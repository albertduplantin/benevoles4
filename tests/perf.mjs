// Mesure de vitesse : temps de réponse (médiane de 5 appels) des pages et API principales.
// Usage : BASE_URL=https://... AUTH_SECRET=... node --env-file=.env.local tests/perf.mjs
import { createUser, cleanup, BASE_URL, RUN, slot } from './helpers.mjs';

const admin = await createUser('perf', 'admin');
const cookie = admin.client._cookie;
try {
  const m = (await admin.client.post('/api/missions', { title: `${RUN} perf`, description: 'x', category: 'Accueil VIP', type: 'scheduled', location: 'L', maxVolunteers: 5, status: 'published', ...slot(0) })).data.mission;
  const targets = [
    ['GET', '/auth/login (page publique)', '/auth/login', false],
    ['GET', '/dashboard/missions (page, connecté)', '/dashboard/missions', true],
    ['GET', 'api/missions?scope=visible', '/api/missions?scope=visible', true],
    ['GET', 'api/missions/:id', `/api/missions/${m.id}`, true],
    ['GET', 'api/users/:id (profil)', `/api/users/${admin.id}`, true],
    ['GET', 'api/notifications', '/api/notifications', true],
    ['GET', 'api/categories', '/api/categories', true],
    ['GET', 'api/settings', '/api/settings', true],
  ];
  const median = (a) => a.sort((x, y) => x - y)[Math.floor(a.length / 2)];
  console.log(`Cible : ${BASE_URL}`);
  for (const [, label, path, auth] of targets) {
    const times = [];
    for (let i = 0; i < 6; i++) {
      const t = performance.now();
      const res = await fetch(BASE_URL + path, { headers: auth ? { cookie } : {}, redirect: 'manual' });
      await res.arrayBuffer();
      if (i > 0) times.push(performance.now() - t); // le 1er appel chauffe le serveur
    }
    console.log(`${String(Math.round(median(times))).padStart(5)} ms  ${label}`);
  }
} finally { await cleanup(); }
