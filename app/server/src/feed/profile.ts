import type { Action, Experience, MemberState } from '../types.js';
import { addScaled, itemVector, type Vec } from './vectors.js';

/**
 * How much each action tells us. Positive pulls the member's interests toward
 * the card's features; negative pushes them away. Starting points, tuned later
 * from data (see docs/AI-MODEL.md).
 */
export const ACTION_WEIGHT: Record<Action, number> = {
  view: 0.1,
  dwell: 0.6,
  skip: -0.4,
  open: 1,
  heart: 3,
  unheart: -3,
  jam: 4,
  share: 2,
  not_interested: -4,
};

/** Interests fade: an action from a week ago counts half as much as one today. */
export const HALF_LIFE_DAYS = 7;

export interface Profile {
  vec: Vec;
  /** Total absolute signal; small means a new member (cold start). */
  strength: number;
  /** Experiences the member has said no to. */
  blocked: Set<string>;
  /** How many times each experience has been shown recently (for exploration). */
  impressions: Map<string, number>;
}

/**
 * Builds the member's interest profile from scratch on every request. This is
 * the real-time loop: a heart updates the very next page. At scale this becomes
 * an online-updated embedding (see docs/ROADMAP-RECSYS.md).
 */
export function buildProfile(member: MemberState, byId: Map<string, Experience>, now = Date.now()): Profile {
  const vec: Vec = new Map();
  let strength = 0;
  const blocked = new Set<string>();
  const impressions = new Map<string, number>();

  for (const tag of member.onboarding) vec.set(tag, (vec.get(tag) ?? 0) + 0.6);
  for (const id of member.hearts) {
    const e = byId.get(id);
    if (e) addScaled(vec, itemVector(e), 1.5);
  }

  for (const ev of member.events) {
    const e = byId.get(ev.experienceId);
    if (!e) continue;
    const ageDays = (now - ev.at) / 86_400_000;
    const decay = Math.pow(0.5, ageDays / HALF_LIFE_DAYS);
    const w = ACTION_WEIGHT[ev.action] * decay;
    addScaled(vec, itemVector(e), w);
    strength += Math.abs(w);
    if (ev.action === 'not_interested') blocked.add(e.id);
    if (ev.action === 'view' && ageDays < 1) impressions.set(e.id, (impressions.get(e.id) ?? 0) + 1);
  }
  strength += member.hearts.length * 1.5;
  return { vec, strength, blocked, impressions };
}

/** The member's strongest interests, for the algorithm lab and explanations. */
export function topInterests(profile: Profile, n = 8): { feature: string; weight: number }[] {
  return [...profile.vec.entries()]
    .filter(([, w]) => w > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([feature, weight]) => ({ feature, weight: Math.round(weight * 100) / 100 }));
}
