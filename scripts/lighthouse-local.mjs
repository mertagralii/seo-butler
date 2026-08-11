#!/usr/bin/env node
/**
 * lighthouse-local.mjs - run Google's Lighthouse against a browser already on this machine.
 *
 * This is rung 2 of the ladder in references/measurement.md. Rung 1 is `lighthouse_audit` from the
 * bundled chrome-devtools MCP; rung 3 is the PageSpeed Insights API, which is metered. `/seo-live`
 * once came back with HTTP 429 because it opened at rung 3 while a perfectly good Chrome sat idle on
 * the same machine. This script is what stands between those two, so that losing the MCP costs you
 * the trace insights - not the measurement.
 *
 * It does not require Chrome specifically, and it installs nothing. It looks for a Chromium that is
 * already there - Chrome, Edge, Brave, plain Chromium, or the one Playwright downloaded - starts it
 * headless on a throwaway profile, and points `npx -y lighthouse@12` at its DevTools port.
 *
 * Three design choices are load-bearing, each because the obvious alternative breaks:
 *
 *   - `--remote-debugging-port=0`, never 9222. A fixed port collides with chrome-devtools-mcp and
 *     with any Chrome the user already started with debugging on - so rung 2 would fail preferentially
 *     on the machines that have rung 1, the worst possible correlation. Chrome writes the real port
 *     into DevToolsActivePort; we read it back.
 *   - a fresh `mkdtemp` profile, never the user's. On Windows, launching with the default profile
 *     while Chrome is running hands off to the existing instance and exits immediately.
 *   - we launch the browser, so Lighthouse gets `--port` and never `--chrome-flags`. That removes
 *     the one argument that would have to carry a space inside quotes, which is where Windows
 *     command-line quoting goes wrong.
 *
 * NOTE FOR LATER MAINTAINERS: every other script in scripts/ is deterministic and offline, and their
 * tests assert that two runs are byte-identical. This one launches a browser and reaches the network,
 * and performance scores bounce between runs (measurement.md, "Interpreting responsibly"). Only
 * `--summarize` is reproducible. Do not write a byte-stability test against a live audit.
 *
 * Usage:
 *   node scripts/lighthouse-local.mjs --url https://example.com --out .seo-butler/lhr-home.json
 *   node scripts/lighthouse-local.mjs --find-browser
 *   node scripts/lighthouse-local.mjs --url https://example.com --lhr | node scripts/triage-external.mjs --lighthouse -
 *
 * No dependencies (Lighthouse is fetched at run time by npx, the same way .mcp.json fetches its
 * servers). Node 18+.
 */

import { spawn } from 'node:child_process'
import { readFileSync, writeFileSync, existsSync, readdirSync, mkdtempSync, rmSync, mkdirSync } from 'node:fs'
import { tmpdir, homedir } from 'node:os'
import { join, dirname, resolve, win32 as pathWin32, posix as pathPosix } from 'node:path'

const USAGE = `
lighthouse-local.mjs - run Google's Lighthouse against a browser on this machine

  --url <url>           page to audit (one page per run)
  --strategy <s>        mobile (default) or desktop
  --categories <list>   comma-separated (default: performance,accessibility,best-practices,seo)
  --out <file>          also write the full LHR JSON here - this is what triage-external.mjs reads
  --lhr                 print the full LHR to stdout instead of the summary (for piping)
  --chrome-path <p>     browser executable to use, overriding discovery (also: CHROME_PATH)
  --timeout <ms>        give up on the audit after this long (default 120000)
  --find-browser        report which browser would be used, and where it looked, then exit
  --platform <p>        with --find-browser: list the search order for win32/darwin/linux (never probes)
  --summarize <file|->  summarise an LHR you already have, without running anything
  --help                this message

stdout is JSON and nothing else. Progress, browser output and diagnostics go to stderr.

Exit 0 measured - Exit 1 could not measure, stdout carries {"ok":false,"reason":…} - Exit 2 bad arguments.
`.trim()

