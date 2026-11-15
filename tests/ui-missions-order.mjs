// Page Missions : ordre chronologique, titres de jour, missions sans date à la fin, passées masquées sauf case cochée.
import { chromium } from 'playwright-core';
import { encode } from 'next-auth/jwt';
import { createUser, cleanup, slot, sql, BASE_URL, RUN } from './helpers.mjs';

const cookieName = BASE_URL.startsWith('https') ? '__Secure-authjs.session-token' : 'authjs.session-token';
const admin = await createUser('chefordre', 'admin');
const fail = (msg) => { console.log('✖', msg); process.exitCode = 1; };

let browser;
try {
  const make = async (title, extra) =>
    (await admin.client.post('/api/missions', {
      title: `${RUN} ${title}`, description: 'Test', category: 'Accueil VIP', type: 'scheduled', location: 'Salle',
      maxVolunteers: 3, status: 'published', ...extra,
    })).data.mission;

  // créées volontairement dans le désordre
  const lateSlot = slot(9);
  const late = await make('C-tard', { ...lateSlot, endDate: new Date(Date.parse(lateSlot.endDate) + 2 * 86400000).toISOString() }); // sur 3 jours
  const early = await make('A-tot', slot(3, 9));
  const sameDay = await make('B-meme-jour', slot(3, 15));
  const past = await make('Z-passee', slot(5));
  await sql`UPDATE missions SET start_date = now() - interval '3 days', end_date = now() - interval '3 days' + interval '2 hours' WHERE id = ${past.id}`;
  const none = (await admin.client.post('/api/missions', {
    title: `${RUN} D-continue`, description: 'Test', category: 'Accueil VIP', type: 'ongoing', location: 'Salle',
    maxVolunteers: 3, status: 'published',
  })).data.mission;

  browser = await chromium.launch({ channel: 'msedge' });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await ctx.addCookies([{ name: cookieName, url: BASE_URL, httpOnly: true,
    value: await encode({ token: { sub: admin.id, name: 'Chef', email: `${admin.id}@test.invalid` }, secret: process.env.AUTH_SECRET, salt: cookieName }) }]);
  const page = await ctx.newPage();
  await page.goto(`${BASE_URL}/dashboard/missions`, { waitUntil: 'load', timeout: 90000 });
  await page.getByPlaceholder(/rechercher/i).fill(RUN); // ne garde que nos missions de test
  await page.getByText(`${RUN} A-tot`).waitFor({ timeout: 40000 });

  const titles = async () => (await page.locator('article h3').allInnerTexts()).map((t) => t.replace(`${RUN} `, ''));

  const order = await titles();
  if (order.join() !== 'A-tot,B-meme-jour,C-tard,D-continue') throw new Error(`ordre inattendu : ${order.join(', ')}`);
  console.log('✔ ordre chronologique, sans date à la fin, terminée masquée :', order.join(' > '));

  const lateCard = await page.locator('article', { hasText: 'C-tard' }).innerText();
  const earlyCard = await page.locator('article', { hasText: 'A-tot' }).innerText();
  if (!lateCard.includes('→')) throw new Error('la date de fin d’une mission sur plusieurs jours n’est pas affichée');
  if (earlyCard.includes('→')) throw new Error('une mission d’un seul jour ne doit pas afficher de date de fin');
  console.log('✔ mission sur plusieurs jours : date de fin affichée (« → »), pas pour un seul jour');

  const headings =await page.locator('section h2').allInnerTexts();
  if (headings.length !== 3) throw new Error(`3 titres attendus (2 jours + sans date), reçu : ${headings.join(' | ')}`);
  if (!/sans date/i.test(headings[2])) throw new Error('titre « sans date » absent');
  console.log('✔ un titre par jour :', headings.join(' | '));

  await page.getByLabel(/afficher les missions terminées/i).check();
  const withPast = await titles();
  if (withPast.join() !== 'A-tot,B-meme-jour,C-tard,D-continue,Z-passee') throw new Error(`avec terminées : ${withPast.join(', ')}`);
  if (!(await page.getByText('Missions terminées', { exact: true }).count())) throw new Error('séparateur « Missions passées » absent');
  console.log('✔ case cochée : la mission terminée apparaît tout à la fin');
} catch (error) {
  fail(error.message);
} finally {
  await browser?.close();
  await cleanup();
}
