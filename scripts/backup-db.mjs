// Sauvegarde de toutes les tables dans un fichier JSON horodaté.
// Usage : npm run backup   (écrit dans le dossier backups/, ignoré par git)
import { neon } from '@neondatabase/serverless';
import fs from 'fs';

const sql = neon(process.env.DATABASE_URL);
const tables = await sql`select table_name from information_schema.tables where table_schema = 'public' order by 1`;
const dump = { createdAt: new Date().toISOString(), tables: {} };
for (const { table_name } of tables) {
  dump.tables[table_name] = await sql.query(`select * from "${table_name}"`);
}
fs.mkdirSync('backups', { recursive: true });
const file = `backups/sauvegarde-${dump.createdAt.slice(0, 19).replace(/[:T]/g, '-')}.json`;
fs.writeFileSync(file, JSON.stringify(dump, null, 2));
const counts = Object.entries(dump.tables)
  .map(([t, rows]) => `${t}: ${rows.length}`)
  .join(', ');
console.log(`Sauvegarde écrite : ${file}`);
console.log(counts);
