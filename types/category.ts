

/**
 * Catégorie de mission stockée dans Firestore
 */
export interface MissionCategoryDB {
  id: string;
  value: string; // Identifiant unique (ex: "accueil_public_pro")
  label: string; // Libellé affiché (ex: "Accueil public et professionnels")
  group: string; // Groupe parent (ex: "Accueil public et professionnels")
  order: number; // Ordre d'affichage dans le groupe
  active: boolean; // Catégorie active ou archivée
  createdAt: Date;
  updatedAt?: Date;
  createdBy: string; // UID de l'admin qui a créé
}

export type MissionCategoryClient = Omit<MissionCategoryDB, 'createdAt' | 'updatedAt'> & {
  createdAt: Date;
  updatedAt?: Date;
};

/**
 * Groupe de catégories
 */
export interface CategoryGroup {
  id: string;
  name: string;
  order: number;
  active: boolean;
}

