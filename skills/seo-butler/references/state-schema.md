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
    "broken_links":      { "status": "done",    "date": "2026-07-19", "scope": "0 internal broken; 2 external flagged (report-only)" },
    "edge_robots_check": { "status": "done",    "date": "2026-07-19", "notes": "live robots.txt matched origin (no CDN override)" },
    "canonical_link_consistency": { "status": "done", "date": "2026-07-19", "notes": "rendered internal links all point at canonical" },
    "stale_public_files":{ "status": "partial", "notes": "21 legacy mockups under /html/ — Disallow added, deletion recommended" },
    "ai_crawlability":   { "status": "done",    "date": "2026-07-19", "notes": "robots allows GPTBot/ClaudeBot/PerplexityBot/Google-Extended; SSR ok" },
    "answer_first":      { "status": "done",    "date": "2026-07-19", "scope": "5 key pages restructured" },
    "semantic_html":     { "status": "done",    "date": "2026-07-19" },
    "ai_readiness":      { "status": "done",    "date": "2026-07-19" },
    "content_suggestions": { "status": "done", "date": "2026-07-19", "notes": "5 suggestions in report" },
    "llms_txt":          { "status": "done",    "date": "2026-07-19", "notes": "created; low real-world weight in 2026 — nice-to-have" },
    "internal_linking":  { "status": "done",    "date": "2026-07-19", "scope": "1 orphan fixed; 4 contextual links added (approved)" },
    "keyword_optimization": { "status": "done", "date": "2026-07-19", "scope": "12/12 pages targeted; 1 cannibalization flagged" },
    "content_authenticity": { "status": "done", "date": "2026-07-19", "notes": "10 fabricated testimonials found; user chose removal" },
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
  ],
  "deploy": {
    "deployedAt": null,
    "liveVerifiedAt": null,
    "liveUrl": "https://example.com",
    "liveScore": null,
    "openFindings": []
  },
  "measurements": {
    "measuredAt": "2026-07-22",
    "source": "psi",
    "strategy": "mobile",
    "lighthouse": [
      { "url": "/",        "performance": 78, "seo": 100, "accessibility": 94, "bestPractices": 92 },
      { "url": "/pricing", "performance": 81, "seo": 100, "accessibility": 96, "bestPractices": 92 }
    ],
    "crux": { "lcp": "2.1s", "inp": "240ms", "cls": "0.05", "note": null },
    "searchConsole": { "discovered": 5, "indexed": 1 },
    "unavailable": [
      { "what": "crux", "reason": "no field data yet — site is new / low traffic" }
    ]
  },
  "watch": {
    "lastCheckedAt": "2026-07-22",
    "history": [
      { "date": "2026-07-22", "status": "stable", "findings": [] },
      { "date": "2026-07-15", "status": "regression", "findings": [
        { "what": "robots.txt changed at the edge", "severity": "high", "since": "2026-07-08" }
      ] }
    ],
    "skipped": [
      { "what": "search-console", "reason": "no logged-in browser in unattended run" }
    ]
  },
  "strategy": {
    "lastRun": "2026-07-19",
    "clusters": [
      { "name": "example topic", "intent": "informational", "signal": "medium", "target": "/existing-page" },
      { "name": "gap topic", "intent": "commercial", "signal": "high", "target": null, "gap": true }
    ],
    "competitorGaps": [
      { "competitor": "competitorA.com", "topic": "thing they cover, you don't", "priority": "high" }
    ],
    "recommendedTopics": ["<prioritized topic 1>", "<prioritized topic 2>"]
  }
}
```

> The `strategy` block is **separate from the fixed checklist**. Strategy is an optional, advisory
> deliverable — it is NOT one of the 33 `items`. It exists only after the user has run the strategy
> phase; omit it entirely on runs where strategy wasn't approved.

## Rules
- The `items` keys are **fixed** and mirror `checklist.md`. Never add ad-hoc keys.
- The `deploy` block tracks **applied vs live**. `items` being `done` only means the change is in the
  codebase; until `liveVerifiedAt` is set by `/seo-live`, nothing has been proven in production and search
  engines may still see none of it. Keep `openFindings` populated while live issues remain unresolved.
- The `watch` block is written by `/seo-watch` (`monitoring.md`) and is the **only** thing that command
  writes — it never edits the user's code. Its `history` gives each check a baseline to diff against, and
  `skipped` records what couldn't be checked (e.g. Search Console with no logged-in browser) so a gap is
  never mistaken for a pass.
- The `measurements` block holds **externally produced numbers only** (`measurement.md`) — never the
  butler's own estimates. Whatever couldn't be measured goes in `unavailable` **with its reason**, so a
  later run shows an honest gap rather than a silent one. Keeping history here lets you show movement
  over time instead of re-measuring from zero.
- On each run: read → treat `done`/`n/a` as settled → only re-open items whose scope changed
  (e.g. `pageCount` grew, new routes) or that are `partial`/`todo`.
- After applying, update every touched item's `status`, `date`, `scope`, `notes`, and append to
  `scoreHistory`.
- If nothing changed, still bump `lastRun` and report "Everything is current ✅".
- Store discovered `business` facts here so you don't ask again next time.
