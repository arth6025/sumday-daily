# Recommendation roadmap: what we borrow from TikTok-style feeds

What the [app/](../app) does today, and how the feed grows into a TikTok-grade recommendation system over time. None of the later stages are needed for day 0 or for the founder demo.

**Sources.** ByteDance's paper [Monolith: Real Time Recommendation System With Collisionless Embedding Table](https://arxiv.org/abs/2209.07663) (ORSUM workshop, ACM RecSys 2022), and screenshots from a developer's teardown of the TikTok app, shared on Reddit (r/antiai). The teardown is one person's claims from decompiled code and captured traffic. We haven't verified it, so we use it for ideas, not facts.

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
| Multi-task predictions | Each card gets five predictions (skip, 3-second stay, heart, jam, seconds on screen), combined into one value that counts 40% of the rank. Hand-set coefficients until trained | `server/src/feed/predict.ts` |
| Session counters | Cards seen and skipped in the last 1 minute, 3 minutes and this session | `server/src/feed/session.ts` |
| Skip-streak variety mode | Three or more fast skips in 3 minutes: more variety and exploration, and the feed says so | `buildFeed` in `server/src/feed/index.ts` |
| Lite mode | Data saver or a 2G/3G connection: videos wait for a tap instead of autoplaying | `formatFor` in `rank.ts`, `isLite` in `Feed.tsx` |

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

## 3. What the TikTok teardown shows, and what we do with it

What the screenshots claim the app does, and our call on each.

| What the teardown shows | Our call | How |
| --- | --- | --- |
| **31 separate models** on the client and server, each with one job (playtime prediction, click zones, push click-through, live gifts, prerendering) | **Take, later.** Small single-purpose models are easier to train, test and replace than one giant model | Phase 4+: separate heads for ranking, push timing and prefetch, each with its own eval |
| **Per-video multi-task scores:** `rec_skip`, `rec_finish`, `rec_like`, `rec_click_comment`, `rec_follow`, `rec_staytime` | **Taken now**, with our own outcomes: skip, 3-second stay, heart, jam, seconds | `predict.ts`; shown under "Why this?" |
| **Session counters** over 30 s, 1, 3 and 10 minutes and the session (`cnt_video_show_1m`, `cnt_video_skip_3m`…) | **Taken now**, a small version | `session.ts`; shown in the algorithm lab |
| **Network quality, mute state** (`cl_net_quality_level`, `is_mute`) | **Adapt.** Only to make the app work better: no autoplay on slow connections, captions when muted | Lite mode now; captions in phase 2 |
| **Prerendering and keep-warm** (`smart_video_prerender`, predicting when you'll open the app) | **Adapt.** Prefetch the morning edition before the member's usual open time, on Wi-Fi only | Phase 2, in the app shell |
| **Battery, charging, brightness, memory, disk** sent with every feed request | **Refuse** as ranking signals. They say nothing about what someone wants to do with their life, and they're a privacy cost | Never collected |
| **Activity recognition:** static, walking, lying down, in a car (`har_predict`) | **Refuse.** Motion sensors are off-limits | Never collected |
| **Drowsiness and sleep detection** (`enhance_drowsy`, `sleep_state`) | **Refuse.** Nothing in sumday should try to catch people when they're tired | Never collected |
| **Typing recommendations** that send what you type in a message, with the recipient (`im/typing_recommendation`) | **Refuse.** Private messages and notes are never read for ranking | Notes stay out of every model |
| **Attention-recapture pushes:** a stored rule fires a push when you've played few videos briefly in a short window (`live_pull_lost_focus_video_feed`) | **Refuse.** The one push a day only goes out with something specific, never to pull someone back | PRD §3, J1 |

The pattern: we take what helps the feed understand **what someone wants to do**, and leave anything that tracks **the state they're in** to keep them scrolling.

## 4. Where we deliberately differ from TikTok

- **We optimise for doing, not scrolling.** Success is a funded, booked someday, not watch time. Session length is a guardrail, not a goal.
- **An editor approves every card.** The model ranks approved content only.
- **Money is never a ranking target to push.** The budget scorer can only lower a card's rank, and plans above a member's comfort amount trigger a warning, not a nudge.
- **Every card explains itself.** "Why this?" is a product feature, not a debug tool.

## 5. Demo script for founders (5 minutes)

1. Open the feed. Point at the autoplaying video and "Why this?": the five predictions (heart, jam, stay, skip, seconds) and the eight algorithms under them.
2. In the algorithm lab, show the live interests. Heart two trekking or bouldering cards and spend 3 seconds on another.
3. Scroll to the next page: Annapurna, Fontainebleau and rafting move up, and the lab shows Bouldering and Trekking climbing.
4. Drag "Your squad" up and "Relevance vs variety" down; the feed re-orders instantly.
5. Scroll fast past three cards: the lab's session counters climb and the feed says "You're skipping a lot, so we're mixing things up".
6. Walk through section 3: what we took from the TikTok teardown, and what we refuse.
7. Open a card: cost in ₹ and $, tag a friend, watch them reply.
8. Open the wish list: the vision board, the month-by-month pour, "Start investing".
9. The sumday dashboard: move a date, pin a price, sign the charter.
