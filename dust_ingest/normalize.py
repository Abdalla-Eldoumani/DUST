"""HTML normalization — extract structured elements and assets from HTML.

Produces a compact element list (headings, paragraphs, list items, images,
blockquotes, figcaptions) suitable for AI prompts and game rendering.
"""

from __future__ import annotations

import hashlib
import logging
from urllib.parse import urljoin

from bs4 import BeautifulSoup, Tag

from dust_ingest.models import PageAsset, PageElement

logger = logging.getLogger(__name__)

# Element types we care about
_EXTRACT_TAGS: set[str] = {
    "h1", "h2", "h3", "h4", "h5", "h6",
    "p", "li", "blockquote", "figcaption",
    "img",
}

_MAX_TEXT_LEN = 2000  # trim very long text blocks
_NOISE_CONTAINERS: set[str] = {
    "nav", "header", "footer", "aside", "form", "button", "svg",
}


def _stable_id(tag_name: str, index: int, text_hint: str) -> str:
    """Generate a stable elementId from tag, position, and content hint."""
    raw = f"{tag_name}:{index}:{text_hint[:80]}"
    return hashlib.sha256(raw.encode()).hexdigest()[:12]


def extract_elements_and_assets(
    html: str,
    *,
    base_url: str = "",
) -> tuple[list[PageElement], list[PageAsset]]:
    """Parse *html* and return (elements, assets).

    Parameters
    ----------
    html:
        Sanitized HTML string.
    base_url:
        Used to resolve relative image URLs if any remain.

    Returns
    -------
    tuple
        ``(elements, assets)`` — lists of :class:`PageElement` and
        :class:`PageAsset`.
    """
    soup = BeautifulSoup(html, "html.parser")
    elements: list[PageElement] = []
    assets: list[PageAsset] = []
    seen_ids: set[str] = set()
    counter = 0
    prev_fingerprint: tuple[str, str | None, str | None] | None = None

    for tag in soup.find_all(_EXTRACT_TAGS):
        if not isinstance(tag, Tag):
            continue
        if tag.find_parent(_NOISE_CONTAINERS):
            continue

        tag_name = tag.name
        text = (tag.get_text(separator=" ", strip=True) or "")[:_MAX_TEXT_LEN]
        src = tag.get("src") or tag.get("data-src")
        srcset = tag.get("srcset")
        alt = tag.get("alt")
        href = tag.get("href")

        # Absolutize remaining relative image URLs
        if src and isinstance(src, str) and base_url:
            src = urljoin(base_url, src)
        if isinstance(srcset, str) and base_url:
            # simple absolutize for srcset
            parts = []
            for entry in srcset.split(","):
                tokens = entry.strip().split()
                if tokens:
                    tokens[0] = urljoin(base_url, tokens[0])
                parts.append(" ".join(tokens))
            srcset = ", ".join(parts)

        # Ignore empty non-image elements.
        if tag_name != "img" and not text:
            continue

        # Skip exact consecutive duplicates (common in scraped boilerplate).
        fingerprint = (tag_name, text or None, str(src) if src else None)
        if fingerprint == prev_fingerprint:
            continue
        prev_fingerprint = fingerprint

        eid = _stable_id(tag_name, counter, text or str(src) or "")
        # Ensure uniqueness
        while eid in seen_ids:
            counter += 1
            eid = _stable_id(tag_name, counter, text or str(src) or "")
        seen_ids.add(eid)
        counter += 1

        elem = PageElement(
            elementId=eid,
            tag=tag_name,
            text=text if text else None,
            src=str(src) if src else None,
            srcset=str(srcset) if srcset else None,
            alt=str(alt) if alt else None,
            href=str(href) if href else None,
            bbox=None,
        )
        elements.append(elem)

        # Collect image assets
        if tag_name == "img" and src:
            assets.append(
                PageAsset(
                    src=str(src),
                    alt=str(alt) if alt else None,
                    srcset=str(srcset) if srcset else None,
                    elementId=eid,
                )
            )

    logger.info(
        "Extracted %d elements and %d assets from HTML (%d bytes)",
        len(elements),
        len(assets),
        len(html),
    )
    return elements, assets
