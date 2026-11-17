# The learning feed

How sumday daily learns what each member wants, and where AI is and isn't allowed. For engineering and data.

**The short version.** Don't start with a big model. Start with an editor, clear rules and clean event logs. Use models to understand content from day one. Bring in a learned ranker only once there's enough data, and keep the editor's rules wrapped around it.

## 1. What the system has to decide

Every night, for every member: **which ~40 approved cards to show first, in what order.** Later in the night it also decides the stories, the highlights and when to show the "wish list so far" module.

A good order:
- shows things this member will heart, jam on and eventually save for;
- keeps the feed varied (places, categories, creators, price bands);
- respects their budget and timing (things a monthly pour can actually fund);
- never pushes money decisions.

## 2. Four stages

| Stage | When | What decides the order | Needs |
| --- | --- | --- | --- |
| 0 · Editor + rules | Phase 1 (beta) | The editor's edition and the scoring rules below | Nothing but the edition |
| 1 · Content understanding | Phase 1 onward | Models tag every card, so rules can match people to content | A model gateway, a tag schema |
| 2 · Learned ranking | Phase 4, after ~50k heart and view events | A learning-to-rank model inside the editor's rules | Clean event logs, a feature store |
| 3 · Squad- and budget-aware | Phase 4+ | Adds friends' signals and affordability to the model | Jam graph, comfort amount |

### Stage 0 · the rules (launch)

Each card gets a score from four parts, multiplied:

- **Relevance:** overlap between the card's tags and the member's hearts, filters used and onboarding picks.
- **Quality:** the editor's grade (1–5) blended with the model's quality score.
- **Freshness:** highest for posts from the last 7 days; halves every 14 days.
- **Timing:** highest when the experience is 3 to 9 months away, the window a monthly pour can fund.

Then the variety rules apply (same place at most once in any 5 cards, same creator at most once in any 10, at least 1 in 4 under ₹25,000, nothing seen in 14 days) and the feed rhythm is filled in (autoplay video, tap-to-play video, carousel, posts, highlights, wish list so far).

### Stage 1 · content understanding

Every candidate post goes through a model once, overnight, and gets structured tags. This is what makes everything else work, so do it from day one.

| Tag | Example | How |
| --- | --- | --- |
| Place, country | "Göreme, Türkiye" | Vision + caption, checked against the catalogue |
| Category | Travel, Sports, Fitness, Lifestyle | Classifier prompt |
| Activities | ballooning, F1, trekking, cooking | Fixed vocabulary, multi-label |
| Season, event date | Apr–Jun; expected Jun 2027 | Caption + catalogue |
| Media checks | sharp, well framed, heavy on-screen text, watermark, AI-looking, faces of minors | Vision prompt with yes/no fields |
| Quality score | 0–1 | Vision prompt, calibrated against editor grades |
| Embedding | a vector for the image and caption | An embedding model, stored with pgvector |

Model choice (Claude API): **Claude Haiku 5.5** for bulk tagging of every candidate, **Claude Sonnet 5.5** for matching a post to a catalogue experience and for the borderline quality calls. Run both through the Batch API overnight at half price. Use structured outputs so every response fits the tag schema. Keep a 500-card labelled set from the editor to check accuracy every week.

### Stage 2 · learned ranking

Once there are enough events, train a ranker to predict what each member will do with each card.

**Labels** (from logs, per member × card shown):

| Signal | Weight (starting point) |
| --- | --- |
| Viewed under 1 s (skip) | −0.5 |
| Viewed 3 s or more / video 50% | +0.5 |
| Opened the drawer | +1 |
| Hearted | +3 |
| Tagged a friend or got an "in" | +4 |
| Became a someday with a mandate | +8 |

**Features:**

| Group | Examples |
| --- | --- |
| Member | city, age band, categories hearted, activities hearted, price band of hearts, comfort amount, days since signup, open time |
| Card | category, activities, country, price, months away, kind (video, carousel), quality score, creator, freshness |
| Member × card | embedding similarity to their hearts, same country as a heart, price vs their median heart |
| Squad | friends who hearted it, friends in a jam on it, friends' activity this week |
| Context | day of week, position in feed, what came just before |

