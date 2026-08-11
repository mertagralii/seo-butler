/**
 * lighthouse-local.mjs - rung 2 of the measurement ladder.
 *
 * This script launches a browser and reaches the network, which nothing else in scripts/ does. That
 * is untestable in this repo's CI on purpose: six matrix jobs, no install step (see test.yml), and a
 * browser download would break the invariant that comment protects. So the script is built with two
 * pure surfaces - `--find-browser --platform` and `--summarize` - which are real features first
 * (you run --find-browser to find out whether this rung is even available) and testable second.
 *
 * What the summarize tests are really guarding is honesty. An LHR has three ways of looking like a
 * measurement when it isn't, and each of them would put a fabricated number in front of the user:
 * a runtimeError with every category null, a single null category that rounds to a plausible 0, and
 * an empty result. measurement.md's rule is "never invent, estimate, or approximate a score", and
 * these are where that rule is actually enforced.
 *
 * Nothing here launches a browser or touches the network.
 */

import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { run, fixture } from './helpers/run.mjs'

const SCRIPT = 'lighthouse-local.mjs'

const LHR_SCORED = fixture('external', 'lighthouse-lhr-scored.json')
const LHR_NULL_CATEGORY = fixture('external', 'lighthouse-lhr-null-category.json')
const LHR_RUNTIME_ERROR = fixture('external', 'lighthouse-lhr-runtime-error.json')

const json = r => {
  try {
    return JSON.parse(r.stdout)
  } catch {
    return null
  }
}

describe('lighthouse-local: the CLI contract', () => {
  test('--help exits 0 and explains itself', () => {
    const r = run(SCRIPT, ['--help'])
    assert.equal(r.code, 0)
    assert.match(r.stdout, /--find-browser/)
    assert.match(r.stdout, /--summarize/)
  })

  test('with nothing to do it exits 2, not 0', () => {
    // Exiting 0 with no output would read to the orchestrator as "measured, no findings".
    const r = run(SCRIPT, [])
    assert.equal(r.code, 2)
    assert.match(r.stdout, /--url/)
  })

  test('an unknown argument is refused rather than ignored', () => {
    const r = run(SCRIPT, ['--bogus'])
    assert.equal(r.code, 2)
    assert.match(r.stderr, /Unknown argument/)
  })

  test('a flag that needs a value says so', () => {
    const r = run(SCRIPT, ['--url'])
    assert.equal(r.code, 2)
    assert.match(r.stderr, /needs a value/)
  })

  test('--url must be an absolute URL', () => {
    // A bare "example.com" would be handed to Lighthouse, which fails minutes later and far away.
    const r = run(SCRIPT, ['--url', 'example.com'])
    assert.equal(r.code, 2)
    assert.match(r.stderr, /absolute URL/)
  })

  test('--strategy and --categories reject values Lighthouse would not understand', () => {
    assert.equal(run(SCRIPT, ['--url', 'https://a.test', '--strategy', 'tablet']).code, 2)
    assert.equal(run(SCRIPT, ['--url', 'https://a.test', '--categories', 'pwa']).code, 2)
  })
})

describe('lighthouse-local: browser discovery', () => {
  for (const platform of ['win32', 'darwin', 'linux']) {
    test(`--find-browser --platform ${platform} reports the search order`, () => {
      // The point of --platform is that the ordering is inspectable without owning the machine -
      // which is also why this assertion runs identically on all six CI jobs.
      const r = run(SCRIPT, ['--find-browser', '--platform', platform])
      assert.equal(r.code, 0)

      const out = json(r)
      assert.ok(out, 'stdout must be JSON')
      assert.equal(out.probed, false, 'a foreign platform can be listed but never probed')
      assert.equal(out.platform, platform)
      assert.ok(out.searched.length > 0, 'an empty search order would mean this rung never runs')

      const absolute = platform === 'win32' ? /^[A-Za-z]:\\/ : /^\//
      const relative = out.searched.filter(p => !absolute.test(p))
      assert.deepEqual(relative, [], 'a relative path would resolve against whatever cwd the run has')

      const at = re => out.searched.findIndex(p => re.test(p))
      const playwright = at(/ms-playwright/)
      assert.ok(playwright > 0, 'Playwright\'s cache must be searched - it is the rung-2 browser when it is the only one')
      assert.ok(at(/[Cc]hrome/) < playwright, 'a real Chrome beats a downloaded one')
      assert.ok(at(/[Ee]dge/) < playwright,
        'Edge ranks high on purpose: it is always present on Windows, which is what makes this rung dependable')
    })
  }

  test('--find-browser on this machine answers either way, in JSON', () => {
    // Deliberately does not assert that a browser exists. CI runners ship Chrome today; the suite
    // must not start failing the day they stop. What must hold is that the answer is machine-readable
    // and says where it looked, because that string is what ends up in measurements.unavailable.
    const r = run(SCRIPT, ['--find-browser'])
    assert.ok([0, 1].includes(r.code), `expected 0 or 1, got ${r.code}`)

    const out = json(r)
    assert.ok(out, 'stdout must be JSON whether or not a browser was found')
    assert.ok(Array.isArray(out.searched) && out.searched.length > 0)
    if (r.code === 0) assert.ok(out.browser.path, 'a found browser is reported with its path')
    else assert.ok(out.reason && out.hint, 'a failure carries a reason and something to do about it')
  })

  test('an explicit --chrome-path that does not exist fails loudly', () => {
    const missing = process.platform === 'win32' ? 'C:\\nope\\chrome.exe' : '/nope/chrome'
    const r = run(SCRIPT, ['--find-browser', '--chrome-path', missing])
    assert.equal(r.code, 1)
    assert.equal(json(r).ok, false)
    assert.match(json(r).reason, /does not exist/)
  })
})

