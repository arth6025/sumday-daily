import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildFeed } from '../src/feed/index.js';
import { buildProfile } from '../src/feed/profile.js';
import { RHYTHM } from '../src/feed/rank.js';
import { buildPlan } from '../src/plan.js';
import { demoMember, loadCatalogue } from '../src/store.js';
import type { MemberState } from '../src/types.js';

const cat = loadCatalogue();
const NOW = new Date('2026-11-18T09:00:00+05:30');

function freshMember(): MemberState {
  return { ...demoMember('t'), hearts: [], jams: {}, notes: {}, onboarding: [], events: [] };
}

test('a brand-new member gets a full first page from popularity and quality (cold start)', () => {
  const r = buildFeed(cat, { member: freshMember(), now: NOW, limit: 10 });
  assert.equal(r.items.length, 10);
  assert.equal(r.profile.coldStart, true);
});

test('hearting scuba moves water experiences up the very next page (real-time)', () => {
  const m = freshMember();
  const before = buildFeed(cat, { member: m, now: NOW, limit: 29 }).items.map((s) => s.experience.id);
  for (let i = 0; i < 4; i++) m.events.push({ memberId: m.id, experienceId: 'andaman', action: 'heart', at: NOW.getTime() });
  m.hearts.push('andaman');
  const after = buildFeed(cat, { member: m, now: NOW, limit: 29 }).items.map((s) => s.experience.id);
  const rank = (ids: string[], id: string) => ids.indexOf(id) === -1 ? 99 : ids.indexOf(id);
  assert.ok(rank(after, 'varkala') < rank(before, 'varkala') || rank(after, 'rhodes') < rank(before, 'rhodes'), 'a related water experience should move up');
});

test('"not interested" removes an experience from the feed', () => {
  const m = freshMember();
  m.events.push({ memberId: m.id, experienceId: 'monaco', action: 'not_interested', at: NOW.getTime() });
  const ids = buildFeed(cat, { member: m, now: NOW, limit: 29 }).items.map((s) => s.experience.id);
  assert.ok(!ids.includes('monaco'));
});

test('no experience repeats within any 4 slots', () => {
  const r = buildFeed(cat, { member: demoMember(), now: NOW, limit: 30 });
  const ids = r.items.map((s) => s.experience.id);
  for (let i = 0; i < ids.length; i++) assert.ok(!ids.slice(Math.max(0, i - 4), i).includes(ids[i]), `repeat at ${i}`);
});

test('the rhythm puts video in the video slots when video exists', () => {
  const r = buildFeed(cat, { member: demoMember(), now: NOW, limit: 10 });
  const first = r.items[0];
  assert.equal(RHYTHM[0], 'auto');
  assert.equal(first.format, 'auto');
  assert.ok(first.experience.media.some((m) => m.kind === 'video'));
});

test('every item explains itself with a score breakdown', () => {
  const r = buildFeed(cat, { member: demoMember(), now: NOW, limit: 5 });
  for (const s of r.items) {
    const sum = s.breakdown.reduce((a, b) => a + b.contribution, 0);
    assert.ok(Math.abs(sum - s.score) < 1e-9);
  }
});

test('a narrow filter ends instead of looping', () => {
  const r = buildFeed(cat, { member: demoMember(), now: NOW, filters: { country: 'Monaco' }, limit: 10 });
  assert.equal(r.items.length, 3);
  assert.equal(r.ended, true);
});

test('turning a scorer up changes the order (weights are live)', () => {
  const m = demoMember();
  const a = buildFeed(cat, { member: m, now: NOW, limit: 10 }).items.map((s) => s.experience.id).join();
  const b = buildFeed(cat, { member: m, now: NOW, limit: 10, weights: { budget: 3 } }).items.map((s) => s.experience.id).join();
  assert.notEqual(a, b);
});

test('interests fade with time', () => {
  const m = freshMember();
  m.events.push({ memberId: m.id, experienceId: 'monaco', action: 'heart', at: NOW.getTime() - 14 * 86_400_000 });
  const old = buildProfile(m, cat.byId, NOW.getTime()).strength;
  m.events[0].at = NOW.getTime();
  const fresh = buildProfile(m, cat.byId, NOW.getTime()).strength;
  assert.ok(Math.abs(old - fresh / 4) < 0.01, 'two half-lives should quarter the weight');
});

test('the plan chart starts at the monthly provision and the shares split with friends who are in', () => {
  const m = demoMember();
  const plan = buildPlan(m, cat.byId, NOW);
  assert.equal(plan.chart[0].amount, plan.items.reduce((a, x) => a + x.provision, 0));
  const indpak = plan.items.find((x) => x.id === 'indpak')!;
  assert.equal(indpak.friendsIn.length, 2);
  assert.equal(indpak.share, Math.round(indpak.cost / 3));
});
