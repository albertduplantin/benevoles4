import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { RUN, anonymous, createUser, cleanup, slot, sql } from './helpers.mjs';

let admin, resp, v1, v2, v3, mail;
const mk = (suffix, body) => ({
  title: `${RUN} ${suffix}`, description: 'Mission de test', category: `${RUN}_cat`, type: 'scheduled',
  location: 'Salle test', maxVolunteers: 2, status: 'published', ...slot(0), ...body,
});

before(async () => {
  admin = await createUser('admin', 'admin');
  resp = await createUser('resp', 'category_responsible');
  v1 = await createUser('v1');
  v2 = await createUser('v2');
  v3 = await createUser('v3');
  mail = await createUser('mail', 'volunteer', { emailOnly: true, token: 'T'.repeat(31) + RUN.slice(-1).replace(/[^A-Za-z0-9]/, 'x') });
  const cat = await admin.client.post('/api/categories', { value: `${RUN}_cat`, label: 'Catégorie test', group: 'Test', order: 0 });
  assert.equal(cat.status, 201, JSON.stringify(cat.data));
});
after(cleanup);

test('sans connexion : API protégées, accès public limité', async () => {
  assert.equal((await anonymous.get('/api/missions')).status, 401);
  assert.equal((await anonymous.get('/api/users')).status, 401);
  assert.equal((await anonymous.post('/api/missions/x/register')).status, 401);
  assert.equal((await anonymous.get('/api/personal')).status, 404);
  assert.equal((await anonymous.get('/api/personal?token=abc')).status, 404);
});

test('bénévole : droits limités', async () => {
  assert.equal((await v1.client.get('/api/missions?scope=all')).status, 403);
  assert.equal((await v1.client.post('/api/missions', mk('x'))).status, 403);
  assert.equal((await v1.client.get('/api/users')).status, 403);
  assert.equal((await v1.client.patch(`/api/users/${v1.id}`, { role: 'admin' })).status, 403);
  assert.equal((await v1.client.patch(`/api/users/${v2.id}`, { firstName: 'X' })).status, 403);
  assert.equal((await v1.client.del(`/api/users/${v2.id}`)).status, 403);
  assert.equal((await v1.client.put('/api/settings', { registrationsBlocked: true })).status, 403);
  const other = await v1.client.get(`/api/users/${v2.id}`);
  assert.equal(other.status, 200);
  assert.equal(other.data.user.email, '', 'les coordonnées ne doivent pas fuiter');
});

test('responsable : ne gère que ses catégories', async () => {
  assert.equal((await resp.client.post('/api/missions', mk('hors cat', { category: 'Accueil VIP' }))).status, 403);
  assert.equal((await admin.client.post('/api/category-responsibles', { categoryId: `${RUN}_cat`, responsibleId: resp.id })).status, 201);
  const own = await resp.client.post('/api/missions', mk('resp'));
  assert.equal(own.status, 201, JSON.stringify(own.data));
  const role = await sql`SELECT role FROM users WHERE id = ${resp.id}`;
  assert.equal(role[0].role, 'category_responsible');
});

test('inscriptions : places, liste d\'attente, promotion, statut', async () => {
  const m = (await admin.client.post('/api/missions', mk('places'))).data.mission;
  assert.equal(m.status, 'published');
  assert.equal((await v1.client.post(`/api/missions/${m.id}/register`)).data.onWaitlist, false);
  assert.equal((await v1.client.post(`/api/missions/${m.id}/register`)).status, 400, 'double inscription refusée');
  assert.equal((await v2.client.post(`/api/missions/${m.id}/register`)).data.onWaitlist, false);
  let cur = (await v1.client.get(`/api/missions/${m.id}`)).data.mission;
  assert.equal(cur.status, 'full');
  const w = await v3.client.post(`/api/missions/${m.id}/register`);
  assert.equal(w.data.onWaitlist, true);
  const out = await v1.client.del(`/api/missions/${m.id}/register`);
  assert.equal(out.status, 200, JSON.stringify(out.data));
  cur = (await v1.client.get(`/api/missions/${m.id}`)).data.mission;
  assert.deepEqual([...cur.volunteers].sort(), [v2.id, v3.id].sort(), 'v3 promu depuis la liste d\'attente');
  assert.equal(cur.status, 'full');
  assert.equal(cur.waitlist.length, 0);
});

test('inscriptions : course simultanée ne dépasse jamais les places', async () => {
  const m = (await admin.client.post('/api/missions', mk('course', { maxVolunteers: 1, ...slot(1) }))).data.mission;
  const users = await Promise.all([1, 2, 3, 4].map((i) => createUser(`race${i}`)));
  const results = await Promise.all(users.map((u) => u.client.post(`/api/missions/${m.id}/register`)));
  const cur = (await admin.client.get(`/api/missions/${m.id}`)).data.mission;
  assert.equal(cur.volunteers.length, 1, `inscrits: ${cur.volunteers.length}`);
  assert.equal(results.filter((r) => r.data?.onWaitlist === false).length, 1);
});