/** The pinned major. The LHR shape is a contract triage-external.mjs parses; @latest could break it silently. */
const LIGHTHOUSE_SPEC = 'lighthouse@12'

const DEFAULT_CATEGORIES = ['performance', 'accessibility', 'best-practices', 'seo']

/** Lighthouse category id -> the key we report it under (and state-schema.md documents). */
const CATEGORY_KEY = {
  performance: 'performance',
  accessibility: 'accessibility',
  'best-practices': 'bestPractices',
  seo: 'seo'
}

/** Audit id -> summary metric. Everything else in the LHR stays in the file, out of the context. */
const METRIC_AUDIT = {
  lcp: 'largest-contentful-paint',
  cls: 'cumulative-layout-shift',
  tbt: 'total-blocking-time',
  fcp: 'first-contentful-paint',
  si: 'speed-index'
}

/**
 * A measurement that did not happen. `reason` is copied verbatim into measurements.unavailable, so
 * it has to read as an explanation on its own - the orchestrator never saw the failure.
 */
class Unmeasurable extends Error {
  constructor (reason, extra = {}) {
    super(reason)
    this.reason = reason
    this.extra = extra
  }
}

// ---------------------------------------------------------------------------- arguments

function parseArgs (argv) {
  const args = {
    url: null,
    strategy: 'mobile',
    categories: [...DEFAULT_CATEGORIES],
    out: null,
    lhr: false,
    chromePath: process.env.CHROME_PATH || null,
    timeout: 120_000,
    findBrowser: false,
    platform: null,
    summarize: null,
    help: false
  }
  const need = (a, v) => {
    if (v === undefined) throw new Error(`${a} needs a value`)
    return v
  }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--help' || a === '-h') args.help = true
    else if (a === '--lhr') args.lhr = true
    else if (a === '--find-browser') args.findBrowser = true
    else if (a === '--url') args.url = need(a, argv[++i])
    else if (a === '--strategy') args.strategy = need(a, argv[++i])
    else if (a === '--categories') args.categories = need(a, argv[++i]).split(',').map(s => s.trim()).filter(Boolean)
    else if (a === '--out') args.out = need(a, argv[++i])
    else if (a === '--chrome-path') args.chromePath = need(a, argv[++i])
    else if (a === '--timeout') args.timeout = Number(need(a, argv[++i]))
    else if (a === '--platform') args.platform = need(a, argv[++i])
    else if (a === '--summarize') args.summarize = need(a, argv[++i])
    else throw new Error(`Unknown argument: ${a}`)
  }

  if (!['mobile', 'desktop'].includes(args.strategy)) {
    throw new Error(`--strategy must be mobile or desktop, got "${args.strategy}"`)
  }
  if (args.platform && !['win32', 'darwin', 'linux'].includes(args.platform)) {
    throw new Error(`--platform must be win32, darwin or linux, got "${args.platform}"`)
  }
  if (!Number.isFinite(args.timeout) || args.timeout <= 0) {
    throw new Error('--timeout must be a positive number of milliseconds')
  }
  const unknownCategories = args.categories.filter(c => !CATEGORY_KEY[c])
  if (unknownCategories.length) {
    throw new Error(`Unknown category: ${unknownCategories.join(', ')}. Known: ${Object.keys(CATEGORY_KEY).join(', ')}`)
  }
  return args
}

// ---------------------------------------------------------------------------- finding a browser

/**
 * The environment a search order is built against.
 *
 * For this machine that is the real environment. For any other platform - `--find-browser --platform
 * darwin` from Windows, which is how the ordering gets reviewed without owning a Mac - the host's
 * env vars and home directory are meaningless and its path separator is wrong. So a foreign listing
 * is built with that platform's own path module and clearly-placeholder absolute roots.
 */
