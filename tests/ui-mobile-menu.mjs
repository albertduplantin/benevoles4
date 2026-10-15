// Menu mobile : le bouton « Se déconnecter » doit être visible et cliquable à l'écran,
// pour un bénévole comme pour un admin (le menu admin est le plus long).
import { chromium } from 'playwright-core';
import { encode } from 'next-auth/jwt';
import { createUser, cleanup, BASE_URL } from './helpers.mjs';

const cookieName = BASE_URL.startsWith('https') ? '__Secure-authjs.session-token' : 'authjs.session-token';
const roles = [
  ['bénévole', 'volunteer'],
  ['admin', 'admin'],
];
const sizes = [
  ['petit téléphone', { width: 360, height: 640 }],
  ['téléphone', { width: 390, height: 844 }],
];

let browser;
try {
  browser = await chromium.launch({ channel: 'msedge' });
  for (const [roleLabel, role] of roles) {
    const user = await createUser(`menu${role}`, role);
    const value = await encode({
      token: { sub: user.id, name: 'Menu', email: `${user.id}@test.invalid` },
      secret: process.env.AUTH_SECRET, salt: cookieName,
    });
    for (const [sizeLabel, viewport] of sizes) {
      const ctx = await browser.newContext({ viewport });
      await ctx.addCookies([{ name: cookieName, url: BASE_URL, httpOnly: true, value }]);
      const page = await ctx.newPage();
      await page.goto(`${BASE_URL}/dashboard/missions`, { waitUntil: 'load', timeout: 90000 });
      await page.waitForTimeout(4000);

      await page.locator('header button:has(svg.lucide-menu)').first().click();
      const logout = page.getByRole('button', { name: /se déconnecter/i }).first();
      await logout.waitFor({ state: 'attached', timeout: 10000 });
      await page.waitForTimeout(500);

      // visible à l'écran ET réellement cliquable (rien ne le recouvre)
      const state = await logout.evaluate((el) => {
        const r = el.getBoundingClientRect();
        const x = r.left + r.width / 2;
        const y = r.top + r.height / 2;
        const top = document.elementFromPoint(x, y);
        return {
          inViewport: r.top >= 0 && r.bottom <= window.innerHeight && r.width > 0,
          clickable: !!top && (el === top || el.contains(top)),
          bottom: Math.round(r.bottom),
          vh: window.innerHeight,
        };
      });
      const ok = state.inViewport && state.clickable;
      if (!ok) process.exitCode = 1;
      console.log(`${ok ? '✔' : '✖'} ${roleLabel.padEnd(8)} ${sizeLabel.padEnd(16)} bas du bouton: ${state.bottom}px / écran ${state.vh}px${state.clickable ? '' : ' (recouvert)'}`);
      await ctx.close();
    }
  }
} finally {
  await browser?.close();
  await cleanup();
}
