# SEO/GEO Butler — a Claude Code plugin

**Türkçe** · [English](#english)

Tek komutla çalışan otonom SEO & GEO ajansın. Siteni yapıp canlıya alırsın; sonra `/seo-butler`
yazarsın — plugin tüm projeni tanır, bir uzman gibi her SEO ve **GEO (Generative Engine Optimization)**
işini planlar, onayınla uygular ve ne yaptığını hatırlar; böylece tekrar çalıştırmak güvenlidir ve seni
her seferinde yeni sürprizlerle şaşırtmaz.

> **GEO (Generative Engine Optimization)** = sadece arama motorlarında sıralanmak değil, AI cevap
> motorları (ChatGPT, Claude, Perplexity, Google AI Overviews) tarafından **kaynak gösterilip
> önerilmek**.

## Ne yapar?

- **Uzman gibi karar verir — sana SEO sorusu sormaz.** SEO bilmene gerek yok. Sadece uyduramayacağı iş
  gerçeklerini (site adı, iletişim) sorar, o da koddan bulamazsa.
- **Tek komut, önce plan.** `/seo-butler` denetler, sana bir plan gösterir (**onayla / düzenle /
  reddet**), yalnızca onayladığını uygular.
- **Stack-bağımsız.** Next.js, Nuxt, Astro, SvelteKit, düz HTML, WordPress ve fazlasını tanır; her
  stack'in doğru yöntemini kullanır.
- **Uzman ekip** — teknik SEO, GEO/içerik, performans, erişilebilirlik, analitik.
- **Güncel kalır.** **context7** (canlı framework dokümanı) + **Playwright** (tarayıcı) MCP'lerini
  paketler; her framework'ün *güncel* doğru yöntemini kullanır, ezberden tahmin yürütmez.
- **GEO'da dürüst.** Seni AI motorlarına gerçekten taşıyan şeye öncelik verir (crawlability, cevap-önce
  yapı, kanıt) ve llms.txt gibi bir taktiğin hâlâ düşük etkili olduğu yeri açıkça söyler.
- **Siteni bozmaz.** Düzenlemeden önce git-farkında yedek, tekrar çalıştırınca çift etiket yok, uygulama
  sonrası doğrulama (build/lint + geçerli XML/JSON-LD) ve bozulan her değişikliği geri alma.
- **Hatırlar.** `.seo-butler/state.json` yazar; sonraki çalıştırmada yalnızca değişeni ele alır.

### Kapsam
robots.txt (AI kaynak botlarına izin dahil) · sitemap.xml · title & meta · canonical/hreflang ·
Open Graph & Twitter card · JSON-LD structured data · favicon/manifest · **GEO**: AI crawlability,
cevap-önce yapı, semantic HTML, AI-cevap hazırlığı, llms.txt · görsel alt text & erişilebilirlik ·
Core Web Vitals düzeltmeleri (LCP/INP/CLS, 2026 eşikleri) · Google Search Console · Google Analytics
(GA4) · sonunda içerik önerileriyle bir **SEO Skor Kartı**.

## Kurulum

```
/plugin marketplace add mertagralii/seo-butler
/plugin install seo-butler
```

Claude Code'u yeniden başlat, sonra herhangi bir web projesinde:

```
/seo-butler
```

İsteğe bağlı kapsam ipucu: `/seo-butler skip analytics` veya `/seo-butler only sitemap`.

## Paneller (Search Console / Analytics)

Google otomatik girişleri engeller, bu yüzden butler **senin zaten giriş yapmış Chrome oturumunda**
çalışır — şifreni asla görmez. Kod tarafını her zaman önce hazırlar (doğrulama dosyası/meta, GA4
etiketi); son birkaç tıklamayı sen yapsan bile proje yarım kalmaz. Tarayıcı otomasyonu paketlenmiş
Playwright MCP ile gelir.

---

<a id="english"></a>

# English

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
- **Stays current.** Bundles **context7** (live framework docs) + **Playwright** (browser) MCPs, so it
  uses each framework's *current* correct method and verifies fast-moving SEO/GEO facts instead of
  guessing from stale knowledge.
- **Honest about GEO.** It prioritizes what actually gets you cited by AI engines (crawlability,
  answer-first structure, evidence) and tells you plainly where a tactic (like llms.txt) is still low-impact.
- **Never breaks your site.** Git-aware backup before editing, idempotent re-runs (no duplicate tags),
  and post-apply verification (build/lint + valid XML/JSON-LD) that rolls back anything it regresses.
- **Remembers.** Writes `.seo-butler/state.json`; next run only touches what changed.

### Covered
robots.txt (incl. allowing AI citation bots) · sitemap.xml · titles & meta · canonical/hreflang ·
Open Graph & Twitter cards · JSON-LD structured data · favicon/manifest · **GEO**: AI crawlability,
answer-first structure, semantic HTML, AI-answer readiness, llms.txt · image alt text & a11y ·
Core Web Vitals fixes (LCP/INP/CLS, 2026 thresholds) · Google Search Console · Google Analytics (GA4) ·
a final **SEO Score Card** with content ideas.

## Install

```
/plugin marketplace add mertagralii/seo-butler
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
skills/seo-butler SKILL.md + references/ (checklist, standards, geo, stacks, state, scorecard, research, safety)
.mcp.json         bundled Playwright + context7 MCPs
```

## Status

**v0.4.0** — reference-path robustness (specialist agents reliably read the bundled skill references via
`${CLAUDE_PLUGIN_ROOT}`) + bilingual README. (v0.3.0 added the "never break a site" safety layer; v0.2.0
deepened expertise to 2026 standards + live knowledge via context7.) Planned next: real-tool
verification (Lighthouse / Rich Results & schema validators), then new traffic channels (local SEO,
deeper measurement, backlinks/directories, auto OG image, periodic re-checks).
