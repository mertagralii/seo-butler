/**
 * The fifth seam: measurement.md <-> every file that tells a run how to measure Lighthouse.
 *
 * `/seo-live` came back with HTTP 429 on a machine that had a perfectly good Chrome sitting idle.
 * Not a quota accident - a drift bug. `measurement.md` had always ranked the PageSpeed Insights API
 * third, behind two local rungs that cost nothing. But `seo-live.md`, `seo-watch.md`, `monitoring.md`,
 * `SKILL.md`, `seo-report.md` and `reporting.md` each restated the measurement step in their own
 * prose, and each of them named PSI first. Six files disagreed with the one that owns the decision,
 * and nothing was checking that they agreed.
 *
 * The fix is the same discipline scorecard.md applies to weights.json: the ladder is written once,
 * in measurement.md, and the consumers point at it. These tests are what stops the copies drifting
 * again - test 1 alone would have failed at the commit that introduced the bug.
 *
 * Nothing here fetches or launches anything. Ordering in prose is a static property of the files.
 */

import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { REPO, SCRIPTS } from './helpers/run.mjs'

const REFERENCES = join(REPO, 'skills', 'seo-butler', 'references')

const read = p => readFileSync(p, 'utf8')

/** Every file that can send a run down the ladder. Add to this list, don't fork the assertion. */
const CONSUMERS = {
  'commands/seo-live.md': read(join(REPO, 'commands', 'seo-live.md')),
  'commands/seo-watch.md': read(join(REPO, 'commands', 'seo-watch.md')),
  'commands/seo-report.md': read(join(REPO, 'commands', 'seo-report.md')),
  'skills/seo-butler/SKILL.md': read(join(REPO, 'skills', 'seo-butler', 'SKILL.md')),
  'references/measurement.md': read(join(REFERENCES, 'measurement.md')),
  'references/monitoring.md': read(join(REFERENCES, 'monitoring.md')),
  'references/reporting.md': read(join(REFERENCES, 'reporting.md'))
}

const MEASUREMENT = CONSUMERS['references/measurement.md']
const SCHEMA_MD = read(join(REFERENCES, 'state-schema.md'))
const SCORECARD = read(join(REFERENCES, 'scorecard.md'))

/** The metered rung. `PSI` as a word, or the product name spelled out. */
const PSI = /\bPSI\b|PageSpeed Insights/
/** The two free rungs: the chrome-devtools MCP tool, or the local CLI script. */
const LOCAL = /lighthouse_audit|lighthouse-local/

const firstIndex = (text, re) => {
  const m = text.match(re)
  return m ? m.index : -1
}

describe('the Lighthouse fallback ladder stays in one order everywhere', () => {
  test('no file names PSI before a local rung', () => {
    // This is the whole bug, asserted. A file is free to never mention measurement at all; what it
    // may not do is send the run to the one metered rung first, because the daily quota is shared
    // across every command and a run that spends it has nothing left to fall back to.
    const offenders = []
    for (const [name, text] of Object.entries(CONSUMERS)) {
      const psi = firstIndex(text, PSI)
      if (psi === -1) continue

      const local = firstIndex(text, LOCAL)
      if (local === -1) {
        offenders.push(`${name}: names PSI but never names a local rung`)
      } else if (local > psi) {
        offenders.push(`${name}: names PSI at ${psi} before the local rung at ${local}`)
      }
    }
    assert.deepEqual(offenders, [],
      'these files route the run to the metered rung first - the 429 this ladder exists to prevent')
  })

  test('measurement.md ranks the rungs 1-4 in order', () => {
    // The consumers point here, so if this file's own order is wrong every pointer inherits it.
    const rungs = [...MEASUREMENT.matchAll(/^#+ Rung (\d)\b/gm)].map(m => Number(m[1]))
    assert.deepEqual(rungs, [1, 2, 3, 4],
      'measurement.md must document exactly four rungs, in ascending order, as headings')

    const ladder = MEASUREMENT.slice(firstIndex(MEASUREMENT, /^#+ Rung 1\b/m))
    assert.ok(firstIndex(ladder, /lighthouse_audit/) < firstIndex(ladder, /lighthouse-local/),
      'rung 1 is the chrome-devtools MCP; rung 2 is the local CLI')
    assert.ok(firstIndex(ladder, /lighthouse-local/) < firstIndex(ladder, PSI),
      'rung 2 is free and local; PSI is rung 3')
  })

  test('every rung names a mechanism that exists', () => {
    // A ladder pointing at a renamed script does not error - it silently falls through to PSI and
    // produces the 429 again, which is exactly how this failure hides.
    assert.ok(existsSync(join(SCRIPTS, 'lighthouse-local.mjs')),
      'measurement.md sends rung 2 to scripts/lighthouse-local.mjs')
    assert.ok(MEASUREMENT.includes('scripts/lighthouse-local.mjs'),
      'rung 2 must name the script by path, so the reader can run it')
  })

  test('the measurements.source vocabulary is written once', () => {
    // state.json records which rung produced a number, and measurement.md's trend rules refuse to
    // diff across two of them. A fourth rung landing in one file only would make that check lie.
    const persist = MEASUREMENT.slice(MEASUREMENT.indexOf('## Persist'))
    assert.ok(persist.length > 0, 'measurement.md no longer carries a Persist section')

    const tokens = [...new Set(
      [...persist.matchAll(/`([a-z-]+)`/g)]
        .map(m => m[1])
        .filter(t => t === 'psi' || t.includes('lighthouse'))
    )].sort()

    assert.deepEqual(tokens, ['lighthouse-cli', 'local-lighthouse', 'psi'],
      'the Persist section names one token per rung that can produce a score')

    for (const t of tokens) {
      assert.ok(SCHEMA_MD.includes(`"${t}"`),
        `state-schema.md documents no measurements.source value "${t}"`)
    }
  })

  test('the performance-score caveat says which rung it is about', () => {
    // `lighthouse_audit` really does not return a performance score - but the CLI at rung 2 does.
    // Left unqualified, the sentence sends the report format wrong the first time rung 2 fires.
    const bare = /`lighthouse_audit` does not return a\s+performance score/
    assert.ok(!bare.test(SCORECARD),
      'scorecard.md must qualify this with the rung - it is false for rung 2')
    assert.ok(/rung 1/.test(SCORECARD),
      'scorecard.md should name the rung the trace line depends on')
  })
})
