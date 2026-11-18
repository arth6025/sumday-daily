import type { MemberState } from '../types.js';

/**
 * Short-term session counters: how many cards were shown and skipped in the
 * last 1 and 3 minutes and in this session. Big feeds keep dozens of these
 * windows; these few are enough to notice when the feed isn't landing.
 */
export interface SessionStats {
  shown1m: number;
  skipped1m: number;
  shown3m: number;
  skipped3m: number;
  shownSession: number;
  skippedSession: number;
  heartsSession: number;
  /** Share of cards skipped in the last 3 minutes, 0..1. */
  skipRate3m: number;
  /**
   * True when the member is skipping a lot. We respond with more variety and
   * exploration, never with more of the same or a push to stay.
   */
  rescue: boolean;
}

/** A gap of 30 minutes or more starts a new session. */
const SESSION_GAP_MS = 30 * 60_000;

export function sessionStats(member: MemberState, now = Date.now()): SessionStats {
  const evs = member.events;
  let start = now;
  for (let i = evs.length - 1; i >= 0; i--) {
    if (start - evs[i].at > SESSION_GAP_MS) break;
    start = evs[i].at;
  }
  const count = (since: number, kinds: string[]) => evs.filter((e) => e.at >= since && e.at <= now && kinds.includes(e.action)).length;
  const shown = ['view', 'skip'];
  const s: SessionStats = {
    shown1m: count(now - 60_000, shown),
    skipped1m: count(now - 60_000, ['skip']),
    shown3m: count(now - 180_000, shown),
    skipped3m: count(now - 180_000, ['skip']),
    shownSession: count(start, shown),
    skippedSession: count(start, ['skip']),
    heartsSession: count(start, ['heart']),
    skipRate3m: 0,
    rescue: false,
  };
  s.skipRate3m = s.shown3m ? s.skipped3m / s.shown3m : 0;
  s.rescue = s.skipped3m >= 3 && s.skipRate3m >= 0.5;
  return s;
}
