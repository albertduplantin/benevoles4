// Carte « Notifications aux bénévoles » dans un vrai navigateur : l'interrupteur s'applique tout de suite,
// la réactivation demande confirmation, et « M'envoyer un exemple » fonctionne sans rien marquer comme envoyé.
import { chromium } from 'playwright-core';
import { encode } from 'next-auth/jwt';
import { createUser, cleanup, slot, BASE_URL, RUN } from './helpers.mjs';

const cookieName = BASE_URL.startsWith('https') ? '__Secure-authjs.session-token' : 'authjs.session-token';
const admin = await createUser('chefpause', 'admin');
const volunteer = await createUser('attendpause');
const original = (await admin.client.get('/api/settings')).data.settings;
const fail = (msg) => { console.log('✖', msg); process.exitCode = 1; };

let browser;
try {
  await admin.client.put('/api/settings', { registrationsBlocked: false, notificationsPaused: true });
  const mission = (
    await admin.client.post('/api/missions', {
      title: `${RUN} Pause UI`, description: 'Test', category: 'Accueil VIP', type: 'scheduled', location: 'Salle',
      maxVolunteers: 3, status: 'published', ...slot(6),
    })
  ).data.mission;
  await admin.client.post(`/api/missions/${mission.id}/volunteers`, { userId: volunteer.id }); // en pause : à prévenir

  browser = await chromium.launch({ channel: 'msedge' });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await ctx.addCookies([{ name: cookieName, url: BASE_URL, httpOnly: true,
    value: await encode({ token: { sub: admin.id, name: 'Chef', email: `${admin.id}@test.invalid` }, secret: process.env.AUTH_SECRET, salt: cookieName }) }]);
  const page = await ctx.newPage();
  const dialogs = [];
  page.on('dialog', (d) => { dialogs.push(d.message()); d.accept(); });

  await page.goto(`${BASE_URL}/dashboard/overview`, { waitUntil: 'load', timeout: 90000 });
  const card = page.locator('div', { has: page.getByText('Notifications aux bénévoles', { exact: true }) }).last();
  await page.getByText('Notifications aux bénévoles', { exact: true }).waitFor({ timeout: 40000 });
  const sw = page.locator('#pause-notifications');

  // 1. état de départ : en pause
  if ((await sw.getAttribute('aria-checked')) !== 'true') throw new Error('devrait démarrer en pause');
  if (!(await page.getByText('En pause', { exact: true }).count())) throw new Error('libellé « En pause » absent');
  console.log('✔ la carte s\'affiche, notifications en pause');

  // 2. compteur « pas encore prévenus » visible
  const text = await page.locator('main').innerText();
  if (!/pas encore reçu de message/.test(text)) throw new Error('compteur des bénévoles à prévenir absent');
  console.log('✔ le compteur des bénévoles à prévenir est affiché');

  // 3. exemple envoyé à l'admin lui-même, sans rien marquer
  const before = (await admin.client.get('/api/notifications/pending')).data.volunteers;
  await page.getByRole('button', { name: /m.envoyer un exemple/i }).click();
  await page.getByText(/exemple envoyé/i).waitFor({ timeout: 20000 });
  const afterSample = (await admin.client.get('/api/notifications/pending')).data.volunteers;
  if (afterSample !== before) throw new Error(`l'exemple a marqué des bénévoles comme prévenus (${before} -> ${afterSample})`);
  console.log('✔ « M\'envoyer un exemple » : envoyé, et personne n\'est marqué comme prévenu');

  // 4. réactivation : confirmation demandée, puis effet immédiat en base
  await sw.click();
  await page.getByText('Actives', { exact: true }).waitFor({ timeout: 15000 });
  if (!dialogs.some((d) => /Réactiver les notifications/.test(d))) throw new Error('pas de confirmation à la réactivation');
  if ((await admin.client.get('/api/settings')).data.settings.notificationsPaused !== false) throw new Error('réglage non enregistré');
  console.log('✔ réactivation : confirmation demandée, réglage enregistré tout de suite');

  // 5. remise en pause : immédiat, sans confirmation
  await sw.click();
  await page.getByText('En pause', { exact: true }).waitFor({ timeout: 15000 });
  if ((await admin.client.get('/api/settings')).data.settings.notificationsPaused !== true) throw new Error('mise en pause non enregistrée');
  console.log('✔ remise en pause : immédiate');
} catch (error) {
  fail(error.message);
} finally {
  await admin.client.put('/api/settings', {
    registrationsBlocked: original.registrationsBlocked,
    registrationBlockedMessage: original.registrationBlockedMessage ?? '',
    notificationsPaused: original.notificationsPaused,
  });
  await browser?.close();
  await cleanup();
}
