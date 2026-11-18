import express, { type Request, type Response } from 'express';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildFeed, editionSeed, type Catalogue } from './feed/index.js';
import { buildProfile, topInterests } from './feed/profile.js';
import { sessionStats } from './feed/session.js';
import { SCORERS } from './feed/scorers.js';
import { buildPlan } from './plan.js';
import { monthsBetween, shiftMonth } from './feed/vectors.js';
import { Store } from './store.js';
import type { Action, Filters } from './types.js';

const here = dirname(fileURLToPath(import.meta.url));
const ACTIONS: Action[] = ['view', 'dwell', 'skip', 'open', 'heart', 'unheart', 'jam', 'share', 'not_interested'];

/** The demo has one member per browser, identified by a header. Real auth replaces this. */
const memberId = (req: Request) => String(req.header('x-member') ?? 'you').slice(0, 64);

const num = (v: unknown) => (v === undefined || v === '' ? undefined : Number(v));

export function createApp(cat: Catalogue, store = new Store()) {
  const app = express();
  app.use(express.json({ limit: '200kb' }));

  app.get('/api/health', (_req, res) => res.json({ ok: true, edition: editionSeed() }));

  app.get('/api/catalogue', (_req, res) => {
    res.json({
      experiences: cat.experiences,
      friends: cat.friends,
      countries: [...new Set(cat.experiences.map((e) => e.country))].sort(),
      activities: [...new Set(cat.experiences.flatMap((e) => e.activities))].sort(),
    });
  });

  app.get('/api/algorithms', (_req, res) => {
    res.json(SCORERS.map((s) => ({ id: s.id, name: s.name, about: s.about, defaultWeight: s.defaultWeight })));
  });

  /** One page of the member's feed. Weights and diversity can be overridden from the algorithm lab. */
  app.get('/api/feed', (req: Request, res: Response) => {
    const q = req.query;
    const filters: Filters = {
      category: q.category ? String(q.category) : undefined,
      country: q.country ? String(q.country) : undefined,
      activity: q.activity ? String(q.activity) : undefined,
      q: q.q ? String(q.q) : undefined,
      newToMe: q.new === '1',
    };
    const weights = Object.fromEntries(SCORERS.map((s) => [s.id, num(q[`w_${s.id}`])]));
    const result = buildFeed(cat, {
      member: store.member(memberId(req)),
      filters,
      weights,
      lambda: num(q.lambda),
      cursor: num(q.cursor) ?? 0,
      limit: num(q.limit) ?? 10,
      recent: q.recent ? String(q.recent).split(',').slice(-6) : [],
      lite: q.lite === '1',
    });
    res.json({
      ...result,
      items: result.items.map((s) => ({
        position: s.position,
        format: s.format,
        score: round(s.finalScore),
        relevance: round(s.score),
        value: round(s.value),
        predictions: s.predictions,
        reasons: s.reasons,
        breakdown: s.breakdown.map((b) => ({ ...b, score: round(b.score), weight: round(b.weight), contribution: round(b.contribution) })),
        experience: s.experience,
      })),
    });
  });

  /** Every interaction is a training signal; the profile updates immediately. */
  app.post('/api/events', (req, res) => {
    const m = store.member(memberId(req));
    const list = Array.isArray(req.body) ? req.body : [req.body];
    for (const ev of list) {
      if (!cat.byId.has(ev?.experienceId) || !ACTIONS.includes(ev?.action)) continue;
      m.events.push({ memberId: m.id, experienceId: ev.experienceId, action: ev.action, at: Date.now() });
    }
    store.save();
    const p = buildProfile(m, cat.byId);
    res.json({ ok: true, profile: { strength: round(p.strength), top: topInterests(p) }, session: sessionStats(m) });
  });

  app.get('/api/profile', (req, res) => {
    const m = store.member(memberId(req));
    const p = buildProfile(m, cat.byId);
    res.json({ name: m.name, comfort: m.comfort, events: m.events.length, hearts: m.hearts, strength: round(p.strength), top: topInterests(p, 12) });
  });

  app.post('/api/reset', (req, res) => {
    store.reset(memberId(req));
    res.json({ ok: true });
  });

  app.post('/api/hearts/:id', (req, res) => {
    const m = store.member(memberId(req));
    const id = req.params.id;
    if (!cat.byId.has(id)) return void res.status(404).json({ error: 'Unknown experience' });
    if (!m.hearts.includes(id)) m.hearts.push(id);
    m.events.push({ memberId: m.id, experienceId: id, action: 'heart', at: Date.now() });
    store.save();
    res.json({ hearts: m.hearts });
  });

  app.delete('/api/hearts/:id', (req, res) => {
    const m = store.member(memberId(req));
    const id = req.params.id;
    m.hearts = m.hearts.filter((h) => h !== id);
    if (cat.byId.has(id)) m.events.push({ memberId: m.id, experienceId: id, action: 'unheart', at: Date.now() });
    store.save();
    res.json({ hearts: m.hearts });
  });

  /** Drawer detail: the experience, its jam and notes, and which friends have it on their list. */
  app.get('/api/experiences/:id', (req, res) => {
    const e = cat.byId.get(req.params.id);
    if (!e) return void res.status(404).json({ error: 'Unknown experience' });
    const m = store.member(memberId(req));
    res.json({
      experience: e,
      hearted: m.hearts.includes(e.id),
      jam: m.jams[e.id] ?? {},
      notes: m.notes[e.id] ?? [],
      friendsWhoHearted: cat.friends.filter((f) => cat.friendHearts.get(f.id)?.includes(e.id)).map((f) => f.id),
    });
  });

  /** Tag a friend on a jam. In the demo the friend "replies" after a moment. */
  app.post('/api/jams/:id/tag', (req, res) => {
    const m = store.member(memberId(req));
    const e = cat.byId.get(req.params.id);
    const f = cat.friends.find((x) => x.id === req.body?.friendId);
    if (!e || !f) return void res.status(404).json({ error: 'Unknown experience or friend' });
    const jam = (m.jams[e.id] ??= {});
    if (jam[f.id]) {
      delete jam[f.id];
    } else {
      jam[f.id] = 'tagged';
      m.events.push({ memberId: m.id, experienceId: e.id, action: 'jam', at: Date.now() });
      setTimeout(() => {
        if (jam[f.id] !== 'tagged') return;
        const yes = (e.id.length + f.id.length) % 3 !== 0;
        jam[f.id] = yes ? 'in' : 'maybe';
        (m.notes[e.id] ??= []).push({ who: f.name, text: yes ? `I'm in. ${f.free}.` : `Maybe. Depends on leave. ${f.free}.`, at: Date.now() });
        store.save();
      }, 1500);
    }
    store.save();
    res.json({ jam });
  });

  app.post('/api/jams/:id/notes', (req, res) => {
    const m = store.member(memberId(req));
    const text = String(req.body?.text ?? '').trim().slice(0, 500);
    if (!cat.byId.has(req.params.id) || !text) return void res.status(400).json({ error: 'Need an experience and some text' });
    (m.notes[req.params.id] ??= []).push({ who: 'You', text, at: Date.now() });
    store.save();
    res.json({ notes: m.notes[req.params.id] });
  });

  /** The vision board and the sumday dashboard both read the plan. */
  app.get('/api/plan', (req, res) => res.json(buildPlan(store.member(memberId(req)), cat.byId)));

  app.patch('/api/somedays/:id', (req, res) => {
    const m = store.member(memberId(req));
    const id = req.params.id;
    if (!m.hearts.includes(id)) return void res.status(404).json({ error: 'Not on your wish list' });
    const sd = (m.somedays[id] ??= { shift: 0, paused: false });
    const prev = { ...sd };
    if (typeof req.body?.shiftBy === 'number') sd.shift += Math.sign(req.body.shiftBy);
    if (typeof req.body?.paused === 'boolean') sd.paused = req.body.paused;
    if (req.body?.pin === true) sd.pinnedAt = new Date().toISOString().slice(0, 10);
    const e = cat.byId.get(id)!;
    if (monthsBetween(shiftMonth(e.expectedMonth, sd.shift)) < 1) {
      m.somedays[id] = prev;
      return void res.status(400).json({ error: 'That date is too close to fund. Pick a later month.' });
    }
    store.save();
    res.json(buildPlan(m, cat.byId));
  });

  app.post('/api/mandate', (req, res) => {
    const m = store.member(memberId(req));
    m.mandate = { active: true, since: new Date().toISOString().slice(0, 10) };
    store.save();
    res.json(buildPlan(m, cat.byId));
  });

  // Media lives with the prototype at the repo root, so it isn't duplicated.
  const media = process.env.MEDIA_DIR ?? join(here, '..', '..', '..', 'prototype', 'media');
  app.use('/media', express.static(media, { maxAge: '7d' }));

  // In production, serve the built React app from the same server.
  const web = join(here, '..', '..', 'web', 'dist');
  if (existsSync(web)) {
    app.use(express.static(web));
    app.get(/^\/(?!api|media).*/, (_req, res) => res.sendFile(join(web, 'index.html')));
  }

  return app;
}

const round = (n: number) => Math.round(n * 1000) / 1000;
