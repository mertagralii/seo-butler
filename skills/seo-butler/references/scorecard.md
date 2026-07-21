# SEO Score Card — report format

Shown at the end of every run, in the user's language. Goal: the user instantly sees what happened
and feels the work is complete — without needing SEO knowledge.

## Scoring (0–100)
Weight the fixed checklist by real impact (aligned with `geo.md`'s honest tiers). Suggested weights (sum 100):

- Titles + meta descriptions — 9
- robots.txt + sitemap.xml — 8
- Canonical / robots hygiene — 6
- Structured data (JSON-LD) — 9
- Open Graph + Twitter — 5
- Broken links (internal integrity) — 3
- **Edge/CDN robots override** — 5  *(when it bites, it overrides everything else)*
- **Canonical ↔ internal-link consistency** — 3
- Stale/orphan public files — 2
- **On-page: keyword / topic targeting** — 5
- **On-page: internal linking** — 4
- **Content authenticity** — 3
- **GEO: AI crawlability** (citation bots allowed + key content SSR'd) — 8  *(Tier 1, high impact)*
- **GEO: answer-first structure + semantic HTML + AI readiness** — 7  *(Tier 2)*
- **GEO: llms.txt** — 2  *(Tier 6, minor — see honesty note)*
- Content suggestions (evidence/freshness recommendations) — 2
- Image alt / accessibility — 4
- Core Web Vitals / performance — 8
- Search Console — 4
- Analytics (GA4) — 3

Score = sum of weights for `done` items + half weight for `partial`. `n/a` items are removed from
the denominator and the total is renormalized to 100. Compute a **before** (initial audit) and an
**after** (post-apply) score.

**Report two scores, never one.**
- **Applied score** — computed as above from what's now in the codebase.
- **Live score** — the same computation re-run against the **deployed** site after `/seo-live`
  (`live-verification.md`). Until that has happened, show `—` and say so.

This distinction matters: a high applied score means the code is right, **not** that search engines see
anything. Work that is applied but never deployed has zero effect, and defects that only appear in
rendered output (encoded JSON-LD, non-canonical link generation, a CDN shadowing robots.txt) are still
undetected. Never let "91" read as "done and working."

> Honesty note: llms.txt is weighted low on purpose — as of 2026 no major AI engine officially
> consumes it. Don't let a high score imply AI-citation is guaranteed; the score reflects *setup
> quality*, not promised placement. Where possible, corroborate with real tools (Lighthouse, Rich
> Results / schema validators) rather than self-assessment.

## Report layout

```
🏁 SEO/GEO Butler — Score Card
Project: <stack> · <N> pages · <first run / re-run>

Applied score:  38 → 91   ▲ +53
Live score:     — (not verified yet — deploy, then run /seo-live)

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

🔍 Strategy (only if the strategy phase ran — else: "Strategy: skipped (opt-in)")
  • Keyword clusters: <N> (by intent) → full map in .seo-butler/strategy.md
  • Top gaps vs competitors (auto-detected: competitorA.com — correct if wrong): <topic>, <topic>
  • Recommended topics (prioritized): <topic 1>, <topic 2>
  • Signals are qualitative (high/med/low) — keyless, no fabricated search volumes

📌 Notes
  • 1 render-blocking script found — moving it is optional, I left it to avoid breaking anything.

Memory updated → .seo-butler/state.json  ·  Next run only touches what changes.
```

## Tone
- Plain language, no jargon dumps. One line per item.
- Be honest in the 🟡 section — never mark dashboard steps "done" if the user still has a click to make.
- Always end by reminding them the state is saved, so re-running is safe and won't re-surprise them.
