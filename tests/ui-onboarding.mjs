// Parcours d'un nouvel arrivant dans un vrai navigateur : connecté mais sans nom ni téléphone,
// il doit être renvoyé vers « Une dernière étape », la remplir, puis arriver sur les missions.
import { chromium } from 'playwright-core';
import { encode } from 'next-auth/jwt';
import { createUser, cleanup, sql, BASE_URL } from './helpers.mjs';

const fail = (msg) => { console.log('✖', msg); process.exitCode = 1; };
const newcomer = await createUser('nouveau', 'volunteer', { emptyProfile: true });
const cookieName = BASE_URL.startsWith('https') ? '__Secure-authjs.session-token' : 'authjs.session-token';
let browser;
try {
  browser = await chromium.launch({ channel: 'msedge' });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await ctx.addCookies([{ name: cookieName, url: BASE_URL, httpOnly: true,
    value: await encode({ token: { sub: newcomer.id, email: `${newcomer.id}@test.invalid` }, secret: process.env.AUTH_SECRET, salt: cookieName }) }]);
  const page = await ctx.newPage();

  await page.goto(`${BASE_URL}/dashboard/missions`, { waitUntil: 'load', timeout: 90000 });
  await page.waitForURL(/complete-profile/, { timeout: 30000 }).catch(() => {});
  if (!page.url().includes('complete-profile')) throw new Error(`pas redirigé vers « Une dernière étape » : ${page.url()}`);
  console.log('✔ profil vide -> redirigé vers « Une dernière étape »');

  // téléphone invalide : message clair, rien n'est enregistré
  await page.fill('#firstName', 'Marie');
  await page.fill('#lastName', 'Dupont');
  await page.fill('#phone', '123');
  await page.click('button[type=submit]');
  await page.waitForTimeout(800);
  if (!(await page.locator('text=ne semble pas correct').count())) throw new Error('message de téléphone invalide absent');
  console.log('✔ téléphone invalide -> message clair');

  // saisie correcte (mise en forme automatique) -> arrive sur les missions
  await page.fill('#phone', '0612345678');
  const shown = await page.inputValue('#phone');
  if (shown !== '06 12 34 56 78') throw new Error(`mise en forme du téléphone : « ${shown} »`);
  await page.click('button[type=submit]');
  await page.waitForURL(/dashboard\/missions/, { timeout: 30000 }).catch(() => {});
  if (!page.url().includes('/dashboard/missions')) throw new Error(`pas arrivé sur les missions : ${page.url()}`);
  console.log('✔ profil rempli -> arrive sur les missions');

  const row = (await sql`SELECT first_name, last_name, phone FROM users WHERE id = ${newcomer.id}`)[0];
  if (row.first_name !== 'Marie' || row.last_name !== 'Dupont' || row.phone !== '06 12 34 56 78') throw new Error(`données en base : ${JSON.stringify(row)}`);
  console.log('✔ données enregistrées en base');

  // et on ne revient plus sur la page d'étape
  await page.goto(`${BASE_URL}/auth/complete-profile`, { waitUntil: 'load' });
  await page.waitForURL(/dashboard\/missions/, { timeout: 20000 }).catch(() => {});
  if (page.url().includes('complete-profile')) throw new Error('revient sur la page d’étape alors que le profil est complet');
  console.log('✔ profil complet -> plus de demande');
} catch (error) {
  fail(error.message);
} finally {
  await browser?.close();
  await cleanup();
}
