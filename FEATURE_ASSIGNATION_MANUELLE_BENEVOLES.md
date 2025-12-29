# Fonctionnalité d'assignation manuelle de bénévoles

## 📋 Résumé

Les **administrateurs** et les **responsables de catégorie** peuvent désormais assigner manuellement des bénévoles à une mission depuis la page de détail de la mission.

## ✨ Fonctionnalités

### 1. Bouton d'assignation
- Visible uniquement pour les admins et les responsables de catégorie (pour leurs catégories)
- Situé dans la section "Participants" de la page de détail de la mission
- Affiche le nombre actuel de bénévoles inscrits

### 2. Modal d'assignation
Un modal intuitif qui permet de :
- **Rechercher** des bénévoles par nom, prénom ou email
- **Voir** tous les bénévoles disponibles avec leurs coordonnées
- **Assigner** un bénévole à la mission en un clic
- **Retirer** un bénévole déjà assigné
- **Visualiser** l'état d'inscription de chaque bénévole avec des badges

### 3. Permissions
- **Administrateurs** : Peuvent assigner des bénévoles sur toutes les missions
- **Responsables de catégorie** : Peuvent assigner des bénévoles uniquement sur les missions des catégories dont ils sont responsables
- **Bénévoles** : N'ont pas accès à cette fonctionnalité

### 4. Validations
L'assignation respecte toutes les règles existantes :
- ✅ Vérification du nombre maximum de bénévoles
- ✅ Détection des missions qui se chevauchent (empêche l'inscription)
- ✅ Mise à jour automatique du statut de la mission (full/published)

## 🛠️ Fichiers créés/modifiés

### Nouveaux fichiers
- **`components/features/missions/assign-volunteer-modal.tsx`**
  - Composant React pour le modal d'assignation
  - Gestion de la recherche et du filtrage
  - Interface intuitive avec boutons d'assignation/retrait

### Fichiers modifiés
- **`app/dashboard/missions/[id]/page.tsx`**
  - Ajout du bouton "Assigner" dans la section Participants
  - Ajout de la vérification des permissions `canManageVolunteers`
  - Intégration du modal d'assignation
  - Rafraîchissement automatique de la liste après assignation

- **`components/features/missions/mission-form.tsx`**
  - Nettoyage des console.log de debug

- **`lib/firebase/missions.ts`**
  - Nettoyage des console.log de debug

- **`lib/utils/category-responsible-helper.ts`**
  - Nettoyage des console.log de debug

- **`app/dashboard/missions/page.tsx`**
  - Nettoyage des console.log de debug

## 📸 Interface utilisateur

### Bouton d'assignation
```
┌─────────────────────────────────────────────┐
│ Participants (2/5)                 [Assigner]│
│ Liste des bénévoles inscrits                │
└─────────────────────────────────────────────┘
```

### Modal d'assignation
```
┌────────────────────────────────────────────────┐
│ Assigner des bénévoles                     [X] │
│ Mission Photobooth • 2/5 bénévoles             │
│                                                │
│ Rechercher un bénévole                         │
│ [🔍 Nom, prénom ou email...]            [X]    │
│                                                │
│ ┌──────────────────────────────────────────┐  │
│ │ Jean Dupont                    [Inscrit] │  │
│ │ jean.dupont@email.com                    │  │
│ │ 06 12 34 56 78                           │  │
│ │                              [Retirer]─► │  │
│ ├──────────────────────────────────────────┤  │
│ │ Marie Martin                             │  │
│ │ marie.martin@email.com                   │  │
│ │                             [Assigner]─► │  │
│ └──────────────────────────────────────────┘  │
└────────────────────────────────────────────────┘
```

## 🔐 Sécurité et validations

### Vérifications automatiques
1. **Permissions** : Seuls les admins et responsables autorisés peuvent accéder au bouton
2. **Capacité** : Impossible d'assigner si la mission est complète
3. **Chevauchements** : Détection automatique des missions qui se chevauchent
4. **Transactions Firestore** : Utilisation de transactions pour éviter les race conditions

### Messages d'erreur
- "Mission complète" : Si le nombre maximum de bénévoles est atteint
- "Missions qui se chevauchent détectées" : Si le bénévole est déjà inscrit à une autre mission au même moment
- Messages d'erreur contextuels avec les titres des missions en conflit

## 🚀 Utilisation

### Pour les administrateurs
1. Accéder à une mission
2. Cliquer sur le bouton "Assigner" dans la section Participants
3. Rechercher un bénévole
4. Cliquer sur "Assigner" pour ajouter le bénévole
5. Cliquer sur "Retirer" pour retirer un bénévole déjà assigné

### Pour les responsables de catégorie
1. Accéder à une mission de leur catégorie
2. Même processus que pour les administrateurs
3. Le bouton n'apparaît que pour les missions de leurs catégories

## 📊 Impacts

### Performance
- Chargement asynchrone de la liste des bénévoles
- Recherche en temps réel côté client (pas de requête serveur)
- Cache des permissions déjà calculé dans le composant parent

### Base de données
- Utilise les fonctions existantes `adminRegisterVolunteer` et `adminUnregisterVolunteer`
- Transactions Firestore pour garantir l'intégrité des données
- Mise à jour automatique du champ `volunteers` dans la mission

## ✅ Tests recommandés

### Scénarios à tester
1. **Admin** : Assigner un bénévole sur n'importe quelle mission
2. **Responsable de catégorie** : Assigner un bénévole sur une mission de sa catégorie
3. **Responsable de catégorie** : Vérifier que le bouton n'apparaît pas sur une mission d'une autre catégorie
4. **Mission complète** : Vérifier que l'assignation est bloquée quand max atteint
5. **Chevauchement** : Tenter d'assigner un bénévole déjà inscrit à une mission qui se chevauche
6. **Retrait** : Retirer un bénévole déjà assigné
7. **Recherche** : Tester la recherche par nom, prénom, email

## 📝 Notes techniques

### Gestion des états
- `canManageVolunteers` : Calculé de manière asynchrone via `canEditMissionAsync`
- `showAssignModal` : État local pour l'affichage du modal
- `processingVolunteerId` : Pour désactiver les boutons pendant le traitement

### Rafraîchissement
- Après chaque assignation/retrait, la mission et les participants sont rechargés
- Utilise la fonction `handleVolunteerAssigned()` pour mettre à jour l'état

### Composants UI utilisés
- `Dialog` (shadcn/ui) pour le modal
- `Button` pour les actions
- `Input` pour la recherche
- `Badge` pour les statuts
- `Avatar` pour les photos de profil

## 🐛 Bugs connus
Aucun bug connu pour le moment.

## 🔄 Améliorations futures possibles
- Ajout d'un filtre par rôle ou compétence
- Suggestion automatique de bénévoles disponibles
- Notification par email lors de l'assignation manuelle
- Historique des assignations manuelles
- Export de la liste des bénévoles assignés

---

**Date de déploiement** : 18 octobre 2025  
**Commit** : `d003218` - feat: assignation manuelle de bénévoles par admins et responsables de catégorie + nettoyage console.log


















