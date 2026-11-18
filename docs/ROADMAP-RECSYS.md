# Recommendation roadmap: what we borrow from TikTok-style feeds

What the [app/](../app) does today, and how the feed grows into a TikTok-grade recommendation system over time. None of the later stages are needed for day 0 or for the founder demo.

**Sources.** The one primary source used here is ByteDance's paper [Monolith: Real Time Recommendation System With Collisionless Embedding Table](https://arxiv.org/abs/2209.07663) (ORSUM workshop, ACM RecSys 2022). The Reddit thread shared in the brief (r/antiai, "a developer reverse-engineered TikTok…") and TikTok's own newsroom explainer couldn't be opened from the build machine, so nothing here relies on them. Read both before the phase 4 design review and add anything useful.

## 1. What already runs in the app (day 0)

| Idea | In the app | Where |
| --- | --- | --- |
| Many algorithms, one blended score | Eight scorers: interest match, people like you, your squad, right time to save, fits your budget, editor's quality, something new, loved on sumday | `server/src/feed/scorers.ts` |
| Real-time interest updates | Every view, 3-second dwell, quick skip, open, heart, jam and "not for me" updates the profile, and the next page uses it | `server/src/feed/profile.ts` |
| Interests that fade | A 7-day half-life on every signal | `profile.ts` |
| Implicit signals beat likes | Dwell and skips are logged automatically from the screen; hearts are only one signal | `web/src/components/Post.tsx` |
| Negative feedback | "Not for me" removes the card and pushes similar ones down | `profile.ts`, `Post.tsx` |
| Collaborative filtering | Item-to-item similarity from co-hearts (a simulated population until real members exist) | `server/src/feed/population.ts` |
| Exploration | An upper-confidence bonus for unseen cards and new categories | `scorers.ts` |
| Cold start | Weight moves from personal scorers to popularity and quality until the profile is strong | `coldStartAdjust` in `scorers.ts` |
| Diversity re-ranking | Maximal Marginal Relevance, no repeat within 4 slots, country runs limited, 1 in 4 under ₹25,000 | `server/src/feed/rank.ts` |
| A feed rhythm | Autoplay video, tap-to-play video, carousel, post, reel, repeated every 10 | `RHYTHM` in `rank.ts` |
| Explainability | Every card carries its score breakdown and two plain-English reasons ("Why this?") | `rank.ts`, `Post.tsx` |
| A tuning console | The algorithm lab: live interests, a weight per algorithm, relevance vs variety | `web/src/components/Lab.tsx` |

## 2. The roadmap

| Stage | When | What we build | Borrowed from |
| --- | --- | --- | --- |
| A · Logs you can learn from | Phase 1 | Every event stored with member, card, position, format, seconds on screen; a daily table of what was shown and what happened | Standard practice |
| B · Multi-stage funnel | Phase 2 | Retrieval (thousands → a few hundred, by embeddings and co-hearts) → light pre-rank → full rank (today's blend) → re-rank (today's rules) | Standard large-scale recommenders |
| C · Learned ranker | Phase 4 | Replace the hand-set weights with a model trained on the logs: LightGBM LambdaMART first (see [AI-MODEL](AI-MODEL.md)) | Standard practice |
| D · Multi-task ranking | Phase 4+ | Predict several things at once (dwell, heart, jam, mandate started) and combine them with business weights | Common in short-video feeds |
| E · Embeddings for members and cards | Phase 4+ | Learned ID embeddings for members, experiences, creators, places; a two-tower model for retrieval | Monolith §2 |
| F · Real-time training | Later | Train continuously on the event stream and push updated embeddings to serving within minutes, not nightly | Monolith §2.2 (minute-level sparse sync) |
| G · Memory-efficient embedding tables | Later | A collisionless hash table for IDs; only create embeddings for IDs seen often enough; expire inactive ones | Monolith §2.1 (cuckoo hashing, frequency filtering, expiry) |
| H · Content cold start | Phase 3+ | Show each new card to a small, varied group first; widen distribution only if it earns hearts and dwell | Common in short-video feeds |
| I · Guardrails as code | From phase 2 | Hard limits the model can't override: affordability cap, creator spread, no unapproved cards, no money language | Our own rules |

## 3. Where we deliberately differ from TikTok

- **We optimise for doing, not scrolling.** Success is a funded, booked someday, not watch time. Session length is a guardrail, not a goal.
- **An editor approves every card.** The model ranks approved content only.
- **Money is never a ranking target to push.** The budget scorer can only lower a card's rank, and plans above a member's comfort amount trigger a warning, not a nudge.
- **Every card explains itself.** "Why this?" is a product feature, not a debug tool.

## 4. Demo script for founders (5 minutes)

1. Open the feed. Point at the autoplaying video and the "Why this?" breakdown.
2. In the algorithm lab, show the live interests. Heart two trekking or bouldering cards and spend 3 seconds on another.
3. Scroll to the next page: Annapurna, Fontainebleau and rafting move up, and the lab shows Bouldering and Trekking climbing.
4. Drag "Your squad" up and "Relevance vs variety" down; the feed re-orders instantly.
5. Open a card: cost in ₹ and $, tag a friend, watch them reply.
6. Open the wish list: the vision board, the month-by-month pour, "Start investing".
7. The sumday dashboard: move a date, pin a price, sign the charter.
