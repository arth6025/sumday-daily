import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import seed from './data/seed.json' with { type: 'json' };
import { coHeartMatrix, popularity, simulatePopulation } from './feed/population.js';
import type { Catalogue } from './feed/index.js';
import type { Experience, Friend, MemberState } from './types.js';

const here = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = process.env.DATA_DIR ?? join(here, '..', '.data');
const STATE_FILE = join(DATA_DIR, 'state.json');

/** Builds the catalogue and the collaborative-filtering signal once at start-up. */
export function loadCatalogue(): Catalogue {
  const experiences = seed.experiences as Experience[];
  const friends = seed.friends as Friend[];
  const byId = new Map(experiences.map((e) => [e.id, e]));
  const people = simulatePopulation(experiences);
  // Friends' hearts: deterministic demo data, the same for everyone.
  const friendHearts = new Map<string, string[]>();
  friends.forEach((f, i) => friendHearts.set(f.id, people[i * 7 + 3]));
  return { experiences, byId, friends, friendHearts, coHeart: coHeartMatrix(people), popularity: popularity(people) };
}

export function demoMember(id = 'you'): MemberState {
  return {
    id,
    name: 'You',
    city: 'Bengaluru',
    comfort: 25000,
    onboarding: ['cat:Travel', 'act:Snow', 'cat:Sports'],
    hearts: ['cappadocia', 'lapland', 'monaco', 'berlin', 'indpak', 'yoga', 'pasta', 'spiti'],
    jams: { lapland: { riya: 'in', kabir: 'maybe' }, spiti: { meera: 'in' }, indpak: { kabir: 'in', dev: 'in' }, monaco: { riya: 'maybe' } },
    notes: {
      lapland: [
        { who: 'Riya', text: 'February? My leave resets in Jan.', at: Date.now() },
        { who: 'Kabir', text: 'Only if we do the glass cabin one night.', at: Date.now() },
      ],
    },
    somedays: {},
    mandate: { active: false },
    events: [],
  };
}

/**
 * A tiny file-backed store so the demo survives restarts. Replace with
 * Postgres (see docs/ARCHITECTURE.md §4) behind the same functions.
 */
export class Store {
  private members = new Map<string, MemberState>();

  constructor(private persist = process.env.NODE_ENV !== 'test') {
    if (this.persist && existsSync(STATE_FILE)) {
      try {
        const raw = JSON.parse(readFileSync(STATE_FILE, 'utf8')) as MemberState[];
        for (const m of raw) this.members.set(m.id, m);
      } catch {
        /* start fresh if the file is unreadable */
      }
    }
  }

  member(id: string): MemberState {
    let m = this.members.get(id);
    if (!m) {
      m = demoMember(id);
      this.members.set(id, m);
    }
    return m;
  }

  reset(id: string): MemberState {
    const m = demoMember(id);
    this.members.set(id, m);
    this.save();
    return m;
  }

  save(): void {
    if (!this.persist) return;
    mkdirSync(DATA_DIR, { recursive: true });
    // Keep the last 2,000 events per member so the file stays small.
    const out = [...this.members.values()].map((m) => ({ ...m, events: m.events.slice(-2000) }));
    writeFileSync(STATE_FILE, JSON.stringify(out));
  }
}
