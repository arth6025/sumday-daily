import type { Experience, Friend, MemberState } from '../types.js';
import type { Profile } from './profile.js';
import { cosine, itemVector, monthsUntil } from './vectors.js';

/** Everything a scorer may look at. Scorers are pure: same context, same score. */
export interface ScoreContext {
  member: MemberState;
  profile: Profile;
  byId: Map<string, Experience>;
  friends: Friend[];
  friendHearts: Map<string, string[]>;
  coHeart: Map<string, Map<string, number>>;
  popularity: Map<string, number>;
  editionSeed: number;
  now: Date;
}

export interface ScorerResult {
  /** 0..1, higher is better. */
  score: number;
  /** A short, human reason, or undefined when this scorer has nothing to say. */
  reason?: string;
}

export interface Scorer {
  id: string;
  name: string;
  /** One line for the algorithm lab. */
  about: string;
  defaultWeight: number;
  score(e: Experience, ctx: ScoreContext): ScorerResult;
}

const clamp = (x: number) => Math.max(0, Math.min(1, x));
const label = (feature: string) => feature.split(':')[1] ?? feature;

/** 1. Content match: how close the card is to what the member has shown interest in. */
const content: Scorer = {
  id: 'content',
  name: 'Interest match',
  about: 'Cosine similarity between the card and your live interest profile (hearts, opens, dwell time, skips).',
  defaultWeight: 0.32,
  score(e, ctx) {
    const iv = itemVector(e, ctx.now);
    const s = clamp((cosine(iv, ctx.profile.vec) + 0.2) / 1.2);
    let best = '';
    let bestW = 0;
    for (const [k, w] of iv) {
      const p = ctx.profile.vec.get(k) ?? 0;
      if (p * w > bestW && (k.startsWith('act:') || k.startsWith('cat:'))) {
        bestW = p * w;
        best = k;
      }
    }
    return { score: s, reason: best && s > 0.45 ? `Because you're into ${label(best).toLowerCase()}` : undefined };
  },
};

/** 2. Collaborative: people who hearted what you hearted also hearted this. */
const collaborative: Scorer = {
  id: 'collaborative',
  name: 'People like you',
  about: 'Item-to-item similarity from who hearted what. "People who hearted Spiti also hearted Gulmarg."',
  defaultWeight: 0.2,
  score(e, ctx) {
    if (!ctx.member.hearts.length) return { score: 0 };
    let sum = 0;
    let top = '';
    let topS = 0;
    for (const h of ctx.member.hearts) {
      if (h === e.id) continue;
      const s = ctx.coHeart.get(h)?.get(e.id) ?? 0;
      sum += s;
      if (s > topS) {
        topS = s;
        top = h;
      }
    }
    const score = clamp(sum / Math.max(1, ctx.member.hearts.length) / 0.5);
    const name = ctx.byId.get(top)?.name;
    return { score, reason: name && score > 0.4 ? `People who hearted ${name} love this` : undefined };
  },
};

/** 3. Squad: your friends hearted it or are jamming on it. */
const squad: Scorer = {
  id: 'squad',
  name: 'Your squad',
  about: 'Friends who hearted this or are in a jam on it. Capped so a feed never becomes only friends\' picks.',
  defaultWeight: 0.14,
  score(e, ctx) {
    const who = ctx.friends.filter((f) => ctx.friendHearts.get(f.id)?.includes(e.id) || ctx.member.jams[e.id]?.[f.id]);
    if (!who.length) return { score: 0 };
    return { score: clamp(who.length / 3), reason: `${who.map((f) => f.name).join(' and ')} ${who.length > 1 ? 'have' : 'has'} this on their list` };
  },
};

/** 4. Timing: best when a monthly pour can actually fund it (3–9 months away). */
const timing: Scorer = {
  id: 'timing',
  name: 'Right time to save',
  about: 'Highest when the experience is 3–9 months away, the window a monthly pour can fund.',
  defaultWeight: 0.1,
  score(e, ctx) {
    const m = monthsUntil(e.expectedMonth, ctx.now);
    const s = m < 3 ? 0.35 + m * 0.15 : m <= 9 ? 1 : Math.max(0.3, 1 - (m - 9) * 0.08);
    return { score: s, reason: m >= 3 && m <= 9 ? `${m} months away, a good window to save` : undefined };
  },
};

