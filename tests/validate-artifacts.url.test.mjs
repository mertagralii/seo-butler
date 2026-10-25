/**
 * validate-artifacts.mjs --url - checking what the server actually sends.
 *
 * Everything here is invisible from the repo. A template engine escaping the JSON-LD script type, a
 * BOM in the sitemap bytes, a framework link helper resolving to a route that does not exist, a
 * redirect chain: the files are all correct, the build passes, and the crawler still gets something
 * broken. "The file is not the output" is the whole reason this mode exists.
 *
 * The server is local and on a random port, so the suite needs no network and cannot collide with
 * anything else running. That is also the point of these tests beyond regression cover: they prove
 * the same checks work against `http://localhost:<port>`, which is what lets the butler run them
 * before a deploy instead of only after one.
 */

import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { runJsonAsync, check, fixture } from './helpers/run.mjs'
import { startServer, goodPage, sitemap, robotsTxt } from './helpers/fixture-server.mjs'

/**
 * Stand up a server, audit it, tear it down. Routes are merged over a sane baseline so each test
 * only has to introduce the one defect it is about.
 *
 * The baseline sitemap uses relative <loc> values on purpose: the port is not known until the
 * server is listening, and a sitemap full of example.com URLs would send the crawl - which seeds
 * from the sitemap without an origin check - onto the real internet.
 */
async function auditSite (routes, { args = [], pages = '/' } = {}) {
  const base = {
    '/robots.txt': { type: 'text/plain; charset=utf-8', body: robotsTxt() },
    '/sitemap.xml': { type: 'application/xml', body: sitemap(['/'], { base: '' }) },
    '/llms.txt': { type: 'text/plain; charset=utf-8', body: '# Example Co\n' },
    '/': { body: goodPage() }
  }
  const server = await startServer({ ...base, ...routes })
  try {
    const r = await runJsonAsync('validate-artifacts.mjs', ['--url', server.origin, '--pages', pages, ...args])
    assert.ok(r.json, `stdout was not JSON:\n${r.stdout}\n${r.stderr}`)
    return { result: r.json, origin: server.origin, raw: r }
  } finally {
    await server.close()
  }
}

