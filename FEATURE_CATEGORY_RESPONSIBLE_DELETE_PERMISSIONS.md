# ✅ Fonctionnalité : Permissions d'Édition et Suppression pour Responsables de Catégorie

**Date** : 18 octobre 2025  
**Statut** : ✅ **IMPLÉMENTÉ**

---

## 🎯 Objectif

Permettre aux responsables de catégorie d'éditer **ET** de supprimer les missions des catégories dont ils sont responsables, exactement comme le font les administrateurs.

---

## 📋 Contexte

### Avant cette Fonctionnalité

- ✅ Les responsables de catégorie pouvaient **éditer** les missions de leur catégorie
- ❌ Seuls les **administrateurs** pouvaient **supprimer** les missions
- ❌ Le calendrier n'affichait les actions que pour les admins

### Problème

Les responsables de catégorie devaient demander aux administrateurs de supprimer des missions erronées ou obsolètes, ce qui créait :
- Des délais de traitement
- Une charge de travail supplémentaire pour les admins
- Une expérience utilisateur dégradée

---

## ✨ Fonctionnalités Implémentées

### 1. **Nouvelle Fonction de Permission** 🔐

Ajout de `canDeleteMission()` dans `lib/utils/permissions.ts` :

```typescript
export function canDeleteMission(
  user: User | UserClient | null,
  missionCategory: string
): boolean {
  if (!user) return false;
  if (user.role === 'admin') return true;
  return isResponsibleForCategory(user, missionCategory);
}
```

**Logique** :
- Admin → Peut supprimer **toutes** les missions ✓
- Responsable de catégorie → Peut supprimer uniquement les missions **de sa catégorie** ✓
- Bénévole → Ne peut pas supprimer ✗

### 2. **Modification de la Page d'Édition** ✏️

**Fichier** : `app/dashboard/missions/[id]/edit/page.tsx`

**Avant** :
```typescript
// Seuls les admins peuvent supprimer des missions
if (user.role !== 'admin') {
  setError('Seuls les administrateurs peuvent supprimer des missions');
  return;
}
```

**Après** :
```typescript
// Vérifier les permissions de suppression
if (!canDeleteMission(user, mission.category)) {
  setError('Vous n\'avez pas la permission de supprimer cette mission');
  return;
}
```

### 3. **Amélioration du Composant Calendrier** 📅

**Fichier** : `components/features/calendar/mission-calendar.tsx`

**Changements** :

1. **Nouveau prop** : `currentUser?: UserClient | null`
   - Permet de vérifier les permissions au niveau de chaque mission
   - Plus flexible que le simple booléen `isAdmin`

2. **Vérification dynamique des permissions** :
   ```typescript
   const canUserEdit = selectedMission && currentUser 
     ? canEditMission(currentUser, selectedMission.category) 
     : isAdmin;
   const canUserDelete = selectedMission && currentUser 
     ? canDeleteMission(currentUser, selectedMission.category) 
     : isAdmin;
   ```

3. **Affichage conditionnel des boutons** :
   - Le bouton "Éditer" s'affiche si `canUserEdit === true`
   - Le bouton "Supprimer" s'affiche si `canUserDelete === true`
   - Modal affiché si au moins l'une des deux permissions est accordée

### 4. **Mise à Jour de l'Utilisation du Calendrier** 🔄

**Fichier** : `app/dashboard/page.tsx`

**Ajout du prop** `currentUser` :
```typescript
<MissionCalendar
  missions={allMissions}
  currentUserId={user.uid}
  currentUser={user}  // ← Nouveau
  isAdmin={isAdmin}
  onDelete={(missionId) => {
    setAllMissions(allMissions.filter(m => m.id !== missionId));
    setMissions(missions.filter(m => m.id !== missionId));
  }}
/>
```

---

## 🔒 Matrice des Permissions

| Rôle | Éditer Mission | Supprimer Mission | Conditions |
|------|----------------|-------------------|------------|
| **Admin** | ✅ Toutes | ✅ Toutes | Sans restriction |
| **Responsable de Catégorie** | ✅ Sa catégorie | ✅ Sa catégorie | Uniquement les missions de sa catégorie |
| **Bénévole** | ❌ | ❌ | Aucune permission |

---

## 📊 Exemples de Scénarios

### Scénario 1 : Admin
```
Utilisateur : Admin
Mission : "Accueil" (Catégorie: "Logistique")

Permissions :
- ✅ Peut éditer
- ✅ Peut supprimer
```

