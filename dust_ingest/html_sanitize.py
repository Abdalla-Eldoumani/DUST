"""HTML sanitization utilities.

Converts relative URLs to absolute and strips script/noscript tags
for deterministic replay.
"""

from __future__ import annotations

import logging
from urllib.parse import urljoin

from bs4 import BeautifulSoup

logger = logging.getLogger(__name__)

# Attributes whose values are URLs that should be absolutized
_URL_ATTRS: dict[str, list[str]] = {
    "href": ["a", "link", "area", "base"],
    "src": ["img", "script", "iframe", "source", "video", "audio", "embed"],
    "srcset": ["img", "source"],
    "action": ["form"],
    "poster": ["video"],
    "data": ["object"],
}

# Tags to remove entirely
_STRIP_TAGS = {"script", "noscript", "style"}


def _absolutize_srcset(srcset: str, base_url: str) -> str:
    """Absolutize each URL in a ``srcset`` attribute value."""
    parts: list[str] = []
    for entry in srcset.split(","):
        entry = entry.strip()
        if not entry:
            continue
        tokens = entry.split()
        if tokens:
            tokens[0] = urljoin(base_url, tokens[0])
        parts.append(" ".join(tokens))
    return ", ".join(parts)


def sanitize_html(html: str, *, base_url: str) -> str:
    """Sanitize *html*: absolutize URLs and strip scripts.

    Parameters
    ----------
    html:
        Raw HTML string.
    base_url:
        The page URL used to resolve relative references.

    Returns
    -------
    str
        Cleaned HTML string.
    """
    soup = BeautifulSoup(html, "html.parser")

    # --- Remove script / noscript / inline styles ---
    for tag_name in _STRIP_TAGS:
        for tag in soup.find_all(tag_name):
            tag.decompose()

    # --- Absolutize URL-bearing attributes ---
    for attr, tag_names in _URL_ATTRS.items():
        for tag in soup.find_all(tag_names):
            val = tag.get(attr)
            if not val or not isinstance(val, str):
                continue
            if attr == "srcset":
                tag[attr] = _absolutize_srcset(val, base_url)
            else:
                tag[attr] = urljoin(base_url, val)

    return str(soup)

# Tags that constitute a "paragraph" for word-count truncation purposes.
# These are leaf-level block elements that carry readable text.
_PARAGRAPH_TAGS: set[str] = {
    "p", "li",
    "h1", "h2", "h3", "h4", "h5", "h6",
    "blockquote", "pre", "figcaption",
}

DEFAULT_MAX_WORDS = 1000


def truncate_to_word_limit(html: str, *, max_words: int = DEFAULT_MAX_WORDS) -> str:
    """Truncate *html* at the last full paragraph before *max_words*.

    Walks block-level paragraph elements in document order, accumulating
    word counts.  The first paragraph that would push the total past
    *max_words* — and every paragraph after it — is removed.

    This means the output may contain slightly fewer than *max_words*
    (never more), and no paragraph is cut in half.

    Parameters
    ----------
    html:
        Sanitized HTML string.
    max_words:
        Approximate word budget (default 1000).

    Returns
    -------
    str
        Truncated HTML.
    """
    soup = BeautifulSoup(html, "html.parser")
    blocks = list(soup.find_all(_PARAGRAPH_TAGS))

    word_count = 0
    cutoff_idx = len(blocks)  # default: keep everything

    for i, tag in enumerate(blocks):
        text = tag.get_text(separator=" ", strip=True)
        tag_words = len(text.split())
        if word_count + tag_words > max_words:
            cutoff_idx = i
            break
        word_count += tag_words

    if cutoff_idx < len(blocks):
        removed = 0
        for tag in blocks[cutoff_idx:]:
            # Guard against already-detached tags (e.g. nested inside a
            # parent that was already decomposed).
            if tag.parent is not None:
                tag.decompose()
                removed += 1
        logger.info(
            "Truncated page to ~%d words (removed %d block elements)",
            word_count,
            removed,
        )

    return str(soup)

