# sumday daily · app

A working Node.js + React build of sumday daily: a personalised feed of travel, sports, fitness and lifestyle experiences, ranked by several algorithms that learn from every interaction, plus the wish list, vision board and sumday dashboard.

## Run it

Needs Node.js 20 or later.

```bash
cd app
npm install
npm run dev
```

- Web app: http://localhost:5173 (Vite, hot reload)
- API: http://localhost:8787

Production build (one server serves the API and the built web app on :8787):

```bash
npm run build
npm start
```

Tests (feed engine and API):

```bash
npm test
```

## What's inside

```
app/
  server/                 Node.js + Express + TypeScript
    src/
      feed/
        vectors.ts        Content features of an experience; cosine similarity
        profile.ts        Live interest profile from events (weights + 7-day half-life)
        population.ts     Simulated members for collaborative filtering and popularity
        scorers.ts        The eight ranking algorithms and cold-start weighting
        rank.ts           Blend, then re-rank: MMR diversity, editor rules, feed rhythm
        index.ts          buildFeed(): the whole pipeline for one page
      plan.ts             Vision board and sumday maths: shares, provisions, chart
      store.ts            Catalogue loader and a file-backed member store
      app.ts              REST API
      data/seed.json      29 experiences, 87 photos and videos with credits
    test/                 node:test suites (14 tests)
  web/                    React 18 + Vite + TypeScript
    src/
      components/
        Feed.tsx          Endless feed, categories, filters, batched attention signals
        Post.tsx          Video, carousel, reel, photo; hearts; "Why this?"
        Drawer.tsx        Cost in ₹ or $, jam with friends, notes
        VisionBoard.tsx   Timeline by quarter, monthly pour chart
        Dashboard.tsx     sumday dashboard (after sumday.in/v4)
        Lab.tsx           Algorithm lab: live interests and weight sliders
```

Media is served from `../prototype/media`, so it isn't duplicated.

## API

| Method and path | What it does |
| --- | --- |
| `GET /api/feed?cursor=&limit=&category=&country=&activity=&q=&new=1&lambda=&w_<scorer>=` | One page of the member's feed, with a score breakdown and reasons per card |
| `POST /api/events` | Log `view`, `dwell`, `skip`, `open`, `heart`, `unheart`, `jam`, `share`, `not_interested`; returns the updated profile |
| `GET /api/profile` | The member's live interests |
| `GET /api/algorithms` | The scorers and their default weights |
| `POST /api/hearts/:id` · `DELETE /api/hearts/:id` | Wish list |
| `GET /api/experiences/:id` | Drawer detail, jam, notes |
| `POST /api/jams/:id/tag` · `POST /api/jams/:id/notes` | Tag a friend (demo friends reply after 1.5 s); add a note |
| `GET /api/plan` | Vision board and dashboard numbers |
| `PATCH /api/somedays/:id` | `{ shiftBy: ±1 }`, `{ paused }`, `{ pin: true }` |
| `POST /api/mandate` | Sign the charter (demo) |
| `POST /api/reset` | Reset the demo member |

The member is picked by the `x-member` header (default `you`). Real auth replaces this.

## How the feed is ranked

1. **Candidates:** the catalogue, minus filters and anything marked "not for me".
2. **Score:** eight scorers each return 0–1 and a reason. Weights blend them; new members lean on popularity and quality.
3. **Re-rank:** MMR for variety, then the editor's rules (no repeat within 4, country runs, 1 in 4 under ₹25,000) and the rhythm of formats (video, carousel, post, reel).
4. **Learn:** every event updates the profile, and the next page uses it.

See [docs/ROADMAP-RECSYS.md](../docs/ROADMAP-RECSYS.md) for how this grows into a learned, real-time system, and [docs/AI-MODEL.md](../docs/AI-MODEL.md) for the model plan.

## Not production-ready yet

- One demo member per header, no auth.
- A JSON file instead of Postgres; collaborative filtering uses a simulated population.
- Friends' replies are simulated. No real KYC, mandates or money.
- Prices, dates and tips are demo data.
