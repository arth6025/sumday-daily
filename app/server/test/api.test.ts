import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import { createApp } from '../src/app.js';
import { loadCatalogue, Store } from '../src/store.js';

let server: Server;
let base = '';
const h = { 'content-type': 'application/json', 'x-member': 'api-test' };

before(async () => {
  server = createApp(loadCatalogue(), new Store(false)).listen(0);
  await new Promise((r) => server.once('listening', r));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});
after(() => server.close());

test('GET /api/feed returns a page with reasons and a next cursor', async () => {
  const r = await (await fetch(`${base}/api/feed?limit=5`, { headers: h })).json();
  assert.equal(r.items.length, 5);
  assert.equal(r.nextCursor, 5);
  assert.ok(Array.isArray(r.items[0].breakdown));
});

test('hearting updates the wish list and the plan', async () => {
  await fetch(`${base}/api/hearts/rhodes`, { method: 'POST', headers: h });
  const plan = await (await fetch(`${base}/api/plan`, { headers: h })).json();
  assert.ok(plan.items.some((x: { id: string }) => x.id === 'rhodes'));
});

test('events update the interest profile', async () => {
  const r = await (await fetch(`${base}/api/events`, { method: 'POST', headers: h, body: JSON.stringify([1, 2, 3].map(() => ({ experienceId: 'fontainebleau', action: 'jam' }))) })).json();
  assert.ok(r.profile.top.some((t: { feature: string }) => t.feature === 'act:Bouldering'));
});

test('moving a someday too close is refused', async () => {
  let res: Response | undefined;
  for (let i = 0; i < 30; i++) {
    res = await fetch(`${base}/api/somedays/spiti`, { method: 'PATCH', headers: h, body: JSON.stringify({ shiftBy: -1 }) });
    if (res.status === 400) break;
  }
  assert.equal(res?.status, 400);
});
