// Les exports Excel et PDF se chargent au clic (chargement différé) : on vérifie qu'ils produisent
// bien un fichier téléchargé, dans un vrai navigateur.
import { chromium } from 'playwright-core';
import { encode } from 'next-auth/jwt';
import { createUser, cleanup, slot, BASE_URL, RUN } from './helpers.mjs';

const cookieName = BASE_URL.startsWith('https') ? '__Secure-authjs.session-token' : 'authjs.session-token';
const admin = await createUser('exporteur', 'admin');
const volunteer = await createUser('inscrit');
const mission = (
  await admin.client.post('/api/missions', {
    title: `${RUN} Export`, description: 'Test export', category: 'Accueil VIP', type: 'scheduled', location: 'Salle',
    maxVolunteers: 3, status: 'published', ...slot(2),
  })
).data.mission;
await admin.client.post(`/api/missions/${mission.id}/volunteers`, { userId: volunteer.id });

let browser;
try {
  browser = await chromium.launch({ channel: 'msedge' });
  const ctx = await browser.newContext({ acceptDownloads: true });
  await ctx.addCookies([{ name: cookieName, url: BASE_URL, httpOnly: true,
    value: await encode({ token: { sub: admin.id, name: 'Exporteur', email: `${admin.id}@test.invalid` }, secret: process.env.AUTH_SECRET, salt: cookieName }) }]);
  const page = await ctx.newPage();

  for (const [format, extension] of [['Excel', /\.xlsx$/], ['PDF', /\.pdf$/]]) {
    await page.goto(`${BASE_URL}/dashboard/missions/${mission.id}`, { waitUntil: 'load', timeout: 90000 });
    await page.getByRole('button', { name: /exporter/i }).first().click({ timeout: 30000 });
    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 60000 }),
      page.getByRole('menuitem', { name: new RegExp(format, 'i') }).first().click(),
    ]);
    const name = download.suggestedFilename();
    if (!extension.test(name)) throw new Error(`export ${format} : fichier inattendu « ${name} »`);
    console.log(`✔ export ${format} : ${name}`);
  }
} catch (error) {
  console.log('✖', error.message);
  process.exitCode = 1;
} finally {
  await browser?.close();
  await cleanup();
}
