import type { Experience, Filters, Friend, MemberState } from '../types.js';
import { buildProfile, topInterests } from './profile.js';
import { sessionStats, type SessionStats } from './session.js';
import { matchesFilters, rerank, scoreAll, type FeedSlot } from './rank.js';
import { defaultWeights, type ScoreContext, type Weights } from './scorers.js';

export interface Catalogue {
  experiences: Experience[];
  byId: Map<string, Experience>;
  friends: Friend[];
  friendHearts: Map<string, string[]>;
  coHeart: Map<string, Map<string, number>>;
  popularity: Map<string, number>;
}

export interface FeedRequest {
  member: MemberState;
  filters?: Filters;
  weights?: Partial<Weights>;
  /** Diversity: 1 = pure relevance, 0 = pure variety. */
  lambda?: number;
  cursor?: number;
  limit?: number;
  /** IDs shown on the previous page, so variety carries across pages. */
  recent?: string[];
  /** Slow connection or data saver: tap-to-play instead of autoplay. */
  lite?: boolean;
  now?: Date;
}

export interface FeedResponse {
  items: FeedSlot[];
  nextCursor: number | null;
  /** True when the filter is narrow and we stopped instead of repeating. */
  ended: boolean;
  profile: { strength: number; coldStart: boolean; top: { feature: string; weight: number }[] };
  session: SessionStats & { note?: string };
  weights: Weights;
}

/** A stable number for today's edition (the edition flips at 6:00 local). */
export function editionSeed(now = new Date()): number {
  const d = new Date(now.getTime() - 6 * 3600_000);
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
}

/**
 * The whole pipeline for one page of one member's feed:
 * candidates → filter → score with every algorithm → blend → re-rank for
 * variety and rhythm. Stateless, so a heart changes the very next page.
 */
export function buildFeed(cat: Catalogue, req: FeedRequest): FeedResponse {
  const now = req.now ?? new Date();
  const member = req.member;
  const filters = req.filters ?? {};
  const weights = { ...defaultWeights(), ...stripUndefined(req.weights ?? {}) } as Weights;
  const limit = Math.min(30, Math.max(1, req.limit ?? 10));
  const cursor = req.cursor ?? 0;

  const profile = buildProfile(member, cat.byId, now.getTime());
  const session = sessionStats(member, now.getTime());
  let lambda = req.lambda ?? 0.72;
  // Lots of skips: the feed isn't landing. Mix it up and explore more, rather
  // than doubling down or trying to hold attention.
  if (session.rescue) {
    lambda = Math.min(lambda, 0.5);
    weights.exploration = (weights.exploration ?? 0) * 3 + 0.05;
  }
  const ctx: ScoreContext = {
    member,
    profile,
    byId: cat.byId,
    friends: cat.friends,
    friendHearts: cat.friendHearts,
    coHeart: cat.coHeart,
    popularity: cat.popularity,
    editionSeed: editionSeed(now),
    now,
  };

  const candidates = cat.experiences.filter((e) => matchesFilters(e, filters, member.hearts));
  const filtered = Boolean(filters.category || filters.country || filters.activity || filters.q || filters.newToMe);
  // A narrow filter ends honestly instead of looping the same few cards.
  const cap = filtered ? Math.max(3, candidates.length * 3) : Infinity;
  const pageLimit = Math.max(0, Math.min(limit, cap - cursor));

  const scored = scoreAll(candidates, ctx, weights, session);
  const items = pageLimit
    ? rerank(scored, { lambda, recent: req.recent ?? [], startPosition: cursor, limit: pageLimit, lite: req.lite }, now)
    : [];
  const next = cursor + items.length;
  const ended = !items.length || next >= cap;

  return {
    items,
    nextCursor: ended ? null : next,
    ended,
    profile: { strength: Math.round(profile.strength * 10) / 10, coldStart: profile.strength < 12, top: topInterests(profile) },
    session: { ...session, note: session.rescue ? "You're skipping a lot, so we're mixing things up." : undefined },
    weights,
  };
}

function stripUndefined<T extends object>(o: T): Partial<T> {
  return Object.fromEntries(Object.entries(o).filter(([, v]) => typeof v === 'number' && !Number.isNaN(v))) as Partial<T>;
}
