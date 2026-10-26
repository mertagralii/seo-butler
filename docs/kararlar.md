# Kararlar

### 2026-10-26 — Squash-merge PR #1 and release v2.5.0; add CLAUDE.md with the session protocol
**Neden:** Mert reviewed the dogfood work and approved it in this session.
**Etki:** `master` gets the dogfood fixes as one commit, tagged `v2.5.0` with a GitHub release; `CLAUDE.md` holds the session protocol, the read-first table and the report format.

### 2026-10-26 — Dogfood work stays on `dogfood/capsle`; no merge, tag or release without Mert
**Neden:** Mert decides what ships in the plugin and when the marketplace moves.
**Etki:** every dogfood fix is committed to `dogfood/capsle` and pushed; `master`, tags, `package.json` version and `.claude-plugin/` are untouched until Mert says otherwise.

### 2026-10-26 — The plugin session never edits Capsle.Web directly
**Neden:** Capsle.Web has its own working session; two writers on one repo collide.
**Etki:** audit findings go to the Capsle.Web session as a prioritized list (route, file, expected result), the full text goes to the shared session notes, and re-audits run on a copy of a committed Capsle.Web HEAD built in this session's scratchpad.

### 2026-10-26 — Fixes come from evidence on a real site, each with a test
**Neden:** a check added from intuition is how false positives get in (see `scripts/external-issues.json` rules).
**Etki:** each plugin change during dogfooding is logged in `docs/dogfood-capsle.md` (what was wrong, how found, the fix) and covered in `tests/`. That file is this repo's mistake log.
