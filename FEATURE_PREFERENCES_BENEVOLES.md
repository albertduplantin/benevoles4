# Fonctionnalité : Système de Préférences des Bénévoles

## 📋 Date de création
28 Octobre 2025

## 🎯 Objectif

Permettre aux bénévoles de renseigner leurs préférences (disponibilités, catégories préférées, horaires, compétences, etc.) et permettre aux administrateurs de visualiser ces préférences lors de l'affectation des missions.

Les missions qui correspondent aux préférences d'un bénévole sont mises en évidence avec une couleur vert pâle dans la grille d'affectation, facilitant ainsi le matching entre bénévoles et missions.

## ✨ Fonctionnalités Implémentées

### 1. Types de Préférences

Les bénévoles peuvent renseigner les préférences suivantes :

#### 📅 **Disponibilités (Dates)**
- Sélection des jours du festival où le bénévole est disponible
- Liste générée automatiquement à partir des dates du festival configurées par l'admin
- Interface avec cases à cocher pour chaque jour

#### 🎯 **Catégories Préférées**
- Sélection des types de missions qui intéressent le bénévole
- Liste complète des catégories actives du festival
- Exemples : Accueil, Logistique, Animation, Communication, etc.

#### ⏰ **Créneaux Horaires Préférés**
- Matin (6h-12h)
- Après-midi (12h-18h)
- Soirée (18h-00h)
- Nuit (00h-6h)
- Sélection multiple possible

#### 🏃 **Type de Poste**
- Statique : Accueil, billetterie, caisse
- Dynamique : Logistique, montage, animation
- Les deux : Pas de préférence particulière

#### ⌛ **Durée de Mission Préférée**
- Courte : Moins de 3 heures
- Moyenne : 3 à 6 heures
- Longue : Plus de 6 heures
- Sélection multiple possible

#### 🎓 **Compétences Spéciales**
Liste de compétences prédéfinies :
- Permis de conduire
- Premiers secours
- Langues (Anglais, Espagnol, Allemand, Autre)
- Compétences techniques (son, lumière, vidéo)
- Expérience en animation
- Expérience en gestion de foule
- Cuisine / Service
- Comptabilité / Caisse

#### 🚗 **Mobilité**
- Possède un véhicule
- Peut transporter du matériel

#### 📝 **Informations Supplémentaires**
- Champ libre pour préciser des contraintes, allergies, besoins d'accessibilité, etc.

### 2. Page de Gestion des Préférences

**Chemin** : `/dashboard/preferences`

**Accessible à** : Tous les bénévoles, responsables de catégorie et administrateurs

**Fonctionnalités** :
- Interface intuitive avec cartes organisées par thématique
- Cases à cocher interactives avec effet visuel de sélection
- Sauvegarde en un clic
- Chargement automatique des préférences existantes
- Feedback visuel lors de la sauvegarde

### 3. Système de Matching dans la Grille d'Affectation

**Chemin** : `/dashboard/affectations`

**Accessible à** : Administrateurs uniquement

#### Algorithme de Matching

Le système calcule un score de correspondance entre chaque mission et les préférences de chaque bénévole :

| Critère | Poids | Description |
|---------|-------|-------------|
| **Date disponible** | 3 points | La date de la mission correspond aux disponibilités du bénévole |
| **Catégorie préférée** | 2 points | La catégorie de la mission est dans les préférences du bénévole |
| **Créneau horaire** | 1 point | L'horaire de la mission correspond aux créneaux préférés |
| **Durée de mission** | 1 point | La durée de la mission correspond aux durées préférées |

**Score maximum** : 7 points

**Seuil de matching** : Une mission est considérée comme "correspondante" si le score est ≥ 2 points.

#### Affichage Visuel

