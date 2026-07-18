# Persistent Memory — `.seo-butler/state.json`

Written to the **target project root** (the site being optimized), not the plugin. This is what makes
the butler consistent: it reads this first, trusts `done` items, and only acts on real deltas.

## Location
`./.seo-butler/state.json` (create the `.seo-butler/` folder if missing). Recommend adding
`.seo-butler/` is *kept* in the repo (it's useful history) — do not gitignore it unless the user asks.

## Schema

```json
{
  "version": 1,
  "project": {
    "stack": "next-app-router",
    "detectedAt": "2026-07-19",
    "pageCount": 12,
    "languages": ["en"],
    "siteUrl": "https://example.com"
  },
  "lastRun": "2026-07-19",
  "business": {
    "name": "Example Co",
    "email": "hello@example.com",
    "address": null,
    "social": ["https://twitter.com/example"]
  },
  "items": {
    "robots_txt":        { "status": "done",    "date": "2026-07-19", "scope": "1 file",        "notes": "sitemap referenced" },
    "sitemap_xml":       { "status": "done",    "date": "2026-07-19", "scope": "12 URLs" },
    "titles":            { "status": "done",    "date": "2026-07-19", "scope": "12/12 pages" },
    "meta_description":  { "status": "partial", "date": "2026-07-19", "scope": "10/12 pages",   "notes": "2 pages need real copy" },
    "canonical":         { "status": "done",    "date": "2026-07-19" },
    "hreflang":          { "status": "n/a",     "notes": "single language" },
    "open_graph":        { "status": "done",    "date": "2026-07-19" },
    "twitter_card":      { "status": "done",    "date": "2026-07-19" },
    "structured_data":   { "status": "done",    "date": "2026-07-19", "scope": "Organization + WebSite + 3 Article" },
    "favicon_manifest":  { "status": "done",    "date": "2026-07-19" },
    "robots_hygiene":    { "status": "done",    "date": "2026-07-19" },
    "url_quality":       { "status": "done",    "date": "2026-07-19" },
    "ai_crawlability":   { "status": "done",    "date": "2026-07-19", "notes": "robots allows GPTBot/ClaudeBot/PerplexityBot/Google-Extended; SSR ok" },
    "answer_first":      { "status": "done",    "date": "2026-07-19", "scope": "5 key pages restructured" },
    "semantic_html":     { "status": "done",    "date": "2026-07-19" },
    "ai_readiness":      { "status": "done",    "date": "2026-07-19" },
    "content_suggestions": { "status": "done", "date": "2026-07-19", "notes": "5 suggestions in report" },
    "llms_txt":          { "status": "done",    "date": "2026-07-19", "notes": "created; low real-world weight in 2026 — nice-to-have" },
    "core_web_vitals":   { "status": "partial", "notes": "LCP image flagged; fix reported" },
    "image_optimization":{ "status": "done",    "date": "2026-07-19" },
    "render_blocking":   { "status": "partial", "notes": "1 blocking script reported" },
    "image_alt":         { "status": "done",    "date": "2026-07-19", "scope": "8/8 images" },
    "link_text":         { "status": "done",    "date": "2026-07-19" },
    "html_lang":         { "status": "done",    "date": "2026-07-19" },
    "search_console":    { "status": "partial", "notes": "verification meta added; user finished verify in browser" },
    "analytics_ga4":     { "status": "done",    "date": "2026-07-19", "scope": "G-XXXXXXX injected" }
  },
  "scoreHistory": [
    { "date": "2026-07-19", "before": 38, "after": 91 }
  ]
}
```

## Rules
- The `items` keys are **fixed** and mirror `checklist.md`. Never add ad-hoc keys.
- On each run: read → treat `done`/`n/a` as settled → only re-open items whose scope changed
  (e.g. `pageCount` grew, new routes) or that are `partial`/`todo`.
- After applying, update every touched item's `status`, `date`, `scope`, `notes`, and append to
  `scoreHistory`.
- If nothing changed, still bump `lastRun` and report "Everything is current ✅".
- Store discovered `business` facts here so you don't ask again next time.
