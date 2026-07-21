# Measurement — real numbers from real tools

The butler's checklist score answers *"did we do the work?"*. It cannot answer *"is the site actually
good?"* — that's marking your own homework. This reference is how you get **independent verdicts** from
tools the user (and Google) actually trust.

Runs primarily from `/seo-live` (see `live-verification.md`), where a public URL unlocks everything.
Never fabricate a number: an unavailable measurement is reported as unavailable, with the reason.

## Three layers, in order of reliability

### Layer 1 — Deterministic validation (always runs, cannot fail from outside)
No network service involved, so this always produces a verdict:
- **JSON-LD**: extract every block from the rendered HTML, `JSON.parse` it, then check the schema.org
  type's **required** fields are present and the recommended ones are mostly there. Report per block:
  valid / invalid / incomplete, with what's missing. (`standards.md` says which types apply where.)
- **sitemap.xml**: well-formed XML, no BOM, `<loc>` values absolute, entries within limits.
- **robots.txt**: parses, has an absolute `Sitemap:` line, doesn't block what should be crawlable.

This layer is the floor. Even with no internet and no Chrome, the butler can still say something true.

### Layer 2 — Lighthouse (Google's own auditor)
Four scores: **Performance, SEO, Accessibility, Best Practices**. Two ways to get them:

**Live URL → PageSpeed Insights API (preferred).** One request returns **both** the Lighthouse lab result
**and** CrUX field data, and needs no local browser:
```
https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=<encoded-url>&strategy=mobile
```
- Works without an API key at low volume; if you get rate-limited (HTTP 429), say so and offer that the
  user can supply a free key rather than silently giving up.
- Use `strategy=mobile` first — Google indexes mobile-first. Add `desktop` only if it's relevant.
- Only works for **publicly reachable** URLs (no localhost, no auth walls).

**Local URL → Lighthouse CLI via the bundled Chromium.** For a dev server before deploy:
```
npx lighthouse <url> --output=json --quiet --chrome-flags="--headless"
```
If it can't find a browser, point `CHROME_PATH` at the Chromium that ships with the bundled Playwright
MCP. If that still fails, **skip this layer and say so** — don't spend the run fighting it.

**Which pages:** the home page plus 2–3 pages that matter (a key landing page, a representative content
page). Auditing every route is slow and adds little; say which pages you measured.

### Layer 3 — Google's own view (opportunistic)
Best evidence when available, but conditional — never block on it:
- **CrUX field data** — comes back in the same PSI response (`loadingExperience` / `originLoadingExperience`):
  real-user LCP / INP / CLS. **If the site is new or low-traffic, Google returns nothing.** That is normal
  and must be reported as *"no field data yet — the site needs more traffic"*, never as a bad score.
- **Search Console** — via the user's already-logged-in browser (same approach as checklist items 32–33):
  indexed page count, coverage issues, and rich-results status. This is literally Google's verdict on the
  live site. Read-only unless the user asked for changes.

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
Write a `measurements` block to `state.json` (see `state-schema.md`): when it ran, which source
(`psi` / `local-lighthouse`), per-page scores, field metrics, and an explicit list of what could **not**
be measured and why. A later run can then show movement over time instead of starting from zero.

## Honesty rules
- Never invent, estimate, or "approximate" a score. Missing is missing.
- Say which tool produced each number and when.
- If a whole layer was skipped (no network, no Chrome, rate-limited, site not public), state it in the
  report — a silent omission reads as a pass.
