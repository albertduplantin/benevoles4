import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

// Créer le client Neon
const sql = neon(process.env.DATABASE_URL);

// Créer l'instance Drizzle
export const db = drizzle(sql, { schema });

// Export du schéma pour utilisation ailleurs
export * from './schema';
