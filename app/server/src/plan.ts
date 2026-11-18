import type { Experience, MemberState } from './types.js';
import { monthsUntil, shiftMonth } from './feed/vectors.js';

export interface PlanItem {
  id: string;
  name: string;
  categories: Experience['categories'];
  month: string;
  monthsAway: number;
  cost: number;
  /** The member's share after splitting with friends who said "in". */
  share: number;
  /** Monthly provision that funds the share by the month before. */
  provision: number;
  paused: boolean;
  pinned: boolean;
  friendsIn: string[];
}

export interface Plan {
  items: PlanItem[];
  total: number;
  share: number;
  /** What the mandate debits this month. */
  provisionNow: number;
  /** Provision needed in each of the coming months. */
  chart: { month: string; amount: number }[];
  emiInterest12m: number;
  mandate: MemberState['mandate'];
}

const up50 = (n: number) => Math.ceil(n / 50) * 50;

export function buildPlan(member: MemberState, byId: Map<string, Experience>, now = new Date()): Plan {
  const items: PlanItem[] = member.hearts
    .map((id) => byId.get(id))
    .filter((e): e is Experience => Boolean(e))
    .map((e) => {
      const sd = member.somedays[e.id] ?? { shift: 0, paused: false };
      const month = shiftMonth(e.expectedMonth, sd.shift);
      const monthsAway = monthsUntil(month, now);
      const friendsIn = Object.entries(member.jams[e.id] ?? {}).filter(([, s]) => s === 'in').map(([f]) => f);
      const share = e.cost / (1 + friendsIn.length);
      return {
        id: e.id,
        name: e.name,
        categories: e.categories,
        month,
        monthsAway,
        cost: e.cost,
        share: Math.round(share),
        provision: sd.paused ? 0 : up50(share / monthsAway),
        paused: sd.paused,
        pinned: Boolean(sd.pinnedAt),
        friendsIn,
      };
    })
    .sort((a, b) => a.month.localeCompare(b.month));

  const provisionNow = items.length ? Math.max(100, items.reduce((a, x) => a + x.provision, 0)) : 0;
  const span = Math.min(18, Math.max(0, ...items.map((x) => x.monthsAway)));
  const chart = Array.from({ length: span }, (_, k) => ({
    month: shiftMonth(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`, k),
    amount: items.reduce((a, x) => a + (x.monthsAway > k ? x.provision : 0), 0),
  }));
  const share = items.reduce((a, x) => a + x.share, 0);
  const r = 0.18 / 12;
  const emi = share ? (share * r * Math.pow(1 + r, 12)) / (Math.pow(1 + r, 12) - 1) : 0;

  return {
    items,
    total: items.reduce((a, x) => a + x.cost, 0),
    share,
    provisionNow,
    chart,
    emiInterest12m: Math.round(emi * 12 - share),
    mandate: member.mandate,
  };
}
