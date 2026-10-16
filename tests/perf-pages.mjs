// Poids et rapidité réels des pages dans un navigateur, sur un téléphone en 4G simulée.
// Usage : BASE_URL=... AUTH_SECRET=... node --env-file=.env.local tests/perf-pages.mjs
import { chromium } from 'playwright-core';
import { encode } from 'next-auth/jwt';
import { createUser, cleanup, slot, BASE_URL, RUN } from './helpers.mjs';

const cookieName = BASE_URL.startsWith('https') ? '__Secure-authjs.session-token' : 'authjs.session-token';
const admin = await createUser('perfpages', 'admin');
let browser;
try {
  await admin.client.post('/api/missions', { title: `${RUN} perf`, description: 'x', category: 'Accueil VIP', type: 'scheduled', location: 'L', maxVolunteers: 5, status: 'published', ...slot(1) });
  browser = await chromium.launch({ channel: 'msedge' });
  const value = await encode({ token: { sub: admin.id, name: 'Perf', email: `${admin.id}@test.invalid` }, secret: process.env.AUTH_SECRET, salt: cookieName });

  for (const [label, path, auth] of [['connexion', '/auth/login', false], ['missions', '/dashboard/missions', true], ['calendrier', '/dashboard', true]]) {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true });
    if (auth) await ctx.addCookies([{ name: cookieName, url: BASE_URL, httpOnly: true, value }]);
    const page = await ctx.newPage();
    const cdp = await ctx.newCDPSession(page);
    // 4G « correcte » : 9 Mb/s descendant, 170 ms de latence
    await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 170, downloadThroughput: (9 * 1024 * 1024) / 8, uploadThroughput: (3 * 1024 * 1024) / 8 });
    const t0 = Date.now();
    await page.goto(BASE_URL + path, { waitUntil: 'load', timeout: 90000 });
    const loadMs = Date.now() - t0;
    await page.waitForLoadState('networkidle').catch(() => {});
    const stats = await page.evaluate(() => {
      const res = performance.getEntriesByType('resource');
      const js = res.filter((r) => r.name.includes('/_next/static') && r.name.endsWith('.js'));
      const fcp = performance.getEntriesByName('first-contentful-paint')[0]?.startTime ?? 0;
      return { jsKb: Math.round(js.reduce((a, r) => a + (r.transferSize || 0), 0) / 1024), jsFiles: js.length, fcp: Math.round(fcp) };
    });
    console.log(`${label.padEnd(11)} affichage ${String(stats.fcp).padStart(5)} ms · chargé ${String(loadMs).padStart(5)} ms · JS reçu ${String(stats.jsKb).padStart(4)} Ko (${stats.jsFiles} fichiers)`);
    await ctx.close();
  }
} finally { await browser?.close(); await cleanup(); }
