# 📋 Feature : Visibilité et Édition des Missions Complètes

**Date** : 22 octobre 2025  
**Statut** : ✅ IMPLÉMENTÉ - En attente de tests production

---

## 🎯 Objectif

Permettre aux responsables de catégories de voir et modifier toutes les missions de leurs catégories, y compris celles qui sont complètes. Également, permettre le recalcul automatique du statut lorsque le nombre de bénévoles maximum change.

---

## 📝 Problème Initial

### Avant les modifications :

1. **Visibilité limitée** : Les responsables de catégories ne voyaient que les missions avec statut `published`, pas celles avec statut `full`
2. **Édition bloquée** : Impossible de modifier une mission complète
3. **Statut figé** : Si on changeait `maxVolunteers` de 2 à 5 sur une mission complète, elle restait marquée comme `full` même avec de la place

---

## ✨ Modifications Implémentées

### 1. Nouvelle Fonction `getVisibleMissions()` 

**Fichier** : `lib/firebase/missions.ts`

```typescript
export async function getVisibleMissions(): Promise<MissionClient[]>
```

**Comportement** :
- Récupère les missions avec statut `published` OU `full`
- Utilisée par les responsables de catégories et les bénévoles
- Permet de voir toutes les missions actives, qu'elles soient complètes ou non

**Requête Firestore** :
```typescript
where('status', 'in', ['published', 'full'])
```

---

### 2. Recalcul Automatique du Statut

**Fichier** : `lib/firebase/missions.ts` - Fonction `updateMission()`

**Logique ajoutée** :

```typescript
// Si maxVolunteers change
if (updates.maxVolunteers !== undefined) {
  const newMaxVolunteers = updates.maxVolunteers;
  const currentVolunteersCount = currentMission.volunteers.length;
  const currentStatus = currentMission.status;
  
  // Cas 1 : Mission était 'full' et a maintenant de la place
  if (currentStatus === 'full' && currentVolunteersCount < newMaxVolunteers) {
    updateData.status = 'published';
  }
  
  // Cas 2 : Mission était 'published' et est maintenant pleine
  else if (currentStatus === 'published' && currentVolunteersCount >= newMaxVolunteers) {
    updateData.status = 'full';
  }
}
```

**Exemple** :
- Mission complète : 2/2 bénévoles, statut = `full`
- Admin/Responsable modifie `maxVolunteers` à 5
- ✅ Statut passe automatiquement à `published` (2/5 bénévoles)

---

### 3. Mise à Jour de la Page Missions

**Fichier** : `app/dashboard/missions/page.tsx`

**Avant** :
```typescript
const data = user.role === 'admin'
  ? await getAllMissions()
  : await getPublishedMissions(); // ❌ Missions 'full' exclues
```

**Après** :
```typescript
const data = user.role === 'admin'
  ? await getAllMissions()
  : await getVisibleMissions(); // ✅ Missions 'full' incluses
```

---

### 4. Hook React Query (Bonus)

**Fichier** : `lib/queries/missions.ts`

Ajout du hook `useVisibleMissions()` pour une utilisation future avec React Query :

```typescript
export function useVisibleMissions() {
  return useQuery({
    queryKey: missionKeys.visible(),
    queryFn: getVisibleMissions,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
```

---

## 🔐 Sécurité & Permissions

### ✅ Permissions Maintenues

Les permissions existantes restent inchangées :

1. **Admins** :
   - Voient toutes les missions (tous statuts)
   - Peuvent modifier toutes les missions
   - Peuvent supprimer toutes les missions

2. **Responsables de Catégories** :
   - Voient les missions `published` et `full` de TOUTES les catégories
   - Peuvent modifier uniquement les missions de LEURS catégories
   - Peuvent supprimer uniquement les missions de LEURS catégories

3. **Bénévoles** :
   - Voient les missions `published` et `full`
   - Ne peuvent PAS modifier les missions
   - Peuvent s'inscrire/se désinscrire

### 🔒 Vérifications en Place

- `canEditMissionAsync(user, missionCategory)` : Vérifie que l'utilisateur peut modifier la catégorie
- `canDeleteMissionAsync(user, missionCategory)` : Vérifie que l'utilisateur peut supprimer la catégorie
- Les règles Firestore restent identiques

---

## 🧪 Tests à Effectuer en Production

### Test 1 : Visibilité des Missions Complètes

**En tant que Responsable de Catégorie** :

1. ✅ Se connecter avec un compte responsable de catégorie
2. ✅ Aller sur `/dashboard/missions`
3. ✅ Vérifier qu'on voit les missions avec statut `full` de toutes les catégories
4. ✅ Vérifier que le badge "Complète" s'affiche correctement

**Résultat attendu** : Les missions complètes sont visibles dans la liste

---

### Test 2 : Édition d'une Mission Complète

**En tant que Responsable de Catégorie** :

1. ✅ Identifier une mission complète de SA catégorie (badge "Complète")
2. ✅ Cliquer sur "Modifier" (icône crayon)
3. ✅ Modifier un champ (ex: titre, description)
4. ✅ Sauvegarder
5. ✅ Vérifier que la modification est prise en compte

**Résultat attendu** : La mission est modifiable et les changements sont sauvegardés

---

### Test 3 : Recalcul du Statut - Augmentation de Places

**En tant qu'Admin ou Responsable** :

1. ✅ Trouver une mission complète : 2/2 bénévoles, statut = `full`
2. ✅ Modifier la mission
3. ✅ Changer "Nombre maximum de bénévoles" de 2 à 5
4. ✅ Sauvegarder
5. ✅ Vérifier que le statut passe à `published` (badge "Publiée")
6. ✅ Vérifier l'affichage : "2 / 5 bénévoles inscrits"

