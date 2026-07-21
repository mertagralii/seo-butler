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

Claude Code'u yeniden başlat. Plugin **genel** olarak kurulur (her projede kullanılabilir), ama yalnızca
komutu çalıştırdığın projede iş yapar.

## Komutlar

Üç komut, üç farklı an:

| Komut | Ne zaman | Ne yapar | Kodunu değiştirir mi? |
|---|---|---|---|
| **`/seo-butler`** | Siteni bitirince | Projeyi tanır, planı sunar, onayınla tüm SEO/GEO işini yapar | ✅ Evet — **her zaman onayınla** |
| **`/seo-live`** | Canlıya aldıktan sonra | Canlı siteyi çeker, gerçekten çalıştığını kanıtlar, Lighthouse/CrUX ile ölçer | ⚠️ Sorun bulursa düzeltmeyi *önerir* (yine onayla) |
| **`/seo-watch`** | Periyodik (ör. haftalık) | Salt-okunur nöbetçi — regresyon var mı diye bakar, raporlar | ❌ **Asla** |

İsteğe bağlı kapsam ipucu: `/seo-butler skip analytics` veya `/seo-butler only sitemap`.

**Neden `/seo-live` ayrı?** Uygulanmış olmak yayında olmak değildir. Bazı hatalar yalnızca render edilmiş
çıktıda görünür: template engine JSON-LD'ni bozabilir, CDN robots.txt'ini gölgeleyebilir, framework
canonical olmayan link üretebilir. Bunlar repoda görünmez — sadece canlıyı çekince ortaya çıkar.

**Neden `/seo-watch` hiçbir şeyi değiştirmiyor?** Çünkü sen başında değilken çalışır. Bu plugin'in en
güçlü vaadi "siteni bozmam" ve bunu koruyan şey **her değişikliğin önce plana girip onaydan geçmesi**.
Gözetimsiz düzeltme o zinciri kırardı. Bekçi havlar, ısırmaz.

## Nasıl çalışır?

`/seo-butler` yazdığında beş aşama işler:

**1. Keşfet** — Tüm projeyi tarar: hangi framework (Next.js/Astro/ASP.NET/Django…), kaç sayfa, site ne
hakkında. Daha önce çalıştıysa `.seo-butler/state.json` hafızasını okur.

**2. Karar ver** — **Sabit 33 maddelik** kontrol listesine göre eksikleri bulur. 5 uzman ajan
(teknik SEO · on-page & GEO · performans · erişilebilirlik · analitik) **paralel** denetim yapar.
Bu aşamada hiçbir dosyaya dokunulmaz. Sana SEO sorusu **sorulmaz** — kararları butler verir.

**3. Plan sun** — Ne yapacağını madde madde gösterir: **[Onayla] [Düzenle] [Reddet]**.
Sen onaylamadan tek bir dosya değişmez.

**4. Uygula (güvenle)** — Önce git durumunu kontrol edip yedek alır. Sonra onayladıklarını uygular —
her ajan yalnızca **sahibi olduğu dosyalara** dokunur, mevcut etiketleri ezmez (tekrar çalıştırınca çift
etiket olmaz). Ardından **doğrular**: build/lint çalıştırır, uygulamayı ayağa kaldırıp sayfaları HTTP ile
çeker, ürettiği XML/JSON-LD geçerli mi bakar. Bir şey bozulduysa **o değişikliği geri alır.**

**5. Raporla + hatırla** — Skor kartı verir (bizim kapsam puanımız + gerçek araç ölçümleri **ayrı ayrı**,
asla harmanlanmadan), yaptıklarını `state.json`'a yazar ve seni bir sonraki adıma yönlendirir:
*"deploy edip `/seo-live` çalıştır."*

Sonra döngü: **deploy et → `/seo-live` ile kanıtla → periyodik `/seo-watch` ile nöbet tut.**

### Hafıza — neden tekrar çalıştırmak güvenli?
Butler yaptığı her şeyi `.seo-butler/state.json`'a yazar. İkinci kez çalıştırdığında önce onu okur:
zaten yapılmışları **tekrar önüne getirmez**, sadece gerçekten değişeni (yeni sayfa, yarım kalmış madde)
ele alır. Sahada doğrulandı: ilk koşu ~1.07M token, ikinci koşu **~6K token** — çünkü kısa devre yaptı.

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

Restart Claude Code. The plugin installs **globally** (available in every project) but only ever acts on
the project you run the command in.

## Commands

Three commands, three moments:

| Command | When | What it does | Changes your code? |
|---|---|---|---|
| **`/seo-butler`** | Once the site is built | Understands the project, shows a plan, does all the SEO/GEO work on approval | ✅ Yes — **always with your approval** |
| **`/seo-live`** | After you deploy | Fetches the live site, proves the work shipped and works, measures with Lighthouse/CrUX | ⚠️ *Offers* fixes for what it finds (again, with approval) |
| **`/seo-watch`** | Periodically (e.g. weekly) | Read-only watchdog — checks for regressions and reports | ❌ **Never** |

Optional scope hint: `/seo-butler skip analytics` or `/seo-butler only sitemap`.

**Why is `/seo-live` separate?** Applied is not the same as live. Some defects only exist in rendered
output: a template engine can mangle your JSON-LD, a CDN can shadow your robots.txt, a framework can emit
non-canonical links. None of that is visible in the repo — only in what the server actually returns.

**Why does `/seo-watch` never change anything?** Because it runs while you're not there. This plugin's
strongest promise is "I won't break your site", and what protects that is **every change going through a
plan you approve**. An unsupervised fix would break the chain. The watchdog barks; it doesn't bite.

## How it works

`/seo-butler` runs five stages:

**1. Discover** — Scans the whole project: which framework (Next.js/Astro/ASP.NET/Django…), how many
pages, what the site is about. On a re-run it first reads the `.seo-butler/state.json` memory.

**2. Decide** — Works the **fixed 33-item checklist** to find what's missing. Five specialists
(technical SEO · on-page & GEO · performance · accessibility · analytics) audit **in parallel**. No file
is touched in this stage, and you are never asked an SEO question — the butler decides.

**3. Present the plan** — Item by item, with **[Approve] [Edit] [Reject]**. Nothing changes until you approve.

**4. Apply (safely)** — Takes a git-aware backup first. Each agent edits only the **files it owns** and
updates existing tags in place (so re-runs never duplicate). Then it **verifies**: build/lint, plus
starting the app and fetching the pages over HTTP to check the *rendered* output and generated artifacts.
Anything that regresses is **rolled back**.

**5. Report + remember** — A score card (our coverage score and the real-tool measurements shown
**separately**, never blended), the work written to `state.json`, and a hand-off:
*"deploy, then run `/seo-live`."*

Then the loop: **deploy → prove it with `/seo-live` → keep watch with `/seo-watch`.**

### Memory — why re-running is safe
The butler records everything it did in `.seo-butler/state.json` and reads it first on the next run, so
completed items are never re-proposed; only real deltas (new pages, unfinished items) come back. Verified
in the field: first run ~1.07M tokens, second run **~6K** — because it short-circuits.

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

### And after that: keep watch

Code doesn't rot on its own, but **live sites do** — a CDN setting flips, a deploy drops a tag, a page
falls out of the index, a teammate ships pages with no metadata. Periodically (weekly is a sensible default):

```
/seo-watch
```

**A read-only watchdog: it changes nothing.** Because it runs unattended — with nobody there to approve a
plan — it only diffs live reality against the baseline in `state.json` and reports **meaningful** changes,
with noise thresholds (any robots.txt change, a Lighthouse drop of ≥5 points, a Core Web Vital crossing a
threshold). If it finds something it hands the fix back to you: *"run `/seo-butler`."* If all is well, one
line: *"stable ✅"*.

## Dashboards (Search Console / Analytics)

Google blocks automated logins, so the butler works inside **your already-logged-in Chrome
session** — it never sees your password. It always prepares the code side first (verification
file/meta, GA4 tag), so even if you finish the last clicks yourself, the project is never left
half-done. Browser automation ships via the bundled Playwright MCP.

## Structure

```
.claude-plugin/   plugin.json, marketplace.json
commands/         seo-butler.md (main) · seo-live.md (post-deploy) · seo-watch.md (read-only watchdog)
agents/           the specialist team (5)
skills/seo-butler SKILL.md + references/ (checklist, standards, geo, stacks, state, scorecard,
                  research, safety, strategy, live-verification, cdn-layer, measurement, monitoring)
.mcp.json         bundled Playwright + context7 MCPs
```

## Status

**v0.9.0 — the watchdog.** Adds **`/seo-watch`**: a read-only periodic regression check that diffs the
live site against the baseline in `state.json` and reports what changed — any robots.txt drift (the
de-indexing risk), routes that stopped responding, missing artifacts, broken JSON-LD, Lighthouse/CrUX
drops, and pages shipped without the butler. It runs unattended, so by design it **never changes
anything** and hands fixes back to `/seo-butler` / `/seo-live`. Noise thresholds keep it quiet when
things are fine.

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
