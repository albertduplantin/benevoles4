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

test('connexion par email : lien envoyé, lien à usage unique, compte existant retrouvé', async (t) => {
  const base = process.env.BASE_URL ?? 'http://localhost:3000';
  const providers = await (await fetch(`${base}/api/auth/providers`)).json();
  if (!providers.email) return t.skip("connexion par email non configurée sur ce serveur");

  const { createHash, randomBytes } = await import('node:crypto');
  const known = await createUser('mailuser'); // volontaire créé à l'avance (ancien bénévole)
  const email = `${known.id}@test.invalid`;

  // 1. demande de lien : redirection vers la page "regardez vos emails" + jeton enregistré
  const csrfRes = await fetch(`${base}/api/auth/csrf`);
  const { csrfToken } = await csrfRes.json();
  // comme un navigateur : pour un même nom de cookie, la dernière valeur reçue l'emporte
  const jar = new Map(csrfRes.headers.getSetCookie().map((c) => c.split(';')[0].split(/=(.*)/s).slice(0, 2)));
  const csrfCookie = [...jar].map(([k, v]) => `${k}=${v}`).join('; ');
  const ask = await fetch(`${base}/api/auth/signin/email`, {
    method: 'POST',
    redirect: 'manual',
    headers: { 'content-type': 'application/x-www-form-urlencoded', cookie: csrfCookie },
    body: new URLSearchParams({ csrfToken, email, callbackUrl: `${base}/dashboard/missions` }),
  });
  assert.ok([302, 303].includes(ask.status), `demande -> ${ask.status}`);
  assert.match(ask.headers.get('location') ?? '', /verify/, 'redirige vers /auth/verify');
  const pending = await sql`SELECT count(*)::int c FROM verification_tokens WHERE identifier = ${email}`;
  assert.equal(pending[0].c, 1);

  // 2. clic sur le lien (jeton connu : on le fabrique comme Auth.js le stocke)
  const raw = randomBytes(16).toString('hex');
  const hashed = createHash('sha256').update(`${raw}${process.env.AUTH_SECRET}`).digest('hex');
  await sql`INSERT INTO verification_tokens (identifier, token, expires) VALUES (${email}, ${hashed}, ${new Date(Date.now() + 3600_000)})`;
  const link = `${base}/api/auth/callback/email?token=${raw}&email=${encodeURIComponent(email)}&callbackUrl=${encodeURIComponent(base + '/dashboard/missions')}`;
  const click = await fetch(link, { redirect: 'manual' });
  assert.ok([302, 303].includes(click.status), `clic -> ${click.status}`);
  const cookie = click.headers.getSetCookie().map((c) => c.split(';')[0]).find((c) => c.includes('session-token'));
  assert.ok(cookie, 'cookie de session reçu');
  const session = await (await fetch(`${base}/api/auth/session`, { headers: { cookie } })).json();
  assert.equal(session.user.email, email);
  assert.equal(session.user.id, known.id, 'rattaché au compte existant, pas un doublon');

  // 3. le même lien ne marche qu'une fois
  const again = await fetch(link, { redirect: 'manual' });
  assert.match(again.headers.get('location') ?? '', /error|login/i);
  const count = await sql`SELECT count(*)::int c FROM users WHERE lower(email) = ${email.toLowerCase()}`;
  assert.equal(count[0].c, 1, 'pas de doublon de compte');
  await sql`DELETE FROM verification_tokens WHERE identifier = ${email}`;
});

test('profil incomplet : inscription refusée tant que nom, prénom et téléphone manquent', async () => {
  const newcomer = await createUser('newcomer', 'volunteer', { emptyProfile: true });
  const m = (await admin.client.post('/api/missions', mk('profil', { maxVolunteers: 5, ...slot(7) }))).data.mission;
  const refused = await newcomer.client.post(`/api/missions/${m.id}/register`);
  assert.equal(refused.status, 403);
  assert.match(refused.data.error, /profil/i);
  // une fois le profil complété, l'inscription passe
  const sync = await newcomer.client.post('/api/users/sync', { firstName: 'Marie', lastName: 'Dupont', phone: '06 12 34 56 78' });
  assert.equal(sync.status, 200);
  assert.equal((await newcomer.client.post(`/api/missions/${m.id}/register`)).status, 200);
});

