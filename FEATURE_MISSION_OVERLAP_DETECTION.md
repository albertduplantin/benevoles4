# 🚫 Fonctionnalité : Détection des Chevauchements de Missions

**Date** : 18 octobre 2025  
**Statut** : ✅ **IMPLÉMENTÉ**

---

## 🎯 Objectif

Empêcher les bénévoles de s'inscrire à des missions qui se chevauchent temporellement, pour éviter les conflits d'horaire et garantir que chaque bénévole ne peut être présent qu'à une mission à la fois.

---

## ✨ Fonctionnalités Implémentées

### 1. **Détection Automatique des Chevauchements** 🔍

Avant chaque inscription à une mission, le système vérifie automatiquement si :
- Le bénévole est déjà inscrit à une autre mission
- Les horaires de la nouvelle mission se chevauchent avec une mission existante

### 2. **Algorithme de Détection** ⚙️

Deux missions se chevauchent si :
- Le début de la mission 1 est **avant** la fin de la mission 2 **ET**
- La fin de la mission 1 est **après** le début de la mission 2

```typescript
// Exemple de chevauchement
Mission A : 10h00 - 12h00
Mission B : 11h00 - 13h00
→ CHEVAUCHEMENT détecté ✗

// Exemple sans chevauchement
Mission A : 10h00 - 12h00
Mission B : 12h00 - 14h00
→ Pas de chevauchement ✓
```

### 3. **Message d'Erreur Explicite** 💬

Lorsqu'un chevauchement est détecté, l'utilisateur reçoit un message clair :

```
Vous ne pouvez pas vous inscrire à cette mission car elle se chevauche avec : [Nom de la mission]
```

### 4. **Protection Multi-Niveau** 🛡️

La vérification est appliquée à plusieurs niveaux :
- **Inscription par le bénévole** : `registerToMission()`
- **Inscription par un admin** : `adminRegisterVolunteer()`

---

## 📋 Cas d'Usage

### Cas 1 : Bénévole s'inscrit lui-même

1. Un bénévole essaie de s'inscrire à "Mission Accueil - 14h-17h"
2. Il est déjà inscrit à "Mission Bar - 15h-18h"
3. Le système détecte le chevauchement (15h-17h)
4. L'inscription est **refusée** avec un message d'erreur

### Cas 2 : Admin inscrit un bénévole

1. Un admin essaie d'inscrire Paul à "Mission Cuisine - 10h-13h"
2. Paul est déjà inscrit à "Mission Nettoyage - 12h-14h"
3. Le système détecte le chevauchement (12h-13h)
4. L'inscription est **refusée** avec un message d'erreur

### Cas 3 : Missions consécutives (autorisé)

1. Un bénévole s'inscrit à "Mission A - 10h-12h"
2. Puis il s'inscrit à "Mission B - 12h-14h"
3. Pas de chevauchement (les missions se suivent)
4. L'inscription est **acceptée** ✓

---

## 🔧 Implémentation Technique

### Fichiers Modifiés

#### `lib/firebase/registrations.ts`

**Nouvelles fonctions :**

```typescript
// Vérifie si deux missions se chevauchent
export function doMissionsOverlap(mission1: Mission, mission2: Mission): boolean

// Récupère toutes les missions conflictuelles pour un utilisateur
export async function checkUserMissionConflicts(
  userId: string,
  targetMission: Mission
): Promise<Mission[]>
```

**Fonction modifiée :**

```typescript
export async function registerToMission(
  missionId: string,
  userId: string
): Promise<void>
```
- Ajout de la vérification des chevauchements avant l'inscription
- Récupération de toutes les missions de l'utilisateur
- Comparaison avec la mission cible
- Rejet si chevauchement détecté

#### `lib/firebase/volunteers.ts`

**Fonction modifiée :**

```typescript
export async function adminRegisterVolunteer(
  missionId: string,
  volunteerId: string
): Promise<void>
```
- Même vérification que `registerToMission`
- Protège aussi les inscriptions faites par les admins

---

## 📊 Logique de Comparaison des Dates

### Gestion des Dates

Le système gère deux formats de dates :
- **JavaScript Date** : Objets Date natifs
- **Firestore Timestamp** : Timestamps Firebase (convertis en Date)

### Gestion des Missions sans Date de Fin

Si une mission n'a pas de `endDate` :
- La date de fin = date de début
- La mission est considérée comme ponctuelle

---

## 🎨 Expérience Utilisateur

### Avant l'Implémentation ❌

- Bénévole pouvait s'inscrire à plusieurs missions en même temps
- Conflits d'horaire découverts trop tard
- Nécessité de gérer manuellement les désistements