describe('validate-artifacts.mjs --url', () => {
  describe('JSON-LD, as served', () => {
    test('an HTML-encoded script type fails even though the JSON is perfectly valid', async () => {
      // Razor encodes the "+" in `application/ld+json`. The page renders, the block is right there,
      // and no consumer on earth recognises it. Caught in the field; only visible in the raw bytes.
      const { result } = await auditSite({
        '/': { body: goodPage({ jsonLdType: 'application/ld&#x2b;json' }) },
        '/sitemap.xml': { body: sitemap(['/']) }
      }, { args: ['--no-links'] })

      const encoding = check(result, 'page[/].jsonld.encoding')
      assert.equal(encoding.status, 'fail')
      assert.match(encoding.detail, /must reach the browser literally/)
      assert.match(encoding.detail, /survives a passing build/)
    })

    test('the canonical @graph pattern passes - this is where an outside auditor gets it wrong', async () => {
      // geodaddy reports "missing required @type" here because it only inspects the root object.
      // The pattern is correct schema.org, and our own validator must not repeat that mistake.
      const { result } = await auditSite({ '/sitemap.xml': { body: sitemap(['/']) } }, { args: ['--no-links'] })

      const parse = check(result, 'page[/].jsonld.parse')
      assert.equal(parse.status, 'pass')
      assert.match(parse.detail, /Organization/)
      assert.match(parse.detail, /WebSite/)
      assert.equal(check(result, 'page[/].jsonld.organization').status, 'pass')
      assert.equal(check(result, 'page[/].jsonld.website').status, 'pass')
    })

    test('a block that is not valid JSON is reported per block', async () => {
      const { result } = await auditSite({
        '/': { body: goodPage({ jsonLd: '{ "@type": "Organization", }' }) },
        '/sitemap.xml': { body: sitemap(['/']) }
      }, { args: ['--no-links'] })

      assert.equal(check(result, 'page[/].jsonld.parse[0]').status, 'fail')
    })
  })

  describe('heading structure', () => {
    test('a skipped level is reported with the actual order on the page', async () => {
      // Invisible on screen: heading level and heading size are styled independently, which is why
      // this survives a run that believed it had fixed the headings.
      const { result } = await auditSite({
        '/': { body: goodPage({ headings: ['h1', 'h3'] }) },
        '/sitemap.xml': { body: sitemap(['/']) }
      }, { args: ['--no-links'] })

      const order = check(result, 'page[/].heading-order')
      assert.equal(order.status, 'warn')
      assert.match(order.detail, /h1 -> h3/)
      assert.match(order.detail, /Order on the page: h1 h3/)
    })

    test('consecutive levels pass', async () => {
      const { result } = await auditSite({
        '/': { body: goodPage({ headings: ['h1', 'h2', 'h3', 'h2'] }) },
        '/sitemap.xml': { body: sitemap(['/']) }
      }, { args: ['--no-links'] })

      assert.equal(check(result, 'page[/].heading-order').status, 'pass')
      assert.equal(check(result, 'page[/].h1').status, 'pass')
    })

    test('more than one h1 is flagged', async () => {
      const { result } = await auditSite({
        '/': { body: goodPage({ headings: ['h1', 'h1'] }) },
        '/sitemap.xml': { body: sitemap(['/']) }
      }, { args: ['--no-links'] })

      const h1 = check(result, 'page[/].h1')
      assert.equal(h1.status, 'warn')
      assert.match(h1.detail, /2 <h1> elements/)
    })
  })

  describe('link integrity', () => {
    test('one dead target linked from two pages is one finding naming both', async () => {
      const server = await startServer({
        '/robots.txt': { type: 'text/plain', body: robotsTxt() },
        '/': { body: goodPage({ links: ['/pricing', '/Home/Index'] }) },
        '/pricing': { body: goodPage({ links: ['/Home/Index'] }) }
      })
      try {
        const r = await runJsonAsync('validate-artifacts.mjs', ['--url', server.origin, '--pages', '/'])
        const broken = check(r.json, 'links.broken[/Home/Index]')

        assert.ok(broken, 'the crawl must reach a page that is only linked to, never listed')
        assert.equal(broken.status, 'fail')
        assert.equal(broken.checklist, 13)
        assert.match(broken.detail, /HTTP 404/)
        assert.match(broken.detail, /Linked from 2 page\(s\): \/, \/pricing/)
      } finally {
        await server.close()
      }
    })

    test('a Cloudflare-injected link is named as an edge problem, not the repo\'s fault', async () => {
      // Email Obfuscation rewrites `mailto:` at the edge. Telling the user to fix their link would
      // send them hunting through source that is already correct.
      const server = await startServer({
        '/robots.txt': { type: 'text/plain', body: robotsTxt() },
        '/': { body: goodPage({ links: ['/cdn-cgi/l/email-protection'] }) }
      })
      try {
        const r = await runJsonAsync('validate-artifacts.mjs', ['--url', server.origin, '--pages', '/'])
        const cdn = check(r.json, 'links.broken[/cdn-cgi/l/email-protection]')

        assert.equal(cdn.status, 'fail')
        assert.match(cdn.detail, /Cloudflare Email Obfuscation/)
        assert.match(cdn.detail, /not a link you wrote/)
        assert.match(cdn.detail, /dashboard, not the repo/)
      } finally {
        await server.close()
      }
    })

    test('a redirect chain longer than one hop is reported with the hops', async () => {
      const server = await startServer({
        '/robots.txt': { type: 'text/plain', body: robotsTxt() },
        '/': { body: goodPage({ links: ['/old'] }) },
        '/old': { status: 301, headers: { location: '/mid' } },
        '/mid': { status: 302, headers: { location: '/final' } },
        '/final': { body: goodPage() }
      })
      try {
        // --link-depth 1 puts /old at the leaf, where links are probed rather than followed and the
        // hop count survives.
        const r = await runJsonAsync('validate-artifacts.mjs',
          ['--url', server.origin, '--pages', '/', '--link-depth', '1'])
        const chain = check(r.json, 'links.redirect-chain[/old]')

        assert.ok(chain, 'the chain must be visible, not hidden by redirect: follow')
        assert.equal(chain.status, 'warn')
        assert.match(chain.detail, /2 redirect hops \(301 -> 302\)/)
        assert.match(chain.detail, /soft 404/)
      } finally {
        await server.close()
      }
    })

    test('a clean site says how much was actually covered', async () => {
      const server = await startServer({
        '/robots.txt': { type: 'text/plain', body: robotsTxt() },
        '/': { body: goodPage({ links: ['/pricing'] }) },
        '/pricing': { body: goodPage() }
      })
      try {
        const r = await runJsonAsync('validate-artifacts.mjs', ['--url', server.origin, '--pages', '/'])
        assert.equal(check(r.json, 'links.broken').status, 'pass')
        assert.match(check(r.json, 'links.coverage').detail, /Cap not reached/)
      } finally {
        await server.close()
      }
    })

    test('hitting the cap is stated, not silently truncated', async () => {
      const server = await startServer({
        '/robots.txt': { type: 'text/plain', body: robotsTxt() },
        '/': { body: goodPage({ links: ['/a', '/b', '/c', '/d'] }) },
        '/a': { body: goodPage() },
        '/b': { body: goodPage() },
        '/c': { body: goodPage() },
        '/d': { body: goodPage() }
      })
      try {
        const r = await runJsonAsync('validate-artifacts.mjs',
          ['--url', server.origin, '--pages', '/', '--max-links', '2'])
        const coverage = check(r.json, 'links.coverage')
        assert.match(coverage.detail, /NOT checked - the cap was hit/)
        assert.match(coverage.detail, /Raise --max-links/)
      } finally {
        await server.close()
      }
    })

    test('--no-links skips the crawl entirely', async () => {
      const { result } = await auditSite({ '/sitemap.xml': { body: sitemap(['/']) } }, { args: ['--no-links'] })
      assert.equal(check(result, 'links.coverage'), null)
    })
  })

  describe('head tags', () => {
    test('a missing canonical fails', async () => {
      const page = goodPage().replace(/<link rel="canonical"[^>]*>/, '')
      const { result } = await auditSite({
        '/': { body: page },
        '/sitemap.xml': { body: sitemap(['/']) }
      }, { args: ['--no-links'] })

      assert.equal(check(result, 'page[/].canonical').status, 'fail')
    })

    test('a relative canonical warns', async () => {
      const { result } = await auditSite({
        '/': { body: goodPage({ canonical: '/pricing' }) },
        '/sitemap.xml': { body: sitemap(['/']) }
      }, { args: ['--no-links'] })

      const canonical = check(result, 'page[/].canonical')
      assert.equal(canonical.status, 'warn')
      assert.match(canonical.detail, /absolute URL/)
    })

    test('an over-long title and an over-long description both warn', async () => {
      const { result } = await auditSite({
        '/': {
          body: goodPage({
            title: 'A'.repeat(75),
            description: 'B'.repeat(200)
          })
        },
        '/sitemap.xml': { body: sitemap(['/']) }
      }, { args: ['--no-links'] })

      assert.equal(check(result, 'page[/].title').status, 'warn')
      assert.match(check(result, 'page[/].title').detail, /75 chars/)
      assert.equal(check(result, 'page[/].description').status, 'warn')
      assert.match(check(result, 'page[/].description').detail, /200 chars/)
    })

    test('noindex is surfaced with the caveat that it may be deliberate', async () => {
      const { result } = await auditSite({
        '/': { body: goodPage({ robotsMeta: 'noindex, nofollow' }) },
        '/sitemap.xml': { body: sitemap(['/']) }
      }, { args: ['--no-links'] })

      const noindex = check(result, 'page[/].noindex')
      assert.equal(noindex.status, 'fail')
      assert.match(noindex.detail, /If this page is meant to rank/)
    })

    test('an inner noindex page that the sitemap also leaves out reads as deliberate, not as a failure', async () => {
      const { result } = await auditSite({
        '/sitemap.xml': { body: sitemap(['/'], { base: '' }) },
        '/kvkk': { body: goodPage({ robotsMeta: 'noindex, follow', description: 'Taslak metin.' }) }
      }, { args: ['--no-links'], pages: '/,/kvkk' })

      const noindex = check(result, 'page[/kvkk].noindex')
      assert.equal(noindex.status, 'info')
      assert.match(noindex.detail, /the two agree/)
      assert.equal(check(result, 'page[/kvkk].description').status, 'info')
    })

    test('a noindex page that the sitemap lists fails as a contradiction', async () => {
      const { result } = await auditSite({
        '/sitemap.xml': { body: sitemap(['/', '/kvkk'], { base: '' }) },
        '/kvkk': { body: goodPage({ robotsMeta: 'noindex' }) }
      }, { args: ['--no-links'], pages: '/,/kvkk' })

      const noindex = check(result, 'page[/kvkk].noindex')
      assert.equal(noindex.status, 'fail')
      assert.match(noindex.detail, /also listed in sitemap\.xml/)
    })

    test('a page that does not respond is reported as unreachable, not as clean', async () => {
      const { result } = await auditSite(
        { '/sitemap.xml': { body: sitemap(['/']) } },
        { args: ['--no-links'], pages: '/,/nope' }
      )
      const reachable = check(result, 'page[/nope].reachable')
      assert.equal(reachable.status, 'fail')
      assert.match(reachable.detail, /HTTP 404/)
    })
  })

  describe('edge/CDN override (repo vs live)', () => {
    test('identical robots.txt on both sides passes', async () => {
      const server = await startServer({
        '/robots.txt': { type: 'text/plain', body: 'User-agent: *\nAllow: /\n\nSitemap: https://example.com/sitemap.xml\n' },
        '/sitemap.xml': { body: sitemap(['/']) },
        '/': { body: goodPage() }
      })
      try {
        const r = await runJsonAsync('validate-artifacts.mjs',
          ['--url', server.origin, '--root', fixture('repo-static'), '--pages', '/', '--no-links'])
        assert.equal(check(r.json, 'robots.edge-diff').status, 'pass')
      } finally {
        await server.close()
      }
    })

    test('a live robots.txt that differs from the repo is an edge override, fixed in a dashboard', async () => {
      const server = await startServer({
        '/robots.txt': { type: 'text/plain', body: 'User-agent: *\nDisallow: /private\n' },
        '/sitemap.xml': { body: sitemap(['/']) },
        '/': { body: goodPage() }
      })
      try {
        const r = await runJsonAsync('validate-artifacts.mjs',
          ['--url', server.origin, '--root', fixture('repo-static'), '--pages', '/', '--no-links'])
        const diff = check(r.json, 'robots.edge-diff')

        assert.equal(diff.status, 'fail')
        assert.equal(diff.checklist, 14)
        assert.match(diff.detail, /editing the repo will not fix it/)
      } finally {
        await server.close()
      }
    })

    test('a repo with no static robots.txt but a live one is correct, not missing', async () => {
      // The other half of the P0-B fix: --root said "skip", and --url settles it as a pass.
      const server = await startServer({
        '/robots.txt': { type: 'text/plain', body: robotsTxt() },
        '/sitemap.xml': { body: sitemap(['/']) },
        '/': { body: goodPage() }
      })
      try {
        const r = await runJsonAsync('validate-artifacts.mjs',
          ['--url', server.origin, '--root', fixture('repo-dynamic'), '--pages', '/', '--no-links'])

        const repoRobots = check(r.json, 'robots.repo.present')
        assert.equal(repoRobots.status, 'pass')
        assert.match(repoRobots.detail, /generated dynamically by a route/)
        assert.equal(check(r.json, 'sitemap.repo.present').status, 'pass')
      } finally {
        await server.close()
      }
    })
  })

  describe('what the site says about its own address', () => {
    test('an og:url inherited from the layout warns, naming both URLs', async () => {
      const { result } = await auditSite({
        '/legal': { body: goodPage({ canonical: 'https://example.com/legal', ogUrl: 'https://example.com' }) }
      }, { args: ['--no-links'], pages: '/,/legal' })

      assert.equal(check(result, 'page[/].og-url').status, 'pass')
      const ogUrl = check(result, 'page[/legal].og-url')
      assert.equal(ogUrl.status, 'warn')
      assert.equal(ogUrl.checklist, 7)
      assert.match(ogUrl.detail, /og:url is https:\/\/example\.com but the canonical is https:\/\/example\.com\/legal/)
      assert.match(ogUrl.detail, /merges shallowly/)
    })

    test('a canonical, sitemap and Sitemap line on another localhost port warn as a site-URL fallback', async () => {
      const { result } = await auditSite({
        '/robots.txt': { type: 'text/plain', body: robotsTxt({ sitemapUrl: 'http://localhost:3100/sitemap.xml' }) },
        '/sitemap.xml': { body: sitemap(['/'], { base: 'http://localhost:3100' }) },
        '/': { body: goodPage({ canonical: 'http://localhost:3100/' }) }
      }, { args: ['--no-links'] })

      for (const id of ['page[/].canonical', 'sitemap.live.host', 'robots.live.sitemap-host']) {
        const c = check(result, id)
        assert.equal(c?.status, 'warn', id)
        assert.match(c.detail, /localhost:3100/)
        assert.match(c.detail, /hard-coded localhost fallback/)
      }
    })

    test('a production canonical on a build served locally is what a pre-deploy run should see', async () => {
      const { result } = await auditSite({
        '/sitemap.xml': { body: sitemap(['/']) }
      }, { args: ['--no-links'] })

      assert.equal(check(result, 'page[/].canonical').status, 'pass')
      assert.equal(check(result, 'sitemap.live.host'), null)
      assert.equal(check(result, 'robots.live.sitemap-host'), null)
    })
  })

  describe('JSON-LD scope', () => {
    test('no JSON-LD fails on the home page and is only a note on an inner page', async () => {
      const bare = goodPage().replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, '')
      const { result } = await auditSite({
        '/': { body: bare },
        '/kvkk': { body: bare }
      }, { args: ['--no-links'], pages: '/,/kvkk' })

      assert.equal(check(result, 'page[/].jsonld.present').status, 'fail')
      const inner = check(result, 'page[/kvkk].jsonld.present')
      assert.equal(inner.status, 'info')
      assert.match(inner.detail, /Not a defect on its own/)
    })

    test('Organization and WebSite are only expected on the home page', async () => {
      const faqOnly = JSON.stringify({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: [] })
      const { result } = await auditSite({
        '/sss': { body: goodPage({ jsonLd: faqOnly }) }
      }, { args: ['--no-links'], pages: '/,/sss' })

      assert.equal(check(result, 'page[/].jsonld.organization').status, 'pass')
      assert.equal(check(result, 'page[/sss].jsonld.parse').status, 'pass')
      assert.equal(check(result, 'page[/sss].jsonld.organization'), null)
      assert.equal(check(result, 'page[/sss].jsonld.website'), null)
    })
  })

  describe('in-page anchors', () => {
    test('a link to a section id that is not in the served HTML warns, naming who links to it', async () => {
      const home = goodPage({ links: ['#icerik', '/#nasil', '/#sss', '/about'] })
        .replace('<h1>', '<h1 id="nasil">')
        .replace('<body>', '<body><main id="icerik">')
      const { result } = await auditSite({
        '/': { body: home },
        '/about': { body: goodPage({ links: ['/#sss', '/#nasil', '/#top'] }) }
      })

      assert.equal(check(result, 'links.anchor[/#nasil]'), null)
      assert.equal(check(result, 'links.anchor[/#icerik]'), null)
      assert.equal(check(result, 'links.anchor[/#top]'), null)
      const sss = check(result, 'links.anchor[/#sss]')
      assert.equal(sss.status, 'warn')
      assert.equal(sss.checklist, 13)
      assert.match(sss.detail, /No element with id="sss"/)
      assert.match(sss.detail, /Linked from 2 page\(s\): \/, \/about/)
      assert.match(check(result, 'links.coverage').detail, /3 in-page anchor target\(s\) checked/)
    })

    test('an anchor whose page was only probed is counted as unchecked, not as fine', async () => {
      const { result } = await auditSite({
        '/': { body: goodPage({ links: ['/deep#x'] }) },
        '/deep': { body: goodPage() }
      }, { args: ['--link-depth', '1'] })

      assert.match(check(result, 'links.coverage').detail, /0 in-page anchor target\(s\) checked .*1 not/)
    })
  })

  describe('thin pages', () => {
    test('an indexable page with almost no text warns as a likely placeholder', async () => {
      const { result } = await auditSite({
        '/kosullar': { body: goodPage({ body: 'Bu sayfanın metni hazırlanıyor.' }) }
      }, { args: ['--no-links'], pages: '/,/kosullar' })

      assert.equal(check(result, 'page[/].thin').status, 'pass')
      const thin = check(result, 'page[/kosullar].thin')
      assert.equal(thin.status, 'warn')
      assert.equal(thin.checklist, 11)
      assert.match(thin.detail, /noindex, and drop it from sitemap\.xml/)
    })

    test('a thin page that is already noindex is left alone', async () => {
      const { result } = await auditSite({
        '/taslak': { body: goodPage({ body: 'Taslak.', robotsMeta: 'noindex' }) }
      }, { args: ['--no-links'], pages: '/taslak' })

      assert.equal(check(result, 'page[/taslak].thin'), null)
    })
  })

  test('a live sitemap with a BOM fails on the bytes', async () => {
    const { result } = await auditSite({
      '/sitemap.xml': { type: 'application/xml', body: sitemap(['/'], { bom: true }) }
    }, { args: ['--no-links'] })

    assert.equal(check(result, 'sitemap.live.bom').status, 'fail')
  })

  test('two runs against an unchanged site are byte-identical', async () => {
    const server = await startServer({
      '/robots.txt': { type: 'text/plain', body: robotsTxt() },
      '/sitemap.xml': { body: sitemap(['/'], { base: '' }) },
      '/': { body: goodPage({ links: ['/pricing', '/dead'] }) },
      '/pricing': { body: goodPage() }
    })
    try {
      const args = ['--url', server.origin, '--pages', '/']
      const a = await runJsonAsync('validate-artifacts.mjs', args)
      const b = await runJsonAsync('validate-artifacts.mjs', args)
      assert.equal(a.stdout, b.stdout, 'a concurrent crawl must still produce sorted, stable output')
    } finally {
      await server.close()
    }
  })
})
