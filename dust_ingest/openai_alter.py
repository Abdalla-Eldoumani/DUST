"""OpenAI-powered page alteration.

Calls the OpenAI Responses API to inject misinformation into scraped pages,
scaled by level difficulty.  All injected spans are explicitly marked with
``<FAKE: ...>`` or ``<MISLEADING: ...>`` tags.
"""

from __future__ import annotations

import html
import json
import logging
import re
import uuid

from bs4 import BeautifulSoup, Tag
from openai import OpenAI

from dust_ingest.models import (
    AlteredPage,
    FakeMark,
    Level,
    MutationParams,
    PageSnapshot,
    PageVariant,
    PipelineConfig,
)

logger = logging.getLogger(__name__)

_MAX_ELEMENT_CHARS = 1200  # keep paragraph context, but cap prompt size
_TEXT_TAGS = {
    "h1", "h2", "h3", "h4", "h5", "h6",
    "p", "li", "blockquote", "figcaption", "pre", "code",
    "td", "th",
}
_SENTENCE_END_RE = re.compile(r"[.!?][\"')\]]?(?=\s|$)")
_FALLBACK_FAKE_SNIPPET = "verified by the 2099 Global Accuracy Census"
_FALLBACK_FAKE_EXPLANATION = (
    "Injected fallback misinformation because the model returned no fake marks."
)
_TEXT_HTML_TAGS = (
    "h1", "h2", "h3", "h4", "h5", "h6",
    "p", "li", "blockquote", "figcaption", "pre", "code", "td", "th",
)


def _truncate_to_sentence_boundary(text: str, max_chars: int) -> str:
    """Trim long text while preserving whole sentences when possible."""
    normalized = " ".join(text.split()).strip()
    if len(normalized) <= max_chars:
        return normalized

    clipped = normalized[:max_chars].rstrip()
    last_end = None
    for match in _SENTENCE_END_RE.finditer(clipped):
        last_end = match.end()

    if last_end is not None and last_end >= int(max_chars * 0.4):
        return clipped[:last_end].strip()

    last_space = clipped.rfind(" ")
    if last_space > 0:
        return clipped[:last_space].strip()
    return clipped


def _compact_elements(page: PageSnapshot) -> list[dict]:
    """Build a compact element list for the OpenAI prompt."""
    out: list[dict] = []
    for el in page.elements:
        d: dict = {"elementId": el.elementId, "type": el.tag}
        if el.text:
            d["text"] = _truncate_to_sentence_boundary(el.text, _MAX_ELEMENT_CHARS)
        if el.src:
            d["src"] = el.src
        if el.alt:
            d["alt"] = el.alt
        out.append(d)
    return out


def _build_system_prompt(params: MutationParams, difficulty: int) -> str:
    """Build the system prompt for alteration."""
    return f"""\
You are a content alteration engine for a media-literacy game called DUST.

Your job: take the structured element list of a real web page and return the
SAME list of elements with subtle misinformation injected into some of them.

DIFFICULTY LEVEL: {difficulty}/10
- fakeRate: {params.fakeRate} (fraction of elements that should be altered)
- subtlety: {params.subtlety} (0=obvious fakes, 1=very subtle)
- maxFakeSpans: {params.maxFakeSpans}

RULES:
1. Wrap EVERY altered phrase with <FAKE: ...> or <MISLEADING: ...> tags.
2. Only alter up to {params.maxFakeSpans} spans total.
3. Keep unaltered elements EXACTLY identical to the original.
4. NEVER create harmful accusations about real people/companies.
5. If the page mentions real entities, ANONYMIZE them:
   - Replace names with roles ("a local official", "a mid-sized retailer").
6. Avoid actionable medical/legal advice.
7. Fake spans must be ONLY the inserted/altered parts, NOT entire paragraphs.
8. At difficulty 1-3: fakes are obvious, exaggerated, clearly wrong.
9. At difficulty 7-10: fakes are subtle framing, cherry-picked context,
   plausible-but-wrong attribution.
10. ALWAYS include at least one fake span and one fakeMarks entry.

OUTPUT FORMAT — strict JSON, no markdown fences:
{{
  "alteredContent": [
    {{"elementId": "...", "type": "...", "text": "...with <FAKE: altered phrase> embedded..."}},
    {{"elementId": "...", "type": "...", "text": "...unchanged text..."}}
  ],
  "fakeMarks": [
    {{"kind": "FAKE"|"MISLEADING", "elementId": "...", "snippet": "the altered phrase only", "explanation": "why it is fake"}}
  ]
}}

"alteredContent" MUST be a JSON array of element objects matching the input
structure. Each object keeps its original "elementId" and "type". Only modify
the "text" (or "alt"/"src" for images) fields where you inject fakes.
Elements you did NOT alter must appear unchanged.

Return ONLY valid JSON. No explanation outside the JSON object."""


