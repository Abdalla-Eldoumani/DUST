# DUST Ingestion + Level Builder

Apify-based web scraping → LLM alteration → Convex upload pipeline for the DUST digital archaeology game.

## Setup

```bash
pip install -r dust_ingest/requirements.txt
```

### Environment variables

Create a `.env` or export directly:

```bash
export APIFY_TOKEN="apify_api_..."
export LLM_API_KEY="your-api-key-here"
export LLM_BASE_URL="https://api.deepinfra.com/v1/openai"
export LLM_MODEL="meta-llama/Llama-3.3-70B-Instruct-Turbo"
export CONVEX_URL="https://your-deployment.convex.cloud"

# Optional (defaults shown):
export APIFY_ACTOR_ID="apify/website-content-crawler"
export APIFY_FALLBACK_ACTOR_ID=""
export APIFY_TIMEOUT_SECS="120"
export CONCURRENCY="3"
export RETRIES="2"
```

## Usage

### One-command run

```bash
py -m dust_ingest build --input dust_ingest\urls.example.json --project calgaryhacks2026 --levels 10
```

### Input file format

```json
{
  "projectId": "calgaryhacks2026",
  "urls": [
    {"url": "https://example.com/article-1", "tags": ["news"]},
    {"url": "https://example.com/blog-post",  "tags": ["blog"]}
  ]
}
```

Also accepts the short form:

```json
{"urls": ["https://example.com/a", "https://example.com/b"]}
```

## Pipeline stages

1. **Scrape** — Apify actor fetches rendered HTML for each URL (depth 0, no wandering)
2. **Sanitize** — Scripts stripped, relative URLs absolutized, ~1000 word cap per page
3. **Normalize** — Extract structured elements (headings, paragraphs, images, …)
4. **Level build** — Sort pages by complexity, distribute into 10 levels
5. **Alter** — LLM injects difficulty-scaled misinformation with `<FAKE:>` / `<MISLEADING:>` tags
6. **Upload** — Pages, levels, and variants pushed to Convex via HTTP mutations

All output is also cached locally for inspection.

## Local cache

After a run, inspect cached data at:

```
./cache/pages/<pageId>/snapshot.json
./cache/pages/<pageId>/raw.html
./cache/levels/level_01.json … level_10.json
./cache/variants/<variantId>.json
```

