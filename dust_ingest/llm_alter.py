"""LLM-powered page alteration.

Calls an LLM API (OpenAI-compatible) to inject misinformation into scraped
pages, scaled by level difficulty.  All injected spans are explicitly marked
with ``<FAKE: ...>`` or ``<MISLEADING: ...>`` tags.
"""

from __future__ import annotations

import html
import json
import logging
import re
import uuid

import httpx
from bs4 import BeautifulSoup, Tag
from openai import OpenAI

from dust_ingest.models import (
    AlteredPage,
    FakeMark,
    MutationParams,
    PageElement,
    PageSnapshot,
    PageVariant,
    PipelineConfig,
)
from dust_ingest.variant_validation import validate_page_variant

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

# Patterns in page title or content that indicate a failed/error page.
_BAD_PAGE_TITLE_PATTERNS = [
    "page not found", "404", "access denied", "403 forbidden",
    "500 internal", "503 service", "error page", "not available",
    "under construction", "coming soon", "moved permanently",
    "web page blocked",
]

_MIN_TEXT_LENGTH = 100  # minimum total text chars for a page to be valid


def is_valid_page(page: "PageSnapshot") -> bool:
    """Return *True* if the page has enough content for meaningful alteration.

    Filters out 404s, error pages, and pages with nearly no text.
    """
    title = (page.title or "").lower()
    if any(pat in title for pat in _BAD_PAGE_TITLE_PATTERNS):
        logger.info(
            "Skipping page %s â€” bad title: %r", page.pageId, page.title,
        )
        return False

    total_text = " ".join(
        el.text or "" for el in page.elements if el.tag != "img"
    )
    if len(total_text.strip()) < _MIN_TEXT_LENGTH:
        logger.info(
            "Skipping page %s â€” too little text (%d chars)",
            page.pageId,
            len(total_text.strip()),
        )
        return False

    return True


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
    """Build a compact element list for the LLM prompt."""
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
11. Do NOT split a sentence across multiple text elements when avoidable.
    Each text element should contain at least one complete sentence.
12. Do NOT output "li" elements. Convert list-style text into "p" elements.

OUTPUT FORMAT â€” strict JSON, no markdown fences:
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


def _strip_h2_sections(html_content: str) -> str:
    """Remove all <h2> tags and their contents from HTML content."""
    if not html_content.strip():
        return html_content
    soup = BeautifulSoup(html_content, "html.parser")
    for tag in soup.find_all("h2"):
        tag.decompose()
    return str(soup)


def _ends_with_sentence(text: str) -> bool:
    """Return True if *text* appears to end at a sentence boundary."""
    normalized = " ".join(text.split()).strip()
    if not normalized:
        return False
    last_end = None
    for match in _SENTENCE_END_RE.finditer(normalized):
        last_end = match.end()
    return last_end == len(normalized)


def _normalize_text_sections(html_content: str) -> str:
    """Normalize sections: remove h2, remove li tags, merge fragments."""
    if not html_content.strip():
        return html_content

    soup = BeautifulSoup(html_content, "html.parser")

    # Remove all h2 sections entirely.
    for tag in soup.find_all("h2"):
        tag.decompose()

    # Remove li tags by converting them to paragraph tags.
    for tag in soup.find_all("li"):
        tag.name = "p"

    # Merge sentence fragments so we avoid sections smaller than a sentence.
    mergeable_tags = ("p", "blockquote", "figcaption", "pre", "code", "td", "th")
    previous: Tag | None = None
    for tag in list(soup.find_all(mergeable_tags)):
        if not isinstance(tag, Tag):
            continue
        text = tag.get_text(separator=" ", strip=True)
        if not text:
            tag.decompose()
            continue

        if previous is None:
            previous = tag
            continue

        prev_text = previous.get_text(separator=" ", strip=True)
        if not prev_text:
            previous = tag
            continue

        prev_complete = _ends_with_sentence(prev_text)
        current_complete = _ends_with_sentence(text)
        current_short_fragment = (not current_complete) and len(text.split()) <= 14
        if (not prev_complete) or current_short_fragment:
            merged = f"{prev_text} {text}".replace("\n", " ")
            merged = " ".join(merged.split()).strip()
            previous.clear()
            previous.append(merged)
            tag.decompose()
            continue

        previous = tag

    return str(soup)


