import type { Experience } from '../types.js';

/**
 * Collaborative filtering needs other people's behaviour. Until there are real
 * members, we simulate a small population with personas so the demo has
 * "people who hearted X also hearted Y" signal. Swap for real hearts in prod.
 */
const PERSONAS: { name: string; likes: string[] }[] = [
  { name: 'adventurer', likes: ['act:Trekking', 'act:Bouldering', 'act:Rafting', 'act:Paragliding', 'act:Scuba', 'act:Skiing', 'cat:Fitness'] },
  { name: 'culture', likes: ['act:Culture', 'act:Craft', 'act:Food', 'act:Slow trips', 'cat:Lifestyle'] },
  { name: 'sports-fan', likes: ['act:F1', 'act:Cricket', 'act:Tennis', 'act:Running', 'cat:Sports'] },
  { name: 'beach-and-water', likes: ['act:Beaches', 'act:Surfing', 'act:Scuba', 'act:Sailing'] },
  { name: 'cold-places', likes: ['act:Snow', 'act:Aurora', 'act:Skiing', 'act:Road trips'] },
  { name: 'wellness', likes: ['act:Yoga', 'act:Slow trips', 'act:Running', 'cat:Fitness'] },
];

function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function affinity(e: Experience, likes: string[]): number {
  const tags = [...e.categories.map((c) => `cat:${c}`), ...e.activities.map((a) => `act:${a}`)];
  return tags.filter((t) => likes.includes(t)).length;
}

/** Each simulated member hearts 4–9 experiences, mostly from their persona. */
export function simulatePopulation(experiences: Experience[], size = 300, seed = 7): string[][] {
  const r = rng(seed);
  const people: string[][] = [];
  for (let i = 0; i < size; i++) {
    const p = PERSONAS[i % PERSONAS.length];
    const second = PERSONAS[Math.floor(r() * PERSONAS.length)];
    const scored = experiences
      .map((e) => ({ id: e.id, s: affinity(e, p.likes) * 2 + affinity(e, second.likes) + r() * 1.5 }))
      .sort((a, b) => b.s - a.s);
    const n = 4 + Math.floor(r() * 6);
    people.push(scored.slice(0, n).map((x) => x.id));
  }
  return people;
}

/** Item-to-item similarity from co-hearts (cosine over who hearted what). */
export function coHeartMatrix(people: string[][]): Map<string, Map<string, number>> {
  const count = new Map<string, number>();
  const pair = new Map<string, Map<string, number>>();
  for (const hearts of people) {
    for (const a of hearts) {
      count.set(a, (count.get(a) ?? 0) + 1);
      for (const b of hearts) {
        if (a === b) continue;
        const row = pair.get(a) ?? new Map<string, number>();
        row.set(b, (row.get(b) ?? 0) + 1);
        pair.set(a, row);
      }
    }
  }
  const sim = new Map<string, Map<string, number>>();
  for (const [a, row] of pair) {
    const out = new Map<string, number>();
    for (const [b, n] of row) out.set(b, n / Math.sqrt((count.get(a) ?? 1) * (count.get(b) ?? 1)));
    sim.set(a, out);
  }
  return sim;
}

/** Share of the population that hearted each experience (popularity prior). */
export function popularity(people: string[][]): Map<string, number> {
  const c = new Map<string, number>();
  for (const h of people) for (const id of h) c.set(id, (c.get(id) ?? 0) + 1);
  const max = Math.max(1, ...c.values());
  const out = new Map<string, number>();
  for (const [id, n] of c) out.set(id, n / max);
  return out;
}
