# SEO Score Card — report format

Shown at the end of every run, in the user's language. Goal: the user instantly sees what happened
and feels the work is complete — without needing SEO knowledge.

## Scoring (0–100)
Weight the fixed checklist by real impact (aligned with `geo.md`'s honest tiers). Suggested weights (sum 100):

- Titles + meta descriptions — 12
- robots.txt + sitemap.xml — 10
- Canonical / robots hygiene — 8
- Structured data (JSON-LD) — 12
- Open Graph + Twitter — 7
- **GEO: AI crawlability** (citation bots allowed + key content SSR'd) — 10  *(Tier 1, high impact)*
- **GEO: answer-first structure + semantic HTML + AI readiness** — 10  *(Tier 2)*
- **GEO: llms.txt** — 2  *(Tier 6, minor — see honesty note)*
- Content suggestions (evidence/freshness recommendations) — 3
- Image alt / accessibility — 6
- Core Web Vitals / performance — 10
- Search Console — 5
- Analytics (GA4) — 5

Score = sum of weights for `done` items + half weight for `partial`. `n/a` items are removed from
the denominator and the total is renormalized to 100. Compute a **before** (initial audit) and an
**after** (post-apply) score.

> Honesty note: llms.txt is weighted low on purpose — as of 2026 no major AI engine officially
> consumes it. Don't let a high score imply AI-citation is guaranteed; the score reflects *setup
> quality*, not promised placement. Where possible, corroborate with real tools (Lighthouse, Rich
> Results / schema validators) rather than self-assessment — that's the Phase-3 direction.

## Report layout

```
🏁 SEO/GEO Butler — Score Card
Project: <stack> · <N> pages · <first run / re-run>

Score:  38 → 91   ▲ +53

✅ Done this run
  • Sitemap with 12 URLs + robots.txt
  • Meta title & description on 12 pages
  • JSON-LD: Organization, WebSite, 3× Article
  • Open Graph + Twitter cards
  • llms.txt + FAQ-ready structure (so ChatGPT/Perplexity can cite you)
  • Alt text on 8 images
  • GA4 measurement tag injected

🟡 Needs one small thing from you
  • Search Console: verification meta is in place — click "Verify" in the tab I opened
  • 2 pages had no body copy for a description — add a sentence and I'll finish them

💡 Content ideas to rank higher (GEO)
  • Home: add a one-line "What is X?" answer near the top — answer engines quote these
  • /pricing: add a short FAQ (3 Q&A) — strong for AI Overviews
  • /blog: add author + date to posts to unlock richer Article results

📌 Notes
  • 1 render-blocking script found — moving it is optional, I left it to avoid breaking anything.

Memory updated → .seo-butler/state.json  ·  Next run only touches what changes.
```

## Tone
- Plain language, no jargon dumps. One line per item.
- Be honest in the 🟡 section — never mark dashboard steps "done" if the user still has a click to make.
- Always end by reminding them the state is saved, so re-running is safe and won't re-surprise them.
