# 🐛 Bugfix : Responsables de Catégorie - Problème ID vs Value

**Date** : 18 octobre 2025  
**Statut** : ✅ **RÉSOLU**

---

## 🎯 Problème Identifié

### Symptômes
Les **responsables de catégorie** ne pouvaient **PAS éditer ni supprimer** les missions de leurs catégories, même s'ils étaient correctement assignés.

### Exemple Concret
- Utilisateur "test" est responsable de la catégorie "**photobooth**"
- Il crée une mission avec catégorie "photobooth"
- ❌ Il ne peut pas éditer ou supprimer cette mission
- Message : "Vous n'avez pas la permission..."

---

## 🔍 Cause Racine

### Le Problème : Deux Formats de Stockage Différents

Il y avait un **décalage de format** entre deux parties du système :

#### 1. Dans la table `users` (Firestore)
```typescript
user.responsibleForCategories = ["abc123def456"]  // IDs Firestore
```

Quand un admin assigne une catégorie à un responsable, le système stocke **l'ID du document Firestore** de la catégorie (ex: `"abc123def456"`).

#### 2. Dans la table `missions` (Firestore)
```typescript
mission.category = "photobooth"  // Value textuelle
```

Quand on crée une mission, le système stocke le **value textuel** de la catégorie (ex: `"photobooth"`), pas l'ID.

### Résultat de la Comparaison
```typescript
// Dans isResponsibleForCategory()
user.responsibleForCategories.includes(mission.category)
// Équivaut à :
["abc123def456"].includes("photobooth")
// Résultat : false ❌
```

La comparaison échouait **toujours** car on comparait un ID Firestore avec un value textuel !

---

## 🔧 Solution Appliquée

### 1. Nouveau Helper : `category-helper.ts`

Création d'un module utilitaire qui gère la **conversion ID ↔ Value** :

```typescript
// lib/utils/category-helper.ts

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
    // 1. Charger le mapping ID → value depuis Firestore
    const mapping = await getCategoryMapping();
    
    // 2. Convertir les IDs de l'utilisateur en values
    const userCategoryValues = user.responsibleForCategories
      .map(id => mapping.find(m => m.id === id)?.value)
      .filter(Boolean);
    
    // 3. Vérifier si la catégorie recherchée est présente
    return userCategoryValues.includes(categoryValue);
  }
  
  return false;
}
```

**Avantages** :
- ✅ Cache de 5 minutes pour les performances
- ✅ Conversion automatique ID → Value
- ✅ Comparaison correcte

### 2. Nouvelles Fonctions de Permissions Asynchrones

Ajout de versions **asynchrones** dans `permissions.ts` :

```typescript
// lib/utils/permissions.ts

/**
 * Version ASYNC avec conversion ID → Value
 */
export async function canEditMissionAsync(
  user: User | UserClient | null,
  missionCategory: string
): Promise<boolean> {
  if (!user) return false;
  if (user.role === 'admin') return true;
  
  return await isUserResponsibleForCategoryValue(user, missionCategory);
}

export async function canDeleteMissionAsync(
  user: User | UserClient | null,
  missionCategory: string
): Promise<boolean> {
  if (!user) return false;
  if (user.role === 'admin') return true;
  
  return await isUserResponsibleForCategoryValue(user, missionCategory);
}
```

**Note** : Les anciennes fonctions `canEditMission()` et `canDeleteMission()` sont **conservées** pour la rétrocompatibilité, mais les nouvelles versions asynchrones doivent être privilégiées.

### 3. Mise à Jour des Composants

#### Page d'Édition (`app/dashboard/missions/[id]/edit/page.tsx`)

**Avant** :
```typescript
const canEdit = canEditMission(user, missionData.category);
```

**Après** :
```typescript
const canEdit = await canEditMissionAsync(user, missionData.category);
```

#### Calendrier (`components/features/calendar/mission-calendar.tsx`)

**Avant** (calcul synchrone immédiat) :
```typescript
const canUserEdit = selectedMission && currentUser 
  ? canEditMission(currentUser, selectedMission.category) 
  : isAdmin;
```

**Après** (useEffect avec état) :
```typescript
const [canUserEdit, setCanUserEdit] = useState(false);

useEffect(() => {
  const checkPermissions = async () => {
    if (selectedMission && currentUser) {
      const canEdit = await canEditMissionAsync(currentUser, selectedMission.category);
      setCanUserEdit(canEdit);
    }
  };
  checkPermissions();
}, [selectedMission, currentUser]);
```

---

## 📊 Workflow de Vérification (Après Fix)

