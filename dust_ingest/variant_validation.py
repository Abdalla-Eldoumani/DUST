"""Validation helpers for page variants."""

from __future__ import annotations

import re

from bs4 import BeautifulSoup, Tag

from dust_ingest.models import PageVariant

TEXT_HTML_TAGS = (
    "h1", "h2", "h3", "h4", "h5", "h6",
    "p", "li", "blockquote", "figcaption", "pre", "code", "td", "th",
)
MIN_TEXT_ELEMENTS = 4
_FAKE_MARKER_RE = re.compile(r"(<|&lt;)\s*(FAKE|MISLEADING)\s*:", re.IGNORECASE)


def count_text_elements(altered_content: str) -> int:
    """Count non-empty text elements in variant HTML."""
    if not altered_content or not altered_content.strip():
        return 0

    soup = BeautifulSoup(altered_content, "html.parser")
    count = 0
    for node in soup.find_all(TEXT_HTML_TAGS):
        if not isinstance(node, Tag):
            continue
        if node.get_text(separator=" ", strip=True):
            count += 1
    return count


def count_true_and_fake_text_sections(altered_content: str) -> tuple[int, int]:
    """Return (true_sections, fake_sections) for text-bearing HTML nodes."""
    if not altered_content or not altered_content.strip():
        return 0, 0

    soup = BeautifulSoup(altered_content, "html.parser")
    true_sections = 0
    fake_sections = 0
    for node in soup.find_all(TEXT_HTML_TAGS):
        if not isinstance(node, Tag):
            continue
        text = node.get_text(separator=" ", strip=True)
        if not text:
            continue
        if _FAKE_MARKER_RE.search(text):
            fake_sections += 1
        else:
            true_sections += 1

    return true_sections, fake_sections


def validate_page_variant(variant: PageVariant) -> tuple[bool, str]:
    """Validate that a variant is upload-safe and playable."""
    if not variant.alteredContent or not variant.alteredContent.strip():
        return False, "empty alteredContent"
    if not variant.fakeMarks:
        return False, "no fakeMarks"

    text_elements = count_text_elements(variant.alteredContent)
    if text_elements < MIN_TEXT_ELEMENTS:
        return (
            False,
            f"only {text_elements} text elements (need >= {MIN_TEXT_ELEMENTS})",
        )

    true_sections, fake_sections = count_true_and_fake_text_sections(
        variant.alteredContent
    )
    if fake_sections < 1:
        return False, "needs at least 1 fake text section"
    if true_sections < 1:
        return False, "needs at least 1 true text section"

    return True, ""
