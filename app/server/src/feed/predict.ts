import type { Experience } from '../types.js';
import type { SessionStats } from './session.js';

/**
 * Multi-task predictions for one card. Short-video feeds predict several
 * outcomes per item (skip, finish, like, comment, follow, seconds on screen)
 * and combine them, rather than ranking on one score. We do the same for the
 * outcomes that matter to sumday.
 *
 * The coefficients below are hand-set starting points so the demo behaves
 * sensibly. In phase 4 each head becomes a trained model on logged outcomes
 * (see docs/AI-MODEL.md §2, Stage 2, and docs/ROADMAP-RECSYS.md, stage D).
 */
export interface Predictions {
  /** Chance the member scrolls past in under a second. */
  skip: number;
  /** Chance they stay 3 seconds or more (our "finish"). */
  dwell: number;
  /** Chance they heart it. */
  heart: number;
  /** Chance they tag a friend on it. */
  jam: number;
  /** Expected seconds on screen. */
  staySeconds: number;
}

/**
 * How much each outcome is worth to sumday. A jam is worth most: it's the
 * strongest sign a someday will actually happen. Skips cost. Seconds count a
 * little, so we never optimise for scrolling time on its own.
 */
export const TASK_VALUE = { heart: 1, jam: 1.6, dwell: 0.5, skip: -0.8, perSecond: 0.02 };

const sigmoid = (x: number) => 1 / (1 + Math.exp(-x));
const r = (n: number) => Math.round(n * 1000) / 1000;

export function predict(s: Record<string, number>, e: Experience, session: SessionStats): Predictions {
  const c = s.content ?? 0;
  const col = s.collaborative ?? 0;
  const sq = s.squad ?? 0;
  const q = s.quality ?? 0;
  const t = s.timing ?? 0;
  const b = s.budget ?? 0;
  const pop = s.popularity ?? 0;
  const video = e.media.some((m) => m.kind === 'video') ? 1 : 0;

  const heart = sigmoid(-3.4 + 2.6 * c + 1.4 * col + 1.0 * sq + 0.8 * t + 0.6 * b + 0.6 * pop);
  const jam = sigmoid(-4.4 + 2.6 * sq + 1.2 * c + 0.6 * col);
  const dwell = sigmoid(-1.2 + 1.8 * c + 1.0 * q + 0.6 * video);
  const skip = sigmoid(0.6 - 2.2 * c - 0.8 * q - 0.4 * video + 1.6 * session.skipRate3m);
  const staySeconds = 1.5 + 14 * dwell * (video ? 1.25 : 1);
  return { skip: r(skip), dwell: r(dwell), heart: r(heart), jam: r(jam), staySeconds: Math.round(staySeconds * 10) / 10 };
}

/** Combines the predictions into one 0..1 value for ranking. */
export function value(p: Predictions): number {
  const v = TASK_VALUE;
  const raw = v.heart * p.heart + v.jam * p.jam + v.dwell * p.dwell + v.skip * p.skip + v.perSecond * Math.min(p.staySeconds, 20);
  const lo = v.skip; // worst case: certain skip, nothing else
  const hi = v.heart + v.jam + v.dwell + v.perSecond * 20;
  return (raw - lo) / (hi - lo);
}
