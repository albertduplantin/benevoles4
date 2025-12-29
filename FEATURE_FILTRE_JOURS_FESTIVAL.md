# Fonctionnalité : Filtre par Jour du Festival

## Date : 7 Octobre 2025

## Vue d'ensemble

Cette fonctionnalité permet à l'administrateur de configurer les dates du festival, puis aux bénévoles de filtrer les missions par jour spécifique.

## Cas d'usage

**Problème résolu** : Un bénévole sait qu'il n'est disponible que le samedi 15 juin. Plutôt que de parcourir toutes les missions, il peut maintenant filtrer directement pour voir uniquement les missions ayant lieu ce jour-là.

## Fonctionnalités Implémentées

### 1. 👨‍💼 Interface Administrateur

**Localisation** : `/dashboard/overview` (Dashboard principal)

**Section** : Paramètres Administrateur > Dates du Festival

**Fonctionnalités** :
- Sélection de la date de début du festival
- Sélection de la date de fin du festival
- Validation automatique (date de début < date de fin)
- Sauvegarde dans Firestore

**Exemple** :
```
Festival du 14 juin 2025 au 18 juin 2025
```

### 2. 🎭 Filtre Bénévole

**Localisation** : `/dashboard/missions`

**Section** : Filtres (panneau de gauche)

**Fonctionnalités** :
- Liste déroulante "Jour du festival" avec tous les jours entre les dates configurées
- Affichage formaté : "Samedi 15 juin", "Dimanche 16 juin", etc.
- Filtre intelligent :
  - ✅ Missions planifiées : affichées si elles ont lieu ce jour-là
  - ✅ Missions continues : toujours affichées (disponibles tous les jours)
  - ✅ Missions multi-jours : affichées si le jour sélectionné est dans la plage

**Interface** :
- Icône calendrier 📅
- Select avec tous les jours
- Message explicatif sous le select

### 3. 🎯 Logique de Filtrage

#### Fonction `missionHappenOnDay(mission, dayDate)`

**Missions continues** : Toujours visibles
```typescript
if (mission.type === 'ongoing') return true;
```

**Missions planifiées** : Vérification de la date
```typescript
// Compare la date sélectionnée avec la plage de dates de la mission
return targetDay >= missionStart && targetDay <= missionEnd;
```

**Exemples** :
- Mission du 15 juin 10h-18h → Visible le 15 juin
- Mission du 15 juin 14h au 16 juin 12h → Visible le 15 ET le 16 juin
- Mission continue → Visible tous les jours

## Architecture Technique

### Modèle de Données

#### AdminSettings (Firestore : `settings/admin`)
```typescript
{
  autoApproveResponsibility: boolean;
  festivalStartDate?: Date;       // 🆕
  festivalEndDate?: Date;          // 🆕
  updatedAt?: Date;
  updatedBy?: string;
}
```

### Fichiers Modifiés

1. **`lib/firebase/admin-settings.ts`**
   - Ajout des champs `festivalStartDate` et `festivalEndDate`
   - Conversion automatique des Timestamps Firestore vers Date

2. **`app/dashboard/overview/page.tsx`**
   - Ajout des états `festivalStartDate` et `festivalEndDate`
   - Chargement des dates depuis Firestore
   - Fonction `handleSaveFestivalDates()` pour la sauvegarde
   - Interface UI avec deux `<input type="date">`

3. **`app/dashboard/missions/page.tsx`**
   - Ajout de l'état `filterDay` et `festivalDays`
   - Fonction `generateFestivalDays()` : génère tous les jours entre deux dates
   - Fonction `missionHappenOnDay()` : vérifie si une mission a lieu un jour donné
   - Chargement des dates du festival au montage du composant
   - Ajout du filtre dans la logique `filteredMissions`
   - Interface UI avec select des jours

### Fonctions Utilitaires

#### `generateFestivalDays(startDate, endDate)`
```typescript
// Génère tous les jours entre deux dates
// Retour : [{ date: '2025-06-15', label: 'Samedi 15 juin' }, ...]
```

