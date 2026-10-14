const ISO_DATE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/;
// createdAt, updatedAt, startDate, endDate, consentDate, assignedAt, readAt, festivalStartDate...
const DATE_KEY = /(At|Date)$/;

function reviver(key: string, value: unknown) {
  if (typeof value === 'string' && DATE_KEY.test(key) && ISO_DATE.test(value)) return new Date(value);
  return value;
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
}

/**
 * Appel JSON vers l'API interne. Les champs de date ISO sont convertis en Date,
 * et les erreurs HTTP sont levées avec le message renvoyé par le serveur.
 */
export async function api<T = any>(path: string, { method = 'GET', body }: RequestOptions = {}): Promise<T> {
  const response = await fetch(path, {
    method,
    headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  });

  const text = await response.text();
  let data: any = null;
  if (text) {
    try {
      data = JSON.parse(text, reviver);
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    throw new Error(data?.error ?? `Erreur ${response.status}`);
  }
  return data as T;
}

/** Date locale ('YYYY-MM-DDTHH:mm' d'un input datetime-local) ou Date -> ISO UTC ; vide -> undefined */
export function toIso(value: Date | string | null | undefined): string | undefined {
  if (!value) return undefined;
  const date = typeof value === 'string' ? new Date(value) : value;
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}
