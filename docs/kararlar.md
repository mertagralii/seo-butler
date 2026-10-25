# Kararlar

### 2026-10-26 — Dogfood work stays on `dogfood/capsle`; no merge, tag or release without Mert
**Neden:** Mert decides what ships in the plugin and when the marketplace moves.
**Etki:** every dogfood fix is committed to `dogfood/capsle` and pushed; `master`, tags, `package.json` version and `.claude-plugin/` are untouched until Mert says otherwise.

### 2026-10-26 — The plugin session never edits Capsle.Web directly
**Neden:** Capsle.Web has its own working session; two writers on one repo collide.
**Etki:** audit findings go to the Capsle.Web session as a prioritized list (route, file, expected result), the full text goes to the shared session notes, and re-audits run on a copy of a committed Capsle.Web HEAD built in this session's scratchpad.

### 2026-10-26 — Fixes come from evidence on a real site, each with a test
**Neden:** a check added from intuition is how false positives get in (see `scripts/external-issues.json` rules).
**Etki:** each plugin change during dogfooding is logged in `docs/dogfood-capsle.md` (what was wrong, how found, the fix) and covered in `tests/`. That file is this repo's mistake log.