def _parse_response(
    raw: str,
    original_elements: list[PageElement] | None = None,
) -> AlteredPage:
    """Parse the LLM response into an AlteredPage, stripping markdown fences.

    If *original_elements* is provided, image ``src`` / ``srcset`` values
    are restored from the originals â€” LLMs frequently mangle or drop URLs.
    """
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
        if not isinstance(m, dict):
            continue  # skip malformed entries (e.g. bare strings)
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
        # Restore original image URLs â€” LLMs often replace src with "..."
        # or hallucinate broken URLs.  Images aren't misinformation targets
        # so the original values are always correct.
        if original_elements:
            orig_img_map = {
                el.elementId: el
                for el in original_elements
                if el.tag == "img" and el.src
            }
            for el in altered:
                if not isinstance(el, dict):
                    continue
                if el.get("type") != "img":
                    continue
                orig = orig_img_map.get(el.get("elementId", ""))
                if orig:
                    el["src"] = orig.src
                    if orig.srcset:
                        el["srcset"] = orig.srcset
                    # Keep LLM alt text only if it's non-empty (may be
                    # a legitimate alteration); otherwise restore original.
                    if not el.get("alt") and orig.alt:
                        el["alt"] = orig.alt
        altered = _elements_to_html(altered)
    elif not isinstance(altered, str):
        altered = json.dumps(altered, ensure_ascii=False)
    altered = _normalize_text_sections(altered)

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
    *,
    client: OpenAI | None = None,
) -> AlteredPage:
    """Call the LLM to produce an altered variant of *page*.

    Retries up to ``config.retries`` times on JSON parse failures.

    Parameters
    ----------
    client:
        A shared :class:`OpenAI` client instance.  If *None* a throwaway
        client is created (kept for backwards-compat, but slower).
    """
    if client is None:
        client = OpenAI(api_key=config.llm_api_key, base_url=config.llm_base_url)
    system = _build_system_prompt(params, difficulty)
    user_prompt = _build_user_prompt(page)

    last_err: Exception | None = None
    no_fake_candidate: AlteredPage | None = None
    for attempt in range(1, config.retries + 2):
        try:
            user_content = user_prompt if attempt == 1 else (
                user_prompt + "\n\nIMPORTANT: Return valid JSON only. "
                "No markdown fences. No text outside the JSON object. "
                "You MUST include at least one fakeMarks entry and at "
                "least one corresponding <FAKE: ...> or <MISLEADING: ...> span."
            )
            response = client.chat.completions.create(
                model=config.llm_model,
                messages=[
                    {"role": "system", "content": system},
                    {"role": "user", "content": user_content},
                ],
                response_format={"type": "json_object"},
            )
            text = response.choices[0].message.content
            parsed = _parse_response(text, original_elements=page.elements)
            if parsed.fakeMarks:
                return parsed

            no_fake_candidate = parsed
            last_err = ValueError("Model returned no fakeMarks")
            logger.warning(
                "LLM response had no fake marks (attempt %d/%d)",
                attempt,
                config.retries + 1,
            )
        except (json.JSONDecodeError, KeyError, TypeError, AttributeError) as exc:
            last_err = exc
            logger.warning(
                "LLM JSON parse failed (attempt %d/%d): %s",
                attempt,
                config.retries + 1,
                exc,
            )
        except Exception as exc:
            last_err = exc
            logger.exception("LLM API error (attempt %d)", attempt)

    if no_fake_candidate is not None:
        ensured = _ensure_minimum_fake(no_fake_candidate)
        if ensured.fakeMarks:
            logger.warning(
                "Injected fallback fake mark for page %s after model returned none",
                page.pageId,
            )
            return ensured

    logger.error("All LLM attempts failed for page %s: %s", page.pageId, last_err)
    # Return empty alteration rather than crashing
    return AlteredPage(alteredContent="", fakeMarks=[])


_DEFAULT_WORKERS = 40
_EXTRA_DIFFICULTY = 5  # default difficulty for pages not in any level
_UNASSIGNED_LEVEL_SUFFIX = "unassigned"


def _level_capacity(difficulty: int) -> int:
    """Number of pages for a given difficulty level."""
    return (difficulty + 1) // 2


def _unassigned_difficulty(num_levels: int) -> int:
    """Difficulty used for variants not placed into a level."""
    return max(1, min(_EXTRA_DIFFICULTY, num_levels))


def _generate_one_variant(
    page: PageSnapshot,
    params: MutationParams,
    difficulty: int,
    project_id: str,
    config: PipelineConfig,
    client: OpenAI,
) -> PageVariant | None:
    """Generate a single valid variant (called from thread pool)."""
    try:
        altered = alter_page(page, params, difficulty, config, client=client)
        candidate = PageVariant(
            variantId=uuid.uuid4().hex[:16],
            pageId=page.pageId,
            # Assigned after all successful variants are known.
            levelId="",
            difficulty=difficulty,
            alteredContent=altered.alteredContent,
            fakeMarks=altered.fakeMarks,
            projectId=project_id,
        )

        is_valid, reason = validate_page_variant(candidate)
        if not is_valid:
            logger.warning(
                "Skipping page %s difficulty %d â€” %s",
                page.pageId,
                difficulty,
                reason,
            )
            return None
        return candidate
    except Exception:
        logger.exception(
            "Failed to generate variant for page %s difficulty %d",
            page.pageId,
            difficulty,
        )
        return None