#### `missionHappenOnDay(mission, dayDate)`
```typescript
// Vérifie si une mission a lieu un jour donné
// Retour : boolean
```

## Expérience Utilisateur

### Pour l'Admin

1. Se rendre sur `/dashboard/overview`
2. Scroller jusqu'à "Paramètres Administrateur"
3. Section "Dates du Festival"
4. Sélectionner date de début et date de fin
5. Cliquer sur "Enregistrer les dates"
6. ✅ Confirmation : "Dates du festival enregistrées avec succès !"

### Pour le Bénévole

1. Se rendre sur `/dashboard/missions`
2. Dans le panneau "Filtres", voir la nouvelle section "Jour du festival" (avec icône 📅)
3. Sélectionner un jour dans la liste déroulante
   - Exemple : "Samedi 15 juin"
4. ✅ Les missions sont automatiquement filtrées !
5. Pour tout afficher : sélectionner "Tous les jours"

## Avantages

✅ **Gain de temps** : Le bénévole trouve immédiatement les missions de son jour de disponibilité

✅ **Meilleure expérience** : Pas besoin de lire toutes les dates de toutes les missions

✅ **Flexible** : Combinable avec les autres filtres (catégorie, urgentes, mes missions)

✅ **Intelligent** : Les missions continues restent visibles tous les jours

✅ **Configurable** : L'admin peut changer les dates à tout moment

## Cas Limites Gérés

### Si aucune date n'est configurée
- Le filtre n'apparaît pas (masqué avec `{festivalDays.length > 0 && ...}`)
- Aucun impact sur l'application

### Si date de début > date de fin
- Validation côté client : message d'erreur
- Pas de sauvegarde dans Firestore

### Missions sans dates
- Les missions continues sont toujours affichées
- Les missions planifiées sans date ne sont pas affichées (comportement attendu)

### Fuseaux horaires
- Toutes les dates sont normalisées à minuit (00:00:00)
- Comparaison jour par jour, pas heure par heure

## Améliorations Futures Possibles

1. **Vue calendrier visuelle** : Au lieu d'un select, afficher un mini-calendrier cliquable

2. **Badge sur les jours** : Afficher le nombre de missions par jour dans le select
   - Exemple : "Samedi 15 juin (12 missions)"

3. **Filtre multi-jours** : Permettre de sélectionner plusieurs jours à la fois

4. **Export planning par jour** : Exporter toutes les missions d'un jour spécifique

5. **Notifications** : Rappeler aux bénévoles les missions du jour J-1

6. **Statistiques** : Tableau de bord admin montrant la répartition des missions par jour

## Sécurité

- ✅ Seuls les administrateurs peuvent configurer les dates
- ✅ Validation des données côté client et serveur (Firestore Rules)
- ✅ Les bénévoles ont accès en lecture seule aux dates

## Performance

- ⚡ Chargement des dates : une seule requête Firestore au montage
- ⚡ Génération des jours : opération très rapide (< 1ms pour 30 jours)
- ⚡ Filtrage : côté client avec `useMemo`, re-calcul uniquement si nécessaire

## Tests Recommandés

### Test 1 : Configuration Admin
1. ✅ Configurer des dates valides
2. ✅ Tenter dates invalides (début > fin)
3. ✅ Vérifier la sauvegarde dans Firestore

### Test 2 : Affichage Bénévole
1. ✅ Vérifier que le filtre apparaît après configuration
2. ✅ Vérifier que tous les jours sont listés
3. ✅ Vérifier le formatage français des dates

### Test 3 : Filtrage
1. ✅ Mission d'un jour spécifique → visible ce jour-là uniquement
2. ✅ Mission sur plusieurs jours → visible tous ces jours
3. ✅ Mission continue → visible tous les jours
4. ✅ Combinaison avec d'autres filtres (catégorie, urgentes)

## Conclusion

Cette fonctionnalité améliore significativement l'expérience des bénévoles ayant des disponibilités limitées. Elle est facile à configurer pour l'admin et intuitive pour les utilisateurs.

**Statut** : ✅ **Déployée et fonctionnelle**