function searchEnv (platform) {
  const native = platform === process.platform
  const path = platform === 'win32' ? pathWin32 : pathPosix
  const env = native ? process.env : {}
  const home = native
    ? homedir()
    : platform === 'win32' ? 'C:\\Users\\<user>' : platform === 'darwin' ? '/Users/<user>' : '/home/<user>'
  return { path, env, home }
}

/**
 * Where a Chromium lives, per platform, in the order we prefer them.
 *
 * Edge sits second on purpose: on Windows it is always present, and that is what makes this rung
 * dependable rather than theoretically available. Playwright's cache is last - it is a fine browser
 * when it is there, but requiring a ~150 MB download would defeat the point of a fallback.
 *
 * Entries whose path contains `*` are glob patterns, expanded only when probing the real filesystem.
 */
function candidates (platform) {
  const { path, env, home } = searchEnv(platform)
  const out = []
  const add = (kind, p) => out.push({ kind, path: p })
  const j = (...parts) => path.join(...parts)

  if (platform === 'win32') {
    const roots = [
      env.LOCALAPPDATA || j(home, 'AppData', 'Local'),
      env.ProgramFiles || 'C:\\Program Files',
      env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)'
    ]
    for (const r of roots) add('chrome', j(r, 'Google', 'Chrome', 'Application', 'chrome.exe'))
    for (const r of roots) add('edge', j(r, 'Microsoft', 'Edge', 'Application', 'msedge.exe'))
    for (const r of roots) add('brave', j(r, 'BraveSoftware', 'Brave-Browser', 'Application', 'brave.exe'))
    for (const r of roots) add('chromium', j(r, 'Chromium', 'Application', 'chrome.exe'))
    for (const r of playwrightRoots(platform)) {
      add('playwright-chromium', j(r, 'chromium-*', 'chrome-win', 'chrome.exe'))
      add('chromium-headless-shell', j(r, 'chromium_headless_shell-*', 'chrome-win', 'headless_shell.exe'))
    }
    return out
  }

  if (platform === 'darwin') {
    const apps = ['/Applications', j(home, 'Applications')]
    for (const a of apps) add('chrome', j(a, 'Google Chrome.app/Contents/MacOS/Google Chrome'))
    for (const a of apps) add('edge', j(a, 'Microsoft Edge.app/Contents/MacOS/Microsoft Edge'))
    for (const a of apps) add('brave', j(a, 'Brave Browser.app/Contents/MacOS/Brave Browser'))
    for (const a of apps) add('chromium', j(a, 'Chromium.app/Contents/MacOS/Chromium'))
    for (const r of playwrightRoots(platform)) {
      add('playwright-chromium', j(r, 'chromium-*/chrome-mac/Chromium.app/Contents/MacOS/Chromium'))
      add('playwright-chromium', j(r, 'chromium-*/chrome-mac-arm64/Chromium.app/Contents/MacOS/Chromium'))
      add('chromium-headless-shell', j(r, 'chromium_headless_shell-*/chrome-mac/headless_shell'))
    }
    return out
  }

  add('chrome', '/opt/google/chrome/chrome')
  add('chrome', '/usr/bin/google-chrome')
  add('chrome', '/usr/bin/google-chrome-stable')
  add('edge', '/opt/microsoft/msedge/msedge')
  add('edge', '/usr/bin/microsoft-edge')
  add('edge', '/usr/bin/microsoft-edge-stable')
  add('brave', '/usr/bin/brave-browser')
  add('chromium', '/usr/bin/chromium')
  add('chromium', '/usr/bin/chromium-browser')
  add('chromium', '/snap/bin/chromium')
  for (const r of playwrightRoots(platform)) {
    add('playwright-chromium', j(r, 'chromium-*/chrome-linux/chrome'))
    add('chromium-headless-shell', j(r, 'chromium_headless_shell-*/chrome-linux/headless_shell'))
  }
  return out
}

