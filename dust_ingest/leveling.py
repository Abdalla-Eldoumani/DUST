"""Level generation — distribute pages across levels with scaling capacity.

Pages are assigned to levels in URL-order.  Level capacity scales with
difficulty::

    Level 1-2:  1 page each
    Level 3-4:  2 pages each
    Level 5-6:  3 pages each
    Level 7-8:  4 pages each
    Level 9-10: 5 pages each

Formula: ``capacity(d) = (d + 1) // 2``  →  total for 10 levels = 30.

The number of levels is controlled by the ``--levels`` CLI flag.
"""

from __future__ import annotations

import logging

from dust_ingest.models import Level, MutationParams, PageSnapshot, PageVariant, UrlEntry

logger = logging.getLogger(__name__)

NUM_LEVELS = 10


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _level_capacity(difficulty: int) -> int:
    """Number of pages for a given difficulty level.

    1→1, 2→1, 3→2, 4→2, 5→3, 6→3, 7→4, 8→4, 9→5, 10→5
    """
    return (difficulty + 1) // 2


def _mutation_params(difficulty: int, num_levels: int) -> MutationParams:
    """Return mutation parameters scaled to *difficulty* (1–num_levels)."""
    t = (difficulty - 1) / max(num_levels - 1, 1)  # 0.0 → 1.0
    return MutationParams(
        fakeRate=round(0.05 + t * 0.45, 3),       # 0.05 → 0.50
        subtlety=round(0.1 + t * 0.85, 3),        # 0.10 → 0.95
        maxFakeSpans=max(1, int(1 + t * 7)),       # 1 → 8
    )


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def build_levels(
    pages: list[PageSnapshot],
    url_entries: list[UrlEntry],
    *,
    project_id: str,
    num_levels: int = NUM_LEVELS,
) -> list[Level]:
    """Create levels by distributing URL entries with scaling capacity.

    URLs are consumed in order from *url_entries*.  Level 1 gets the
    first ``_level_capacity(1)`` URLs, level 2 gets the next batch, etc.

    Parameters
    ----------
    pages:
        All scraped page snapshots.
    url_entries:
        The resolved URL entries from the input file, **in order**.
    project_id:
        Project identifier used in level IDs.
    num_levels:
        How many levels to create (from ``--levels`` CLI flag).
    """
    if not pages:
        logger.warning("No pages to build levels from")
        return []

    # Map URL → pageId for fast lookup
    url_to_page_id: dict[str, str] = {p.url: p.pageId for p in pages}

    total_capacity = sum(_level_capacity(d) for d in range(1, num_levels + 1))
    logger.info(
        "Level capacities: %s (total %d pages for %d levels)",
        [_level_capacity(d) for d in range(1, num_levels + 1)],
        total_capacity,
        num_levels,
    )

    levels: list[Level] = []
    idx = 0  # cursor into url_entries
    for difficulty in range(1, num_levels + 1):
        cap = _level_capacity(difficulty)
        page_ids: list[str] = []

        for _ in range(cap):
            if idx >= len(url_entries):
                break
            entry = url_entries[idx]
            idx += 1
            page_id = url_to_page_id.get(entry.url)
            if not page_id:
                logger.warning(
                    "URL %s was not scraped — skipping", entry.url,
                )
                continue
            page_ids.append(page_id)

        if not page_ids:
            logger.warning("Level %d has no pages — skipping", difficulty)
            continue

        level_id = f"{project_id}_level_{difficulty:02d}"
        levels.append(
            Level(
                levelId=level_id,
                projectId=project_id,
                difficulty=difficulty,
                pageIds=page_ids,
                mutationParams=_mutation_params(difficulty, num_levels),
            )
        )

    leveled_count = sum(len(lv.pageIds) for lv in levels)
    extra_count = len(url_entries) - idx
    logger.info(
        "Built %d planned levels with %d pages, %d extra URLs remain (project=%s)",
        len(levels), leveled_count, extra_count, project_id,
    )
    return levels


def rebuild_levels_from_variants(
    variants: list[PageVariant],
    project_id: str,
    num_levels: int = NUM_LEVELS,
) -> list[Level]:
    """Build levels purely from the variants that were generated successfully.

    Groups variants by their ``levelId``, then creates a :class:`Level`
    for each group.  The difficulty and mutation params are derived from
    the level number.  Levels with zero variants are not created.
    """
    # Group variant pageIds by levelId
    level_page_ids: dict[str, set[str]] = {}
    level_difficulty: dict[str, int] = {}
    for v in variants:
        level_page_ids.setdefault(v.levelId, set()).add(v.pageId)
        level_difficulty.setdefault(v.levelId, v.difficulty)

    levels: list[Level] = []
    for level_id, page_ids in sorted(level_page_ids.items()):
        diff = level_difficulty[level_id]
        cap = _level_capacity(diff)
        capped_pages = sorted(page_ids)[:cap]
        if len(page_ids) > cap:
            logger.info(
                "Level %s (difficulty %d): capped from %d to %d pages",
                level_id, diff, len(page_ids), cap,
            )
        levels.append(Level(
            levelId=level_id,
            projectId=project_id,
            difficulty=diff,
            pageIds=capped_pages,
            mutationParams=_mutation_params(diff, num_levels),
        ))

    logger.info(
        "Built %d levels from %d variants (project=%s)",
        len(levels), len(variants), project_id,
    )
    return levels

