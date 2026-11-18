// Types mirror server/src/types.ts and the API responses in server/src/app.ts.

export type Category = 'Travel' | 'Sports' | 'Fitness' | 'Lifestyle';
export type Format = 'auto' | 'tap' | 'carousel' | 'post' | 'reel';
export type Action = 'view' | 'dwell' | 'skip' | 'open' | 'heart' | 'unheart' | 'jam' | 'share' | 'not_interested';

export interface Media {
  kind: 'video' | 'photo';
  src: string;
  poster?: string;
  shape?: '4:5' | '9:16';
  credit: string;
  licence: string;
  source: string;
  note?: string;
}

export interface Experience {
  id: string;
  name: string;
  place: string;
  country: string;
  categories: Category[];
  activities: string[];
  bestMonths: string;
  expectedMonth: string;
  nights: number;
  cost: number;
  costSplit: { flights: number; stay: number; experience: number; food: number };
  hooks: string[];
  tips: string[];
  editorNote: string;
  media: Media[];
}

export interface Friend {
  id: string;
  name: string;
  colour: string;
  free: string;
}

export interface Breakdown {
  id: string;
  name: string;
  score: number;
  weight: number;
  contribution: number;
}

export interface FeedItem {
  position: number;
  format: Format;
  score: number;
  relevance: number;
  reasons: string[];
  breakdown: Breakdown[];
  experience: Experience;
}

export interface Interest {
  feature: string;
  weight: number;
}

export interface FeedPage {
  items: FeedItem[];
  nextCursor: number | null;
  ended: boolean;
  profile: { strength: number; coldStart: boolean; top: Interest[] };
  weights: Record<string, number>;
}

export interface Algorithm {
  id: string;
  name: string;
  about: string;
  defaultWeight: number;
}

export interface PlanItem {
  id: string;
  name: string;
  categories: Category[];
  month: string;
  monthsAway: number;
  cost: number;
  share: number;
  provision: number;
  paused: boolean;
  pinned: boolean;
  friendsIn: string[];
}

export interface Plan {
  items: PlanItem[];
  total: number;
  share: number;
  provisionNow: number;
  chart: { month: string; amount: number }[];
  emiInterest12m: number;
  mandate: { active: boolean; since?: string };
}

export interface Detail {
  experience: Experience;
  hearted: boolean;
  jam: Record<string, 'tagged' | 'in' | 'maybe'>;
  notes: { who: string; text: string; at: number }[];
  friendsWhoHearted: string[];
}

export interface Catalogue {
  experiences: Experience[];
  friends: Friend[];
  countries: string[];
  activities: string[];
}

export interface FeedQuery {
  category?: string;
  country?: string;
  activity?: string;
  q?: string;
  newToMe?: boolean;
  weights?: Record<string, number>;
  lambda?: number;
}

const headers = { 'content-type': 'application/json', 'x-member': 'you' };

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, { ...init, headers: { ...headers, ...(init?.headers ?? {}) } });
  const body = await res.json();
  if (!res.ok) throw new Error(body?.error ?? `Request failed (${res.status})`);
  return body as T;
}

export const api = {
  catalogue: () => call<Catalogue>('/api/catalogue'),
  algorithms: () => call<Algorithm[]>('/api/algorithms'),
  feed(q: FeedQuery, cursor: number, recent: string[]) {
    const p = new URLSearchParams({ cursor: String(cursor), limit: '10' });
    if (q.category) p.set('category', q.category);
    if (q.country) p.set('country', q.country);
    if (q.activity) p.set('activity', q.activity);
    if (q.q) p.set('q', q.q);
    if (q.newToMe) p.set('new', '1');
    if (q.lambda !== undefined) p.set('lambda', String(q.lambda));
    for (const [k, v] of Object.entries(q.weights ?? {})) p.set(`w_${k}`, String(v));
    if (recent.length) p.set('recent', recent.slice(-6).join(','));
    return call<FeedPage>(`/api/feed?${p}`);
  },
  events: (list: { experienceId: string; action: Action }[]) =>
    call<{ profile: { strength: number; top: Interest[] } }>('/api/events', { method: 'POST', body: JSON.stringify(list) }),
  heart: (id: string) => call<{ hearts: string[] }>(`/api/hearts/${id}`, { method: 'POST' }),
  unheart: (id: string) => call<{ hearts: string[] }>(`/api/hearts/${id}`, { method: 'DELETE' }),
  detail: (id: string) => call<Detail>(`/api/experiences/${id}`),
  tag: (id: string, friendId: string) => call<{ jam: Detail['jam'] }>(`/api/jams/${id}/tag`, { method: 'POST', body: JSON.stringify({ friendId }) }),
  note: (id: string, text: string) => call<{ notes: Detail['notes'] }>(`/api/jams/${id}/notes`, { method: 'POST', body: JSON.stringify({ text }) }),
  plan: () => call<Plan>('/api/plan'),
  someday: (id: string, body: { shiftBy?: number; paused?: boolean; pin?: boolean }) =>
    call<Plan>(`/api/somedays/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  mandate: () => call<Plan>('/api/mandate', { method: 'POST' }),
  reset: () => call<{ ok: boolean }>('/api/reset', { method: 'POST' }),
};
