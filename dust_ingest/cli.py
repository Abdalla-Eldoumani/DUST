"""CLI entrypoint for the DUST ingestion pipeline.

Usage::

    python -m dust_ingest build --input urls.json --project calgaryhacks2026 --levels 10
"""

from __future__ import annotations

import argparse
import json
import logging
import os
import sys
from pathlib import Path

from dust_ingest.models import InputFile, PipelineConfig

logger = logging.getLogger("dust_ingest")

CACHE_DIR = Path("./cache")
_ENV_FILE = Path(__file__).resolve().parent / ".env"


# ---------------------------------------------------------------------------
# Environment helpers
# ---------------------------------------------------------------------------

def _load_dotenv() -> None:
    """Read key=value pairs from the .env file next to this package."""
    if not _ENV_FILE.is_file():
        return
    for line in _ENV_FILE.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        # Strip optional leading "export "
        if line.startswith("export "):
            line = line[len("export "):]
        key, _, value = line.partition("=")
        if not key or not _:
            continue
        # Strip surrounding quotes
        value = value.strip().strip("\"'")
        os.environ.setdefault(key.strip(), value)


def _require_env(name: str, default: str | None = None) -> str:
    """Read an env var or exit with an informative error."""
    val = os.environ.get(name, default)
    if val is None:
        logger.error("Missing required environment variable: %s", name)
        sys.exit(1)
    return val


def _load_config() -> PipelineConfig:
    """Build a PipelineConfig from environment variables."""
    return PipelineConfig(
        apify_token=_require_env("APIFY_TOKEN"),
        apify_actor_id=_require_env("APIFY_ACTOR_ID", "apify/website-content-crawler"),
        apify_fallback_actor_id=os.environ.get("APIFY_FALLBACK_ACTOR_ID"),
        apify_timeout_secs=int(_require_env("APIFY_TIMEOUT_SECS", "120")),
        openai_api_key=_require_env("OPENAI_API_KEY"),
        openai_model=_require_env("OPENAI_MODEL", "gpt-4o"),
        convex_url=_require_env("CONVEX_URL"),
        concurrency=int(_require_env("CONCURRENCY", "3")),
        retries=int(_require_env("RETRIES", "2")),
    )


# ---------------------------------------------------------------------------
# Local cache I/O
# ---------------------------------------------------------------------------

def _save_page_cache(page) -> None:  # type: ignore[no-untyped-def]
    """Write page snapshot + raw HTML to local cache."""
    page_dir = CACHE_DIR / "pages" / page.pageId
    page_dir.mkdir(parents=True, exist_ok=True)
    (page_dir / "snapshot.json").write_text(
        page.model_dump_json(indent=2), encoding="utf-8"
    )
    (page_dir / "raw.html").write_text(page.html, encoding="utf-8")


def _save_level_cache(level) -> None:  # type: ignore[no-untyped-def]
    """Write a level JSON to local cache."""
    levels_dir = CACHE_DIR / "levels"
    levels_dir.mkdir(parents=True, exist_ok=True)
    fname = f"level_{level.difficulty:02d}.json"
    (levels_dir / fname).write_text(
        level.model_dump_json(indent=2), encoding="utf-8"
    )


# ---------------------------------------------------------------------------
# Build command
# ---------------------------------------------------------------------------

def _cmd_build(args: argparse.Namespace) -> None:
    """Execute the full build pipeline."""
    from dust_ingest.apify_scrape import scrape_urls
    from dust_ingest.convex_upload import upload_levels, upload_pages, upload_variants
    from dust_ingest.leveling import build_levels
    from dust_ingest.openai_alter import generate_variants

    # 1. Load config
    config = _load_config()
    logger.info("Pipeline config loaded (model=%s)", config.openai_model)

    # 2. Read + validate input
    input_path = Path(args.input)
    if not input_path.exists():
        logger.error("Input file not found: %s", input_path)
        sys.exit(1)

    raw = json.loads(input_path.read_text(encoding="utf-8"))
    inp = InputFile.model_validate(raw)
    urls = inp.resolved_urls()
    project_id = args.project or inp.projectId
    logger.info("Loaded %d URLs for project '%s'", len(urls), project_id)

    # 3. Apify scrape
    logger.info("=== Phase 1: Scraping with Apify ===")
    pages = scrape_urls(urls, config, project_id=project_id)
    logger.info("Scraped %d pages successfully", len(pages))
    if not pages:
        logger.error("No pages scraped — aborting")
        sys.exit(1)

    # 4. Cache pages locally
    for p in pages:
        _save_page_cache(p)
    logger.info("Cached %d page snapshots to %s", len(pages), CACHE_DIR / "pages")

    # 5. Build levels
    logger.info("=== Phase 2: Building levels ===")
    num_levels = args.levels
    levels = build_levels(pages, project_id=project_id, num_levels=num_levels)
    for lv in levels:
        _save_level_cache(lv)
    logger.info("Built and cached %d levels", len(levels))

    # 6. Generate variants via OpenAI
    logger.info("=== Phase 3: Generating altered variants (OpenAI) ===")
    variants = generate_variants(pages, levels, config)
    logger.info("Generated %d variants", len(variants))

    # 7. Cache variants locally
    variants_dir = CACHE_DIR / "variants"
    variants_dir.mkdir(parents=True, exist_ok=True)
    for v in variants:
        (variants_dir / f"{v.variantId}.json").write_text(
            v.model_dump_json(indent=2), encoding="utf-8"
        )

    # 8. Upload to Convex
    logger.info("=== Phase 4: Uploading to Convex ===")
    pg_ok = upload_pages(pages, config)
    lv_ok = upload_levels(levels, config)
    vr_ok = upload_variants(variants, config)
    logger.info(
        "Convex upload: %d/%d pages, %d/%d levels, %d/%d variants",
        pg_ok, len(pages), lv_ok, len(levels), vr_ok, len(variants),
    )

    logger.info("✅ Pipeline complete! %d pages, %d levels, %d variants "
                "(cached to %s, uploaded to Convex)",
                len(pages), len(levels), len(variants), CACHE_DIR)


# ---------------------------------------------------------------------------
# Argument parser
# ---------------------------------------------------------------------------

def main() -> None:
    """CLI entrypoint."""
    _load_dotenv()

    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    )

    parser = argparse.ArgumentParser(
        prog="dust_ingest",
        description="DUST Ingestion + Level Builder Pipeline",
    )
    sub = parser.add_subparsers(dest="command")

    build_p = sub.add_parser("build", help="Run the full build pipeline")
    build_p.add_argument("--input", required=True, help="Path to urls.json")
    build_p.add_argument("--project", default=None, help="Project ID override")
    build_p.add_argument("--levels", type=int, default=10, help="Number of levels")

    args = parser.parse_args()
    if args.command == "build":
        _cmd_build(args)
    else:
        parser.print_help()
        sys.exit(1)


if __name__ == "__main__":
    main()