test('liste d attente : le bénévole promu est prévenu', async () => {
  const a = await createUser('promoA');
  const b = await createUser('promoB');
  const m = (await admin.client.post('/api/missions', mk('promo', { maxVolunteers: 1, ...slot(8) }))).data.mission;
  assert.equal((await a.client.post(`/api/missions/${m.id}/register`)).data.onWaitlist, false);
  assert.equal((await b.client.post(`/api/missions/${m.id}/register`)).data.onWaitlist, true);
  assert.equal((await a.client.del(`/api/missions/${m.id}/register`)).status, 200);
  await new Promise((r) => setTimeout(r, 2000));
  const notifs = (await b.client.get('/api/notifications')).data.notifications;
  assert.ok(notifs.some((n) => n.missionId === m.id && /place/i.test(n.title)), 'notification de promotion reçue');
  const cur = (await admin.client.get(`/api/missions/${m.id}`)).data.mission;
  assert.deepEqual(cur.volunteers, [b.id]);
});

test('pointage : réservé aux responsables, présent/absent/effacé', async () => {
  const v = await createUser('pointe');
  const m = (await admin.client.post('/api/missions', mk('pointage', { maxVolunteers: 3, ...slot(9) }))).data.mission;
  await admin.client.post(`/api/missions/${m.id}/volunteers`, { userId: v.id });
  assert.equal((await v.client.put(`/api/missions/${m.id}/attendance`, { userId: v.id, present: true })).status, 403);
  assert.equal((await admin.client.put(`/api/missions/${m.id}/attendance`, { userId: v.id, present: true })).status, 200);
  let list = (await admin.client.get(`/api/missions/${m.id}/attendance`)).data.attendance;
  assert.deepEqual(list, [{ userId: v.id, present: true }]);
  await admin.client.put(`/api/missions/${m.id}/attendance`, { userId: v.id, present: false });
  list = (await admin.client.get(`/api/missions/${m.id}/attendance`)).data.attendance;
  assert.equal(list[0].present, false);
  await admin.client.put(`/api/missions/${m.id}/attendance`, { userId: v.id, present: null });
  assert.equal((await admin.client.get(`/api/missions/${m.id}/attendance`)).data.attendance.length, 0);
  const stranger = await createUser('inconnu');
  assert.equal((await admin.client.put(`/api/missions/${m.id}/attendance`, { userId: stranger.id, present: true })).status, 400);
});

test('import : crée les nouveaux, ignore les existants, signale les lignes invalides', async () => {
  const mail = (n) => `${RUN}_imp${n}@test.invalid`;
  const rows = [
    { firstName: 'Anne', lastName: 'Martin', email: mail(1), phone: '0611111111' },
    { firstName: 'Paul', lastName: 'Durand', email: mail(2) },
    { firstName: '', lastName: 'Sansprenom', email: mail(3) },
    { firstName: 'Doublon', lastName: 'Interne', email: mail(1) },
    { firstName: 'Déjà', lastName: 'Là', email: `${v1.id}@test.invalid` },
  ];
  assert.equal((await v1.client.post('/api/users/import', { rows })).status, 403);
  const res = await admin.client.post('/api/users/import', { rows });
  assert.equal(res.status, 200, JSON.stringify(res.data));
  assert.equal(res.data.created.length, 2);
  assert.equal(res.data.skippedExisting, 1);
  assert.equal(res.data.invalid.length, 2);
  const again = await admin.client.post('/api/users/import', { rows: [rows[0]] });
  assert.equal(again.data.created.length, 0, 'ré-import sans doublon');
});

