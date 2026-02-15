"""Apify-based web scraper.

Runs an Apify Actor (default: apify/website-content-crawler) for each batch
of URLs, downloads the dataset, and adapts the output to our PageSnapshot model.
"""

from __future__ import annotations

import asyncio
import hashlib
import logging
from datetime import datetime, timezone
from typing import Any

from apify_client import ApifyClient

from dust_ingest.html_sanitize import sanitize_html, truncate_to_word_limit
from dust_ingest.models import PageSnapshot, PipelineConfig, UrlEntry
from dust_ingest.normalize import extract_elements_and_assets

logger = logging.getLogger(__name__)

# Fields the actor might use for rendered HTML (tried in order)
_HTML_FIELDS = [
    "html",
    "pageHtml",
    "pageContent",
    "contentHtml",
    "htmlContent",
    "body",
    "rawHtml",
    "content",
]


def _page_id(url: str) -> str:
    """Deterministic page ID: first 16 hex chars of sha256(url)."""
    return hashlib.sha256(url.encode()).hexdigest()[:16]


def _extract_html(item: dict[str, Any]) -> str | None:
    """Try multiple field names to find the rendered HTML in an actor result."""
    for field in _HTML_FIELDS:
        val = item.get(field)
        if val and isinstance(val, str) and len(val) > 50:
            return val
    return None


def _build_actor_input(
    urls: list[UrlEntry],
    config: PipelineConfig,
) -> dict[str, Any]:
    """Build the input payload for the Apify actor run."""
    start_urls = [{"url": u.url} for u in urls]
    return {
        "startUrls": start_urls,
        "maxCrawlDepth": 0,
        "maxCrawlPages": len(urls),
        "saveHtml": True,
        "crawlerType": "cheerio",  # fast; switch to "playwright" if JS-heavy
        "maxRequestRetries": 2,
        "requestTimeoutSecs": config.apify_timeout_secs,
    }


def scrape_urls(
    urls: list[UrlEntry],
    config: PipelineConfig,
    *,
    project_id: str = "default",
) -> list[PageSnapshot]:
    """Run the Apify actor synchronously and return PageSnapshot objects.

    Falls back to ``config.apify_fallback_actor_id`` if the primary actor
    yields no usable HTML.
    """
    client = ApifyClient(config.apify_token)

    actor_ids = [config.apify_actor_id]
    if config.apify_fallback_actor_id:
        actor_ids.append(config.apify_fallback_actor_id)

    for actor_id in actor_ids:
        logger.info("Starting Apify actor %s for %d URLs", actor_id, len(urls))
        actor_input = _build_actor_input(urls, config)

        try:
            run = client.actor(actor_id).call(
                run_input=actor_input,
                timeout_secs=config.apify_timeout_secs * len(urls) + 60,
            )
        except Exception:
            logger.exception("Apify actor %s failed", actor_id)
            continue

        dataset_id = run.get("defaultDatasetId")
        if not dataset_id:
            logger.warning("No dataset returned by actor %s", actor_id)
            continue

        items: list[dict[str, Any]] = list(
            client.dataset(dataset_id).iterate_items()
        )
        logger.info("Actor %s returned %d items", actor_id, len(items))

        snapshots = _items_to_snapshots(items, urls, project_id)
        if snapshots:
            return snapshots

        logger.warning("Actor %s produced no usable HTML; trying fallback", actor_id)

    logger.error("All Apify actors failed or returned no HTML")
    return []


def _items_to_snapshots(
    items: list[dict[str, Any]],
    urls: list[UrlEntry],
    project_id: str,
) -> list[PageSnapshot]:
    """Convert raw Apify dataset items into PageSnapshot objects."""
    url_tags: dict[str, list[str]] = {u.url: u.tags for u in urls}
    now = datetime.now(timezone.utc).isoformat()
    snapshots: list[PageSnapshot] = []

    for item in items:
        url = item.get("url", "")
        raw_html = _extract_html(item)
        if not raw_html:
            logger.warning("No HTML for %s — skipping", url)
            continue

        html = sanitize_html(raw_html, base_url=url)
        html = truncate_to_word_limit(html)
        elements, assets = extract_elements_and_assets(html, base_url=url)
        title = item.get("title") or item.get("metadata", {}).get("title")

        snap = PageSnapshot(
            pageId=_page_id(url),
            url=url,
            title=title,
            capturedAt=now,
            html=html,
            elements=elements,
            assets=assets,
            tags=url_tags.get(url, []),
            projectId=project_id,
        )
        snapshots.append(snap)

    return snapshots