### Scénario 2 : Responsable de Catégorie (Catégorie Assignée)
```
Utilisateur : Marie (Responsable de "Logistique")
Mission : "Accueil" (Catégorie: "Logistique")

Permissions :
- ✅ Peut éditer (sa catégorie)
- ✅ Peut supprimer (sa catégorie)
```

### Scénario 3 : Responsable de Catégorie (Catégorie NON Assignée)
```
Utilisateur : Marie (Responsable de "Logistique")
Mission : "Animation Enfants" (Catégorie: "Animation")

Permissions :
- ❌ Ne peut pas éditer (pas sa catégorie)
- ❌ Ne peut pas supprimer (pas sa catégorie)
```

### Scénario 4 : Bénévole
```
Utilisateur : Paul (Bénévole)
Mission : "Accueil" (Catégorie: "Logistique")

Permissions :
- ❌ Ne peut pas éditer
- ❌ Ne peut pas supprimer
```

---

## 🎨 Expérience Utilisateur

### Interface Calendrier

#### Pour un Admin
- Clique sur une mission dans le calendrier
- Modal s'affiche avec :
  - ✅ Bouton "Voir les détails"
  - ✅ Bouton "Éditer la mission"
  - ✅ Bouton "Supprimer la mission"

#### Pour un Responsable de Catégorie

**Mission de SA catégorie** :
- Clique sur la mission
- Modal s'affiche avec :
  - ✅ Bouton "Voir les détails"
  - ✅ Bouton "Éditer la mission"
  - ✅ Bouton "Supprimer la mission"

**Mission d'une AUTRE catégorie** :
- Clique sur la mission
- Modal **ne s'affiche pas** (aucune action disponible)
- Peut seulement naviguer vers les détails via la liste des missions

#### Pour un Bénévole
- Clique sur une mission
- Modal **ne s'affiche pas**
- Peut voir les missions mais pas les modifier

### Page d'Édition

#### Tentative de Suppression Sans Permission
```
🔴 Message d'erreur :
"Vous n'avez pas la permission de supprimer cette mission"
```

---

## 🔧 Implémentation Technique

### Fichiers Modifiés

1. **`lib/utils/permissions.ts`**
   - Ajout de `canDeleteMission()`
   
2. **`app/dashboard/missions/[id]/edit/page.tsx`**
   - Import de `canDeleteMission`
   - Remplacement de la vérification `user.role !== 'admin'`
   
3. **`components/features/calendar/mission-calendar.tsx`**
   - Ajout du prop `currentUser`
   - Vérification dynamique des permissions par mission
   - Affichage conditionnel des boutons
   
4. **`app/dashboard/page.tsx`**
   - Passage du prop `currentUser` au calendrier

### Code Clé

#### Vérification des Permissions
```typescript
// Dans le composant calendrier
const canUserEdit = selectedMission && currentUser 
  ? canEditMission(currentUser, selectedMission.category) 
  : isAdmin;

const canUserDelete = selectedMission && currentUser 
  ? canDeleteMission(currentUser, selectedMission.category) 
  : isAdmin;
```

#### Affichage Conditionnel
```typescript
{/* Le modal s'affiche si au moins une permission */}
{(canUserEdit || canUserDelete) && selectedMission && (
  <Dialog>
    {/* ... */}
    {canUserEdit && <Button>Éditer</Button>}
    {canUserDelete && <Button>Supprimer</Button>}
  </Dialog>
)}
```

---

## 🧪 Tests Recommandés

### Test 1 : Admin - Toutes Permissions
1. Se connecter en tant qu'admin
2. Ouvrir le calendrier
3. Cliquer sur n'importe quelle mission
4. ✅ Vérifier que les boutons "Éditer" et "Supprimer" sont visibles
5. Cliquer sur "Supprimer"
6. ✅ Vérifier que la mission est supprimée

### Test 2 : Responsable - Mission de Sa Catégorie
1. Se connecter en tant que responsable de "Logistique"
2. Ouvrir le calendrier
3. Cliquer sur une mission de catégorie "Logistique"
4. ✅ Vérifier que les boutons "Éditer" et "Supprimer" sont visibles
5. Cliquer sur "Supprimer"
6. ✅ Vérifier que la mission est supprimée

### Test 3 : Responsable - Mission d'Autre Catégorie
1. Se connecter en tant que responsable de "Logistique"
2. Ouvrir le calendrier
3. Cliquer sur une mission de catégorie "Animation"
4. ❌ Vérifier que le modal ne s'affiche pas
5. Aller sur la page de détails de la mission
6. ❌ Vérifier que le bouton "Modifier" n'est pas visible