**Models, in order of effort:**
1. **Gradient-boosted ranker** (LightGBM LambdaMART) on the features above. Fast to train nightly, easy to explain, strong on tabular data. Start here.
2. **Two-tower retrieval** (a member tower and a card tower) once the catalogue grows past a few thousand cards, to pick candidates before the ranker.
3. **Sequence model** over a member's recent actions, only if the first two stall.

**Training loop:** nightly, on the last 60 days of events, with a time-based split (train on older days, validate on the most recent week). Promote a new model only if it beats the current one offline and passes the guardrails.

**The editor's rules stay on top.** The model scores; the variety rules, the rhythm and the editor's approvals decide what can be shown. The model never sees unapproved cards.

### Stage 3 · squad- and budget-aware

- **Squad.** Boost cards friends hearted or jammed on, but cap it so a feed doesn't become only friends' picks (at most 1 in 5).
- **Budget.** Members set a monthly comfort amount. Cards that would push their plan above it are shown less, and the vision board warns them. We never optimise for spending more.
- **Timing.** Learn which "months away" window each member actually saves for.

## 3. Cold start

- **New member:** onboarding asks for three moods from a photo grid, a monthly comfort amount and a home city. Rank by these plus what's popular with similar members (same city and age band).
- **New card:** use its tags and embedding to find similar cards' performance, plus an exploration boost for its first 48 hours.
- **Exploration:** 10% of slots go to cards the model is unsure about, so the feed keeps learning and doesn't narrow.

## 4. Measuring it

**Offline (every training run):** NDCG@10 and recall@40 on the held-out week; coverage (share of the edition shown to someone); novelty (new places per member per week); creator spread.

**Online (A/B, two weeks minimum, by member):**

| Metric | Type |
| --- | --- |
| Hearts per active member per week | Primary |
| Morning opens, 5 of 7 days | Primary |
| Wish-list items with a friend jamming | Secondary |
| Members with 2+ hearts who start a mandate | Secondary (slow) |
| Skips under 1 s | Guardrail, must not rise |
| Share of feed from top 10 creators | Guardrail, must not rise |
| Members whose plan goes above their comfort amount | Guardrail, must not rise |
| Complaints, takedowns, unsubscribes | Guardrail |

## 5. Where AI is allowed

| Allowed | Not allowed |
| --- | --- |
| Tagging and checking content | Generating or editing images or video |
| Drafting a card's caption or tip for the editor to approve | Publishing anything without the editor |
| Summarising a creator's long post into a tip, with credit | Writing fake reviews, anecdotes or quotes |
| Estimating a cost split from partner data, marked "Modelled" | Showing an estimate as a quote |
| Ranking approved cards | Recommending, rating or ranking funds |
| Explaining the plan maths in plain words | Anything that sounds like investment advice or mentions returns |

## 6. Data and privacy

- Train only on in-app behaviour (views, hearts, jams, filters, someday starts). Never on balances, KYC data or bank data.
- Keep events with a member id that can be deleted; deleting an account deletes their events from training data within 30 days.
- Explain the feed in the app: "Picked because you hearted Spiti and Riya is in on this."
- Review the model's top cards every week for bias: are some regions, price bands or creators never shown?

## 7. Build order (engineering tickets)

1. Event logging for every row in the PRD analytics table, with a member id and card id.
2. Tag schema and the overnight tagging job (Haiku 5.5, batch), with the editor's labelled set and a weekly accuracy check.
3. Rule-based scorer and variety rules as a pure function with unit tests.
4. Feature store: a nightly table of member, card and member × card features.
5. Offline evaluation harness (NDCG, recall, coverage, novelty) on logged data.
6. LightGBM ranker, trained nightly, behind a feature flag.
7. A/B framework with guardrails and an automatic rollback.
8. Two-tower retrieval when the catalogue passes a few thousand cards.
