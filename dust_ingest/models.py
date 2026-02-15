"""Pydantic models for the DUST ingestion pipeline."""

from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Input models
# ---------------------------------------------------------------------------

class UrlEntry(BaseModel):
    """A single URL entry from the input JSON."""
    url: str
    tags: list[str] = Field(default_factory=list)


class InputFile(BaseModel):
    """Schema for the urls.json input file."""
    projectId: str = "default"
    urls: list[UrlEntry | str]

    def resolved_urls(self) -> list[UrlEntry]:
        """Normalize mixed url formats into UrlEntry objects."""
        out: list[UrlEntry] = []
        for item in self.urls:
            if isinstance(item, str):
                out.append(UrlEntry(url=item))
            else:
                out.append(item)
        return out


# ---------------------------------------------------------------------------
# Page snapshot models
# ---------------------------------------------------------------------------

class PageElement(BaseModel):
    """A single extracted DOM element."""
    elementId: str
    tag: str
    text: str | None = None
    src: str | None = None
    srcset: str | None = None
    alt: str | None = None
    href: str | None = None
    bbox: dict[str, float] | None = None  # null when unavailable


class PageAsset(BaseModel):
    """An image or media asset discovered on the page."""
    src: str
    alt: str | None = None
    srcset: str | None = None
    elementId: str | None = None


class PageSnapshot(BaseModel):
    """Full scraped snapshot for a single URL."""
    pageId: str
    url: str
    title: str | None = None
    capturedAt: str  # ISO-8601
    html: str
    elements: list[PageElement] = Field(default_factory=list)
    assets: list[PageAsset] = Field(default_factory=list)
    styles: list[str] = Field(default_factory=list)
    tags: list[str] = Field(default_factory=list)
    projectId: str = "default"


# ---------------------------------------------------------------------------
# LLM alteration models
# ---------------------------------------------------------------------------

class FakeMark(BaseModel):
    """A single fake/misleading span injected by the LLM."""
    kind: Literal["FAKE", "MISLEADING"]
    elementId: str | None = None
    snippet: str
    explanation: str


class AlteredPage(BaseModel):
    """Result of LLM alteration for one page."""
    alteredContent: str
    fakeMarks: list[FakeMark] = Field(default_factory=list)


# ---------------------------------------------------------------------------
# Level models
# ---------------------------------------------------------------------------

class MutationParams(BaseModel):
    """Parameters controlling how aggressively a level mutates content."""
    fakeRate: float = Field(ge=0.0, le=1.0)
    subtlety: float = Field(ge=0.0, le=1.0)
    maxFakeSpans: int = Field(ge=1)


class Level(BaseModel):
    """A single game level."""
    levelId: str
    projectId: str
    difficulty: int = Field(ge=1, le=10)
    pageIds: list[str] = Field(default_factory=list)
    mutationParams: MutationParams


# ---------------------------------------------------------------------------
# Page variant (post-alteration)
# ---------------------------------------------------------------------------

class PageVariant(BaseModel):
    """An altered variant of a page for a specific level."""
    variantId: str
    pageId: str
    levelId: str
    difficulty: int
    alteredContent: str
    fakeMarks: list[FakeMark] = Field(default_factory=list)
    projectId: str = "default"


# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

class PipelineConfig(BaseModel):
    """Runtime configuration pulled from environment variables."""
    apify_token: str
    apify_actor_id: str = "apify/website-content-crawler"
    apify_fallback_actor_id: str | None = None
    apify_timeout_secs: int = 120
    llm_api_key: str
    llm_base_url: str = "https://api.deepinfra.com/v1/openai"
    llm_model: str = "meta-llama/Llama-3.3-70B-Instruct-Turbo"
    convex_url: str  # e.g. "https://hushed-fennec-813.convex.cloud"
    concurrency: int = 3
    retries: int = 2