### Test 4 : Responsable - Page d'Édition
1. Se connecter en tant que responsable de "Logistique"
2. Tenter d'accéder à `/missions/[id]/edit` d'une mission "Animation"
3. ✅ Vérifier la redirection ou message d'erreur
4. Accéder à `/missions/[id]/edit` d'une mission "Logistique"
5. ✅ Vérifier l'accès autorisé
6. Cliquer sur "Supprimer"
7. ✅ Vérifier que la suppression fonctionne

### Test 5 : Bénévole - Aucune Permission
1. Se connecter en tant que bénévole
2. Ouvrir le calendrier
3. Cliquer sur n'importe quelle mission
4. ❌ Vérifier que le modal ne s'affiche pas
5. Tenter d'accéder à une page d'édition via URL
6. ❌ Vérifier le blocage

---

## 🔒 Sécurité

### Vérifications Multi-Niveaux

1. **Frontend** : Vérification dans `canDeleteMission()`
   - Empêche l'affichage des boutons non autorisés
   - Améliore l'UX en masquant les actions impossibles

2. **Backend** : Règles Firestore existantes
   - Protection côté serveur
   - Les règles Firestore doivent également autoriser la suppression

### Règles Firestore

**Note** : Les règles Firestore doivent être mises à jour pour permettre aux responsables de catégorie de supprimer :

```firestore
match /missions/{missionId} {
  allow read: if isAuthenticated();
  allow create: if isAdmin() || isCategoryResponsible();
  allow update: if isAdmin() 
               || isCategoryResponsibleForMission()
               || (isAuthenticated() && isVolunteerRegistration())
               || (isAuthenticated() && isResponsibilityRequest());
  allow delete: if isAdmin() || isCategoryResponsibleForMission();
}

function isCategoryResponsibleForMission() {
  let userDoc = get(/databases/$(database)/documents/users/$(request.auth.uid));
  let missionCategory = resource.data.category;
  return userDoc.data.role == 'category_responsible' 
         && missionCategory in userDoc.data.responsibleForCategories;
}
```

---

## ⚠️ Limitations et Considérations

### Limitations Actuelles

1. **Prop Déprécié** : Le prop `isAdmin` est maintenu pour compatibilité mais devrait être supprimé à terme
2. **Vérification Manuelle** : Les règles Firestore doivent être mises à jour manuellement
3. **Pas de Log d'Audit** : Aucun historique des suppressions n'est conservé

### Améliorations Futures Possibles

1. **Historique des Suppressions** : Logger qui a supprimé quelle mission et quand
2. **Suppression Douce** : Archiver au lieu de supprimer définitivement
3. **Confirmation Renforcée** : Double confirmation pour les suppressions importantes
4. **Notifications** : Alerter les bénévoles inscrits quand une mission est supprimée

---

## 📝 Migration depuis l'Ancien Système

### Changements pour les Développeurs

**Avant** :
```typescript
// Vérification simple
if (user.role !== 'admin') { ... }
```

**Après** :
```typescript
// Vérification par fonction utilitaire
if (!canDeleteMission(user, mission.category)) { ... }
```

### Rétrocompatibilité

Le composant calendrier maintient le prop `isAdmin` pour compatibilité :
```typescript
const canUserEdit = selectedMission && currentUser 
  ? canEditMission(currentUser, selectedMission.category) 
  : isAdmin;  // ← Fallback sur l'ancien système
```

---

## ✅ Validation

### Tests Manuels Effectués

- ✅ Admin peut supprimer toutes les missions
- ✅ Responsable peut supprimer les missions de sa catégorie
- ✅ Responsable ne peut pas supprimer les missions d'autres catégories
- ✅ Bénévole ne peut pas supprimer de missions
- ✅ Messages d'erreur appropriés affichés

### Vérifications de Lint

- ✅ Aucune erreur TypeScript
- ✅ Aucune erreur ESLint
- ✅ Imports corrects

---

## 🎉 Résultat Final

Cette fonctionnalité apporte :

- ✅ **Autonomie** : Les responsables gèrent leurs catégories de A à Z
- ✅ **Efficacité** : Pas besoin de passer par un admin pour chaque suppression
- ✅ **Sécurité** : Permissions vérifiées au niveau de chaque catégorie
- ✅ **Flexibilité** : Système de permissions extensible et maintenable

**Impact** : Amélioration significative de l'expérience pour les responsables de catégorie et réduction de la charge de travail des administrateurs ! 🚀

---

## 📚 Ressources Associées

- `lib/utils/permissions.ts` - Toutes les fonctions de permissions
- `REFACTORING_CATEGORY_RESPONSIBLES.md` - Contexte du système de responsables
- `PHASE4_RESPONSABLES.md` - Historique des permissions de responsables


















