# The Fixed SEO/GEO Checklist

This list is **fixed**. It is the complete menu the butler audits every run. On a first run you
cover all of it; on later runs you re-check the same items — you never invent new ones. Each item
maps to a specialist and to a key in `.seo-butler/state.json`.

Statuses: `done` · `partial` · `skipped` (user chose to skip) · `todo` · `n/a` (not applicable to this stack).

## A. Technical SEO — `seo-technical`
1. **robots.txt** — present, not blocking the whole site, points to sitemap.
2. **sitemap.xml** — all indexable URLs, correct `<loc>`, `lastmod`; referenced from robots.txt.
3. **Title tags** — unique per page, within length budget (see standards).
4. **Meta description** — unique per page, within length budget.
5. **Canonical URLs** — every page declares its canonical; no duplicate-content ambiguity.
6. **hreflang** — only if the site is multilingual; otherwise `n/a`.
7. **Open Graph tags** — og:title, og:description, og:image, og:url, og:type.
8. **Twitter Card tags** — summary_large_image with image.
9. **Structured data (JSON-LD)** — at minimum Organization + WebSite; add per-page types
   (Article/Product/FAQ/BreadcrumbList/LocalBusiness) where the content justifies it.
10. **Favicon + web manifest + theme-color** — basic app/meta presence.
11. **Meta robots / noindex hygiene** — no accidental `noindex` on pages that should rank; staging
    or thin pages correctly excluded.
12. **Clean, descriptive URLs** — flag obviously bad patterns (query-string-only, IDs) as a note.

## B. GEO / Content — `seo-geo-content`  (see `geo.md` for the full playbook + honest impact tiers)
13. **AI crawlability** — robots.txt allows citation bots (GPTBot, OAI-SearchBot, ClaudeBot,
    PerplexityBot, Google-Extended, Bingbot); key content is server-rendered (flag SPA gaps);
    nothing important behind login/paywall. **(Tier 1 — highest impact.)**
14. **Answer-first structure** — key pages/sections answer their core question in the first ~2
    sentences; question-based headings ("What is X?"); one clear h1; scannable lists/tables. **(Tier 2.)**
15. **Semantic HTML** — correct h1–h3 hierarchy, landmarks, one h1 per page.
16. **AI-answer readiness** — definitional sentences + FAQ blocks where genuinely useful.
17. **Content suggestions (evidence & freshness)** — concrete, per-page recommendations surfaced in
    the report, not auto-written: add real statistics/quotes/cited sources (measured citation
    boosters), add an FAQ, add original data, refresh dates. **(Tiers 3–4.)**
18. **llms.txt** — create root-level file (cheap, future-proofing) **but report its impact honestly**:
    ~2% adoption, no major AI company officially consumes it yet. Nice-to-have, not a ranking lever. **(Tier 6.)**

## C. Performance — `seo-performance`  (2026 thresholds in `standards.md`)
19. **Core Web Vitals** — identify likely LCP (≤2.5s) / INP (≤200ms) / CLS (≤0.1) problems from the code.
20. **Image optimization** — dimensions set, modern formats, lazy-loading where safe.
21. **Render-blocking / bundle notes** — flag heavy blocking resources; apply safe code fixes,
    report the rest.

## D. Accessibility (SEO-adjacent) — `seo-accessibility`
22. **Image alt text** — every meaningful image has descriptive alt; decorative images `alt=""`.
23. **Link text** — no bare "click here"; descriptive anchors.
24. **Language attribute** — `<html lang>` set correctly.

## E. Dashboards — `seo-analytics`
25. **Google Search Console** — site added, ownership verified, sitemap submitted.
26. **Google Analytics (GA4)** — property set up, measurement tag injected into the site.

> Dashboard items (25–26) always prepare their code side first (verification file/meta, GA4 tag)
> so the code is complete even if the browser steps must be finished by the user.