def _build_user_prompt(page: PageSnapshot) -> str:
    """Build the user message containing the page data."""
    elements = _compact_elements(page)
    return (
        f"Page URL: {page.url}\n"
        f"Page title: {page.title or '(none)'}\n"
        f"Domain: {page.url.split('/')[2] if '/' in page.url else page.url}\n\n"
        f"Elements ({len(elements)} total):\n"
        f"{json.dumps(elements, ensure_ascii=False, indent=1)}"
    )


def _elements_to_html(elements: list[dict]) -> str:
    """Render altered element objects into a compact HTML snippet."""
    lines: list[str] = []
    for idx, el in enumerate(elements):
        element_id = str(el.get("elementId") or f"el-{idx}")
        tag = str(el.get("type") or "p").lower()
        safe_id = html.escape(element_id, quote=True)

        if tag == "img":
            src = str(el.get("src") or "").strip()
            if not src:
                continue
            alt = str(el.get("alt") or "")
            lines.append(
                f'<img data-element-id="{safe_id}" src="{html.escape(src, quote=True)}" '
                f'alt="{html.escape(alt, quote=True)}" />'
            )
            continue

        text = str(el.get("text") or "").strip()
        if not text:
            continue
        safe_tag = tag if tag in _TEXT_TAGS else "p"
        lines.append(
            f'<{safe_tag} data-element-id="{safe_id}">{html.escape(text)}</{safe_tag}>'
        )

    return "\n".join(lines)


def _parse_response(raw: str) -> AlteredPage:
    """Parse the OpenAI response into an AlteredPage, stripping markdown fences."""
    text = raw.strip()
    # Strip markdown code fences if present
    if text.startswith("```"):
        lines = text.splitlines()
        # Remove first and last fence lines
        if lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].strip().startswith("```"):
            lines = lines[:-1]
        text = "\n".join(lines)

    data = json.loads(text)
    marks = []
    for m in data.get("fakeMarks", []):
        marks.append(
            FakeMark(
                kind=m.get("kind", "FAKE"),
                elementId=m.get("elementId"),
                snippet=m.get("snippet", ""),
                explanation=m.get("explanation", ""),
            )
        )

    altered = data.get("alteredContent", "")
    # The model may return alteredContent as a list of element objects.
    # Convert this list into HTML so stored content is webpage-like and readable.
    if isinstance(altered, list):
        altered = _elements_to_html(altered)
    elif not isinstance(altered, str):
        altered = json.dumps(altered, ensure_ascii=False)

    return AlteredPage(
        alteredContent=altered,
        fakeMarks=marks,
    )


