# Durum

## Şu an
Waiting on Mert. PR #1 (v2.5.0) is ready; CLAUDE.md, the squash-merge, the tag and the release need his approval typed in this session. Capsle.Web passes round 3.

## Son biten
- 2026-10-26 — Round 2 logged in `docs/dogfood-capsle.md` (`8330f39`)
- 2026-10-26 — Lighthouse pin bumped to 13; metric errors now reported (`c156a92`)
- 2026-10-26 — Validator: noindex counts as deliberate when the sitemap agrees (`bdc1702`)
- 2026-10-26 — Next.js metadata pitfalls and the off-port local run documented in the skill (`2acca45`)
- 2026-10-26 — Triage maps Lighthouse 12 insight and lab-only audits (`2cd0e50`); validator catches og:url drift, site-URL fallbacks, dead anchors and thin pages (`9ac6272`)

## Sıradaki
- Review and merge `dogfood/capsle` into `master`. Waits on: Mert.
- Version bump, tag, marketplace release, and the README "Known limitations" update (Lighthouse 13, macOS verified). Waits on: Mert, after the merge.
- Round 3 re-audit when Capsle.Web changes SEO-relevant code (metadata, routes, legal text) or gets a domain. Waits on: Capsle.Web / Mert.
- First live run (`/seo-live`, `/seo-verify`, Search Console) once Capsle has a domain. Waits on: Mert buying the domain.

## Açık sorular
- Merge `dogfood/capsle` as is, or squash? Release as v2.5.0?
- Should this repo get a CLAUDE.md with the session protocol? The coordinator's draft is in the shared session notes; it needs Mert's own OK.

## Bilinen sorunlar
- `lighthouse-local.mjs` now pins `lighthouse@13`; triage notes still describe insight audits as "Lighthouse 12's insight form". That's accurate (LH12 introduced them), but no LH13-only audit has a fixture yet.
- The thin-page check is a heuristic (< 50 words in `<main>`). A short page that is complete as it is (contact, a 404) will also warn.
- The installed marketplace copy under `~/.claude/plugins/marketplaces/seo-butler-marketplace` is older than `master`. Never edit it.
- The validator's canonical-host fail branch (loopback canonical on a public origin) has no test, because the fixture server only binds to loopback.
