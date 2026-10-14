import { api } from '@/lib/api/http';
import { UserClient } from '@/types';

/** Responsables d'une catégorie (la valeur de la catégorie sert d'identifiant) */
export async function getCategoryResponsiblesByValue(categoryValue: string): Promise<UserClient[]> {
  try {
    const { users } = await api<{ users: UserClient[] }>(
      `/api/category-responsibles?categoryId=${encodeURIComponent(categoryValue)}&withUsers=true`
    );
    return users ?? [];
  } catch (err) {
    console.error('Error getting category responsibles:', err);
    return [];
  }
}

/** Premier responsable de la catégorie, ou null */
export async function getCategoryResponsibleByValue(categoryValue: string): Promise<UserClient | null> {
  const responsibles = await getCategoryResponsiblesByValue(categoryValue);
  return responsibles[0] ?? null;
}
