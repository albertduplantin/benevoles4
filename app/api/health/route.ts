import { sql } from 'drizzle-orm';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/health : vérifie que le site et la base répondent (et réveille la base si elle dormait).
 * Publique, ne renvoie aucune donnée.
 */
export async function GET() {
  const start = Date.now();
  try {
    await db.execute(sql`select 1`);
    return Response.json({ ok: true, ms: Date.now() - start }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return Response.json({ ok: false }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}