**Résultat attendu** : Le statut change automatiquement de `full` à `published`

---

### Test 4 : Recalcul du Statut - Diminution de Places

**En tant qu'Admin ou Responsable** :

1. ✅ Trouver une mission publiée : 3/5 bénévoles, statut = `published`
2. ✅ Modifier la mission
3. ✅ Changer "Nombre maximum de bénévoles" de 5 à 3
4. ✅ Sauvegarder
5. ✅ Vérifier que le statut passe à `full` (badge "Complète")
6. ✅ Vérifier l'affichage : "3 / 3 bénévoles inscrits"

**Résultat attendu** : Le statut change automatiquement de `published` à `full`

---

### Test 5 : Permissions - Responsable ne Peut Pas Modifier les Autres Catégories

**En tant que Responsable de Catégorie** :

1. ✅ Se connecter avec un compte responsable de catégorie "Bar / Restauration"
2. ✅ Trouver une mission complète d'une AUTRE catégorie (ex: "Accueil")
3. ✅ Vérifier qu'il n'y a PAS de bouton "Modifier"
4. ✅ Essayer d'accéder directement à `/dashboard/missions/[id]/edit`
5. ✅ Vérifier le message d'erreur : "Vous n'avez pas la permission d'éditer cette mission"

**Résultat attendu** : Les permissions sont respectées, pas d'édition des autres catégories

---

### Test 6 : Bénévole Simple ne Peut Pas Modifier

**En tant que Bénévole** :

1. ✅ Se connecter avec un compte bénévole simple
2. ✅ Voir les missions complètes dans la liste
3. ✅ Vérifier qu'il n'y a PAS de bouton "Modifier" ou "Supprimer"
4. ✅ Vérifier que le bouton "S'inscrire" est désactivé pour les missions complètes

**Résultat attendu** : Les bénévoles voient les missions complètes mais ne peuvent pas les modifier

---

## 📊 Impact sur les Données

### Aucune Migration Nécessaire ✅

Les modifications sont **non-destructives** :

- ✅ Pas de changement de schéma Firestore
- ✅ Pas de modification des données existantes
- ✅ Compatibilité ascendante totale
- ✅ Les anciennes versions du code continueront de fonctionner

### Index Firestore Requis

L'index composite suivant est nécessaire (probablement déjà créé) :

**Collection** : `missions`  
**Champs** :
- `status` (Ascending)
- `createdAt` (Descending)

**Vérification** :
1. Aller sur Firebase Console → Firestore → Indexes
2. Vérifier que cet index existe
3. Si erreur lors des tests, Firebase affichera un lien pour créer l'index automatiquement

---

## 🔄 Rollback Possible

En cas de problème, voici comment revenir en arrière :

### Rollback Partiel (Visibilité uniquement)

Modifier `app/dashboard/missions/page.tsx` ligne 227 :

```typescript
// Revenir à l'ancien comportement
const data = user.role === 'admin'
  ? await getAllMissions()
  : await getPublishedMissions(); // Retour à l'ancien
```

### Rollback Complet

```bash
git revert <commit-hash>
```

---

## 📝 Notes Importantes

### Console Logs

Des logs ont été ajoutés pour le debugging :

```typescript
console.log(`Mission ${missionId}: statut changé de 'full' à 'published' (${currentVolunteersCount}/${newMaxVolunteers} bénévoles)`);
```

Ces logs s'affichent dans la console du navigateur lors de l'édition d'une mission.

### Performance

- ✅ Pas d'impact sur les performances
- ✅ Même nombre de requêtes Firestore qu'avant
- ✅ La requête `where('status', 'in', ['published', 'full'])` est optimisée par Firestore

---

## ✅ Checklist de Déploiement

Avant de déployer en production :

- [x] Code modifié et testé localement
- [x] Pas d'erreurs de linter
- [ ] Tests manuels effectués (voir section Tests ci-dessus)
- [ ] Vérifier que l'index Firestore existe
- [ ] Informer les responsables de catégories du changement
- [ ] Déployer pendant une période de faible activité
- [ ] Surveiller les logs pour détecter d'éventuels problèmes

---

## 🐛 Problèmes Potentiels et Solutions

### Problème 1 : Index Firestore Manquant

**Symptôme** : Erreur "The query requires an index"

**Solution** : Cliquer sur le lien dans la console d'erreur pour créer l'index automatiquement

---

### Problème 2 : Trop de Missions Affichées

**Symptôme** : Les bénévoles voient trop de missions et sont confus

**Solution** : Ajouter un filtre par défaut pour masquer les missions complètes (option à cocher)

---

### Problème 3 : Statut ne se Recalcule Pas

**Symptôme** : Après modification de `maxVolunteers`, le statut ne change pas

**Vérification** :
1. Ouvrir la console du navigateur
2. Chercher les logs `Mission ${id}: statut changé...`
3. Si absent, vérifier que `maxVolunteers` est bien dans les `updates`

---

## 🎉 Résumé des Avantages

✅ **Transparence** : Les responsables voient toutes leurs missions  
✅ **Flexibilité** : Possibilité d'ajuster le nombre de bénévoles même si complet  
✅ **Automatisation** : Le statut se recalcule automatiquement  
✅ **Sécurité** : Les permissions restent identiques  
✅ **Compatibilité** : Pas de migration nécessaire  

---

**Auteur** : Assistant IA  
**Validation** : En attente des tests utilisateurs