/** Playwright's browser cache. PLAYWRIGHT_BROWSERS_PATH moves it; "0" means inside the package. */
function playwrightRoots (platform) {
  const { path, env, home } = searchEnv(platform)
  const configured = env.PLAYWRIGHT_BROWSERS_PATH
  if (configured && configured !== '0') return [configured]
  if (platform === 'win32') return [path.join(env.LOCALAPPDATA || path.join(home, 'AppData', 'Local'), 'ms-playwright')]
  if (platform === 'darwin') return [path.join(home, 'Library/Caches/ms-playwright')]
  return [path.join(home, '.cache/ms-playwright')]
}

/** Expand one `chromium-*` style pattern against the real filesystem, newest build first. */
function expandGlob (pattern) {
  const star = pattern.indexOf('*')
  if (star === -1) return [pattern]

  const sep = Math.max(pattern.lastIndexOf('/', star), pattern.lastIndexOf('\\', star))
  const parent = pattern.slice(0, sep)
  const segEnd = Math.min(
    ...[pattern.indexOf('/', star), pattern.indexOf('\\', star)].filter(i => i !== -1).concat([pattern.length])
  )
  const seg = pattern.slice(sep + 1, segEnd)
  const rest = pattern.slice(segEnd)

  let entries
  try {
    entries = readdirSync(parent)
  } catch {
    return []
  }
  const prefix = seg.slice(0, seg.indexOf('*'))
  // Builds are numbered, so the highest number is the newest. Sort descending, numerically.
  return entries
    .filter(e => e.startsWith(prefix))
    .sort((a, b) => (Number(b.slice(prefix.length)) || 0) - (Number(a.slice(prefix.length)) || 0))
    .map(e => join(parent, e) + rest)
}

/**
 * Resolve the browser to use. Returns {kind, path} or throws Unmeasurable carrying everywhere it
 * looked - rung 4 needs a reason a human can act on, not "not found".
 */
function findBrowser (chromePath) {
  if (chromePath) {
    if (existsSync(chromePath)) return { kind: 'explicit', path: resolve(chromePath) }
    throw new Unmeasurable(`the browser at ${chromePath} does not exist`, {
      hint: 'check --chrome-path / CHROME_PATH, or drop it and let discovery find a browser',
      searched: [chromePath]
    })
  }

  const searched = []
  for (const c of candidates(process.platform)) {
    const expanded = expandGlob(c.path)
    // A pattern that matched nothing is still worth reporting - it says where we looked.
    if (!expanded.length) searched.push(c.path)
    for (const path of expanded) {
      searched.push(path)
      if (existsSync(path)) return { kind: c.kind, path }
    }
  }

  // Distinguish "Playwright is here but its Chromium is not" from "no browser at all" - the first
  // has a one-command fix and the second does not, and telling the user the wrong one wastes them.
  const playwrightPresent = playwrightRoots(process.platform).some(r => existsSync(r))
  if (playwrightPresent) {
    throw new Unmeasurable('Playwright is installed but its Chromium browser is not', {
      hint: 'npx playwright install chromium (or install Chrome or Edge)',
      searched
    })
  }
  throw new Unmeasurable('no Chromium-based browser found on this machine', {
    hint: 'install Chrome or Edge, or set CHROME_PATH to a Chromium binary',
    searched
  })
}

// ---------------------------------------------------------------------------- shaping the result

/** Accept a bare LHR or the `{lhr}` wrapper, the same two shapes triage-external.mjs takes. */
function unwrapLhr (doc) {
  return doc && typeof doc === 'object' && doc.lhr ? doc.lhr : doc
}

/**
 * Turn an LHR into the compact summary that goes to stdout.
 *
 * Three ways an LHR lies if you read it naively, all guarded here:
 *   - Lighthouse exits 0 on a page that never loaded, and reports it as `runtimeError` with every
 *     category null. That is not a measurement.
 *   - a null category score is not a zero. It goes to `unavailable`; inventing a 0 is worse than a gap.
 *   - all categories null with no runtimeError is still nothing. A summary of nothing must not read
 *     as a success.
 */
