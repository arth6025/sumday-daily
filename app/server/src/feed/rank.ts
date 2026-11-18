import type { Experience, Filters, Format } from '../types.js';
import { coldStartAdjust, SCORERS, type ScoreContext, type Weights } from './scorers.js';
import { cosine, itemVector, priceBand } from './vectors.js';

export interface Scored {
  experience: Experience;
  score: number;
  breakdown: { id: string; name: string; score: number; weight: number; contribution: number }[];
  reasons: string[];
}

export interface FeedSlot extends Scored {
  position: number;
  format: Format;
  /** Final score after diversity re-ranking. */
  finalScore: number;
}

/** The feed's rhythm: what kind of post each position gets. Repeats every 10. */
export const RHYTHM: Format[] = ['auto', 'tap', 'carousel', 'post', 'reel', 'carousel', 'post', 'auto', 'post', 'tap'];

export function matchesFilters(e: Experience, f: Filters, hearts: string[]): boolean {
  if (f.category && !e.categories.includes(f.category as Experience['categories'][number])) return false;
  if (f.country && e.country !== f.country) return false;
  if (f.activity && !e.activities.includes(f.activity)) return false;
  if (f.q) {
    const q = f.q.toLowerCase();
    if (![e.name, e.place, e.country].some((v) => v.toLowerCase().includes(q))) return false;
  }
  if (f.newToMe && hearts.includes(e.id)) return false;
  return true;
}

/** Stage 1 · score every candidate with every algorithm and blend. */
export function scoreAll(candidates: Experience[], ctx: ScoreContext, weights: Weights): Scored[] {
  const w = coldStartAdjust(weights, ctx.profile.strength);
  const total = Object.values(w).reduce((a, b) => a + Math.max(0, b), 0) || 1;
  return candidates
    .filter((e) => !ctx.profile.blocked.has(e.id))
    .map((e) => {
      const breakdown = SCORERS.map((s) => {
        const r = s.score(e, ctx);
        const weight = Math.max(0, w[s.id] ?? 0) / total;
        return { id: s.id, name: s.name, score: r.score, weight, contribution: r.score * weight, reason: r.reason };
      });
      const score = breakdown.reduce((a, b) => a + b.contribution, 0);
      const reasons = breakdown
        .filter((b) => b.reason && b.weight > 0)
        .sort((a, b) => b.contribution - a.contribution)
        .slice(0, 2)
        .map((b) => b.reason as string);
      return {
        experience: e,
        score,
        breakdown: breakdown.map(({ reason: _r, ...b }) => b),
        reasons,
      };
    })
    .sort((a, b) => b.score - a.score);
}

export interface RerankOptions {
  /** 0..1: 1 = pure relevance, 0 = pure diversity. */
  lambda: number;
  /** Experiences shown just before this page, for variety across pages. */
  recent: string[];
  /** Global position of the first slot (keeps the rhythm across pages). */
  startPosition: number;
  limit: number;
}

/**
 * Stage 2 · re-rank for variety with Maximal Marginal Relevance, then apply the
 * editor's hard rules: no repeat within 4 slots, same country at most twice in
 * a row, at least 1 in 4 under ₹25,000, and the rhythm of formats.
 */
export function rerank(scored: Scored[], opts: RerankOptions, now = new Date()): FeedSlot[] {
  const vec = new Map(scored.map((s) => [s.experience.id, itemVector(s.experience, now)]));
  const out: FeedSlot[] = [];
  const recent = [...opts.recent];
  const shown = new Map<string, number>();
  for (const id of opts.recent) shown.set(id, (shown.get(id) ?? 0) + 1);

  for (let i = 0; i < opts.limit && scored.length; i++) {
    const pos = opts.startPosition + i;
    const window = recent.slice(-4);
    const lastCountries = recent.slice(-2).map((id) => scored.find((s) => s.experience.id === id)?.experience.country);
    const needCheap = (pos + 1) % 4 === 0 && !recent.slice(-3).some((id) => {
      const e = scored.find((s) => s.experience.id === id)?.experience;
      return e && priceBand(e.cost) === 'under-25k';
    });

    const isVid = (s: Scored) => s.experience.media.some((m) => m.kind === 'video');
    const isCheap = (s: Scored) => priceBand(s.experience.cost) === 'under-25k';
    const wantVid = RHYTHM[pos % RHYTHM.length] === 'auto' || RHYTHM[pos % RHYTHM.length] === 'tap';

    // Pick the best card under the editor's rules. If the rules clash (say, the
    // slot wants a video and a cheap card, and no card is both), relax them in
    // order: first the price rule, then the video rule, then the no-repeat window.
    let best: Scored | undefined;
    let bestVal = -Infinity;
    for (let strict = 3; strict >= 0 && !best; strict--) {
      for (const s of scored) {
        const id = s.experience.id;
        if (strict >= 1 && window.includes(id) && scored.length > 4) continue;
        if (strict >= 3 && needCheap && !isCheap(s)) continue;
        if (strict >= 2 && wantVid && !isVid(s) && scored.some((x) => isVid(x) && !window.includes(x.experience.id))) continue;
        const sameCountryRun = lastCountries.length === 2 && lastCountries.every((c) => c === s.experience.country);
        const maxSim = Math.max(0, ...window.map((r) => (vec.get(r) ? cosine(vec.get(id)!, vec.get(r)!) : 0)));
        const repeatPenalty = (shown.get(id) ?? 0) * 0.15;
        const val = opts.lambda * s.score - (1 - opts.lambda) * maxSim - repeatPenalty - (sameCountryRun ? 0.2 : 0);
        if (val > bestVal) {
          bestVal = val;
          best = s;
        }
      }
    }
    if (!best) break;
    const id = best.experience.id;
    recent.push(id);
    shown.set(id, (shown.get(id) ?? 0) + 1);
    out.push({ ...best, position: pos, format: formatFor(best.experience, pos), finalScore: bestVal });
  }
  return out;
}

/** Pick the post format for a position, falling back when the media doesn't allow it. */
export function formatFor(e: Experience, position: number): Format {
  const want = RHYTHM[position % RHYTHM.length];
  const hasVideo = e.media.some((m) => m.kind === 'video');
  const hasTall = e.media.some((m) => m.shape === '9:16');
  const photos = e.media.filter((m) => m.kind === 'photo').length;
  if ((want === 'auto' || want === 'tap') && hasVideo) return want;
  if (want === 'reel' && hasTall) return 'reel';
  if (want === 'carousel' && photos >= 1) return 'carousel';
  if (hasVideo && (want === 'auto' || want === 'tap')) return want;
  return photos >= 2 && position % 3 === 0 ? 'carousel' : 'post';
}