describe('lighthouse-local: --summarize never invents a number', () => {
  test('a fully scored LHR becomes the compact summary', () => {
    const r = run(SCRIPT, ['--summarize', LHR_SCORED])
    assert.equal(r.code, 0)

    const out = json(r)
    assert.equal(out.ok, true)
    assert.equal(out.source, 'lighthouse-cli', 'state-schema.md records the rung by this name')
    assert.deepEqual(out.categories, { performance: 100, accessibility: 100, bestPractices: 96, seo: 80 })
    assert.deepEqual(out.unavailable, [])
    assert.equal(out.metrics.lcp, 781, 'milliseconds, rounded')
    assert.equal(out.metrics.cls, 0)
    assert.equal(out.strategy, 'mobile')
    assert.equal(out.lighthouseVersion, '12.8.2', 'which tool produced the number is part of the number')
  })

  test('the summary is a summary - the LHR does not come along', () => {
    // An LHR is megabytes and the caller is a language model. measurement.md forbids the identical
    // thing for performance traces: copying it around burns context for no benefit.
    const out = json(run(SCRIPT, ['--summarize', LHR_SCORED]))
    assert.equal(out.audits, undefined)
    assert.ok(run(SCRIPT, ['--summarize', LHR_SCORED]).stdout.length < 1500)
  })

  test('a null category is unavailable, never a zero', () => {
    // This is the whole point. Rounding null to 0 would report a fast page as catastrophically slow,
    // and it would look exactly like a real measurement.
    const r = run(SCRIPT, ['--summarize', LHR_NULL_CATEGORY])
    assert.equal(r.code, 0)

    const out = json(r)
    assert.equal('performance' in out.categories, false, 'no score is not a score of 0')
    assert.deepEqual(out.categories, { accessibility: 94, bestPractices: 92, seo: 100 })
    assert.deepEqual(out.unavailable.map(u => u.what), ['performance'])
    assert.ok(out.unavailable[0].reason, 'unavailable entries carry the reason, per state-schema.md')
    assert.equal(Object.values(out.categories).includes(0), false)
  })

  test('a runtimeError is not a measurement, whatever the exit code said', () => {
    // Lighthouse exits 0 here. Trusting that is how a page that never rendered gets reported as
    // audited.
    const r = run(SCRIPT, ['--summarize', LHR_RUNTIME_ERROR])
    assert.equal(r.code, 1)

    const out = json(r)
    assert.equal(out.ok, false)
    assert.match(out.reason, /NO_FCP|did not paint/)
    assert.equal(out.categories, undefined, 'no scores may appear anywhere in a failed run')
    assert.equal(/\b(performance|accessibility|bestPractices|seo)\b/.test(r.stdout), false)
  })

  test('--summarize reads stdin too', () => {
    const input = JSON.stringify({
      categories: { seo: { score: 0.9 } },
      audits: {},
      lighthouseVersion: '12.8.2'
    })
    const r = run(SCRIPT, ['--summarize', '-', '--categories', 'seo'], { input })
    assert.equal(r.code, 0)
    assert.deepEqual(json(r).categories, { seo: 90 })
  })

  test('the {lhr} wrapper is accepted, like triage-external.mjs accepts it', () => {
    const r = run(SCRIPT, ['--summarize', '-', '--categories', 'seo'], {
      input: JSON.stringify({ lhr: { categories: { seo: { score: 1 } }, audits: {} } })
    })
    assert.equal(r.code, 0)
    assert.deepEqual(json(r).categories, { seo: 100 })
  })

  test('an LHR with no scores at all fails rather than summarising nothing', () => {
    const r = run(SCRIPT, ['--summarize', '-'], {
      input: JSON.stringify({ categories: {}, audits: {} })
    })
    assert.equal(r.code, 1)
    assert.equal(json(r).ok, false)
  })

  test('malformed input is exit 2, not a crash and not a false measurement', () => {
    const r = run(SCRIPT, ['--summarize', '-'], { input: '{not json' })
    assert.equal(r.code, 2)
    assert.match(r.stderr, /not valid JSON/)
  })

  test('two --summarize runs are byte-identical', () => {
    // True of --summarize and deliberately NOT of a live audit: performance scores bounce between
    // runs (measurement.md). Do not generalise this assertion to an audit.
    const a = run(SCRIPT, ['--summarize', LHR_SCORED])
    const b = run(SCRIPT, ['--summarize', LHR_SCORED])
    assert.equal(a.stdout, b.stdout)
  })
})

describe('lighthouse-local: end to end', () => {
  // Opt-in only. Launches a real browser and fetches Lighthouse over the network, so it must never
  // run in CI - see the header. Run it by hand after touching the launch or npx paths:
  //   SEO_BUTLER_E2E=1 node --test tests/lighthouse-local.test.mjs
  const skip = !process.env.SEO_BUTLER_E2E && 'set SEO_BUTLER_E2E=1 to run the live audit'

  test('audits a real page and returns real scores', { skip }, () => {
    const r = run(SCRIPT, ['--url', 'https://example.com'], { timeout: 300_000 })
    assert.equal(r.code, 0)

    const out = json(r)
    assert.equal(out.source, 'lighthouse-cli')
    assert.ok(out.browser.path, 'the summary says which browser produced it')
    for (const v of Object.values(out.categories)) {
      assert.ok(Number.isInteger(v) && v >= 0 && v <= 100, `${v} is not a Lighthouse score`)
    }
  })

  test('an unreachable URL produces no score', { skip }, () => {
    const r = run(SCRIPT, ['--url', 'https://this-host-does-not-exist.invalid'], { timeout: 300_000 })
    assert.equal(r.code, 1)
    assert.equal(json(r).ok, false)
    assert.ok(json(r).reason)
  })
})