```
1. Utilisateur "test" clique sur "Éditer mission"
   ↓
2. canEditMissionAsync(user, "photobooth")
   ↓
3. isUserResponsibleForCategoryValue(user, "photobooth")
   ↓
4. Charger mapping depuis Firestore :
   { id: "abc123def456", value: "photobooth" }
   ↓
5. Convertir user.responsibleForCategories :
   ["abc123def456"] → ["photobooth"]
   ↓
6. Vérifier :
   ["photobooth"].includes("photobooth") → true ✅
   ↓
7. Permission accordée → Édition possible !
```

---

## 🎯 Tests Effectués

### Test 1 : Responsable de Catégorie - Édition
1. ✅ Assigner "test" comme responsable de "photobooth"
2. ✅ Créer une mission avec catégorie "photobooth"
3. ✅ Se connecter avec "test"
4. ✅ Accéder à la page d'édition
5. ✅ **Résultat** : Accès accordé, édition possible

### Test 2 : Responsable de Catégorie - Suppression
1. ✅ Cliquer sur "Supprimer" depuis la page d'édition
2. ✅ **Résultat** : Suppression autorisée

### Test 3 : Calendrier - Actions Rapides
1. ✅ Ouvrir le calendrier
2. ✅ Cliquer sur une mission de sa catégorie
3. ✅ **Résultat** : Boutons "Éditer" et "Supprimer" visibles

### Test 4 : Mission d'Autre Catégorie
1. ✅ Créer une mission avec catégorie "théâtre"
2. ✅ Se connecter avec responsable de "photobooth"
3. ✅ Essayer d'éditer la mission "théâtre"
4. ✅ **Résultat** : Accès refusé (comme attendu)

### Test 5 : Admin - Toujours Accès
1. ✅ Se connecter en tant qu'admin
2. ✅ **Résultat** : Accès à toutes les missions (aucun changement)

---

## ⚠️ Points d'Attention

### Performance
- Le helper utilise un **cache de 5 minutes** pour éviter de charger les catégories à chaque vérification
- Le cache est invalidé automatiquement après 5 minutes
- Fonction `invalidateCategoryCache()` disponible pour forcer le refresh

### Asynchronicité
- Les nouvelles fonctions sont **asynchrones** → Nécessitent `await`
- Les composants doivent gérer l'asynchronicité avec `useEffect`
- Les anciennes fonctions synchrones sont conservées mais **ne fonctionnent pas correctement** pour les responsables de catégorie

### Rétrocompatibilité
- ✅ Les anciennes fonctions `canEditMission()` et `canDeleteMission()` existent toujours
- ✅ Les admins ne sont pas affectés (toujours accès complet)
- ✅ Les bénévoles ne sont pas affectés (toujours pas d'accès)
- ⚠️ Seuls les **responsables de catégorie** bénéficient de la correction

---

## 📝 Fichiers Modifiés

### Nouveaux Fichiers
- ✅ `lib/utils/category-helper.ts` - Helper pour conversion ID/Value

### Fichiers Modifiés
- ✅ `lib/utils/permissions.ts` - Ajout de `canEditMissionAsync()` et `canDeleteMissionAsync()`
- ✅ `app/dashboard/missions/[id]/edit/page.tsx` - Utilisation des fonctions async
- ✅ `components/features/calendar/mission-calendar.tsx` - Vérification async avec useEffect

---

## 🚀 Déploiement

```bash
Commit : 4b279d4
Message : "fix: corriger le matching catégorie ID vs value pour les responsables de catégorie"
Fichiers : 4 changed, 138 insertions(+), 10 deletions(-)
Status : ✅ Déployé en production
```

---

## 💡 Leçons Apprises

### Problème Original
Le système avait **deux formats** pour représenter les catégories :
- **IDs Firestore** pour l'assignation des responsables
- **Values textuelles** pour les missions

Cette incohérence causait des échecs de comparaison silencieux.

### Solution Durable
- ✅ Helper centralisé pour gérer la conversion
- ✅ Cache pour les performances
- ✅ Fonctions asynchrones explicites
- ✅ Rétrocompatibilité préservée

### Recommandation Future
Envisager de **normaliser** le système pour utiliser **uniquement** un format (soit IDs, soit values) partout, mais cela nécessiterait une migration de données complexe.

---

## ✅ Résultat Final

Les **responsables de catégorie** peuvent maintenant :
- ✅ Éditer les missions de leurs catégories
- ✅ Supprimer les missions de leurs catégories  
- ✅ Voir les boutons d'action dans le calendrier
- ✅ Gérer leurs missions de manière autonome

**Impact** : Le système de permissions fonctionne maintenant comme prévu pour tous les types d'utilisateurs ! 🎉


















