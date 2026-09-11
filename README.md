# seo-butler

> An expert SEO & GEO agency for developers, inside Claude Code.

[Türkçe](README.tr.md) · [MIT](LICENSE) · Node 18+

You build the product; seo-butler gets it found — ranked by Google, and cited by ChatGPT, Claude and Perplexity.

It never asks you SEO questions. It reads your project, detects your stack, and does the technical work an agency would — behind a plan you approve, with a git-aware backup and rollback.

<!-- TODO: demo GIF goes here. Record a real `/seo` run: discovery → audit → the plan → approval → score card. ~30s, 800px wide. Put it at docs/demo.gif and uncomment:
![seo-butler running](docs/demo.gif)
-->

## Install

```
/plugin marketplace add mertagralii/seo-butler
/plugin install seo-butler
```

Restart Claude Code. It installs globally but only ever touches the project you run it in.

## It doesn't grade its own homework

This plugin once scored a site **98/100** and marked all 35 checklist items done. An outside crawler then found a 404-ing link on three pages, a dead contact link on five more, and a skipped heading level inside an item marked done.

The root cause was structural: an item that existed on paper but had no mechanical check behind it quietly degraded to "the model will look at it." A system that verifies itself can never find the check it forgot to write.

So `/seo-verify` hands the site to four independent auditors after each deploy — Google Search Console, a site-wide crawler, a GEO auditor, and Lighthouse — because each is blind somewhere different. Measured on one site in one session: Lighthouse scored SEO 100/100 while the crawler found the 404 and the GEO auditor found the heading gap. A green score is evidence about the page it audited, and nothing else.

External findings are treated as evidence, not verdicts — all three tools produce false positives, and "fixing" one damages a site that was already correct. When two sources independently agree, it's marked `corroborated`.

## The five commands

| Command | Question it answers | Touches your code? | Cadence |
|---|---|---|---|
| `/seo` | Did I do the work? | ✅ after approval | when there's work |
| `/seo-live` | Did it actually ship? | ❌ | after each deploy |
| `/seo-verify` | Does anyone but me agree? | ✅ after approval | until clean |
| `/seo-watch` | Did something break? | ❌ | weekly, unattended |
| `/seo-report` | Is it working? | ❌ | monthly |

**The loop:** `/seo` → deploy → `/seo-live` → (weekly `/seo-watch`) → ~4 weeks → `/seo-report` → repeat.

It works from a fixed 35-item checklist. Fixed on purpose — it never invents new items on later runs. Either it did them or it didn't.

## GEO is first-class

Most SEO tools solve 2015's problem. People now ask their questions in ChatGPT.

The highest-impact single setting is whether your `robots.txt` blocks the citation bots — GPTBot, ClaudeBot, PerplexityBot, OAI-SearchBot, Google-Extended, GoogleOther, Bytespider, CCBot. A catch-all `User-agent: *` block usually sweeps them up without anyone intending it.

Beyond that: server-rendered key content (SPA gaps), answer-first structure, semantic HTML, FAQ blocks, schema stacking.

`llms.txt` is weighted low on purpose — as of 2026 no major AI engine officially consumes it, and this plugin won't repeat a number it can't source, including in its own favour.

## Honesty gates

- **Rules are read, not recalled.** Every checklist item carries the address of its official document. A source that can't be reached is reported with the reason, never counted as confirmed.
- **Nothing is estimated.** Anything unmeasured is reported as unmeasured, with the reason.
- **Applied is not live.** Undeployed work has zero effect, and every run says so.
- **The score is computed.** Two runs on an unchanged site produce byte-identical output. Items marked n/a leave the denominator.
- **Approval before writing.** Meta/title/alt are edited directly; body copy always goes into the plan.
- **No invented content gets schema.** Testimonial blocks it can't verify never receive `Review` markup — reported as a misleading-advertising risk, not an SEO issue.
- **Your password is never requested.**

## Requirements

| What | Required | Note |
|---|---|---|
| Node 18+ | ✅ | For `scripts/`. No other dependencies. |
| chrome-devtools MCP | Recommended | Runs Lighthouse locally, no quota or key. Bundled. |
| A local Chrome/Edge/Chromium | Recommended | Fallback for the above. Nothing to install. |
| Google account | For Search Console/GA4 | You sign in yourself, once. |
| geodaddy MCP | Recommended | The GEO auditor. Free, no account. Bundled. |
| OpenSEO MCP | Optional | Site-wide crawl + Search Console. Reading is free. |

Its memory lives in `./.seo-butler/state.json` — it'll suggest gitignoring that (it holds a business profile), but the call is yours.

## Running the scripts directly

No plugin needed:

```bash
node scripts/validate-artifacts.mjs --url https://yoursite.com --root . --json
node scripts/score.mjs --state ./.seo-butler/state.json --fail-under 90
node scripts/triage-external.mjs --openseo issues.json --geodaddy gd.json --lighthouse lhr.json
```

`--url` takes any origin, so `http://localhost:5173` works — every render-time check runs before you deploy. That matters: a template engine HTML-encoding your JSON-LD type, or a BOM in your sitemap, is invisible in the files and visible only in the bytes the server sends.

`--fail-under` and `--fail-on-act` exit non-zero, so both work as CI gates.

`npm test` runs the suite. No dependencies, no network.

## Known limitations

Current version **v2.4.0**. All four commands have been run end to end on a real project (ASP.NET Core MVC, live site) and held their honesty gates. Still untested:

- A first run on a fresh project has never been exercised.
- The v2.3.0 source registry resolves and is covered by tests, but no live run has yet watched a specialist read a source and act on it.
- The local-Lighthouse rung was verified standalone on Windows, but hasn't carried a full `/seo-live` run.

This section is here because the plugin holds itself to the same rule it holds your site to.

---

Migrating from `growth-butler` (v1.x)? Commands moved from `/growth-seo*` to `/seo*`, and an existing `.growth-butler/state.json` is read and carried forward on first run.