function summarize (doc, wanted = DEFAULT_CATEGORIES, extra = {}) {
  const lhr = unwrapLhr(doc)
  if (!lhr || typeof lhr !== 'object') throw new Unmeasurable('the report is not a Lighthouse LHR object')

  if (lhr.runtimeError && lhr.runtimeError.code !== 'NO_ERROR') {
    throw new Unmeasurable(
      `Lighthouse could not load the page: ${lhr.runtimeError.message || lhr.runtimeError.code}`,
      { hint: 'check the URL is reachable from this machine and returns HTML', ...extra }
    )
  }

  const categories = {}
  const unavailable = []
  for (const id of wanted) {
    const key = CATEGORY_KEY[id]
    const score = lhr.categories?.[id]?.score
    if (typeof score === 'number') categories[key] = Math.round(score * 100)
    else unavailable.push({ what: key, reason: `Lighthouse returned no ${id} score for this run` })
  }

  if (Object.keys(categories).length === 0) {
    throw new Unmeasurable('Lighthouse returned no scores at all for this page', {
      hint: 'the page loaded but produced no usable audit - try it in a browser by hand',
      ...extra
    })
  }

  const metrics = {}
  for (const [key, auditId] of Object.entries(METRIC_AUDIT)) {
    const v = lhr.audits?.[auditId]?.numericValue
    if (typeof v === 'number') metrics[key] = key === 'cls' ? Number(v.toFixed(3)) : Math.round(v)
  }

  return {
    ok: true,
    url: lhr.finalDisplayedUrl || lhr.finalUrl || lhr.requestedUrl || null,
    strategy: lhr.configSettings?.formFactor === 'desktop' ? 'desktop' : 'mobile',
    source: 'lighthouse-cli',
    lighthouseVersion: lhr.lighthouseVersion || null,
    fetchedAt: lhr.fetchTime || null,
    categories,
    metrics,
    unavailable,
    ...extra
  }
}

// ---------------------------------------------------------------------------- running it

const sleep = ms => new Promise(r => setTimeout(r, ms))

/** Chrome writes the port it actually bound as line 1 of this file. Poll until it appears. */
async function waitForPort (profileDir, child, ms = 30_000) {
  const portFile = join(profileDir, 'DevToolsActivePort')
  const deadline = Date.now() + ms
  while (Date.now() < deadline) {
    if (child.exitCode !== null) break
    try {
      const port = Number(readFileSync(portFile, 'utf8').split('\n')[0])
      if (Number.isInteger(port) && port > 0) return port
    } catch { /* not written yet */ }
    await sleep(100)
  }
  return null
}

/**
 * npm ships npx as a .cmd shim on Windows, which spawn cannot execute without a shell - and under a
 * shell every argument becomes a quoting problem, including a URL with `&` in its query string.
 * Running npx's own JS entry point with this Node avoids the shell entirely. Falls back to the shim
 * when the layout is unfamiliar.
 */
function npxCommand () {
  const base = dirname(process.execPath)
  for (const rel of [
    ['node_modules', 'npm', 'bin', 'npx-cli.js'],
    ['..', 'lib', 'node_modules', 'npm', 'bin', 'npx-cli.js'],
    ['..', 'libexec', 'lib', 'node_modules', 'npm', 'bin', 'npx-cli.js']
  ]) {
    const p = join(base, ...rel)
    if (existsSync(p)) return { file: process.execPath, prefix: [p], shell: false }
  }
  return process.platform === 'win32'
    ? { file: 'npx.cmd', prefix: [], shell: true }
    : { file: 'npx', prefix: [], shell: false }
}