test('rappels planifiés : refusés sans le bon secret', async () => {
  const noAuth = await anonymous.get('/api/cron/reminders');
  assert.equal(noAuth.status, 401);
  const base = process.env.BASE_URL ?? 'http://localhost:3000';
  const bad = await fetch(`${base}/api/cron/reminders`, { headers: { authorization: 'Bearer mauvais' } });
  assert.equal(bad.status, 401);
});

test('je ne peux plus venir : place libérée à moins de 24 h, responsables prévenus, appel urgent', async () => {
  const leaver = await createUser('partant');
  const candidate = await createUser('candidat');
  const soon = new Date(Date.now() + 5 * 3600_000);
  const m = (
    await admin.client.post('/api/missions', mk('urgence', { startDate: soon.toISOString(), endDate: new Date(+soon + 3600_000).toISOString(), maxVolunteers: 2 }))
  ).data.mission;
  await admin.client.post(`/api/missions/${m.id}/volunteers`, { userId: leaver.id });

  assert.equal((await leaver.client.del(`/api/missions/${m.id}/register`)).status, 400, 'désinscription simple fermée à moins de 24 h');
  assert.equal((await candidate.client.post(`/api/missions/${m.id}/release`)).status, 400, 'un non-inscrit ne peut pas se désister');

  const res = await leaver.client.post(`/api/missions/${m.id}/release`);
  assert.equal(res.status, 200, JSON.stringify(res.data));
  assert.equal(res.data.urgent, true);
  assert.equal(res.data.spotsLeft, 2);

  const cur = (await admin.client.get(`/api/missions/${m.id}`)).data.mission;
  assert.equal(cur.volunteers.includes(leaver.id), false);
  assert.equal(cur.isUrgent, true, 'la mission passe en urgent');

  await new Promise((r) => setTimeout(r, 3000));
  const adminNotifs = (await admin.client.get('/api/notifications')).data.notifications;
  assert.ok(adminNotifs.some((n) => n.missionId === m.id && n.type === 'volunteer_withdrawal'), 'responsables prévenus');
  const candNotifs = (await candidate.client.get('/api/notifications')).data.notifications;
  assert.ok(candNotifs.some((n) => n.missionId === m.id && n.type === 'urgent_call'), 'appel urgent reçu par un bénévole disponible');
  const leaverNotifs = (await leaver.client.get('/api/notifications')).data.notifications;
  assert.equal(leaverNotifs.some((n) => n.type === 'urgent_call'), false, 'le partant n est pas sollicité');
});

test('créneaux en série : création groupée, droits et validations', async () => {
  const slots = [0, 1, 2].map((d) => slot(10 + d, 14, 4));
  const body = { title: `${RUN} Série`, description: 'Accueil', category: `${RUN}_cat`, location: 'Salle', maxVolunteers: 3, status: 'published', slots };
  assert.equal((await v1.client.post('/api/missions/series', body)).status, 403, 'un bénévole ne crée pas de série');
  assert.equal((await resp.client.post('/api/missions/series', { ...body, category: 'Accueil VIP' })).status, 403, 'responsable : seulement ses catégories');

  const res = await admin.client.post('/api/missions/series', body);
  assert.equal(res.status, 201, JSON.stringify(res.data));
  assert.equal(res.data.created, 3);
  const list = (await admin.client.get('/api/missions?scope=all')).data.missions.filter((m) => m.title === body.title);
  assert.equal(list.length, 3);
  assert.ok(list.every((m) => m.status === 'published' && m.maxVolunteers === 3));

  const reversed = { ...body, slots: [{ startDate: slots[0].endDate, endDate: slots[0].startDate }] };
  assert.equal((await admin.client.post('/api/missions/series', reversed)).status, 400, 'créneau inversé refusé');
  const tooMany = { ...body, slots: Array.from({ length: 101 }, () => slots[0]) };
  assert.equal((await admin.client.post('/api/missions/series', tooMany)).status, 400, 'plus de 100 créneaux refusé');
});
