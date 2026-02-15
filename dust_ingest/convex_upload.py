"""Upload pipeline data to a Convex deployment via the HTTP API.

Uses only ``urllib.request`` from the standard library â€” no extra
dependencies required.  Targets the public mutation endpoints that
already exist in the Convex backend (``pages:upsert``,
``levels:upsert``, ``pageVariants:insert``).
"""

from __future__ import annotations

import json
import logging
import urllib.request
import urllib.error

from dust_ingest.models import Level, PageSnapshot, PageVariant, PipelineConfig
from dust_ingest.variant_validation import validate_page_variant

logger = logging.getLogger(__name__)


def _call_mutation(convex_url: str, path: str, args: dict) -> dict | None:
    """POST a mutation to the Convex HTTP API and return the parsed response."""
    url = convex_url.rstrip("/") + "/api/mutation"
    body = json.dumps({"path": path, "args": args, "format": "json"}).encode()
    req = urllib.request.Request(
        url,
        data=body,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = json.loads(resp.read().decode())
            return data
    except urllib.error.HTTPError as exc:
        err_body = exc.read().decode() if exc.fp else ""
        logger.error(
            "Convex mutation %s failed (HTTP %d): %s", path, exc.code, err_body
        )
        return None
    except Exception:
        logger.exception("Convex mutation %s failed", path)
        return None


# ------------------------------------------------------------------
# Public helpers
# ------------------------------------------------------------------

def upload_pages(pages: list[PageSnapshot], config: PipelineConfig) -> int:
    """Upload page snapshots via ``pages:upsert``.  Returns success count."""
    ok = 0
    for p in pages:
        payload = p.model_dump()
        # title must be a string for the Convex schema (not None)
        if payload.get("title") is None:
            payload["title"] = ""
        result = _call_mutation(config.convex_url, "pages:upsert", payload)
        if result is not None:
            ok += 1
            logger.debug("Uploaded page %s", p.pageId)
        else:
            logger.warning("Failed to upload page %s", p.pageId)
    return ok


def upload_levels(levels: list[Level], config: PipelineConfig) -> int:
    """Upload level definitions via ``levels:upsert``.  Returns success count."""
    ok = 0
    for lv in levels:
        result = _call_mutation(
            config.convex_url, "levels:upsert", lv.model_dump()
        )
        if result is not None:
            ok += 1
            logger.debug("Uploaded level %s", lv.levelId)
        else:
            logger.warning("Failed to upload level %s", lv.levelId)
    return ok


def upload_variants(
    variants: list[PageVariant], config: PipelineConfig
) -> int:
    """Upload page variants via ``pageVariants:insert``.  Returns success count.

    Invalid variants are skipped (empty content, no fake marks, or too few
    text elements), preventing degenerate archived pages in gameplay.
    """
    ok = 0
    skipped = 0
    for v in variants:
        is_valid, reason = validate_page_variant(v)
        if not is_valid:
            skipped += 1
            logger.warning(
                "Skipping variant %s â€” %s",
                v.variantId,
                reason,
            )
            continue

        result = _call_mutation(
            config.convex_url, "pageVariants:insert", v.model_dump()
        )
        if result is not None:
            ok += 1
            logger.debug("Uploaded variant %s", v.variantId)
        else:
            logger.warning("Failed to upload variant %s", v.variantId)

    if skipped:
        logger.info("Skipped %d invalid variants", skipped)
    return ok