test('inscriptions : chevauchement, brouillon, blocage global', async () => {
  const a = (await admin.client.post('/api/missions', mk('a', { maxVolunteers: 5, ...slot(2) }))).data.mission;
  const b = (await admin.client.post('/api/missions', mk('b', { maxVolunteers: 5, ...slot(2, 11) }))).data.mission;
  const d = (await admin.client.post('/api/missions', mk('draft', { status: 'draft', ...slot(3) }))).data.mission;
  assert.equal((await v1.client.post(`/api/missions/${a.id}/register`)).status, 200);
  assert.equal((await v1.client.post(`/api/missions/${b.id}/register`)).status, 409, 'chevauchement');
  assert.equal((await v1.client.post(`/api/missions/${d.id}/register`)).status, 400, 'brouillon');
  assert.equal((await v1.client.get(`/api/missions/${d.id}`)).status, 404, 'brouillon invisible');

  assert.equal((await admin.client.put('/api/settings', { registrationsBlocked: true, registrationBlockedMessage: 'Fermé' })).status, 200);
  const blocked = await v2.client.post(`/api/missions/${a.id}/register`);
  assert.equal(blocked.status, 403);
  assert.equal(blocked.data.error, 'Fermé');
  await admin.client.put('/api/settings', { registrationsBlocked: false });
  assert.equal((await v2.client.post(`/api/missions/${a.id}/register`)).status, 200);
});

test('désinscription : refusée moins de 24 h avant, admin peut', async () => {
  const soon = new Date(Date.now() + 5 * 3600_000);
  const m = (await admin.client.post('/api/missions', mk('bientôt', { startDate: soon.toISOString(), endDate: new Date(+soon + 3600_000).toISOString(), maxVolunteers: 3 }))).data.mission;
  assert.equal((await v1.client.post(`/api/missions/${m.id}/register`)).status, 200);
  assert.equal((await v1.client.del(`/api/missions/${m.id}/register`)).status, 400);
  assert.equal((await admin.client.del(`/api/missions/${m.id}/volunteers`, { userId: v1.id })).status, 200);
});

test('affectation par admin et notification du bénévole', async () => {
  const m = (await admin.client.post('/api/missions', mk('assign', { maxVolunteers: 3, ...slot(4) }))).data.mission;
  assert.equal((await v2.client.post(`/api/missions/${m.id}/volunteers`, { userId: v2.id })).status, 403);
  assert.equal((await admin.client.post(`/api/missions/${m.id}/volunteers`, { userId: v3.id })).status, 200);
  await new Promise((r) => setTimeout(r, 1500)); // notification envoyée après la réponse
  const notifs = (await v3.client.get('/api/notifications')).data.notifications;
  assert.ok(notifs.some((n) => n.missionId === m.id && n.type === 'new_assignment'), 'notification d\'affectation');
});

test('email-only : accès par jeton, sans connexion', async () => {
  const token = (await sql`SELECT personal_token t FROM users WHERE id = ${mail.id}`)[0].t;
  const m = (await admin.client.post('/api/missions', mk('mail', { maxVolunteers: 3, ...slot(5) }))).data.mission;
  await admin.client.post(`/api/missions/${m.id}/volunteers`, { userId: mail.id });
  const res = await anonymous.get(`/api/personal?token=${token}`);
  assert.equal(res.status, 200, JSON.stringify(res.data));
  assert.equal(res.data.missions.some((x) => x.id === m.id), true);
  assert.equal(res.data.user.personalToken, undefined);
  assert.equal((await anonymous.del(`/api/personal?token=${token}&missionId=${m.id}`)).status, 200);
});

test('profil et rôles', async () => {
  const me = await v1.client.patch(`/api/users/${v1.id}`, { firstName: 'Nouveau', phone: '0611223344', communications: true });
  assert.equal(me.status, 200);
  assert.equal(me.data.user.firstName, 'Nouveau');
  assert.equal((await admin.client.patch(`/api/users/${admin.id}`, { role: 'volunteer' })).status, 400, 'admin ne se rétrograde pas');
  assert.equal((await admin.client.patch(`/api/users/${v2.id}`, { role: 'category_responsible' })).status, 200);
  const bad = await v1.client.post('/api/users/sync', { firstName: 'A', lastName: 'B', phone: 'x' });
  assert.equal(bad.status, 400, 'téléphone invalide refusé');
});

test('catégories et suppression d\'un bénévole', async () => {
  assert.equal((await v1.client.post('/api/categories', { value: `${RUN}_x`, label: 'x', group: 'g' })).status, 403);
  const used = await admin.client.del(`/api/categories/${encodeURIComponent(`${RUN}_cat`)}`);
  assert.equal(used.status, 409, 'catégorie utilisée non supprimable');
  const victim = await createUser('victim');
  const m = (await admin.client.post('/api/missions', mk('victim', { maxVolunteers: 3, ...slot(6) }))).data.mission;
  await admin.client.post(`/api/missions/${m.id}/volunteers`, { userId: victim.id });
  assert.equal((await admin.client.del(`/api/users/${victim.id}`)).status, 200);
  const cur = (await admin.client.get(`/api/missions/${m.id}`)).data.mission;
  assert.equal(cur.volunteers.includes(victim.id), false, 'retiré des missions');
});

test('pages : chargent sans erreur serveur (admin connecté) et redirigent sans connexion', async () => {
  const pages = ['/dashboard/missions', '/dashboard/profile', '/dashboard/preferences', '/dashboard/volunteers',
    '/dashboard/affectations', '/dashboard/overview', '/dashboard/missions/new', '/dashboard/admin/categories',
    '/dashboard/admin/category-responsibles', '/dashboard/admin/email-only', '/dashboard/admin/notifications',
    '/dashboard/admin/search-volunteers', '/dashboard/volunteer-call', '/mes-missions', '/auth/login', '/'];
  const jar = admin.client;
  for (const p of pages) {
    const r = await jar.get(p);
    assert.ok(r.status < 400, `${p} -> ${r.status}`);
  }
  const redirected = await anonymous.get('/dashboard/missions');
  assert.ok([302, 307].includes(redirected.status), `non connecté -> ${redirected.status}`);
});
