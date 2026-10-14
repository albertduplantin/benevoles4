// Captures d'écran de l'interface (Edge installé, pas de téléchargement de navigateur).
// Usage : node --env-file=.env.local tests/screenshots.mjs <dossier de sortie>
import { chromium } from 'playwright-core';
import { encode } from 'next-auth/jwt';
import { createUser, cleanup, slot, BASE_URL, RUN } from './helpers.mjs';

const out = process.argv[2] ?? '.';
const admin = await createUser('Camille', 'admin');
const cat = ['Accueil VIP', 'Bar / Restauration générale', 'Logistique & technique'];
const specs = [
  ['Accueil des invités à la cérémonie d’ouverture', 0, 18, cat[0], 4, true],
  ['Service au bar du festival', 0, 20, cat[1], 3, false],
  ['Installation des salles de projection', 1, 9, cat[2], 6, false],
  ['Accueil des réalisateurs', 1, 14, cat[0], 2, false],
];
const ids = [];
for (const [title, d, h, category, max, urgent] of specs) {
  const r = await admin.client.post('/api/missions', {
    title: `${RUN} ${title}`, description: 'Mission de démonstration', category, type: 'scheduled',
    location: 'Cinéma Les Korrigans', maxVolunteers: max, status: 'published', isUrgent: urgent, ...slot(d, h, 3),
  });
  ids.push(r.data.mission.id);
}
await admin.client.post(`/api/missions/${ids[1]}/volunteers`, { userId: admin.id });

const browser = await chromium.launch({ channel: 'msedge' });
const cookie = {
  name: 'authjs.session-token', url: BASE_URL, httpOnly: true,
  value: await encode({ token: { sub: admin.id, name: 'Camille', email: `${admin.id}@test.invalid` }, secret: process.env.AUTH_SECRET, salt: 'authjs.session-token' }),
};
const shots = [
  ['home-desktop', { width: 1280, height: 800 }, '/', false],
  ['login-mobile', { width: 390, height: 844 }, '/auth/login', false],
  ['missions-desktop', { width: 1280, height: 900 }, '/dashboard/missions', true],
  ['missions-mobile', { width: 390, height: 844 }, '/dashboard/missions', true],
];
for (const [name, viewport, path, auth] of shots) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: 1 });
  if (auth) await ctx.addCookies([cookie]);
  const page = await ctx.newPage();
  await page.goto(BASE_URL + path, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${out}/${name}.png` });
  await ctx.close();
}
await browser.close();
await cleanup();
console.log('ok');
