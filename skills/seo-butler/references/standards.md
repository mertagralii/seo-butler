# Best-Practice Standards (decide like an expert, don't ask)

These are the defaults the butler applies. When a choice arises, use these instead of asking the user.

## Titles
- Length: aim **50–60 characters** (hard cap ~65). Unique per page.
- Pattern: `Primary Page Topic — Brand` for inner pages; `Brand — Value Proposition` for home.
- Front-load the important words. No keyword stuffing.

## Meta descriptions
- Length: aim **140–160 characters** (hard cap ~165). Unique per page.
- One clear sentence describing the page + a soft call to action. Written for humans.

## Canonical
- Every page self-references its clean, absolute canonical URL (https, no tracking params).
- Choose one host convention (www vs non-www) and one trailing-slash convention; keep it consistent.

## Open Graph / Twitter
- og:type = `website` for home/landing, `article` for posts.
- og:image: 1200×630, absolute URL. If none exists, note it (v1 does not auto-generate images).
- Twitter card: `summary_large_image`.

## Structured data (JSON-LD) — choose types by content
- Always: **Organization** (or **LocalBusiness** if there's a physical address/phone) + **WebSite**
  (with `potentialAction` SearchAction only if the site has real search).
- Blog/news post → **Article** / **BlogPosting** (headline, author, datePublished, image).
- Product page → **Product** (+ **Offer** with price/availability if present in the page).
- FAQ content → **FAQPage**.
- Multi-level nav / breadcrumbs → **BreadcrumbList**.
- Only assert facts actually present on the page. Never fabricate ratings, prices, or authorship.

## robots.txt
- Allow crawling of the public site. Disallow only genuine non-public paths (admin, api internals,
  cart, search result permutations). Always include `Sitemap:` absolute URL.

## sitemap.xml
- Include indexable, canonical URLs only (skip noindex, redirects, auth-gated).
- `lastmod` from real file/content dates when available. Keep it valid XML.

## llms.txt (GEO)
- Root `/llms.txt`, markdown. Include: one-paragraph site summary, what the site/company does,
  and a linked list of the most important pages with one-line descriptions. Keep it truthful and current.

## GEO content readiness
- Ensure each key page answers its core question in the first ~2 sentences (answer-first).
- Prefer clear definitional sentences and FAQ blocks — the formats answer engines quote well.
- Recommend (don't silently write) content additions; surface them in the report.

## Accessibility
- Meaningful images: specific, useful alt text (not the filename). Decorative: `alt=""`.
- `<html lang="…">` matches the primary content language.

## Performance
- Apply only safe, clearly-correct code fixes automatically (set image width/height, add
  `loading="lazy"` below the fold, add `<link rel="preconnect">` for known origins).
- Anything risky (bundle splitting, framework config) → report as a recommendation, don't force it.

## The one thing you DON'T decide: business facts
Site/brand name, contact email, postal address, phone, social profile URLs. Read them from the
codebase/content first (footer, contact page, package.json, existing meta). Only if truly absent,
ask 1–2 plain questions. Everything else is yours to decide.