**1. Indicateurs sur les bénévoles (en-têtes de colonnes)**
- Fond vert pâle (#e8f5e9) : Le bénévole a renseigné ses préférences
- Étoile verte (★) : Indicateur visuel supplémentaire
- Fond gris (#f5f5f5) : Aucune préférence renseignée

**2. Cellules de la grille**
- **Fond vert pâle (#d1f4d1)** : Mission correspondant aux préférences du bénévole
- **Icône info (ℹ️) verte** : Affichée dans les cellules avec match
- **Tooltip enrichi** :
  - Affiche le score de correspondance (ex: "score: 5/7")
  - Liste les préférences du bénévole (nombre de jours dispo, catégories)
  - Instructions d'affectation

**3. Légende**
- Bandeau d'information bleu en haut de la grille
- Explications du code couleur
- Description du système de matching

### 4. Navigation

Un nouveau lien "Mes préférences" a été ajouté dans le header avec :
- Icône cœur (❤️)
- Accessible à tous les rôles
- Mis en évidence lorsque la page est active

## 🛠️ Fichiers Créés/Modifiés

### Nouveaux Fichiers

1. **`lib/firebase/preferences.ts`**
   - Fonction `updateVolunteerPreferences()` pour sauvegarder les préférences
   - Gestion de la mise à jour du timestamp

2. **`app/dashboard/preferences/page.tsx`**
   - Page complète de gestion des préférences
   - Interface utilisateur riche avec cartes thématiques
   - Chargement automatique des catégories et dates du festival
   - Sauvegarde et rechargement du profil utilisateur

3. **`FEATURE_PREFERENCES_BENEVOLES.md`**
   - Documentation complète de la fonctionnalité

### Fichiers Modifiés

1. **`types/index.ts`**
   - Ajout de l'interface `VolunteerPreferences`
   - Ajout du champ `preferences` dans `User` et `UserClient`

2. **`components/features/affectations/affectations-grid.tsx`**
   - Fonction `getMissionMatchScore()` : calcul du score de correspondance
   - Fonction `doesMissionMatchPreferences()` : vérification du matching
   - Modification du rendu des cellules avec couleur verte pour les matchs
   - Ajout d'icônes info dans les cellules matchées
   - Tooltips enrichis avec informations de préférences
   - Légende explicative du système
   - Indicateurs visuels sur les en-têtes de colonnes

3. **`components/layouts/header.tsx`**
   - Ajout de l'import `HeartIcon`
   - Ajout de l'entrée "Mes préférences" dans le tableau de navigation

## 📊 Modèle de Données

### Interface VolunteerPreferences

```typescript
export interface VolunteerPreferences {
  availableDates?: string[]; // Format YYYY-MM-DD
  preferredCategories?: string[]; // Valeurs des catégories
  preferredTimeSlots?: ('morning' | 'afternoon' | 'evening' | 'night')[];
  preferredPostType?: 'static' | 'dynamic' | 'both';
  preferredDuration?: ('short' | 'medium' | 'long')[];
  skills?: string[];
  hasCar?: boolean;
  canTransportEquipment?: boolean;
  additionalInfo?: string;
}
```

### Stockage Firestore

Les préférences sont stockées directement dans le document utilisateur :

```
/users/{uid}
  - preferences: {
      availableDates: ['2025-06-14', '2025-06-15'],
      preferredCategories: ['logistique', 'accueil_public_pr'],
      preferredTimeSlots: ['morning', 'afternoon'],
      preferredPostType: 'dynamic',
      preferredDuration: ['medium', 'long'],
      skills: ['Permis de conduire', 'Bilingue (Anglais)'],
      hasCar: true,
      canTransportEquipment: true,
      additionalInfo: 'Disponible pour transporter du matériel léger'
    }
```

## 🎨 Expérience Utilisateur

### Pour le Bénévole

1. **Accéder aux préférences**
   - Cliquer sur "Mes préférences" dans le header (icône ❤️)
   - Ou via le menu mobile

2. **Renseigner ses préférences**
   - Parcourir les différentes cartes thématiques
   - Cocher les options souhaitées
   - Les préférences sont mises en évidence visuellement
   - Ajouter des informations supplémentaires si nécessaire

3. **Sauvegarder**
   - Bouton "Enregistrer" en bas de page (sticky)
   - Confirmation visuelle de la sauvegarde
   - Retour au dashboard ou autre page

### Pour l'Administrateur

1. **Accéder à la grille d'affectation**
   - Cliquer sur "Affectations" dans le header

2. **Identifier les bénévoles avec préférences**
   - Colonnes avec fond vert pâle et étoile (★)
   - Indication visuelle immédiate

3. **Voir les correspondances**
   - Cellules vertes : missions correspondant aux préférences
   - Icônes info pour les matchs détectés
   - Survoler pour voir le détail du score et des préférences

4. **Affecter en connaissance de cause**
   - Double-clic pour affecter/désaffecter (comme d'habitude)
   - Les correspondances facilitent le choix
   - Meilleure satisfaction des bénévoles

## 🔄 Intégration avec l'Existant

- ✅ **Compatible** avec le système d'affectation existant
- ✅ **Compatible** avec la détection de conflits de créneaux
- ✅ **Compatible** avec le système de catégories Firestore
- ✅ **Compatible** avec les dates du festival configurées par l'admin
- ✅ **Optionnel** : Les bénévoles peuvent choisir de ne pas renseigner leurs préférences
- ✅ **Non bloquant** : L'absence de préférences n'empêche pas l'affectation

## 📈 Avantages

### Pour les Bénévoles
- 🎯 Missions plus adaptées à leurs contraintes et envies
- ⏰ Gain de temps : pas besoin de décrire ses disponibilités par email
- 😊 Meilleure expérience et satisfaction
- 🔄 Peuvent mettre à jour leurs préférences à tout moment

### Pour les Administrateurs
- 👀 Visibilité immédiate sur les préférences de chaque bénévole
- 🎨 Aide visuelle pour l'affectation (code couleur)
- 📊 Meilleure répartition des bénévoles
- 💪 Affectations plus pertinentes et efficaces
- 📉 Réduction des désistements

### Pour l'Organisation
- 📈 Meilleure qualité des affectations
- 😊 Bénévoles plus motivés et engagés
- ⚡ Process d'affectation plus rapide
- 📊 Données exploitables pour analyser les préférences

## 🚀 Évolutions Futures Possibles

1. **Filtres avancés dans la grille**
   - Filtrer les bénévoles par compétences
   - Filtrer par disponibilité
   - Voir uniquement les bénévoles avec véhicule

2. **Suggestions automatiques**
   - L'application suggère des missions basées sur les préférences
   - Notifications push pour les missions correspondantes

3. **Statistiques**
   - Dashboard admin avec stats sur les préférences
   - Identification des catégories populaires/impopulaires
   - Analyse des compétences disponibles

4. **Export enrichi**
   - Inclure les préférences dans les exports Excel/PDF
   - Rapport de matching par bénévole

5. **Préférences avancées**
   - Préférences par jour (différentes selon le jour)
   - Blacklist de catégories (ce que le bénévole ne veut PAS faire)
   - Préférence de travail en équipe avec d'autres bénévoles

## 📝 Notes Techniques

- Les préférences sont **optionnelles** : un bénévole peut ne rien renseigner
- Le système de matching utilise un **algorithme pondéré** avec des scores
- La couleur verte pâle a été choisie pour ne **pas interférer** avec les couleurs des catégories
- Les tooltips sont **enrichis** pour afficher toutes les informations pertinentes
- Le système est **performant** : calcul du score en temps réel sans impact sur les performances

## 🎓 Guide d'Utilisation Rapide

### Bénévole : Renseigner ses préférences

1. Cliquez sur "Mes préférences" (icône ❤️) dans le menu
2. Parcourez les différentes sections
3. Cochez vos préférences
4. Cliquez sur "Enregistrer"
5. ✅ Vos préférences sont sauvegardées !

### Admin : Utiliser les préférences pour affecter

1. Allez sur "Affectations"
2. Repérez les colonnes avec fond vert clair (bénévoles avec préférences)
3. Les cellules vertes = missions qui correspondent
4. Survolez pour voir le détail
5. Double-cliquez pour affecter comme d'habitude

## 🔐 Règles de Sécurité Firestore

Aucune modification des règles Firestore n'est nécessaire. Les préférences font partie du document utilisateur et suivent les mêmes règles :
- Un utilisateur peut modifier ses propres préférences
- Les admins peuvent voir toutes les préférences

---

**Fonctionnalité créée le 28 Octobre 2025**