/** 5. Budget: don't push things the member can't fund within their comfort amount. */
const budget: Scorer = {
  id: 'budget',
  name: 'Fits your budget',
  about: 'Compares the monthly amount this would need with your comfort amount. Never optimises for spending more.',
  defaultWeight: 0.1,
  score(e, ctx) {
    const monthly = e.cost / monthsUntil(e.expectedMonth, ctx.now);
    const ratio = monthly / Math.max(1000, ctx.member.comfort);
    const s = ratio <= 0.5 ? 1 : ratio <= 1 ? 1 - (ratio - 0.5) : Math.max(0, 0.5 - (ratio - 1) * 0.25);
    return { score: clamp(s), reason: ratio <= 0.5 ? 'Fits easily in your monthly budget' : undefined };
  },
};

/** 6. Quality: the editor's grade and how rich the media is (video beats photo). */
const quality: Scorer = {
  id: 'quality',
  name: 'Editor\'s quality',
  about: 'The editor\'s grade blended with media richness: video, more photos, no illustrative-only media.',
  defaultWeight: 0.08,
  score(e) {
    const hasVideo = e.media.some((m) => m.kind === 'video');
    const photos = e.media.filter((m) => m.kind === 'photo').length;
    const illustrative = e.media.every((m) => m.note);
    const s = 0.45 + (hasVideo ? 0.3 : 0) + Math.min(0.2, photos * 0.05) - (illustrative ? 0.15 : 0);
    return { score: clamp(s) };
  },
};

/** 7. Exploration: give unseen and new-to-you things a chance, so the feed keeps learning. */
const exploration: Scorer = {
  id: 'exploration',
  name: 'Something new',
  about: 'An upper-confidence bonus for things you haven\'t seen much, plus a nudge for categories you haven\'t tried.',
  defaultWeight: 0.06,
  score(e, ctx) {
    const n = ctx.profile.impressions.get(e.id) ?? 0;
    const total = [...ctx.profile.impressions.values()].reduce((a, b) => a + b, 0);
    const ucb = Math.sqrt((2 * Math.log(total + 2)) / (n + 1)) / 2;
    const unknownCat = e.categories.every((c) => (ctx.profile.vec.get(`cat:${c}`) ?? 0) <= 0.05);
    const s = clamp(ucb * 0.7 + (unknownCat ? 0.3 : 0));
    return { score: s, reason: unknownCat && n === 0 ? 'Something new for you' : undefined };
  },
};

/** 8. Popularity: what's loved across sumday. The main signal for brand-new members. */
const popular: Scorer = {
  id: 'popularity',
  name: 'Loved on sumday',
  about: 'How many members hearted it. Carries most of the weight for brand-new members (cold start).',
  defaultWeight: 0.0,
  score(e, ctx) {
    const s = ctx.popularity.get(e.id) ?? 0;
    return { score: s, reason: s > 0.75 ? 'Popular on sumday this week' : undefined };
  },
};

export const SCORERS: Scorer[] = [content, collaborative, squad, timing, budget, quality, exploration, popular];

export type Weights = Record<string, number>;

export function defaultWeights(): Weights {
  return Object.fromEntries(SCORERS.map((s) => [s.id, s.defaultWeight]));
}

/**
 * New members have no profile, so personal signals mean little. Move weight
 * from personal scorers to popularity and quality until the profile is strong.
 */
export function coldStartAdjust(w: Weights, strength: number): Weights {
  const t = Math.min(1, strength / 12);
  const out = { ...w };
  const moved = (out.content + out.collaborative) * (1 - t) * 0.7;
  out.content *= 0.3 + 0.7 * t;
  out.collaborative *= 0.3 + 0.7 * t;
  out.popularity = (out.popularity ?? 0) + moved * 0.7;
  out.quality = (out.quality ?? 0) + moved * 0.3;
  return out;
}
