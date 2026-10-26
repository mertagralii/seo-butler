# seo-butler

Claude Code plugin: SEO + GEO audits for a developer's site. Markdown (commands, agents, skill) plus
dependency-free Node scripts.

- `commands/` — the five slash commands. `agents/` — the five specialists.
- `skills/seo-butler/SKILL.md` + `references/` — the method, the fixed 35-item checklist, standards.
- `scripts/` — deterministic CLIs: `validate-artifacts.mjs`, `score.mjs`, `triage-external.mjs`,
  `lighthouse-local.mjs`; `external-issues.json` maps outside auditors onto the checklist.
- `tests/` — `node --test`, black-box CLI tests, local fixture server, no network.

## Never
- Edit the installed copy under `~/.claude/plugins/marketplaces/seo-butler-marketplace`.
- Merge to `master`, tag, bump the version or the marketplace without Mert.
- Edit a target site's repo from here; send findings to its session.
- Add a check or a false-positive suppression without a real-site reproduction and a test.

## Done
`npm test` green locally and the GitHub Actions test workflow green on the pushed branch.

## Oturum protokolü
- Start: read `docs/durum.md`, the headings of `docs/kararlar.md`, and the coordinator's brief if one was given.
- End: update `docs/durum.md` in the same commit as the work; add a `docs/kararlar.md` entry if Mert decided something; log any plugin mistake found in `docs/dogfood-capsle.md`; report in the format below.

## Ne zaman neyi oku
| Situation | Read first |
|---|---|
| Changing a validator check | `scripts/validate-artifacts.mjs` header, `references/safety.md` "Runtime verification", `tests/validate-artifacts.url.test.mjs` |
| An outside tool reports something odd | `references/ground-truth.md`, `scripts/external-issues.json` |
| Lighthouse numbers look wrong or empty | `references/measurement.md`, `scripts/lighthouse-local.mjs` header |
| Next.js / other stack specifics | `references/stack-detection.md` |
| A checklist item's rule | `references/sources.md` (registry), then `references/standards.md` |
| Adding or renaming a checklist item | `references/checklist.md`, `references/state-schema.md`, `scripts/weights.json`, `tests/weights-sync.test.mjs` |
| Dogfooding a real site | `docs/dogfood-capsle.md`, `docs/kararlar.md` |
| Writing a commit | global CLAUDE.md commit rules |

## Rapor formatı
Every report to the coordinator uses: `Ne değişti` (files, commit), `Doğrulama` (commands + result,
CI URL), `Açık sorular`, `Sonraki adım önerisi`.
