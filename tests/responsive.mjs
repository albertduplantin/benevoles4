// Contrôle de responsive : ouvre les pages en largeur téléphone et tablette et signale
// tout ce qui déborde horizontalement. Usage : npm run test:responsive (serveur lancé).
import { chromium } from 'playwright-core';
import { encode } from 'next-auth/jwt';
import { createUser, cleanup, slot, BASE_URL, RUN } from './helpers.mjs';

const SIZES = [
  ['téléphone', { width: 390, height: 844 }],
  ['tablette', { width: 768, height: 1024 }],
];
const out = process.argv[2]; // dossier de captures (optionnel)
const only = process.argv[3]?.split(',');

const admin = await createUser('Responsive', 'admin');
let browser;
let failures = 0;
try {
  // Données réalistes : noms et emails longs, mission avec titre long
  const people = [];
  for (let i = 0; i < 4; i++) {
    people.push(await createUser(`Bénévole-avec-un-prénom-très-long-${i}`, 'volunteer'));
  }
  const m = (
    await admin.client.post('/api/missions', {
      title: `${RUN} Accueil et orientation du public à l'entrée principale du cinéma Les Korrigans`,
      description: 'Mission de test responsive avec une description un peu longue pour vérifier les retours à la ligne.',
      category: 'Accueil VIP', type: 'scheduled', location: 'Cinéma Les Korrigans, 1 rue du Théâtre, Dinan',
      maxVolunteers: 6, status: 'published', ...slot(0),
    })
  ).data.mission;
  for (const p of people) await admin.client.post(`/api/missions/${m.id}/volunteers`, { userId: p.id });

  const pages = [
    '/dashboard', `/dashboard/missions`, `/dashboard/missions/${m.id}`, '/dashboard/missions/new',
    '/dashboard/profile', '/dashboard/preferences', '/dashboard/overview', '/dashboard/volunteers',
    '/dashboard/affectations', '/dashboard/admin/categories', '/dashboard/admin/category-responsibles',
    '/dashboard/admin/email-only', '/dashboard/admin/notifications', '/dashboard/admin/search-volunteers',
    '/dashboard/admin/import', '/dashboard/missions/series', '/dashboard/volunteer-call', '/dashboard/mon-planning', '/auth/login', '/',
  ].filter((p) => !only || only.some((o) => p.includes(o)));

  browser = await chromium.launch({ channel: 'msedge' });
  const cookieName = BASE_URL.startsWith('https') ? '__Secure-authjs.session-token' : 'authjs.session-token';
  const value = await encode({
    token: { sub: admin.id, name: 'Responsive', email: `${admin.id}@test.invalid` },
    secret: process.env.AUTH_SECRET, salt: cookieName,
  });

  for (const [label, viewport] of SIZES) {
    const ctx = await browser.newContext({ viewport });
    await ctx.addCookies([{ name: cookieName, url: BASE_URL, httpOnly: true, value }]);
    for (const path of pages) {
      const page = await ctx.newPage();
      await page.goto(BASE_URL + path, { waitUntil: 'load', timeout: 90000 });
      await page.waitForTimeout(4500);

      const report = await page.evaluate(() => {
        const vw = document.documentElement.clientWidth;
        const overflow = document.documentElement.scrollWidth - vw;
        const offenders = [];
        for (const el of document.querySelectorAll('body *')) {
          const r = el.getBoundingClientRect();
          if (r.width === 0 || r.height === 0) continue;
          // un élément qui dépasse à droite sans être dans une zone qui défile
          let scrolls = false;
          for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
            const s = getComputedStyle(p).overflowX;
            if (s === 'auto' || s === 'scroll' || s === 'hidden') { scrolls = true; break; }
          }
          if (!scrolls && r.right > vw + 1) {
            offenders.push(`${el.tagName.toLowerCase()}${el.className && typeof el.className === 'string' ? '.' + el.className.split(' ').slice(0, 3).join('.') : ''} (+${Math.round(r.right - vw)}px)`);
          }
        }
        return { overflow, offenders: offenders.slice(0, 4) };
      });

      const bad = report.overflow > 1;
      if (bad) failures++;
      console.log(`${bad ? '✖' : '✔'} ${label.padEnd(9)} ${path.replace(m.id, ':id').padEnd(42)} ${bad ? `déborde de ${report.overflow}px  ${report.offenders.join(' | ')}` : ''}`);
      if (out && bad) await page.screenshot({ path: `${out}/resp-${label}-${path.replace(/[^a-z]+/gi, '_')}.png` });
      await page.close();
    }
    await ctx.close();
  }
} finally {
  await browser?.close();
  await cleanup();
}
if (failures) { console.log(`\n${failures} page(s) avec débordement`); process.exitCode = 1; }