function runLighthouse (url, port, args) {
  const npx = npxCommand()
  const lhArgs = [
    '-y', LIGHTHOUSE_SPEC,
    url,
    `--port=${port}`,
    '--output=json',
    '--output-path=stdout',
    '--quiet',
    `--only-categories=${args.categories.join(',')}`
  ]
  if (args.strategy === 'desktop') lhArgs.push('--preset=desktop')

  // Only reachable via the fallback branch above; a URL cannot contain a literal double quote.
  const finalArgs = npx.shell ? lhArgs.map(a => (a === url ? `"${url}"` : a)) : lhArgs

  console.error(`[lighthouse-local] ${npx.file} ${[...npx.prefix, ...finalArgs].join(' ')}`)

  return new Promise((resolvePromise, reject) => {
    const child = spawn(npx.file, [...npx.prefix, ...finalArgs], {
      shell: npx.shell,
      stdio: ['ignore', 'pipe', 'pipe']
    })
    const out = []
    const err = []
    let timedOut = false

    const timer = setTimeout(() => {
      timedOut = true
      child.kill('SIGKILL')
    }, args.timeout)

    child.stdout.on('data', c => out.push(c))
    child.stderr.on('data', c => {
      err.push(c)
      process.stderr.write(c)
    })
    child.on('error', e => {
      clearTimeout(timer)
      reject(new Unmeasurable(`could not start the Lighthouse CLI: ${e.message}`, {
        hint: 'npx must be on PATH; the first run also needs network to fetch Lighthouse'
      }))
    })
    child.on('close', code => {
      clearTimeout(timer)
      const stderr = Buffer.concat(err).toString('utf8')

      if (timedOut) {
        return reject(new Unmeasurable(`Lighthouse did not finish within ${args.timeout}ms`, {
          hint: 'raise --timeout, or check whether the page ever finishes loading'
        }))
      }
      if (/ENOTFOUND|EAI_AGAIN|ERR_SOCKET_TIMEOUT|npm ERR/.test(stderr) && !out.length) {
        return reject(new Unmeasurable('could not fetch the Lighthouse CLI through npx', {
          hint: 'npx needs network the first time it fetches Lighthouse; after that it is cached'
        }))
      }
      const raw = Buffer.concat(out).toString('utf8').trim()
      if (!raw) {
        return reject(new Unmeasurable(`the Lighthouse CLI exited ${code} without producing a report`, {
          hint: 'the stderr above is Lighthouse\'s own explanation'
        }))
      }
      try {
        resolvePromise(JSON.parse(raw))
      } catch (e) {
        reject(new Unmeasurable(`the Lighthouse CLI did not return valid JSON: ${e.message}`))
      }
    })
  })
}

async function audit (args) {
  const browser = findBrowser(args.chromePath)
  console.error(`[lighthouse-local] browser: ${browser.kind} at ${browser.path}`)

  const profileDir = mkdtempSync(join(tmpdir(), 'seo-butler-lh-'))
  let child = null

  try {
    child = spawn(browser.path, [
      '--headless=new',
      '--remote-debugging-port=0',
      `--user-data-dir=${profileDir}`,
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-extensions',
      '--disable-features=Translate,MediaRouter',
      // Chrome refuses to run as root without this, and CI containers often are.
      ...(typeof process.getuid === 'function' && process.getuid() === 0 ? ['--no-sandbox'] : []),
      'about:blank'
    ], { stdio: ['ignore', 'ignore', 'pipe'] })

    const browserErr = []
    child.stderr.on('data', c => browserErr.push(c.toString('utf8')))
    child.on('error', () => { /* surfaced by the port wait below */ })

    const port = await waitForPort(profileDir, child)
    if (!port) {
      const tail = browserErr.join('').trim().split('\n').slice(-20).join('\n')
      throw new Unmeasurable(`${browser.kind} started but never opened a DevTools port`, {
        hint: tail ? `the browser said: ${tail}` : 'try --chrome-path with a different browser',
        browser
      })
    }
    console.error(`[lighthouse-local] DevTools port ${port}`)

    const lhr = await runLighthouse(args.url, port, args)
    return { lhr, browser }
  } finally {
    // Wait for the browser to actually be gone before deleting its profile. On Windows the
    // directory stays locked until the process exits, and rmSync's own retries are far shorter
    // than Chrome's shutdown - the first run of this script leaked a profile that way.
    if (child && child.exitCode === null) {
      child.kill()
      await Promise.race([
        new Promise(r => child.once('exit', r)),
        sleep(5000).then(() => child.kill('SIGKILL'))
      ])
      await sleep(200)
    }
    try {
      rmSync(profileDir, { recursive: true, force: true, maxRetries: 10, retryDelay: 250 })
    } catch (e) {
      // Failing a measurement we already have, over a leftover temp directory, would be absurd.
      console.error(`[lighthouse-local] could not remove the temp profile ${profileDir}: ${e.message}`)
    }
  }
}

