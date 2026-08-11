# Measurement — real numbers from real tools

The butler's checklist score answers *"did we do the work?"*. It cannot answer *"is the site actually
good?"* — that's marking your own homework. This reference is how you get **independent verdicts** from
tools the user (and Google) actually trust.

Runs primarily from `/seo-live` (see `live-verification.md`), where a public URL unlocks everything.
Never fabricate a number: an unavailable measurement is reported as unavailable, with the reason.

## Three layers, in order of reliability

### Layer 1 — Deterministic validation (always runs, cannot fail from outside)

**Run the script — don't re-derive these checks by reading files and reasoning about them:**

```
node ${CLAUDE_PLUGIN_ROOT}/scripts/validate-artifacts.mjs --url https://<site> --root . --pages /,/pricing --json
```

`--root` alone works with no network (repo artifacts only); `--url` alone works with no repo; passing
both additionally diffs the repo's robots.txt against the live one, which is the only way an
edge/CDN override shows up. No dependencies, Node 18+.

What it decides, on raw bytes rather than on a belief about the raw bytes:
- **JSON-LD**: that the served response contains a *literal* `application/ld+json` (a template engine
  that HTML-encodes the `+` produces a page that builds, renders, and is invisible to every consumer),
  then `JSON.parse` on every block, then the `@type` inventory and whether Organization/WebSite exist.
- **sitemap.xml**: **no UTF-8 BOM** (a BOM makes strict parsers reject the whole file, and it is
  invisible in an editor), balanced tag structure, `<loc>` count, `<lastmod>` coverage.
- **robots.txt**: parses per-user-agent groups properly, has an absolute `Sitemap:` line, no blanket
  `Disallow: /`, and none of the six AI citation bots blocked.
- **Per page**: title/meta-description presence and length budget, canonical (single + absolute),
  `noindex` hygiene, the five core Open Graph tags, `twitter:card`, `<html lang>`, exactly one `<h1>`,
  mixed content, and **heading order** (no skipped levels — invisible on screen, since level and size
  are styled separately).
- **Link integrity** (`--url` only): a bounded crawl seeded from `--pages` **and the sitemap**, following
  internal links outward (`--link-depth`, default 2; `--max-links`, default 150). Reports every 4xx/5xx
  target with the pages linking to it, and redirect chains over one hop. It reaches `noindex` pages —
  login, register, password reset — precisely because they are absent from the sitemap and are where
  broken links accumulate. `--no-links` skips it. Read `links.coverage`: if the cap was hit, coverage
  was partial and the report must say so.

Three of those checks exist because a passing build and a clean file read still shipped a broken site.
Schema.org *required-field* depth beyond `@type` is still a judgement call — make it yourself, using
`standards.md`, on top of the script's parse result.

This layer is the floor. Even with no internet and no Chrome, `--root` still produces a real verdict.

**`--url` is not "the deployed-site mode".** It takes any origin, so `http://localhost:5173` gets the
same checks as a public domain — which means everything above is available *before* a deploy, as soon
as the project can be started locally. Use it that way during `/seo`'s verification step
(`safety.md` → Runtime verification); `--root` cannot see anything a template does at render time.
What a local run still cannot see is the edge: robots.txt and HTML-body rewrites happen in production
only (`cdn-layer.md`), so `/seo-live` against the real origin remains a separate, required step.

### Layer 2 — Lighthouse (Google's own auditor)

**Four rungs, in this order.** Go down one only when the rung above is unavailable or fails. Never
start at the bottom.

| Rung | How | What it costs |
|---|---|---|
| **1** | `lighthouse_audit` — the bundled chrome-devtools MCP | local, no key, no quota |
| **2** | `scripts/lighthouse-local.mjs` — a browser already on this machine + the Lighthouse CLI | local, no key, no quota |
| **3** | the PageSpeed Insights API | public URL only, **metered daily quota** |
| **4** | nothing | record it in `measurements.unavailable`, with the reason |

The order is not stylistic. Rungs 1 and 2 run on the machine the command is already running on and
cost nothing. Rung 3 is metered by Google, and the keyless quota was exhausted across two commands
in one day in the field. A run that opens at rung 3 spends the only scarce resource first and then
has nothing to fall back to — which is exactly how `/seo-live` came back with HTTP 429 while a
perfectly good Chrome sat idle on the same machine.

#### Rung 1 — `lighthouse_audit` (chrome-devtools MCP)

Runs locally against a real Chrome — **no API key, no daily quota** — and works on localhost as well
as a live URL:
```
lighthouse_audit(device: "mobile", mode: "navigation")
```
- Use `device: "mobile"` first — Google indexes mobile-first. Add desktop only if it's relevant.
- Returns **Accessibility, Best Practices, SEO, and Agentic Browsing**.
- **It does not return a Performance score** — that is Layer 2b below, and the two must not be
  conflated in the report. Saying "Lighthouse 100" when performance was never measured is exactly the
  kind of blended number `scorecard.md` forbids.
