// Lance le serveur de développement sur la BASE DE TEST (.env.test) au lieu de la production.
// (Next.js refuse l'option --env-file de Node : on charge le fichier nous-mêmes et on l'injecte.)
import { spawn } from 'node:child_process';
import fs from 'node:fs';

if (!fs.existsSync('.env.test')) {
  console.error('⛔ .env.test introuvable : créez-le (voir CLAUDE.md) pour ne jamais lancer sur la production.');
  process.exit(1);
}

const env = { ...process.env };
for (const line of fs.readFileSync('.env.test', 'utf8').split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m && !line.trim().startsWith('#')) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}
if (env.DATABASE_URL?.includes('ep-bitter-credit-agw7unej')) {
  console.error('⛔ DATABASE_URL de .env.test pointe vers la production.');
  process.exit(1);
}

console.log(`Serveur de test sur la base ${new URL(env.DATABASE_URL).host.split('.')[0]} (envoi d'emails simulé : ${env.EMAIL_TRANSPORT === 'json' ? 'oui' : 'NON'})`);
spawn(process.execPath, ['./node_modules/next/dist/bin/next', 'dev'], { env, stdio: 'inherit' }).on('exit', (code) => process.exit(code ?? 0));
