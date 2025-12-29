# Refactoring : Responsables de Catégories

## 🎯 Objectif
Remplacer le système de **responsables par mission** par un système de **responsables par catégorie** plus simple et centralisé.

## ✅ Ce qui est fait (Phase 1)

### 1. Modèles TypeScript
- ✅ Nouveau type `CategoryResponsible`
- ✅ Mise à jour de `UserRole` : `mission_responsible` → `category_responsible`
- ✅ Ajout du champ `responsibleForCategories?: string[]` dans `User`
- ✅ Type client `CategoryResponsibleClient`

### 2. Firebase Backend
- ✅ Nouvelle collection `categoryResponsibles`
- ✅ Fonctions CRUD complètes dans `lib/firebase/category-responsibles.ts` :
  - `assignCategoryResponsible()` - Assigner un responsable
  - `removeCategoryResponsible()` - Retirer un responsable
  - `getCategoryResponsible()` - Obtenir le responsable d'une catégorie
  - `getAllCategoryResponsibles()` - Liste complète
  - `getUserResponsibleCategories()` - Catégories d'un utilisateur
  - `isUserResponsibleForCategory()` - Vérification

### 3. Système de Permissions
- ✅ Fichier `lib/utils/permissions.ts` refactorisé :
  - `isCategoryResponsible()` - Vérifier le rôle
  - `isResponsibleForCategory()` - Vérifier pour une catégorie spécifique
  - `canEditMission()` - Basé sur la catégorie maintenant
  - `canViewMissionContacts()` - Adapté aux catégories
  - `canCreateMissionForCategory()` - Nouvelle fonction

### 4. Interface Admin
- ✅ Page complète `/dashboard/admin/category-responsibles`
- ✅ Vue par groupe de catégories
- ✅ Statistiques (Total, Assignées, Sans responsable)
- ✅ Assignation avec sélection de catégorie + bénévole
- ✅ Retrait avec confirmation
- ✅ Mise à jour automatique du rôle utilisateur

### 5. Header & Navigation
- ✅ Mise à jour des rôles dans le header
- ✅ Nouveau lien "Responsables" pour les admins
- ✅ Affichage correct du rôle "Responsable" au lieu de "Responsable de mission"

### 6. Règles Firestore
- ✅ Mise à jour de `isResponsible()` → `isCategoryResponsible()`
- ✅ Simplification des règles pour missions (plus de `responsibles[]` à vérifier)
- ✅ Nouvelle collection `categoryResponsibles` avec règles appropriées
- ✅ Suppression des fonctions de postulation (deprecated)

## 🔄 Ce qu'il reste à faire (Phase 2)

### 1. Dashboard Responsable
- [ ] Modifier `/dashboard/page.tsx` pour afficher les catégories assignées
- [ ] Remplacer "Missions que je coordonne" par "Mes catégories"
- [ ] Afficher la liste des missions par catégorie

### 2. Création/Édition de Missions
- [ ] Adapter `components/features/missions/mission-form.tsx`
- [ ] Supprimer la section "Responsables de mission"
- [ ] Afficher automatiquement le responsable de catégorie (en read-only)
- [ ] Limiter la création aux catégories dont l'utilisateur est responsable

### 3. Page de Détails Mission
- [ ] Modifier `/dashboard/missions/[id]/page.tsx`
- [ ] Afficher le responsable de catégorie au lieu des responsables de mission
- [ ] Supprimer le bouton "Devenir responsable"

### 4. Nettoyage Code Ancien Système
- [ ] Supprimer `lib/firebase/mission-responsibles.ts`
- [ ] Supprimer les composants de postulation
- [ ] Nettoyer les champs `responsibles[]` et `pendingResponsibles[]` des missions
- [ ] Supprimer la collection `volunteerRequests` (ou la marquer deprecated)

### 5. Mise à jour des Affichages
- [ ] Calendrier : Adapter les badges pour les responsables de catégorie
- [ ] Liste des missions : Afficher le responsable de catégorie
- [ ] Dashboard admin : Supprimer les demandes de responsabilité en attente

### 6. Migration des Données
- [ ] Script de migration pour les missions existantes
- [ ] Conversion des anciens responsables vers le nouveau système
- [ ] Nettoyage des anciennes collections

## 📚 Utilisation

### Pour l'Admin

```typescript
// Assigner un responsable
await assignCategoryResponsible(
  'accueil_public_pro',  // categoryId
  'Accueil public et professionnels',  // categoryLabel
  'user123',  // responsibleId
  'admin456'  // adminId
);

// Retirer un responsable
await removeCategoryResponsible('accueil_public_pro');

// Liste complète
const assignments = await getAllCategoryResponsibles();
```

### Pour les Permissions

```typescript
// Vérifier si un utilisateur peut éditer une mission
const canEdit = canEditMission(user, mission.category);

// Vérifier si un utilisateur est responsable d'une catégorie
const isResponsible = isResponsibleForCategory(user, 'bar_restauration');
```

## 🗂️ Structure des Données

### Collection `categoryResponsibles`
```typescript
{
  id: "auto-generated",
  categoryId: "accueil_public_pro",
  categoryLabel: "Accueil public et professionnels",
  responsibleId: "user123",
  assignedBy: "admin456",
  assignedAt: Timestamp
}
```

### User
```typescript
{
  ...
  role: "category_responsible",
  responsibleForCategories: ["accueil_public_pro", "bar_restauration"]
}
```

## 🚀 Avantages du Nouveau Système

1. **Simplicité** : Plus de workflow de validation
2. **Centralisation** : Gestion admin unique
3. **Clarté** : Un responsable = une catégorie
4. **Performance** : Moins de requêtes Firestore
5. **Scalabilité** : Facile d'ajouter des catégories
6. **UX** : Compréhension immédiate pour les bénévoles

## ⚠️ Points d'Attention

- Les responsables de catégorie peuvent créer/éditer/supprimer TOUTES les missions de leur catégorie
- Un seul responsable par catégorie (pas de co-responsabilité)
- Les admins gardent tous les pouvoirs sur toutes les missions
- Le champ `responsibles[]` dans Mission est maintenant deprecated

## 🧪 Tests à Effectuer

1. **Admin** :
   - [ ] Assigner un responsable à une catégorie
   - [ ] Retirer un responsable
   - [ ] Vérifier la mise à jour du rôle utilisateur

2. **Responsable de Catégorie** :
   - [ ] Voir "Mes catégories" dans le dashboard
   - [ ] Créer une mission dans sa catégorie
   - [ ] Éditer une mission de sa catégorie
   - [ ] Ne PAS pouvoir éditer une mission d'une autre catégorie

3. **Bénévole** :
   - [ ] Voir le responsable de catégorie sur une mission
   - [ ] Ne PAS voir l'option "Devenir responsable"

## 📝 Notes de Migration

Les anciens champs `responsibles` et `pendingResponsibles` dans Mission restent présents pour compatibilité mais ne sont plus utilisés. Ils seront supprimés dans une version ultérieure après migration complète des données.























