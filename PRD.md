# sumday daily · PRD

For product, engineering and design. The why is in the [README](README.md). Systems are in [ARCHITECTURE](docs/ARCHITECTURE.md), the learning feed is in [AI-MODEL](docs/AI-MODEL.md), and phases and partners are in [LAUNCH-PLAN](docs/LAUNCH-PLAN.md).

Prototype: [clickable](https://claude.ai/artifact/MiZ3viaGyCBfV6nWUM2BnP) · source in [`prototype/index.html`](prototype/index.html)*. Everything in the prototype is a proposal; friends, prices, dates and tips are demo data.

---

## 1. What we ship

**V1 (beta, phases 1–3):** the morning feed, filters, hearts and wish list, jam with friends, the drawer with cost, the vision board, and the hand-off to sumday for KYC, folio, mandate and pinned prices.

**Later (phase 4+):** a learned ranking, the creator programme at scale, group pools where friends see each other's progress, booking inside the app, and more cities and currencies.

**Out of scope:** selling tickets or trips ourselves, any fund recommendation, AI-generated images or video, and lending of any kind.

## 2. Feature list

Written from the member's side. "In prototype" means it can be clicked today.

| Feature | What it means for people | Phase | In prototype |
| --- | --- | --- | --- |
| Morning drop | A new edition at 6:00 am local time; a countdown to the next one | 1 | Yes |
| Preview tomorrow | Peek at tomorrow's edition (internal and demo only) | 1 | Yes |
| Stories row | Today's drop as story circles; "go deeper" stories for things on your wish list; friends' stories | 1 | Yes |
| Autoplay video post | A muted clip plays when it's on screen and stops when it isn't | 2 | Yes |
| Tap-to-play video | A big centred play button with the clip's length | 2 | Yes |
| Carousel | Photo, an insider tip, another photo, then what it really costs | 1 | Yes |
| Reel | A tall 9:16 post with a slow drift | 2 | Yes |
| Hotspots and sketches | Numbered dots on a photo that reveal details, a hand-drawn ring, margin notes from the editor or a friend | 2 | Yes |
| Highlights | Saved story sets: Wish list, Videos, Squad picks, Sports, Under ₹30k | 2 | Yes |
| Categories | For you, Travel, Sports, Fitness, Lifestyle | 1 | Yes |
| Filter | Plan for a country or type a place; pick an experience from photo tiles | 1 | Yes |
| Heart | Tap ♥ or double-tap a photo to add to the wish list | 1 | Yes |
| Friends' hearts | "Riya and Dev have this on their wish list" on posts | 1 | Yes |
| Drawer | Tap any post to open the full detail on the right | 1 | Yes |
| Tentative cost | All-in cost in ₹ or $, broken into flights, stay, the experience, food; per person as friends join | 1 | Yes |
| Tag a friend | Tag, see "waiting", then "in" or "maybe" with a note | 1 | Yes (demo replies) |
| Stickers and sketching | Stickers you drag onto the photo; a pen to draw on it; both stay on your board | 1 | Yes |
| Notes | A short thread on each experience for your squad | 1 | Yes |
| Wish list so far | A mosaic in the feed with the total and the monthly amount | 2 | Yes |
| Vision board | Everything hearted on a timeline by quarter, with "Up next", friends, a month-by-month chart and the plan | 2 | Yes |
| Split with friends | Each person's share once friends say they're in | 2 | Yes |
| EMI comparison | What the same plans would cost on a 12-month EMI | 2 | Yes |
| sumday dashboard | Each wish becomes a "someday" with its own first provision | 3 | Yes (demo) |
| Sign the charter | KYC once, a folio in your name, one mandate on the 1st | 3 | Yes (demo) |
| Pin tonight's price | Hold today's partner price from ₹1,000 | 3 | Yes (demo) |
| Move a date, pause | Shift a someday by a month; pause or resume its provision | 3 | Yes |
| Withdraw | Take everything out, no penalty from sumday | 3 | Placeholder |
| Push | One morning push, only if there's something specific to say | 1 | No |
| Real friends | Invite by link, accept to join a jam, see their real hearts | 1 | No (simulated) |
| Book it | Hand off to the partner to book when the someday is funded | 4 | No |

## 3. Journeys and done criteria

Each journey is done when every line under it is true in staging, on a mid-range Android phone on 4G.

### J1 · The morning drop
- [ ] A new edition is live for every member by 6:00 am in their time zone.
- [ ] If the edition isn't approved by 4:00 am, members get yesterday's edition in a new order. A feed is never blank.
- [ ] At most one push a day, at the member's chosen time (7:30 am default), naming something specific. No push if there's nothing specific.
- [ ] The first screen shows stories and a playing video within 2 seconds on 4G.
- [ ] The first 40 posts are the member's picks. Then "You're all caught up", then the rest of the edition.

### J2 · Discover and filter
- [ ] Category tabs, the filter button and the active-filter line stay above the stories.
- [ ] Filtering by country, place text or activity updates the feed and stories in under 300 ms.
- [ ] A narrow filter ends with an honest end card, not repeats.
- [ ] Every post shows the creator's name, the licence or partnership, and a link to the original.

### J3 · Heart and wish list
- [ ] ♥ and double-tap both add to the wish list, with a burst and a toast showing the new total.
- [ ] The wish list count updates everywhere at once (rail, side panel, vision board).
- [ ] Removing a heart removes it from the vision board and the plan.

### J4 · Jam with friends
- [ ] A member can tag a friend from their contacts on sumday, or share an invite link.
- [ ] The friend gets one notification. Accepting puts them in that jam; "maybe" is allowed.
- [ ] Stickers, sketches and notes sync to everyone in the jam within 5 seconds.
- [ ] Cost per person counts only friends who said "in".
- [ ] A member can leave a jam. Their stickers and notes stay, marked "left".

### J5 · Vision board
- [ ] Opens with "Up next": the soonest item, months away, its share and monthly amount, who's on it.
- [ ] Items sit on a timeline by quarter; videos play muted.
- [ ] The month-by-month chart matches the plan list to the rupee.
- [ ] "Start investing" and "plan it in sumday" go to the dashboard with the same items and amounts.

### J6 · Set it up in sumday
- [ ] KYC, folio and mandate happen once, through regulated partners, in the member's own name.
- [ ] The mandate amount equals the sum of the somedays' monthly provisions.
- [ ] Moving a date recalculates the provision; a date too close to fund is refused with a clear reason.
- [ ] Pinning a price shows the partner's terms, what's refundable, and when the pin expires.
- [ ] Pause and withdraw are always one tap away, and both are confirmed on screen and by SMS.

## 4. How it works (short)

1. **Overnight, the edition is built.** Posts are collected from licensed sources, tagged by models, matched to a priced experience, and approved by an editor. See [ARCHITECTURE §3](docs/ARCHITECTURE.md#3-the-overnight-edition).
2. **Each member gets their own order.** Rules at launch, a learned ranker later. See [AI-MODEL](docs/AI-MODEL.md).
3. **Social state is live.** Hearts, jams, stickers, sketches and notes are real-time.
4. **Money is sumday's existing rails.** KYC, folio, mandates and orders go through regulated partners. The feed never touches money.

## 5. Rules

### Content
- Real media only: creators' own photos and video, partner media under contract, or openly licensed media with credit. No AI-generated images or video, ever.
- Every card is approved by an editor before it ships. Models may sort, tag and draft; they never publish.
- Credit on every card: creator name, licence or partnership, link back. Takedown within 24 hours.
- A card must link to an experience we can price. No price, no card.
- "Illustrative" is shown when media isn't of the exact place or event.

### Money and compliance
- sumday acts as an AMFI-registered mutual-fund distributor. No ranking, rating or recommending of funds. Facts only, A to Z.
- The feed never mentions returns. Fund facts appear only in the sumday dashboard, next to the standard risk statement.
- Prices in the feed are "from" prices, dated. The binding number is the partner's quote at pin or booking.
- Event dates are "expected" until the organiser confirms them. Tickets come from official channels only.
- Accounts and folios are always in the member's own name. sumday never holds money.
- Tax is shown before any redemption, including TCS on overseas tour packages where it applies.

### Social
- Nobody is added to a jam without accepting.
- No contact-book upload. Friends are found by invite link or by phone number they've shared with sumday.
- Friends see your hearts only on things you've jammed on, or if you turn on "friends can see my wish list".

## 6. Design brief

- **Two rooms.** The feed is dark and photographic, Instagram-grade. The sumday dashboard is paper and Caslon, the sumday v4 look. Walking from one to the other should feel like stepping from the dream into the plan.
- **The picture does the talking.** One line of copy at most on media. Price, place and source sit quietly underneath.
- **Hand-drawn layer.** Handwritten notes, sketched rings and stickers make it feel made by people. Use them sparingly: at most one per post.
- **Motion with a reason.** Video plays only on screen. Hearts burst once. Arrows draw themselves once. Everything respects reduced motion.
- **Words.** "sumday" is always lowercase. Use pour or provision, someday, jam, wish list. Never "loan", "credit", "returns" or "guaranteed".

## 7. Analytics

Events to log from day one (names are suggestions):

| Event | When | Key properties |
| --- | --- | --- |
| `edition_opened` | Feed opens | edition date, minutes since drop |
| `post_viewed` | 50% visible for 1 s | post id, kind, position |
| `video_played` | Autoplay or tap | post id, seconds watched |
| `heart_added` / `heart_removed` | ♥ or double-tap | experience id, category |
| `drawer_opened` | Post tapped | experience id |
| `friend_tagged` / `jam_reply` | Tag, reply | experience id, reply |
| `sticker_added` / `sketch_added` / `note_posted` | In the drawer | experience id |
| `vision_board_opened` | Wish list tab | items, total |
| `mandate_started` | Charter signed | amount, item count |
| `price_pinned`, `date_moved`, `provision_paused` | Dashboard | experience id |

## 8. Go-live checklist

- [ ] AMFI ARN active; staff with NISM Series V-A certificates; distributor agreements with AMCs signed.
- [ ] KYC, folio, mandate and order flows tested end to end with real ₹100 mandates on staff accounts.
- [ ] Every claim in copy reviewed by compliance once; the risk statement is on every money screen.
- [ ] Creator agreements signed for every native video in the first 4 weeks of editions.
- [ ] Takedown inbox staffed; 24-hour SLA tested.
- [ ] DPDP consent screens, privacy policy and data deletion in place.
- [ ] 4:00 am fallback tested by failing the pipeline on purpose.
- [ ] Load test: 10× expected members opening within 10 minutes of 7:30 am.
- [ ] Analytics events verified in staging.
- [ ] Support playbook for "where is my money", "pause", "withdraw", "my friend can't see the jam".

## 9. How we test

- **Unit and integration.** Edition builder, ranking rules, cost and provision maths (the plan must match the chart to the rupee), mandate amount equals the sum of provisions.
- **Contract tests** against every partner sandbox: KYC, MF order routing, UPI AutoPay, travel and ticket partners.
- **Device lab.** Two low-end Androids, one iPhone, on throttled 4G: first video within 2 s, no layout jumps.
- **Content QA.** A daily checklist for the editor: credit present, price dated, no text-heavy media, illustrative label where needed.
- **Compliance QA.** A banned-words lint on all copy (returns, guaranteed, best fund, loan).
- **Beta.** 200 members for 4 weeks, with weekly calls with 10 of them.

## 10. Risks

| Risk | What we do |
| --- | --- |
| Creator rights | Licensed or embedded only; credit and takedown; creator programme by phase 3 |
| Platform API changes | No single platform over half of an edition; direct creator uploads |
| Wrong or stale prices | "From" prices, dated, refreshed nightly; binding quote at pin |
| Advice or returns language | Facts-only shelf, copy lint, compliance review |
| High first provisions | Show the monthly amount before hearting gets big; suggest later dates; never pressure |
| Over-spending | An affordability cap the member sets; the plan warns above it |
| Lonely feed | Seed squads in beta from real friend groups |

## 11. Open questions

1. Is "pin tonight's price" refundable if the member stops saving? Who holds the ₹1,000?
2. Which partners sell the trips and the official event packages (F1, ICC, Wimbledon), and what do they pay us?
3. One fund for all somedays, or one per someday? (One folio, tagged goals, is simpler.)
4. Do friends in a jam each run their own mandate, or can one person cover a share? (V1: each their own.)
5. How do we show progress honestly when markets fall before a trip?
6. What happens on the trip date if the someday is short of its target?