### Après l'Implémentation ✅

- Vérification instantanée lors de l'inscription
- Message d'erreur clair et informatif
- Impossible de créer des conflits d'horaire
- Gain de temps pour les coordinateurs

---

## 🧪 Scénarios de Test

### Test 1 : Chevauchement Total

```
Mission existante : "Accueil" 10h-18h
Nouvelle mission : "Bar" 14h-16h
Résultat : REFUSÉ ✗
```

### Test 2 : Chevauchement Partiel Début

```
Mission existante : "Cuisine" 10h-14h
Nouvelle mission : "Ménage" 12h-16h
Résultat : REFUSÉ ✗
```

### Test 3 : Chevauchement Partiel Fin

```
Mission existante : "Bar" 15h-19h
Nouvelle mission : "Rangement" 13h-16h
Résultat : REFUSÉ ✗
```

### Test 4 : Missions Consécutives

```
Mission existante : "Installation" 08h-12h
Nouvelle mission : "Animation" 12h-14h
Résultat : ACCEPTÉ ✓
```

### Test 5 : Missions Séparées

```
Mission existante : "Accueil Matin" 09h-13h
Nouvelle mission : "Accueil Soir" 18h-22h
Résultat : ACCEPTÉ ✓
```

### Test 6 : Même Jour, Horaires Différents

```
Mission existante : "Petit-déjeuner" 07h-09h
Nouvelle mission : "Dîner" 19h-22h
Résultat : ACCEPTÉ ✓
```

---

## ⚠️ Limitations et Considérations

### Limitations Actuelles

1. **Temps de Déplacement** : Le système ne prend pas en compte le temps de déplacement entre deux missions
2. **Missions Flexibles** : Les missions sans horaire précis ne sont pas vérifiées
3. **Annulations** : Si une mission est annulée, les bénévoles doivent être informés manuellement

### Améliorations Futures Possibles

1. **Marge de Sécurité** : Ajouter un buffer de 15-30 minutes entre les missions
2. **Notifications** : Alerter le bénévole des missions proches dans le temps
3. **Suggestions** : Proposer des missions compatibles avec l'emploi du temps
4. **Dashboard** : Vue calendrier avec visualisation des conflits potentiels

---

## 🔒 Sécurité et Performance

### Sécurité

- ✅ Vérification côté serveur (Firebase Functions)
- ✅ Règles Firestore inchangées (permissions existantes maintenues)
- ✅ Validation avant toute modification de la base de données

### Performance

- ⚡ Requête unique pour récupérer les missions de l'utilisateur
- ⚡ Vérification en mémoire (pas de requêtes supplémentaires)
- ⚡ Utilisation d'index Firestore existants (`volunteers` array-contains)

---

## 📝 Notes pour les Développeurs

### Ajout de Nouvelles Vérifications

Pour ajouter d'autres vérifications avant l'inscription :

```typescript
// Dans registerToMission() ou adminRegisterVolunteer()
// Après la vérification des chevauchements, ajouter :

if (/* votre condition */) {
  throw new Error('Message d\'erreur personnalisé');
}
```

### Modification de la Logique de Chevauchement

Pour modifier l'algorithme de détection (ex: ajouter une marge) :

```typescript
// Dans doMissionsOverlap()
// Ajouter une marge de 30 minutes par exemple
const BUFFER_MINUTES = 30;
const buffer = BUFFER_MINUTES * 60 * 1000; // en millisecondes

return start1 < end2.getTime() + buffer && 
       end1.getTime() + buffer > start2;
```

---

## ✅ Validation

### Tests Manuels Effectués

- ✅ Inscription avec chevauchement total
- ✅ Inscription avec chevauchement partiel
- ✅ Inscription à missions consécutives
- ✅ Inscription par admin avec conflit
- ✅ Message d'erreur affiché correctement

### Tests Automatisés Recommandés

```typescript
// Tests unitaires à ajouter
describe('Mission Overlap Detection', () => {
  test('should detect full overlap', () => { ... });
  test('should detect partial overlap', () => { ... });
  test('should allow consecutive missions', () => { ... });
  test('should allow separate missions', () => { ... });
});
```

---

## 🎉 Résultat Final

Cette fonctionnalité améliore significativement :
- ✅ L'expérience utilisateur (pas d'erreurs de planning)
- ✅ La gestion des missions (moins de conflits à résoudre)
- ✅ La fiabilité du système (détection automatique)
- ✅ La confiance des bénévoles (système qui protège leur temps)

**Impact** : Réduction des conflits d'horaire et meilleure organisation du planning des missions ! 🚀


















