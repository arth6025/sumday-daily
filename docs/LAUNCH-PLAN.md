# Launch plan

How to take sumday daily from prototype to live. For whoever runs the build. The go-live checklist and tests are in the [PRD](../PRD.md#8-go-live-checklist).

## 1. Team

The smallest team that can ship V1 in about 18 weeks.

| Role | Count | Owns |
| --- | --- | --- |
| Product lead | 1 | This repo, scope, gates, partners, weekly beta calls |
| Designer | 1 | Rebuilding the prototype in sumday's design language; feed and dashboard |
| Mobile engineer | 1–2 | App: feed, drawer, video, vision board, dashboard hand-off |
| Backend engineer | 1–2 | API, realtime jams, edition pipeline, partner integrations |
| Data / ML engineer | 1 (from phase 2) | Tagging job, events, rule scorer, then the learned ranker |
| Travel editor | 1 | Creator list, nightly edition, copy, takedowns |
| Compliance (part-time or advisor) | 1 | Distributor setup, copy review, money screens |
| Partnerships (can be the product lead) | 1 | Trip, event and creator partners |

## 2. Partners to sign

| Need | Partner type | Before |
| --- | --- | --- |
| Distributor licence | AMFI registration (ARN); NISM Series V-A certificates for staff | Phase 3 |
| Fund houses | Distributor agreements with AMCs on the facts-only shelf | Phase 3 |
| Order routing | BSE StAR MF or NSE NMF II membership | Phase 3 |
| KYC | A KYC registration agency integration | Phase 3 |
| Bank account | A partner bank for accounts in the member's name (sumday v4 uses ICICI) | Phase 3 |
| Mandates | A payment provider for UPI AutoPay and e-NACH | Phase 3 |
| Trips | 3–5 experience partners with prices, dates and a price-hold product | Phase 1 (prices), phase 3 (holds) |
| Events | Official hospitality or package partners for F1, cricket, tennis, marathons | Phase 2 |
| Creators | 300 creators on the list; 30 licensed for native video | Phase 1 list, phase 3 licences |
| Content platforms | Meta app review for Instagram embeds; YouTube API key | Phase 1 |

## 3. Phases and gates

### Phase 0 · Set up (weeks 1–2)
- Hire or assign the team; agree the targets in the README.
- Confirm the compliance path with an advisor: distributor model, copy rules, what "pin" can legally be.
- Start the creator list (50 by week 2) and the first 3 trip partners.
- Rebuild the design of the prototype in sumday's language.

**Gate:** team in place, compliance path written down, 50 creators and 3 partners.

### Phase 1 · Hand-made beta (weeks 3–6)
- App with feed, categories, filter, hearts, drawer with cost, jam (real friends, real invites), stickers, sketches, notes.
- The editor builds each edition by hand in a simple admin tool. Same order for everyone.
- Event logging for every analytics event from day one.
- 200 waitlist members, in real friend groups.

**Gate:** 40% open 5 of 7 mornings; 3 hearts per active member per week.

### Phase 2 · Personal feed (weeks 7–12)
- The overnight pipeline (collect, understand, match and price, editor review, rank) with the 4:00 am fallback.
- Rule-based ranking per member; video, reels, highlights, "wish list so far".
- Vision board with the plan and month-by-month chart.
- Event partners for the Sports category.

**Gate:** 1 in 5 wish-list items has a friend jamming; edition on time 28 nights out of 30.

### Phase 3 · Money live (weeks 13–18)
- Hand-off to sumday: KYC, folio, one mandate, provisions, pin, move date, pause, withdraw.
- First real provisions on the 1st of the month after launch, staff first.
- Creator programme: licensed native video from 30 creators.

**Gate:** 8% of members with 2+ hearts start a mandate; zero money incidents; zero compliance findings.

### Phase 4 · Learning feed (week 19 onward)
- The learned ranker behind a flag, A/B tested against the rules (see [AI-MODEL](AI-MODEL.md)).
- Squad- and budget-aware ranking.
- Booking hand-off to partners when a someday is funded.

## 4. Budget (monthly, indicative)

| Line | Beta (1,000 members) | 100,000 members |
| --- | --- | --- |
| Technology (models, APIs, media, servers) | about $420 | about $3,560 |
| Travel editor | ₹1,00,000 | ₹1,00,000–₹2,00,000 (second editor) |
| Creator licences | — | ₹1,50,000 and up |
| Partner and compliance fees | Quote from partners | Quote from partners |

Technology figures come from the [feed plan](https://claude.ai/artifact/P43pNBzeBAsSwDC4ogSrVk). Rows without a figure need real quotes.

## 5. Launch week (phase 3)

| Day | What happens |
| --- | --- |
| Mon | Final go-live checklist run; compliance sign-off on every money screen |
| Tue | Staff mandates live (₹100 each); watch one full debit and order cycle in staging and prod |
| Wed | Open the sumday hand-off to 50 beta members |
| Thu | Fix list from Wednesday; support playbook dry run |
| Fri | Open to all beta members; one announcement in the feed, one push |
| 1st of next month | First real provisions debited and invested; check every one |

## 6. What to watch every week

- Morning opens within 2 hours of the drop.
- Hearts per active member; skips under 1 second.
- Wish-list items with a friend jamming.
- Mandates started; failed debits; pauses and withdrawals.
- Edition on time; editor hours per night (should fall from about 4 to under 2).
- Takedown requests and complaints (should stay near zero).

## 7. Decisions to make now

1. Native app or PWA for the beta? (Recommendation: PWA for phase 1, native from phase 2 for video and push.)
2. Build the edition admin tool, or start with a spreadsheet and a script? (Recommendation: spreadsheet for 4 weeks.)
3. Which 3 trip partners and which event partner first?
4. The pin product: refundable deposit, partner hold, or neither in V1?
5. Who is the travel editor?