// ---------------------------------------------------------------------------- main

function fail (err) {
  const body = { ok: false, reason: err.reason, ...err.extra }
  console.log(JSON.stringify(body, null, 2))
  process.exit(1)
}

async function main () {
  let args
  try {
    args = parseArgs(process.argv.slice(2))
  } catch (err) {
    console.error(err.message)
    console.error('')
    console.error(USAGE)
    process.exit(2)
  }

  if (args.help) {
    console.log(USAGE)
    process.exit(0)
  }

  // --find-browser: what would this machine use, and everywhere it looked.
  if (args.findBrowser) {
    // --platform always lists and never probes, even when it names this machine: it answers "what
    // is the search order there", which you can review without owning that machine.
    if (args.platform) {
      console.log(JSON.stringify({
        ok: true,
        probed: false,
        platform: args.platform,
        searched: candidates(args.platform).map(c => c.path)
      }, null, 2))
      process.exit(0)
    }
    try {
      const browser = findBrowser(args.chromePath)
      console.log(JSON.stringify({
        ok: true,
        probed: true,
        platform: process.platform,
        browser,
        searched: candidates(process.platform).map(c => c.path)
      }, null, 2))
      process.exit(0)
    } catch (err) {
      return fail(err)
    }
  }

  // --summarize: no browser, no network, fully reproducible.
  if (args.summarize) {
    let doc
    try {
      const raw = args.summarize === '-' ? readFileSync(0, 'utf8') : readFileSync(args.summarize, 'utf8')
      doc = JSON.parse(raw.replace(/^\ufeff/, ''))
    } catch (err) {
      console.error(`${args.summarize === '-' ? 'stdin' : args.summarize} is not valid JSON: ${err.message}`)
      process.exit(2)
    }
    try {
      console.log(JSON.stringify(summarize(doc, args.categories), null, 2))
      process.exit(0)
    } catch (err) {
      return fail(err)
    }
  }

  if (!args.url) {
    console.log(USAGE)
    process.exit(2)
  }
  try {
    // eslint-disable-next-line no-new
    new URL(args.url)
  } catch {
    console.error(`--url must be an absolute URL, got "${args.url}"`)
    process.exit(2)
  }

  try {
    const { lhr, browser } = await audit(args)
    const summary = summarize(lhr, args.categories, { browser })

    if (args.out) {
      mkdirSync(dirname(resolve(args.out)), { recursive: true })
      writeFileSync(args.out, JSON.stringify(lhr, null, 2), 'utf8')
      summary.lhrPath = args.out
    }
    // The LHR is megabytes. It goes to a file or down a pipe - never into the conversation.
    console.log(args.lhr ? JSON.stringify(lhr) : JSON.stringify(summary, null, 2))
    process.exit(0)
  } catch (err) {
    if (err instanceof Unmeasurable) return fail(err)
    throw err
  }
}

main()
