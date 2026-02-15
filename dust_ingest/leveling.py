"""Level generation — distribute pages into 10 levels of increasing difficulty.

Computes a per-page complexity score, sorts by complexity, and distributes
them across levels respecting a cap: level *d* can hold at most *d* pages
(level 1 → max 1, level 2 → max 2, … level 10 → max 10; total capacity 55).

When fewer than ``num_levels`` pages exist, levels that receive 0 pages
recycle from the pool so every level has at least 1 page.
"""

from __future__ import annotations

import logging

from dust_ingest.models import Level, MutationParams, PageSnapshot

logger = logging.getLogger(__name__)

NUM_LEVELS = 10


# ---------------------------------------------------------------------------
# Complexity scoring
# ---------------------------------------------------------------------------

def _complexity_score(page: PageSnapshot) -> float:
    """Heuristic complexity score for a single page snapshot.

    Higher = more complex → harder level.
    """
    text_len = len(page.html)
    n_elements = len(page.elements)
    n_images = len(page.assets)
    n_headings = sum(
        1 for e in page.elements if e.tag in {"h1", "h2", "h3", "h4", "h5", "h6"}
    )
    # Simple weighted sum
    return (
        text_len * 0.001
        + n_elements * 1.0
        + n_images * 2.0
        + n_headings * 1.5
    )


# ---------------------------------------------------------------------------
# Mutation parameters per difficulty
# ---------------------------------------------------------------------------

def _mutation_params(difficulty: int) -> MutationParams:
    """Return mutation parameters scaled to *difficulty* (1–10)."""
    t = (difficulty - 1) / 9.0  # 0.0 → 1.0
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
    *,
    project_id: str,
    num_levels: int = NUM_LEVELS,
) -> list[Level]:
    """Create *num_levels* :class:`Level` objects from *pages*.

    Pages are sorted by complexity and distributed across levels
    respecting a per-level cap: level *d* can hold at most *d* pages.
    Surplus pages are allocated to harder (later) levels first.

    If ``len(pages) < num_levels``, levels that receive no pages are
    back-filled by recycling from the pool.
    """
    if not pages:
        logger.warning("No pages to build levels from")
        return []

    # Sort ascending complexity
    scored = sorted(pages, key=_complexity_score)
    page_ids = [p.pageId for p in scored]
    n = len(page_ids)

    # Level d can hold at most d pages  →  caps = [1, 2, 3, ..., num_levels]
    caps = list(range(1, num_levels + 1))
    total_cap = sum(caps)  # 55 for 10 levels

    # --- allocate page counts per level ---
    allocation = [0] * num_levels

    if n <= total_cap:
        remaining = n

        # Pass 1: give each level at least 1 page (if enough pages)
        for i in range(num_levels):
            if remaining <= 0:
                break
            allocation[i] = 1
            remaining -= 1

        # Pass 2: distribute surplus to harder levels first, respecting caps
        for i in range(num_levels - 1, -1, -1):
            if remaining <= 0:
                break
            space = caps[i] - allocation[i]
            give = min(space, remaining)
            allocation[i] += give
            remaining -= give
    else:
        # More pages than capacity — fill every level to its cap
        allocation = caps[:]
        logger.warning(
            "Have %d pages but total level capacity is %d — "
            "%d pages will be unused",
            n,
            total_cap,
            n - total_cap,
        )

    # --- build Level objects ---
    levels: list[Level] = []
    idx = 0
    for i in range(num_levels):
        difficulty = i + 1
        count = allocation[i]
        bucket_ids = page_ids[idx : idx + count]
        idx += count

        # If this level got 0 pages (N < num_levels), recycle from pool
        if not bucket_ids:
            bucket_ids = [page_ids[i % n]]

        level_id = f"{project_id}_level_{difficulty:02d}"
        levels.append(
            Level(
                levelId=level_id,
                projectId=project_id,
                difficulty=difficulty,
                pageIds=bucket_ids,
                mutationParams=_mutation_params(difficulty),
            )
        )

    logger.info(
        "Built %d levels from %d pages (project=%s, allocation=%s)",
        len(levels),
        n,
        project_id,
        allocation,
    )
    return levels

