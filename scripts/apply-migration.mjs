// Applique un fichier de drizzle/ sur la base visée par DATABASE_URL (instructions séparées par « ; »).
// Usage : node --env-file=.env.local [--env-file=.env.test] scripts/apply-migration.mjs drizzle/0004_xxx.sql
import fs from 'node:fs';
import { neon } from '@neondatabase/serverless';

const file = process.argv[2];
if (!file) throw new Error('fichier manquant');
const sql = neon(process.env.DATABASE_URL);
console.log('Base visée :', new URL(process.env.DATABASE_URL).host.split('.')[0]);
const statements = fs.readFileSync(file, 'utf8').split('\n').filter((l) => !l.trim().startsWith('--')).join('\n').split(';').map((s) => s.trim()).filter(Boolean);
for (const statement of statements) {
  await sql.query(statement);
  console.log('OK :', statement.slice(0, 90).replace(/\s+/g, ' '));
}
