// Test navigateur : chaque page principale se charge sans erreur JS ni requête en échec.
// Usage : npm run test:ui (serveur lancé). Ignore les ressources tierces (ex. avatars Google).
import { chromium } from 'playwright-core';
import { encode } from 'next-auth/jwt';
import { createUser, cleanup, slot, BASE_URL, RUN } from './helpers.mjs';
const admin = await createUser('Debug', 'admin');
let browser;
try {
  const m = (await admin.client.post('/api/missions', { title: `${RUN} dbg`, description: 'd', category: 'Accueil VIP', type: 'scheduled', location: 'L', maxVolunteers: 2, status: 'published', ...slot(0) })).data.mission;
  browser = await chromium.launch({ channel: 'msedge' });
  const ctx = await browser.newContext();
  await ctx.addCookies([{ name: 'authjs.session-token', url: BASE_URL, httpOnly: true,
    value: await encode({ token: { sub: admin.id, name: 'Debug', email: `${admin.id}@test.invalid` }, secret: process.env.AUTH_SECRET, salt: 'authjs.session-token' }) }]);
  for (const path of ['/dashboard', `/dashboard/missions/${m.id}`, '/dashboard/profile', '/dashboard/preferences', '/dashboard/overview', '/dashboard/volunteers', '/dashboard/affectations', '/dashboard/missions/new', '/dashboard/admin/categories', '/dashboard/admin/category-responsibles', '/dashboard/admin/email-only', '/dashboard/admin/notifications', '/dashboard/admin/search-volunteers', '/dashboard/volunteer-call', '/dashboard/mon-planning', '/dashboard/admin/import', '/dashboard/missions/series']) {
    const page = await ctx.newPage();
    let errs = 0, first = '';
    const own = (u) => u.startsWith(BASE_URL);
    page.on('console', (msg) => { if (msg.type() === 'error' && !/Failed to load resource/.test(msg.text())) { errs++; first ||= msg.text().slice(0, 140); } });
    page.on('pageerror', (e) => { errs++; first ||= String(e).slice(0, 140); });
    page.on('response', (r) => { if (r.status() >= 400 && own(r.url())) { errs++; first ||= `${r.status()} ${r.url().replace(BASE_URL, '')}`; } });
    await page.goto(BASE_URL + path, { waitUntil: 'load', timeout: 90000 });
    await page.waitForTimeout(5000);
    const text = (await page.locator('main').first().innerText().catch(() => '')).replace(/\s+/g, ' ').slice(0, 70);
    console.log(`${errs ? '✖' : '✔'} ${path.replace(m.id, ':id')}  [${errs} err] ${first} | ${text}`);
    if (errs) process.exitCode = 1;
    await page.close();
  }
} finally { await browser?.close(); await cleanup(); }
if (process.exitCode) console.log('ÉCHEC');