def _ensure_minimum_fake(altered: AlteredPage) -> AlteredPage:
    """Guarantee at least one fake mark by injecting a safe fallback if needed."""
    if altered.fakeMarks:
        return altered
    if not altered.alteredContent.strip():
        return altered

    soup = BeautifulSoup(altered.alteredContent, "html.parser")
    for tag in soup.find_all(_TEXT_HTML_TAGS):
        if not isinstance(tag, Tag):
            continue
        text = tag.get_text(separator=" ", strip=True)
        if not text:
            continue

        if text.endswith((".", "!", "?")):
            patched_text = f"{text} <MISLEADING: {_FALLBACK_FAKE_SNIPPET}>"
        else:
            patched_text = f"{text}. <MISLEADING: {_FALLBACK_FAKE_SNIPPET}>"
        tag.clear()
        tag.append(patched_text)

        mark = FakeMark(
            kind="MISLEADING",
            elementId=str(tag.get("data-element-id")) if tag.get("data-element-id") else None,
            snippet=_FALLBACK_FAKE_SNIPPET,
            explanation=_FALLBACK_FAKE_EXPLANATION,
        )
        return AlteredPage(
            alteredContent=str(soup),
            fakeMarks=[mark],
        )

    return altered


def alter_page(
    page: PageSnapshot,
    params: MutationParams,
    difficulty: int,
    config: PipelineConfig,
) -> AlteredPage:
    """Call OpenAI to produce an altered variant of *page*.

    Retries up to ``config.retries`` times on JSON parse failures.
    """
    client = OpenAI(api_key=config.openai_api_key)
    system = _build_system_prompt(params, difficulty)
    user = _build_user_prompt(page)

    last_err: Exception | None = None
    no_fake_candidate: AlteredPage | None = None
    for attempt in range(1, config.retries + 2):
        try:
            response = client.responses.create(
                model=config.openai_model,
                instructions=system,
                input=user if attempt == 1 else (
                    user + "\n\nIMPORTANT: Return valid JSON only. "
                    "No markdown fences. No text outside the JSON object. "
                    "You MUST include at least one fakeMarks entry and at "
                    "least one corresponding <FAKE: ...> or <MISLEADING: ...> span."
                ),
            )
            text = response.output_text
            parsed = _parse_response(text)
            if parsed.fakeMarks:
                return parsed

            no_fake_candidate = parsed
            last_err = ValueError("Model returned no fakeMarks")
            logger.warning(
                "OpenAI response had no fake marks (attempt %d/%d)",
                attempt,
                config.retries + 1,
            )
        except (json.JSONDecodeError, KeyError, TypeError) as exc:
            last_err = exc
            logger.warning(
                "OpenAI JSON parse failed (attempt %d/%d): %s",
                attempt,
                config.retries + 1,
                exc,
            )
        except Exception as exc:
            last_err = exc
            logger.exception("OpenAI API error (attempt %d)", attempt)

    if no_fake_candidate is not None:
        ensured = _ensure_minimum_fake(no_fake_candidate)
        if ensured.fakeMarks:
            logger.warning(
                "Injected fallback fake mark for page %s after model returned none",
                page.pageId,
            )
            return ensured

    logger.error("All OpenAI attempts failed for page %s: %s", page.pageId, last_err)
    # Return empty alteration rather than crashing
    return AlteredPage(alteredContent="", fakeMarks=[])


def generate_variants(
    pages: list[PageSnapshot],
    levels: list[Level],
    config: PipelineConfig,
) -> list[PageVariant]:
    """Generate altered variants for every page in every level.

    Returns a flat list of :class:`PageVariant` objects.
    """
    page_map = {p.pageId: p for p in pages}
    variants: list[PageVariant] = []

    for level in levels:
        logger.info(
            "Generating variants for level %d (%d pages)",
            level.difficulty,
            len(level.pageIds),
        )
        for pid in level.pageIds:
            page = page_map.get(pid)
            if not page:
                logger.warning("Page %s not found — skipping variant", pid)
                continue

            altered = alter_page(
                page, level.mutationParams, level.difficulty, config
            )
            variant = PageVariant(
                variantId=uuid.uuid4().hex[:16],
                pageId=pid,
                levelId=level.levelId,
                difficulty=level.difficulty,
                alteredContent=altered.alteredContent,
                fakeMarks=altered.fakeMarks,
                projectId=level.projectId,
            )
            variants.append(variant)

    logger.info("Generated %d total variants", len(variants))
    return variants
