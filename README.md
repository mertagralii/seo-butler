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
- **Kendi ödevini kendi notlamaz.** Gerçek araçlarla ölçer — Lighthouse, CrUX gerçek kullanıcı verisi,
  schema doğrulaması, Search Console — ve ölçemediğini uydurmaz, sebebini yazar.
- **Hatırlar.** `.seo-butler/state.json` yazar; sonraki çalıştırmada yalnızca değişeni ele alır.

### Kapsam
robots.txt (AI kaynak botlarına izin dahil) · sitemap.xml · title & meta · canonical/hreflang ·
Open Graph & Twitter card · JSON-LD structured data · favicon/manifest · kırık link kontrolü ·
edge/CDN robots override tespiti · canonical↔iç link tutarlılığı · yetim statik dosyalar · içerik doğruluğu (sahte yorum tespiti) ·
**On-page**: iç linkleme, keyword/konu hedefleme (cannibalization dahil) · **GEO**: AI crawlability,
cevap-önce yapı, semantic HTML, AI-cevap hazırlığı, llms.txt · görsel alt text & erişilebilirlik ·
Core Web Vitals düzeltmeleri (LCP/INP/CLS, 2026 eşikleri) · Google Search Console · Google Analytics
(GA4) · **gerçek araçlarla ölçüm** (Lighthouse/PSI + CrUX + schema doğrulama) · **opsiyonel Strateji fazı**: keyword araştırma + rakip analizi (anahtarsız — nitel sinyal, hacim
yok) · sonunda içerik önerileriyle bir **SEO Skor Kartı**.

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

### Sonra: canlıda doğrula

Uygulanmış olmak yayında olmak değildir. Commit + push edip **canlıya aldıktan sonra**:

```
/seo-live
```

Canlı siteni çeker ve gerçekten çalıştığını kanıtlar: CDN'in robots.txt'ini gölgeleyip gölgelemediği,
JSON-LD'nin render'da bozulup bozulmadığı, iç linklerin canonical'ı gösterip göstermediği, analytics'in
gerçekten ateşlenip ateşlenmediği (Playwright ile). Ayrıca **gerçek araçlarla ölçer**: Lighthouse skorları
(PageSpeed Insights), **CrUX gerçek kullanıcı verisi** ve Search Console — kendi puanı değil, bağımsız
verdikt. Sorun bulursa kod tarafını düzeltmeyi önerir, panel
tarafı içinse seni dashboard'da yönlendirir — **canlı temiz olana kadar döngü kapanmaz.**

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
- **Doesn't mark its own homework.** Real tools produce the numbers — Lighthouse, CrUX field data, schema
  validation, Search Console — and anything it can't measure is reported with the reason, never guessed.
- **Remembers.** Writes `.seo-butler/state.json`; next run only touches what changed.

### Covered
robots.txt (incl. allowing AI citation bots) · sitemap.xml · titles & meta · canonical/hreflang ·
Open Graph & Twitter cards · JSON-LD structured data · favicon/manifest · broken-link checks ·
edge/CDN robots-override detection · canonical↔internal-link consistency · stale public files · content authenticity (fake-review detection) ·
**On-page**: internal linking, keyword/topic targeting (incl. cannibalization) · **GEO**: AI crawlability,
answer-first structure, semantic HTML, AI-answer readiness, llms.txt · image alt text & a11y ·
Core Web Vitals fixes (LCP/INP/CLS, 2026 thresholds) · Google Search Console · Google Analytics (GA4) ·
**real-tool measurement** (Lighthouse/PSI + CrUX + schema validation) · an **optional Strategy phase**: keyword research + competitor analysis (keyless — qualitative signals, no
volumes) · a final **SEO Score Card** with content ideas.

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

### Then: verify it live

Applied is not the same as live. After you commit, push and **deploy**:

```
/seo-live
```

It fetches the deployed site and proves the work is real: whether a CDN is shadowing your robots.txt,
whether the template engine mangled your JSON-LD, whether rendered internal links point at the canonical
URL, whether analytics actually fires (via Playwright). It also **measures with real tools**: Lighthouse
scores (PageSpeed Insights), **CrUX real-user data** and Search Console — independent verdicts, not our own
marking. Code-side findings get the normal plan → approve →
apply flow; panel/CDN findings are walked through in your dashboard — **the loop stays open until live is clean.**

## Dashboards (Search Console / Analytics)

Google blocks automated logins, so the butler works inside **your already-logged-in Chrome
session** — it never sees your password. It always prepares the code side first (verification
file/meta, GA4 tag), so even if you finish the last clicks yourself, the project is never left
half-done. Browser automation ships via the bundled Playwright MCP.

## Structure

```
.claude-plugin/   plugin.json, marketplace.json
commands/         seo-butler.md (main) + seo-live.md (post-deploy verification)
agents/           the specialist team (5)
skills/seo-butler SKILL.md + references/ (checklist, standards, geo, stacks, state, scorecard,
                  research, safety, strategy, live-verification, cdn-layer, measurement)
.mcp.json         bundled Playwright + context7 MCPs
```

## Status

**v0.8.0 — real-tool scoring.** The butler no longer marks its own homework. `/seo-live` now produces
**independent verdicts**: schema.org validation of every JSON-LD block, **Lighthouse** scores via the
PageSpeed Insights API (one call, no local browser), **CrUX real-user field data**, and Search Console's
own view. Results are reported as **separate labelled blocks** — coverage vs lab vs field vs Google —
never blended into one flattering number, and anything unmeasured shows the reason instead of a guess.

**v0.7.0 — "field lessons"**, shaped by a full real-world run on a production ASP.NET Core site.
Adds the **`/seo-live`** post-deploy verification command (applied ≠ live: the score card now reports
both), a **CDN/edge layer** reference (the live robots.txt can differ from your code — that turned out to
be the highest-impact lever of the whole run), **mandatory runtime verification** (build + static checks
caught only 1 of 4 real defects; the rest only appeared when the running site was fetched), **server-side
frameworks** in stack detection (ASP.NET, Django, Rails, Laravel, Spring, Flask, Phoenix, Go — and
"degrade to Plain HTML" is gone, it was misleading), an explicit **file-ownership model** for parallel
apply, and four new checklist items (edge robots override, canonical↔internal-link consistency, stale
public files, **content authenticity** — detecting fabricated reviews as a consumer-law risk, not just an
SEO one). 33 checklist items total.

Earlier: v0.6.0 optional keyless Strategy phase · v0.5.0 on-page (broken links, internal linking, keyword
targeting) · v0.4.0 reference-path robustness + bilingual README · v0.3.0 "never break a site" safety ·
v0.2.0 deepened expertise + live knowledge via context7.

Planned next: real-tool scoring (Lighthouse / Rich Results & schema validators), optional API-key
enrichment for real keyword volumes (via an OpenSEO-style MCP), then more traffic channels (local SEO,
deeper measurement, backlinks/directories, auto OG image, periodic re-checks).
