# Safety & Verification — never break a site

The rule: **applying SEO must never make the site worse.** A plugin that breaks a site once gets
uninstalled forever. When torn between a risky improvement and safety, choose safety and *report* the
recommendation instead of forcing it.

## Before applying — git-aware backup (smart git check)
Run this check after the plan is approved, before touching any file:

1. **Is it a git repo?** (`git rev-parse --is-inside-work-tree`)
2. **If git repo:**
   - **Clean tree** → proceed. Changes will land in the working tree; the user reviews them with
     `git diff` and can undo with `git checkout` / `git restore`. Tell them this.
   - **Dirty tree (uncommitted changes)** → warn: "You have uncommitted changes — I recommend
     committing or stashing them first so my edits are easy to separate and revert." Proceed only on
     the user's OK. **Never auto-commit or stash the user's unrelated work.**
   - Do **not** create commits on the user's behalf. Plan approval authorizes *edits*, not commits.
3. **If NOT a git repo:** recommend `git init` (so changes are trackable/revertable), or, if the user
   declines, make a lightweight backup of the files about to change into
   `.seo-butler/backup/<runId>/` before editing. Inform the user either way, then proceed.

## Idempotency — safe re-runs
- Read `state.json` first; skip items already `done` and still valid.
- Before adding any tag/file, check whether it already exists — **update in place, never duplicate**:
  no two `<title>`, no double canonical, no repeated JSON-LD block, no duplicated robots rules.
- Regenerate whole-file artifacts (robots.txt, sitemap.xml, llms.txt) deterministically — don't append.

## Preserve the user's work
- Never overwrite existing meaningful metadata/content without surfacing it in the plan. **Complete
  and repair; don't replace.**
- **Body-copy edit boundary:** metadata fields (title, meta, headings, alt) may be edited directly.
  Edits to the user's **substantive body copy** (keyword/readability/internal-link edits) are only ever
  applied **after the user approves them in the plan** — never silently. Never fabricate facts/stats/
  reviews, and never write new articles/content from scratch.
- Match the project's conventions: indentation, quote style, framework idioms.

## After applying — verify, then roll back if broken
Detect the project's own checks (from `package.json` scripts / config) and run what's available:
- **Build / typecheck:** e.g. `npm run build`, `tsc --noEmit`, the framework build. If it now fails
  due to our change, fix it or revert that change.
- **Lint / format:** run if present; apply safe auto-fixes.
- **Validate generated artifacts:**
  - robots.txt parses and contains an absolute `Sitemap:` line.
  - sitemap.xml is well-formed XML, URLs absolute, within size/count limits.
  - Each JSON-LD block is valid JSON and satisfies its schema.org required fields (no fabricated values).
  - Head edits don't duplicate: exactly one `<title>`, one canonical, one `<h1>` per page.
- **On regression from our change:** revert that specific change (`git checkout -- <file>` in a repo;
  restore from `.seo-butler/backup/` otherwise), mark the item `partial`/`todo` in state with the
  reason, and report it honestly. **Never leave the project in a broken state.**

## Honesty
- If verification couldn't run (no build script, unknown stack, tool missing), say so — don't imply it passed.
- The score card / report states exactly what changed, what was verified, and what still needs the user.
