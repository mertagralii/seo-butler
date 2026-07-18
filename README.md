# SEO/GEO Butler — a Claude Code plugin

Your autonomous SEO & GEO agency in one command. You build and ship a site; then you run
`/seo-butler` and it discovers your whole project, plans every SEO and **Generative Engine
Optimization** task like an expert, applies them, and remembers what it did — so re-running is safe
and never re-surprises you.

> **GEO (Generative Engine Optimization)** = getting cited and recommended by AI answer engines
> (ChatGPT, Claude, Perplexity, Google AI Overviews), not just ranked by search crawlers.

## What it does

- **Decides like an expert — never quizzes you.** You don't need to know SEO. It only asks for
  business facts it can't invent (site name, contact) and only if it can't find them in your code.
- **One command, plan first.** `/seo-butler` audits, shows you a plan (**approve / edit / reject**),
  then applies only what you approved.
- **Stack-agnostic.** Detects Next.js, Nuxt, Astro, SvelteKit, plain HTML, WordPress, and more, and
  uses each stack's correct method.
- **A team of specialists** — technical SEO, GEO/content, performance, accessibility, analytics.
- **Remembers.** Writes `.seo-butler/state.json`; next run only touches what changed.

### Covered
robots.txt · sitemap.xml · titles & meta · canonical/hreflang · Open Graph & Twitter cards ·
JSON-LD structured data · favicon/manifest · llms.txt · semantic HTML & AI-answer readiness ·
image alt text & a11y · Core Web Vitals fixes · Google Search Console · Google Analytics (GA4) ·
a final **SEO Score Card** with content ideas.

## Install (local, for testing)

```
/plugin marketplace add "C:\Users\Mert\Desktop\Yeni klasör"
/plugin install seo-butler
```

Restart Claude Code, then in any web project:

```
/seo-butler
```

Optional scope hint: `/seo-butler skip analytics` or `/seo-butler only sitemap`.

## Dashboards (Search Console / Analytics)

Google blocks automated logins, so the butler works inside **your already-logged-in Chrome
session** — it never sees your password. It always prepares the code side first (verification
file/meta, GA4 tag), so even if you finish the last clicks yourself, the project is never left
half-done. Browser automation ships via the bundled Playwright MCP.

## Structure

```
.claude-plugin/   plugin.json, marketplace.json
commands/         seo-butler.md          (the one command)
agents/           the specialist team (5)
skills/seo-butler SKILL.md + references/ (checklist, standards, stacks, state, scorecard)
.mcp.json         bundled Playwright MCP
```

## Status

**v0.1.0** — first working version. Planned next: competitor & keyword research, automatic OG image
generation, and periodic re-checks.