- **Agentic Browsing** is Lighthouse's newest category: how well an AI agent can navigate and
  understand the page. It is the closest thing to an *authoritative* GEO signal, and it comes from
  Google. Report it alongside the others; it is evidence, not a checklist item.

Record the source as `local-lighthouse`.

#### Rung 2 — a local browser + the Lighthouse CLI

When chrome-devtools isn't connected, or `lighthouse_audit` errors, you have still almost certainly
got a Chromium on the machine — Chrome, Edge, Brave, plain Chromium, or the one Playwright
downloaded. Run Google's own Lighthouse against it:

```
node ${CLAUDE_PLUGIN_ROOT}/scripts/lighthouse-local.mjs --url https://<site>/<path> \
  --strategy mobile --out .seo-butler/lhr-home.json
```

It finds a browser, starts it headless on a throwaway profile, runs `npx -y lighthouse@12` against
it, and prints a **compact score summary** to stdout. The full LHR goes to `--out`, not into the
conversation — it is megabytes, and that file is exactly what `/seo-verify` feeds to
`triage-external.mjs --lighthouse` (`ground-truth.md`).

- The same categories as rung 1 **plus a real Performance score**, because the CLI runs the full
  audit. What it does not give you is the insight breakdown of Layer 2b — that is a chrome-devtools
  capability. You get the *what* without the *why*.
