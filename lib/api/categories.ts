import type { MissionCategoryClient } from '@/types';
import { api } from './http';

export async function getActiveCategories(): Promise<MissionCategoryClient[]> {
  const { categories } = await api<{ categories: MissionCategoryClient[] }>('/api/categories');
  return categories;
}

export async function getAllCategories(): Promise<MissionCategoryClient[]> {
  const { categories } = await api<{ categories: MissionCategoryClient[] }>('/api/categories?all=true');
  return categories;
}

export async function getCategoryById(categoryId: string): Promise<MissionCategoryClient | null> {
  try {
    const { category } = await api<{ category: MissionCategoryClient }>(`/api/categories/${encodeURIComponent(categoryId)}`);
    return category;
  } catch (error: any) {
    if (/introuvable/i.test(error.message)) return null;
    throw error;
  }
}

export async function getGroupedCategories(): Promise<Array<{ group: string; categories: MissionCategoryClient[] }>> {
  const categories = await getActiveCategories();
  const grouped: Array<{ group: string; categories: MissionCategoryClient[] }> = [];
  for (const category of categories) {
    const existing = grouped.find((g) => g.group === category.group);
    if (existing) existing.categories.push(category);
    else grouped.push({ group: category.group, categories: [category] });
  }
  return grouped;
}

/** Retourne l'identifiant de la catégorie (identique à sa valeur) */
export async function createCategory(
  value: string,
  label: string,
  group: string,
  order: number,
  _createdBy?: string
): Promise<string> {
  const { category } = await api<{ category: MissionCategoryClient }>('/api/categories', {
    method: 'POST',
    body: { value, label, group, order },
  });
  return category.id;
}

export async function updateCategory(
  categoryId: string,
  updates: Partial<Pick<MissionCategoryClient, 'label' | 'group' | 'order' | 'active'>>
): Promise<void> {
  await api(`/api/categories/${encodeURIComponent(categoryId)}`, { method: 'PATCH', body: updates });
}

export async function archiveCategory(categoryId: string): Promise<void> {
  await updateCategory(categoryId, { active: false });
}

export async function deleteCategory(categoryId: string): Promise<void> {
  await api(`/api/categories/${encodeURIComponent(categoryId)}`, { method: 'DELETE' });
}

export async function isCategoryUsed(categoryValue: string): Promise<boolean> {
  try {
    const { used } = await api<{ used: boolean }>(`/api/categories/${encodeURIComponent(categoryValue)}?used=true`);
    return used;
  } catch {
    return false;
  }
}
