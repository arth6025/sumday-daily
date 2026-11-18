import type { Experience } from '../types.js';

/** A sparse feature vector: feature name to weight. */
export type Vec = Map<string, number>;

export function priceBand(cost: number): string {
  if (cost < 25000) return 'under-25k';
  if (cost < 75000) return '25k-75k';
  if (cost < 150000) return '75k-1.5L';
  return '1.5L-plus';
}

/** Whole months from `now` to a YYYY-MM month (can be zero or negative). */
export function monthsBetween(month: string, now = new Date()): number {
  const [y, m] = month.split('-').map(Number);
  return (y - now.getFullYear()) * 12 + (m - 1 - now.getMonth());
}

/** Whole months from `now` to a YYYY-MM month, never below 1 (safe to divide by). */
export function monthsUntil(month: string, now = new Date()): number {
  return Math.max(1, monthsBetween(month, now));
}

export function shiftMonth(month: string, by: number): string {
  const [y, m] = month.split('-').map(Number);
  const t = y * 12 + (m - 1) + by;
  return `${Math.floor(t / 12)}-${String((t % 12) + 1).padStart(2, '0')}`;
}

/**
 * The content features of an experience. Categories and activities carry most
 * of the weight; country and price band help; the timing band is small.
 */
export function itemVector(e: Experience, now = new Date()): Vec {
  const v: Vec = new Map();
  for (const c of e.categories) v.set(`cat:${c}`, 1);
  for (const a of e.activities) v.set(`act:${a}`, 1.4);
  v.set(`country:${e.country}`, 0.8);
  v.set(`price:${priceBand(e.cost)}`, 0.5);
  const m = monthsUntil(e.expectedMonth, now);
  v.set(`when:${m < 3 ? 'soon' : m <= 9 ? 'window' : 'later'}`, 0.3);
  return normalise(v);
}

export function normalise(v: Vec): Vec {
  let n = 0;
  for (const x of v.values()) n += x * x;
  n = Math.sqrt(n) || 1;
  const out: Vec = new Map();
  for (const [k, x] of v) out.set(k, x / n);
  return out;
}

export function cosine(a: Vec, b: Vec): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (const [k, x] of a) {
    na += x * x;
    const y = b.get(k);
    if (y) dot += x * y;
  }
  for (const y of b.values()) nb += y * y;
  if (!na || !nb) return 0;
  return dot / Math.sqrt(na * nb);
}

export function addScaled(into: Vec, v: Vec, scale: number): void {
  for (const [k, x] of v) into.set(k, (into.get(k) ?? 0) + x * scale);
}