- No API key, no quota, and it works against `localhost`.
- **It never invents a score.** No browser found, the browser won't start, or Lighthouse returns a
  `runtimeError` (the page didn't load, no First Contentful Paint) → it exits non-zero and prints
  `{"ok": false, "reason": …}`. Copy that reason into `measurements.unavailable` verbatim and drop to
  rung 3. A category Lighthouse scored as `null` is reported as unavailable, never as a 0.
- `--find-browser` tells you what it would use and everywhere it looked. Run that first when you're
  unsure whether this rung is even available on the user's machine.
- If it reports *"Playwright is installed but its Chromium browser is not"*, the fix is one command:
  `npx playwright install chromium`. **Tell the user; don't run it** — it's a ~150 MB download, and
  installing browsers unasked is not this plugin's habit.
- The first use fetches Lighthouse through `npx`, so it needs network once — the same mechanism
  `.mcp.json` already uses for the bundled MCP servers. Offline with a cold npm cache, this rung is
  unavailable; that is a reason to record, not a failure to hide.

Record the source as `lighthouse-cli`.

#### Rung 3 — PageSpeed Insights API (last resort)

Only when there is a public URL and **both local rungs are unavailable** — no chrome-devtools MCP,
and no browser the script can find:
```
https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=<encoded-url>&strategy=mobile
```
It has one thing the local rungs don't: the same response carries CrUX field data (Layer 3). That is
not a reason to call it first. On rungs 1 and 2 you get CrUX from the trace instead — spending a
metered quota to fetch a number that is free elsewhere is how the quota runs out.

The keyless quota is per-day and small — in the field it was exhausted across two commands in one
day. A free key removes the limit (Google Cloud Console → enable *PageSpeed Insights API* → create a
key), goes in the environment as `PAGESPEED_API_KEY`, appended as `&key=<key>`, and is **never
written to `state.json`, printed, or committed.** Record the source as `psi`.

#### Rung 4 — no number at all

On quota or rate-limit failure — HTTP 429, or a 403/400 saying *"Quota exceeded … Queries per day"* —
**produce no score.** Record the reason in `measurements.unavailable` and move on. Never estimate a
Lighthouse number to fill the hole.

**A 429 is only rung 4 if rungs 1 and 2 were actually tried.** If you have arrived here without
having attempted `lighthouse_audit` and the local CLI, that is a bug in the run, not a fact about the
site — go back and attempt them.

**Which pages (all rungs):** the home page plus 2–3 pages that matter (a key landing page, a
representative content page). Auditing every route is slow and adds little; say which pages you
measured.

### Layer 2b — Performance, measured (not guessed)

`performance_start_trace(reload: true, autoStop: true)` records a real load and returns **observed
LCP and CLS** with an LCP breakdown (TTFB / render delay), plus named insights — `LCPBreakdown`,
`RenderBlocking`, `FontDisplay`, `NetworkDependencyTree`, `DOMSize`, `ThirdParties`, `ForcedReflow`,
`Cache` — several with estimated metric savings. It also pulls **CrUX field data** for the URL when
Google has any, and says so honestly when it doesn't.

Judge the numbers against the thresholds in `standards.md` (LCP/INP/CLS, plus TTFB/FCP/TBT).

**Do not paste the raw trace into the report or the conversation.** Each call returns a long
call-tree and network-request format specification along with the data; copying that around burns
context for no benefit. Read the summary, then use `performance_analyze_insight(insightName)` to ask
a targeted question — *"which LCP phase was worst"*, *"which third parties cost the most"* — and
report only the answer.

**This is a rung-1 capability.** Rung 2 gives you a Performance score with LCP / CLS / TBT / FCP
values but no insight breakdown; rung 3, the same. Say which one you had rather than reporting the
thinner result as if it were this one.

### Layer 3 — Google's own view (opportunistic)
Best evidence when available, but conditional — never block on it:
- **CrUX field data** — comes back in the same PSI response (`loadingExperience` / `originLoadingExperience`):
  real-user LCP / INP / CLS. **If the site is new or low-traffic, Google returns nothing.** That is normal
  and must be reported as *"no field data yet — the site needs more traffic"*, never as a bad score.
- **Search Console** — via the user's already-logged-in browser (same approach as checklist items 32–33):
  indexed page count, coverage issues, and rich-results status. This is literally Google's verdict on the
  live site. Read-only unless the user asked for changes.

### Layer 4 — Outside auditors (`ground-truth.md`, run by `/seo-verify`)
Layers 1–3 all measure what *this* toolchain thinks to look at. Layer 4 asks tools with different
blind spots: OpenSEO's site-wide crawl, geodaddy's GEO checks, and — importantly — **Lighthouse's
SEO/accessibility/best-practices categories**, which Layer 2 computes and then uses only for
performance. Feed them all through `triage-external.mjs`, which maps every finding onto the fixed
checklist and suppresses each tool's measured false positives.

Why it is a separate layer rather than more of Layer 2: on a real site Lighthouse returned **SEO
100/100** while the same site had a 404-ing internal link on three pages and a skipped heading level.
Lighthouse audits one page load and cannot follow a link. Every source here is blind somewhere, and
the only defence is not trusting any single one — including this toolchain's own validators.

## Lab vs field — keep them apart
- **Lab** (Lighthouse) = a simulated load on one machine. Reproducible-ish, good for catching regressions,
  but **not** what users experience.
- **Field** (CrUX) = aggregated real users over time. Slower to move, far more meaningful.
They will disagree, and that's expected. Label every number with which it is, and never average them together.

## Interpreting responsibly
- **Performance scores bounce.** A few points between runs is noise. Only report a performance problem when
  it's clear (a failed Core Web Vitals threshold from `standards.md`, or a large, repeatable gap).
- SEO/Accessibility/Best-Practices scores are far more stable — treat their failures as real findings.
- Map each failed audit to a checklist item where one exists, so the user sees *what to do*, not just a number.
- A perfect Lighthouse SEO score does **not** mean the site will rank; it means the technical basics pass.
  Say that plainly rather than letting "100" imply success.

## Reporting
Present the numbers as separate, clearly-labelled blocks — never blended into one composite (see
`scorecard.md`). Each block states what it measures and, if it's missing, why:
```
Coverage (butler checklist):  42 → 95
Lighthouse (live, lab, mobile): SEO 100 · Perf 78 · A11y 94 · BP 92   [home, /pricing, /blog]
Real users (CrUX field):        no data yet — site is new / low traffic
Search Console:                 5 pages discovered · 1 indexed
```

## Persist
Write a `measurements` block to `state.json` (see `state-schema.md`): when it ran, **which rung
produced the number** — `local-lighthouse` (rung 1), `lighthouse-cli` (rung 2) or `psi` (rung 3) —
per-page scores, field metrics, and an explicit list of what could **not** be measured and why.
**Before overwriting the latest snapshot, push the old one onto `measurements.history`** so movement
over time is preserved (keep ~10, prune older).

## Show the trend (movement since last time)
When a prior snapshot exists in `state.json`, report the **delta vs the last comparable measurement** —
same page, same source/strategy — so the user sees progress, not just a static number:
```
Lighthouse (live, lab, mobile): Perf 78 (▲ +16 since 2026-07-15) · SEO 100 · A11y 94 (▲ +6) · BP 92
Real users (CrUX field):        LCP 2.1s (▼ from 2.8s) ✅ · INP 240ms ⚠️ · CLS 0.05 ✅
```
Honesty guards, all inherited from below:
- **Only compare like with like.** Never diff a lab score against a field score, and never diff two
  different rungs — `local-lighthouse`, `lighthouse-cli` and `psi` are three separate harnesses, and
  the gap between them is not a change in the site. If the only prior snapshot isn't comparable, show
  the number with no delta and say why.
- **Performance noise is not progress.** A few points of Lighthouse-performance movement between runs is
  noise — don't render it as ▲/▼. Only show a perf delta when it's large and repeatable, or a Core Web
  Vitals threshold was actually crossed.
- **First run shows no delta** — there's nothing to compare to yet. Say "baseline" rather than faking one.

## Honesty rules
- Never invent, estimate, or "approximate" a score. Missing is missing.
- Say which tool produced each number and when.
- If a whole layer was skipped (no network, no Chrome, rate-limited, site not public), state it in the
  report — **including which rung you ended on** — a silent omission reads as a pass.
