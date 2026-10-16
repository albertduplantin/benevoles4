// Parcours bénévole dans un vrai navigateur (téléphone) : la prochaine mission s'affiche en grand,
// et à moins de 24 h le bouton devient « Je ne peux plus venir » (désistement + appel urgent).
import { chromium } from 'playwright-core';
import { encode } from 'next-auth/jwt';
import { createUser, cleanup, BASE_URL, RUN } from './helpers.mjs';

const cookieName = BASE_URL.startsWith('https') ? '__Secure-authjs.session-token' : 'authjs.session-token';
const fail = (msg) => { console.log('✖', msg); process.exitCode = 1; };

const admin = await createUser('chef', 'admin');
const volunteer = await createUser('benevole');
const soon = new Date(Date.now() + 5 * 3600_000);
const later = new Date(Date.now() + 5 * 24 * 3600_000);
const make = async (title, start, extra = {}) =>
  (await admin.client.post('/api/missions', {
    title: `${RUN} ${title}`, description: 'Test', category: 'Accueil VIP', type: 'scheduled', location: 'Cinéma Les Korrigans',
    maxVolunteers: 3, status: 'published', startDate: start.toISOString(), endDate: new Date(+start + 7200_000).toISOString(), ...extra,
  })).data.mission;
const imminent = await make('Mission imminente', soon);
const distant = await make('Mission lointaine', later);
await admin.client.post(`/api/missions/${imminent.id}/volunteers`, { userId: volunteer.id });
await admin.client.post(`/api/missions/${distant.id}/volunteers`, { userId: volunteer.id });

let browser;
try {
  browser = await chromium.launch({ channel: 'msedge' });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await ctx.addCookies([{ name: cookieName, url: BASE_URL, httpOnly: true,
    value: await encode({ token: { sub: volunteer.id, name: 'Benevole', email: `${volunteer.id}@test.invalid` }, secret: process.env.AUTH_SECRET, salt: cookieName }) }]);
  const page = await ctx.newPage();
  page.on('dialog', (d) => d.accept()); // confirmation « Vous ne pouvez plus venir ? »

  await page.goto(`${BASE_URL}/dashboard/missions`, { waitUntil: 'load', timeout: 90000 });
  await page.getByText('Votre prochaine mission').waitFor({ timeout: 30000 });
  const card = page.locator('section', { hasText: 'Votre prochaine mission' });
  const text = await card.innerText();
  if (!/Aujourd.hui|Demain/.test(text)) throw new Error(`jour relatif absent : ${text.slice(0, 80)}`);
  if (!text.includes('Mission imminente')) throw new Error('la prochaine mission n\'est pas la plus proche');
  if (!(await card.getByRole('link', { name: /itinéraire/i }).count())) throw new Error('bouton Itinéraire absent');
  console.log('✔ prochaine mission affichée en grand, avec l\'itinéraire');

  const urgentBtn = page.getByRole('button', { name: /je ne peux plus venir/i });
  if ((await urgentBtn.count()) !== 1) throw new Error(`bouton « Je ne peux plus venir » : ${await urgentBtn.count()} (attendu 1, seulement la mission imminente)`);
  console.log('✔ « Je ne peux plus venir » seulement sur la mission à moins de 24 h');

  await urgentBtn.click();
  await page.waitForTimeout(3500);
  const after = (await admin.client.get(`/api/missions/${imminent.id}`)).data.mission;
  if (after.volunteers.includes(volunteer.id)) throw new Error('toujours inscrit après le désistement');
  if (!after.isUrgent) throw new Error('la mission n\'est pas passée en urgent');
  console.log('✔ désistement : place libérée et mission passée en urgent');

  const stillThere = (await admin.client.get(`/api/missions/${distant.id}`)).data.mission;
  if (!stillThere.volunteers.includes(volunteer.id)) throw new Error('l\'autre inscription a disparu');
  console.log('✔ les autres inscriptions sont conservées');
} catch (error) {
  fail(error.message);
} finally {
  await browser?.close();
  await cleanup();
}
