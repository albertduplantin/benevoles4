/**
 * Helper functions pour la gestion des catégories
 * Gère la conversion entre IDs Firestore et values textuelles
 */

import { getGroupedCategories } from '@/lib/api/categories';
import { User, UserClient } from '@/types';

// Cache pour éviter de charger les catégories à chaque fois
let categoriesCache: Array<{ id: string; value: string }> | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Récupérer le mapping ID -> value des catégories (avec cache)
 */
async function getCategoryMapping(): Promise<Array<{ id: string; value: string }>> {
  const now = Date.now();
  
  // Utiliser le cache si valide
  if (categoriesCache && (now - cacheTimestamp) < CACHE_DURATION) {
    return categoriesCache;
  }
  
  // Charger depuis Firestore
  const grouped = await getGroupedCategories();
  categoriesCache = grouped.flatMap(g => 
    g.categories.map(cat => ({ id: cat.id, value: cat.value }))
  );
  cacheTimestamp = now;
  
  return categoriesCache;
}

/**
 * Vérifier si un utilisateur est responsable d'une catégorie
 * Gère la conversion entre IDs Firestore et values textuelles
 */
export async function isUserResponsibleForCategoryValue(
  user: User | UserClient | null,
  categoryValue: string
): Promise<boolean> {
  if (!user) return false;
  if (user.role === 'admin') return true;
  
  if (user.role === 'category_responsible' && user.responsibleForCategories) {
    // Charger le mapping ID -> value
    const mapping = await getCategoryMapping();
    
    // Convertir les IDs de l'utilisateur en values
    const userCategoryValues = user.responsibleForCategories
      .map(id => mapping.find(m => m.id === id)?.value)
      .filter(Boolean) as string[];
    
    // Vérifier si la catégorie recherchée est dans les catégories de l'utilisateur
    return userCategoryValues.includes(categoryValue);
  }
  
  return false;
}

/**
 * Invalider le cache (à appeler après création/modification de catégories)
 */
export function invalidateCategoryCache(): void {
  categoriesCache = null;
  cacheTimestamp = 0;
}

