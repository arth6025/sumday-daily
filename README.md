# sumday daily

**A feed of things you want to do someday, and a plan to pay for them before you go.**

Every morning at 6am, members open a fresh feed of travel, sports, fitness and lifestyle experiences. They heart what they love, jam on it with friends, and see it all on a vision board with the monthly amount that gets them there. One tap sets that amount up in sumday: a monthly autopay into a mutual fund in their own name. No card, no EMI.

| | |
| --- | --- |
| Status | Prototype and a working Node.js + React demo build. Ready to plan the real build. |
| Prototype | [Open the clickable prototype](https://claude.ai/artifact/MiZ3viaGyCBfV6nWUM2BnP) · or [`prototype/`](prototype/) in this repo* |
| Working app | [`app/`](app/README.md): Node.js API + React web app with the multi-algorithm feed |
| Feed plan | [How the real feed works](https://claude.ai/artifact/P43pNBzeBAsSwDC4ogSrVk): sources, pipeline, ranking, cost |
| sumday app | [sumday.in/v4](https://sumday.in/v4): the app the vision board hands off to |
| Owner | Arvind |
| Last updated | 17 Nov 2026 |

\* The prototype is a proposal. Rebuild it in our design language.

## Read this repo in order

1. **This README.** Why we're building it, for whom, and what success looks like. For everyone.
2. **[PRD.md](PRD.md).** What we ship, each journey with its done criteria, rules, go-live checklist and tests. For product, engineering and design.
3. **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).** Systems, data, partners and APIs. For engineering.
4. **[docs/AI-MODEL.md](docs/AI-MODEL.md).** How the feed learns what each member wants, and where AI is and isn't allowed. For engineering and data.
5. **[docs/LAUNCH-PLAN.md](docs/LAUNCH-PLAN.md).** Phases, team, partners, compliance steps, budget and the launch checklist. For whoever runs the build.
6. **[app/](app/README.md).** A working Node.js + React build: the feed with eight ranking algorithms that learn in real time, an algorithm lab, the vision board and the sumday dashboard. Run it with `npm install && npm run dev`.
7. **[docs/ROADMAP-RECSYS.md](docs/ROADMAP-RECSYS.md).** How the feed grows into a TikTok-grade, real-time recommender, and a 5-minute founder demo script.

## The problem

People have a list of things they'll do "someday": the northern lights, a Grand Prix, a marathon abroad, a cooking school in Italy. Most never happen. They feel too expensive all at once, nobody books them, and when they do happen they go on a credit card or an EMI at 16–24% a year.

sumday already fixes the paying part: you pick one trip and pour a little into a fund every month. What's missing is the wanting part. People don't arrive knowing which trip. They need something that keeps the dream in front of them, makes it social, and turns a vague list into dates and a monthly number.

## Who it's for

- **Salaried 24–38 year-olds in Indian metros** who scroll travel and sports content daily, earn well, save badly, and use EMIs for big experiences.
- **Friend groups** planning one big thing together: a trip, a match, a race.
- **People already on sumday** who finished or booked one someday and need the next.

## Why now

- Travel and live-event spending by young Indians keeps rising, and much of it goes on EMIs and cards.
- UPI AutoPay makes small monthly mandates easy. Mutual-fund SIPs are normal now.
- The sumday app (v4) already proves the money side: KYC, a folio in your name, provisions, pinned prices. This feed is the front door it needs.

## What people can do

| What | What it means for people |
| --- | --- |
| A fresh feed at 6am | New things to dream about every morning, picked for you, never the same twice |
| Real photos and video | It looks like the best travel and sports accounts, not an ad catalogue |
| Four worlds | Travel, Sports, Fitness, Lifestyle, plus filters by country, place or activity |
| Heart it | Anything you love goes on your wish list in one tap |
| Jam with friends | Tag friends, see who's in, add stickers, sketch on photos, leave notes, split the cost |
| See the real cost | A tentative all-in cost in ₹ or $, broken down, and what it is per person |
| Vision board | Everything you hearted on one timeline, with what's up next and the monthly amount that gets you there |
| Make it real in sumday | One monthly autopay into a fund in your own name. Pin today's price, move a date, pause anytime |

## Key journeys

1. **The morning drop.** A push at 7:30am, the feed opens on today's stories and a playing video.
2. **Find and heart.** Filter to "Nepal" or "Scuba", heart three things.
3. **Jam.** Tag two friends on India v Pakistan; both say they're in; the cost per person halves.
4. **Vision board.** See the next 12 months on one board: what's next, who's coming, the monthly amount.
5. **Start investing.** Sign once, set one mandate, pin a price. The first provision lands on the 1st.

## Goals and how we'll know

| Goal | Measure | Target by end of beta |
| --- | --- | --- |
| People come back every morning | Members who open within 2 hours of the drop, 5 of 7 days | 40% |
| The feed finds things people want | Hearts per active member per week | 3 or more |
| It's social | Wish-list items with at least one friend jamming | 1 in 5 |
| It turns into saving | Members with 2+ hearted items who start a mandate | 8% |
| It stays trusted | Creator takedown requests; complaints about advice or returns | Close to zero |

Targets are proposals to agree before the build starts.

## Timeline

| Phase | Weeks | What ships |
| --- | --- | --- |
| 0 · Set up | 1–2 | Team, partners signed, compliance path confirmed, creator list started |
| 1 · Hand-made beta | 3–6 | 200 waitlist members. An editor builds each edition by hand. Hearts, wish list, jam |
| 2 · Personal feed | 7–12 | Overnight pipeline, a personal order for each member, vision board, video |
| 3 · Money live | 13–18 | sumday hand-off live: KYC, folio, mandates, pinned prices. Creator programme |
| 4 · Learning feed | 19+ | Learned ranking replaces rules, squad-aware and budget-aware |

Each phase has a gate in [docs/LAUNCH-PLAN.md](docs/LAUNCH-PLAN.md). We don't start the next phase until the gate is met.

## What this is not

- **Not a travel agent or ticket reseller.** Trips and tickets are sold by partners. sumday shows them, helps people save, and hands off to book.
- **Not investment advice.** sumday acts as a mutual-fund distributor. It shows facts and never ranks or recommends funds.
- **Not an AI content farm.** Every card is a real creator's work, approved by an editor.