def _mutation_params(difficulty: int, num_levels: int) -> MutationParams:
    """Return mutation parameters scaled to *difficulty* (1â€“num_levels)."""
    t = (difficulty - 1) / max(num_levels - 1, 1)  # 0.0 â†’ 1.0
    return MutationParams(
        fakeRate=round(0.05 + t * 0.45, 3),       # 0.05 â†’ 0.50
        subtlety=round(0.1 + t * 0.85, 3),        # 0.10 â†’ 0.95
        maxFakeSpans=max(1, int(1 + t * 7)),       # 1 â†’ 8
    )


def generate_variants(
    pages: list[PageSnapshot],
    config: PipelineConfig,
    project_id: str,
    *,
    num_levels: int = 10,
    max_workers: int = _DEFAULT_WORKERS,
) -> tuple[list[PageVariant], list[PageVariant]]:
    """Generate valid variants, then assign them to levels.

    Returns ``(all_valid_variants, level_assigned_variants)``.
    """
    from concurrent.futures import ThreadPoolExecutor, as_completed

    # Filter to valid pages first
    valid_pages: list[PageSnapshot] = []
    skipped = 0
    for page in pages:
        if not is_valid_page(page):
            skipped += 1
            continue
        valid_pages.append(page)

    if skipped:
        logger.info("Skipped %d invalid pages (404s, error pages, etc.)", skipped)

    if not valid_pages:
        logger.warning("No valid pages to generate variants from")
        return [], []

    # Provisional difficulty controls mutation strength while converting.
    Work = tuple[int, PageSnapshot, MutationParams, int, str]
    work: list[Work] = []
    level_counts: dict[int, int] = {}
    extra_difficulty = _unassigned_difficulty(num_levels)
    for idx, page in enumerate(valid_pages):
        assigned = False
        for difficulty in range(1, num_levels + 1):
            cap = _level_capacity(difficulty)
            current = level_counts.get(difficulty, 0)
            if current < cap:
                work.append(
                    (
                        idx,
                        page,
                        _mutation_params(difficulty, num_levels),
                        difficulty,
                        project_id,
                    )
                )
                level_counts[difficulty] = current + 1
                assigned = True
                break
        if not assigned:
            work.append(
                (
                    idx,
                    page,
                    _mutation_params(extra_difficulty, num_levels),
                    extra_difficulty,
                    project_id,
                )
            )

    logger.info(
        "Generating up to %d variants across %d levels with %d threads",
        len(work),
        num_levels,
        max_workers,
    )

    # Single shared client with explicit connection pool limits to avoid
    # socket contention on Windows (WinError 10038).  Keep a few extra
    # connections beyond max_workers for httpx's keep-alive headroom.
    pool_size = max_workers + 5
    http_client = httpx.Client(
        limits=httpx.Limits(
            max_connections=pool_size,
            max_keepalive_connections=max_workers,
        ),
        timeout=httpx.Timeout(90.0, connect=30.0),
    )
    client = OpenAI(
        api_key=config.llm_api_key,
        base_url=config.llm_base_url,
        http_client=http_client,
    )

    completed: list[tuple[int, PageVariant]] = []
    with ThreadPoolExecutor(max_workers=max_workers) as pool:
        futures = {
            pool.submit(
                _generate_one_variant,
                page,
                params,
                diff,
                proj,
                config,
                client,
            ): (idx, page.pageId, diff)
            for idx, page, params, diff, proj in work
        }
        for future in as_completed(futures):
            idx, pid, diff = futures[future]
            variant = future.result()
            if variant is not None:
                completed.append((idx, variant))
                logger.info(
                    "Variant done: page=%s difficulty=%d (%d/%d)",
                    pid,
                    diff,
                    len(completed),
                    len(work),
                )

    # Preserve original page order before final level assignment.
    completed.sort(key=lambda pair: pair[0])
    all_variants = [variant for _, variant in completed]

    level_assigned: list[PageVariant] = []
    leftovers = 0
    level_counts = {}
    unassigned_level_id = f"{project_id}_{_UNASSIGNED_LEVEL_SUFFIX}"
    for variant in all_variants:
        assigned = False
        for difficulty in range(1, num_levels + 1):
            cap = _level_capacity(difficulty)
            current = level_counts.get(difficulty, 0)
            if current < cap:
                variant.difficulty = difficulty
                variant.levelId = f"{project_id}_level_{difficulty:02d}"
                level_counts[difficulty] = current + 1
                level_assigned.append(variant)
                assigned = True
                break
        if not assigned:
            leftovers += 1
            variant.difficulty = extra_difficulty
            variant.levelId = unassigned_level_id

    logger.info(
        "Generated %d valid variants (%d assigned to levels, %d leftovers)",
        len(all_variants),
        len(level_assigned),
        leftovers,
    )
    return all_variants, level_assigned
