# Stack Detection & Per-Stack Method

Never assume. Detect first, then use that stack's correct mechanism. Detection signals below;
if several match, prefer the most specific framework.

## How to detect
- Read `package.json` dependencies and scripts.
- Look for framework config files and signature folders.
- Fall back to inspecting how HTML is served (static files vs. templated vs. CMS).

| Stack | Signals | Where SEO lives |
|---|---|---|
| **Next.js (App Router)** | `next` dep, `app/` dir, `layout.tsx` | `metadata` export / `generateMetadata`; `app/robots.ts`, `app/sitemap.ts`; JSON-LD via `<script type="application/ld+json">` in a Server Component |
| **Next.js (Pages Router)** | `next` dep, `pages/` dir | `next/head` `<Head>`; `public/robots.txt`; `next-sitemap` or an API route |
| **Nuxt / Vue** | `nuxt` dep, `nuxt.config` | `useHead` / `useSeoMeta`; `@nuxtjs/sitemap`; `public/robots.txt` |
| **Astro** | `astro` dep, `.astro` files | `<head>` in layouts; `@astrojs/sitemap`; `public/robots.txt` |
| **SvelteKit** | `@sveltejs/kit` | `<svelte:head>`; `src/routes/sitemap.xml/+server`; `static/robots.txt` |
| **Vite/CRA React SPA** | `vite`/`react-scripts`, single `index.html` | `react-helmet-async` or direct `index.html` head; static `public/robots.txt` + generated sitemap; note SPA indexing limits |
| **Plain HTML** | raw `.html` files, no framework | edit each file's `<head>`; create `robots.txt` + `sitemap.xml` at web root |
| **WordPress** | `wp-content/`, `wp-config.php` | prefer guiding via an SEO plugin (Yoast/RankMath) settings + theme `header.php`; robots/sitemap often plugin-managed |
| **Hugo/Jekyll/11ty** | `config.toml`/`_config.yml`/`.eleventy.js` | templates/front matter + built-in sitemap; `static/robots.txt` |

## Rules
- **Static assets** (`robots.txt`, `sitemap.xml`, `llms.txt`, verification files) go in the stack's
  public/static directory (`public/`, `static/`, or web root) so they serve at the domain root.
- **Per-page meta** uses the framework's head mechanism, not hardcoded duplicated tags, when one exists.
- **JSON-LD** is injected via a `<script type="application/ld+json">` in the correct layout/head slot.
- If the stack is ambiguous or custom, degrade gracefully to the "Plain HTML" method and note the
  assumption in the plan.
- Record the detected stack in `state.json` (`project.stack`) so re-runs stay consistent.

## Canonical implementation patterns (confirm current API via context7)

These are the correct mechanisms as of 2026. **Before writing version-specific code, confirm the
current API with context7** (see `research.md`) — framework APIs move, and wrong-version code is the
top way to break a site. Patterns below are the shape; context7 gives the exact current syntax.

**Next.js (App Router)** — file conventions, not hardcoded tags:
- Per-page meta: export `metadata` (static) or `generateMetadata()` (dynamic) from the route/layout.
- `app/robots.ts` → returns rules + sitemap URL. `app/sitemap.ts` → returns the URL array.
- JSON-LD: render `<script type="application/ld+json" dangerouslySetInnerHTML=...>` in a Server Component.
- Analytics: prefer `@next/third-parties/google` `<GoogleAnalytics gaId=...>`.

**Next.js (Pages Router)** — `next/head` `<Head>` per page; `public/robots.txt`; sitemap via
`next-sitemap` or an API route; gtag via `next/script` with `strategy="afterInteractive"`.

**Nuxt 3 / Vue** — `useSeoMeta()` / `useHead()` in pages; `@nuxtjs/sitemap` + `@nuxtjs/robots`
modules; `nuxt-schema-org` for JSON-LD; `public/robots.txt` fallback.

**Astro** — head tags in layout `.astro`; `@astrojs/sitemap` integration (set `site` in
`astro.config`); `public/robots.txt`; JSON-LD via a `<script type="application/ld+json">` block.

**SvelteKit** — `<svelte:head>` per route; `src/routes/sitemap.xml/+server.js`; `static/robots.txt`.

**Vite / CRA React SPA** — `react-helmet-async` (or edit `index.html` head for static bits); generate
`public/sitemap.xml`; `public/robots.txt`. **Flag the SSR gap**: client-only content may be invisible
to AI crawlers → recommend SSR/SSG/prerender for key pages (see `geo.md` Tier 1).

**Plain HTML** — edit each file's `<head>` directly; create `robots.txt`, `sitemap.xml`, `llms.txt`,
and any verification file at the web root.

**WordPress** — prefer guiding through an installed SEO plugin (Yoast / Rank Math) for meta, sitemap,
and schema; theme `header.php` / block templates for anything manual; robots & sitemap are usually plugin-managed.

**Static site generators (Hugo / Jekyll / 11ty / Eleventy)** — templates + front matter; most have a
built-in sitemap; `static/`(`public/`) for robots/llms.txt.

## What to map during discovery
- The list of indexable **routes/pages** (from the router, file tree, or CMS).
- Existing metadata already present (don't duplicate; repair/complete instead).
- The site's **topic and business facts** from real content (home, about, footer, contact).
- Primary **language(s)** → drives `hreflang` applicability and `<html lang>`.
