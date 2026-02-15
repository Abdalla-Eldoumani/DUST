"""Validation helpers for page variants."""

from __future__ import annotations

from bs4 import BeautifulSoup, Tag

from dust_ingest.models import PageVariant

TEXT_HTML_TAGS = (
    "h3", "h4", "h5", "h6",
    "p", "li", "blockquote", "figcaption", "pre", "code", "td", "th",
)
MIN_TEXT_ELEMENTS = 3


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


def validate_page_variant(variant: PageVariant) -> tuple[bool, str]:
    """Validate that a variant is upload-safe and playable.

    Uses fakeMarks array to determine fake content rather than inline tags.
    """
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

    # Count fake elements from fakeMarks array
    fake_element_ids = {m.elementId for m in variant.fakeMarks if m.elementId}
    fake_count = len(fake_element_ids) if fake_element_ids else len(variant.fakeMarks)

    # Must have at least 1 fake and at least 1 true section
    true_count = text_elements - fake_count
    if fake_count < 1:
        return False, "needs at least 1 fake text section"
    if true_count < 1:
        return False, "needs at least 1 true text section"

    return True, ""
