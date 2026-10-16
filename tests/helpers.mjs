// Harnais de test API : simule des utilisateurs connectés sans passer par Google.
// On signe nous-mêmes un cookie de session Auth.js avec AUTH_SECRET.
// Toutes les données créées sont préfixées `test_` et supprimées en fin de test.
import { neon } from '@neondatabase/serverless';
import { encode } from 'next-auth/jwt';

export const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000';
const secure = BASE_URL.startsWith('https');
const COOKIE = secure ? '__Secure-authjs.session-token' : 'authjs.session-token';
const SECRET = process.env.AUTH_SECRET;
if (!SECRET) throw new Error('AUTH_SECRET manquant (lancer via npm run test:api)');

export const sql = neon(process.env.DATABASE_URL);
export const RUN = `test_${Date.now().toString(36)}`;

/** Crée un utilisateur de test en base et retourne un client HTTP authentifié */
export async function createUser(name, role = 'volunteer', extra = {}) {
  const id = `${RUN}_${name}`;
  await sql`INSERT INTO users (id, email, first_name, last_name, phone, role, name, email_only, personal_token, data_processing_consent)
            VALUES (${id}, ${`${id}@test.invalid`}, ${extra.emptyProfile ? '' : name}, ${extra.emptyProfile ? '' : 'Test'}, ${extra.emptyProfile ? '' : '0600000000'}, ${role}, ${extra.emptyProfile ? null : name}, ${extra.emailOnly ?? false}, ${extra.token ?? null}, true)`;
  const jwt = await encode({ token: { sub: id, name, email: `${id}@test.invalid` }, secret: SECRET, salt: COOKIE, maxAge: 3600 });
  return { id, client: makeClient(`${COOKIE}=${jwt}`) };
}

function makeClient(cookie) {
  const call = async (method, path, body) => {
    const res = await fetch(BASE_URL + path, {
      method,
      redirect: 'manual',
      headers: { ...(cookie && { cookie }), ...(body !== undefined && { 'content-type': 'application/json' }) },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    const text = await res.text();
    let data = null;
    try { data = JSON.parse(text); } catch {}
    return { status: res.status, data };
  };
  return {
    get: (p) => call('GET', p),
    post: (p, b = {}) => call('POST', p, b),
    put: (p, b) => call('PUT', p, b),
    patch: (p, b) => call('PATCH', p, b),
    del: (p, b) => call('DELETE', p, b),
  };
}

export const anonymous = makeClient(null);

const hour = 3600_000;
/** Dates ISO de mission relatives à demain, pour éviter la règle des 24 h */
export const slot = (offsetDays, startHour = 10, durationH = 2) => {
  const start = new Date(Date.now() + (3 + offsetDays) * 24 * hour);
  start.setUTCHours(startHour, 0, 0, 0);
  return { startDate: start.toISOString(), endDate: new Date(start.getTime() + durationH * hour).toISOString() };
};

/** Supprime toutes les données créées par ce run */
export async function cleanup() {
  const like = `${RUN}%`;
  await sql`DELETE FROM notifications WHERE user_id LIKE ${like} OR volunteer_id LIKE ${like} OR mission_id LIKE ${like} OR mission_title LIKE ${`${RUN}%`}`;
  await sql`DELETE FROM missions WHERE created_by LIKE ${like} OR title LIKE ${`${RUN}%`}`;
  await sql`DELETE FROM category_responsibles WHERE responsible_id LIKE ${like}`;
  await sql`DELETE FROM mission_categories WHERE id LIKE ${like}`;
  await sql`DELETE FROM users WHERE id LIKE ${like} OR email LIKE ${`${RUN}%@test.invalid`}`;
  await sql`DELETE FROM login_attempts WHERE email LIKE ${`${RUN}%`}`;
  await sql`UPDATE admin_settings SET registrations_blocked = false WHERE id = 'admin' AND updated_by LIKE ${like}`;
}
