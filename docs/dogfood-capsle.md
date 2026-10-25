# Dogfooding on Capsle.Web

Target: Capsle.Web, a Turkish Next.js 16 (App Router) landing site with no domain yet, so it is only
run locally. Search Console, `/seo-live`, the edge diff and CrUX don't apply. Method: `next build` +
`next start` on a free port, then `validate-artifacts.mjs --url` over all 7 routes with the link crawl
on, `lighthouse-local.mjs` on the home page, and `triage-external.mjs` on the LHR.

## Round 1 (site at commit 93dfb85)

What the plugin got wrong or missed, how each one was found, and the fix:

| # | Problem | How found | Fix |
|---|---|---|---|
| 1 | **og:url drift passed.** Four inner pages inherited the layout's `og:url` (the home URL) and the home `og:title`, but the validator only checked that the five OG tags *exist*. | Read the rendered `<head>` of `/kosullar` next to the validator's PASS. | New `page[…].og-url` check: warn when `og:url` ≠ canonical. The message names the shallow-merge cause. |
| 2 | **localhost canonicals passed.** `site.url` falls back to `http://localhost:3100` when the env var is unset. A build without it emitted that host in the canonical, the sitemap, the robots `Sitemap:` line and og tags. Every check passed, because the URLs were absolute. | Rebuilt without `NEXT_PUBLIC_SITE_URL` and served it on :4517. | `hostVerdict`: the canonical, sitemap `<loc>`s and robots Sitemap line are compared with the audited origin. Loopback target on a public origin → fail; another loopback port → warn ("env var with a hard-coded fallback"); production host on a local run → fine. `safety.md`: serve local runs on a port other than the project default, or the fallback can't be seen. |
| 3 | **JSON-LD false positives.** "No JSON-LD" failed on all 7 pages, so 7 of 7 fails were really one defect. Google only expects Organization/WebSite on the home page. | First run: `70 passed · 7 failed`. | Missing JSON-LD fails on `/` only. Inner pages get an `info` note, and the Organization/WebSite warnings run only on `/`. |
| 4 | **Thin placeholder pages weren't seen.** Four "taslak" legal pages (28–36 words) were indexable and listed in the sitemap. Checklist item 11 covers thin pages, but nothing checked it mechanically. | Word count of `<main>` per route. | New `page[…].thin` check: warn on an indexable page with fewer than 50 words in `<main>`/`<body>`. noindex pages are skipped. |
| 5 | **In-page anchors weren't checked.** 3 of the site's 5 nav links are `/#section` anchors. The crawler dropped the fragment, so a renamed section id would break navigation silently, while `standards.md` claims anchors are checked. | Read `checkLinks`. On Capsle all 12 anchor targets do exist. | The crawl records `#id` links and checks each id against the served HTML of every page it read. Pages that were only probed are counted as unchecked in the coverage line. |
| 6 | **Lighthouse 12 output was mostly "unmapped".** 10 of 12 findings said "No mapping … judge it manually" (the `*-insight` audits, the LCP element, TTI, max-potential-FID, unused/legacy JS, DOM size). | `triage-external.mjs` on the real LHR. | Mapped them in `external-issues.json`. Insight audits share the classic audit's item and verdict, so the pair collapses into one job, and the lab-only metrics are marked verify with the reason. 12 raw findings now make 5 jobs. Only `target-size` stays unmapped (no checklist item for it). |
| 7 | **Next.js guidance gaps.** Nothing covered the shallow metadata merge, the `metadataBase` env fallback, or noindexing placeholder routes that must keep their URL. | Findings 1, 2 and 4. | Added to the Next.js section of `stack-detection.md`. |

Also confirmed: `lighthouse-local.mjs` works standalone on macOS (Chrome found and run headless
automatically, exit 0).

Findings sent to Capsle.Web (full note: `seo-audit-capsle-web-r1.md` in the shared session notes):
P1: home JSON-LD (Organization + WebSite + FAQPage from the visible FAQ), per-page Open Graph from a
shared base, noindex the placeholder legal pages and take them out of the sitemap, fix the h1 → h3
skip on `/iletisim`. P2: fail the build when the site URL is unset, keep above-the-fold elements out
of the new reveal/parallax start states (lab LCP is 3.46 s, element = the hero wordmark, 87% render
delay), 24 px touch targets for the carousel dots.
