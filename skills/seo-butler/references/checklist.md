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

## B. GEO / Content — `seo-geo-content`
13. **llms.txt** — root-level file guiding AI engines to the key pages/summary of the site.
14. **Semantic HTML** — proper h1–h3 hierarchy, landmarks, one clear h1 per page.
15. **AI-answer readiness** — concise summaries, definitional sentences, FAQ blocks where useful,
    so answer engines can quote the site cleanly.
16. **Content suggestions** — concrete, per-page recommendations (surfaced in the report, not
    auto-written): e.g. "add an FAQ section", "add a one-line definition near the top".

## C. Performance — `seo-performance`
17. **Core Web Vitals** — identify likely LCP/CLS/INP problems from the code.
18. **Image optimization** — dimensions set, modern formats, lazy-loading where safe.
19. **Render-blocking / bundle notes** — flag heavy blocking resources; apply safe code fixes,
    report the rest.

## D. Accessibility (SEO-adjacent) — `seo-accessibility`
20. **Image alt text** — every meaningful image has descriptive alt; decorative images `alt=""`.
21. **Link text** — no bare "click here"; descriptive anchors.
22. **Language attribute** — `<html lang>` set correctly.

## E. Dashboards — `seo-analytics`
23. **Google Search Console** — site added, ownership verified, sitemap submitted.
24. **Google Analytics (GA4)** — property set up, measurement tag injected into the site.

> Dashboard items (23–24) always prepare their code side first (verification file/meta, GA4 tag)
> so the code is complete even if the browser steps must be finished by the user.
