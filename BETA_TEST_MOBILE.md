# 📱 CHECKLIST BETA TEST - MOBILE

## 👤 Testeur Mobile
**Date** : 7 Octobre 2025

---

## ✅ CHECKLIST DES TESTS

### 1️⃣ CONNEXION & INSCRIPTION (10 min)

#### Test A : Inscription nouveau compte
- [ ] Ouvrir le navigateur mobile (Chrome ou Safari)
- [ ] Aller sur l'URL de l'application
- [ ] Taper sur "S'inscrire"
- [ ] Remplir le formulaire
- [ ] **Vérifier** : Le clavier mobile s'affiche correctement
- [ ] **Vérifier** : Le numéro de téléphone se formate automatiquement (06 12 34 56 78)
- [ ] **Vérifier** : Icône œil pour voir/masquer le mot de passe
- [ ] Taper sur "S'inscrire"
- [ ] **Résultat attendu** : Redirection vers les missions

**✅ Succès** | **❌ Échec** (noter le problème)

---

#### Test B : Déconnexion / Reconnexion
- [ ] Taper sur l'icône menu (hamburger ☰) en haut à droite
- [ ] Taper sur "Se déconnecter"
- [ ] **Vérifier** : Retour à la page de connexion
- [ ] Se reconnecter
- [ ] **Résultat attendu** : Redirection vers les missions

**✅ Succès** | **❌ Échec** (noter le problème)

---

### 2️⃣ INSTALLATION PWA (5 min)

#### Test C : Installer l'application sur le mobile
- [ ] Ouvrir le menu hamburger ☰
- [ ] Chercher le bouton "Installer" dans le menu
- [ ] Taper sur "Installer"
- [ ] **Vérifier** : Popup du navigateur "Ajouter à l'écran d'accueil"
- [ ] Confirmer l'installation
- [ ] **Vérifier** : L'icône de l'application apparaît sur l'écran d'accueil
- [ ] Fermer le navigateur
- [ ] Ouvrir l'application depuis l'écran d'accueil
- [ ] **Vérifier** : L'app s'ouvre en plein écran (sans barre d'adresse)

**✅ Succès** | **❌ Échec** (noter le problème)

---

### 3️⃣ NAVIGATION MOBILE (5 min)

#### Test D : Menu hamburger
- [ ] Taper sur l'icône menu ☰
- [ ] **Vérifier** : Le menu latéral s'ouvre avec animation
- [ ] Taper sur "Dashboard" → Voir le tableau de bord
- [ ] Ouvrir le menu, taper sur "Calendrier" → Voir le calendrier
- [ ] Ouvrir le menu, taper sur "Missions" → Voir la liste
- [ ] Ouvrir le menu, taper sur "Mes missions" → Voir missions inscrites
- [ ] **Vérifier** : Le menu se ferme automatiquement après chaque clic

**✅ Succès** | **❌ Échec** (noter le problème)

---

### 4️⃣ MISSIONS - VERSION MOBILE CONDENSÉE (15 min)

#### Test E : Liste des missions mobile
- [ ] Aller sur "Missions"
- [ ] **Vérifier** : Affichage condensé des missions (format mobile)
- [ ] **Vérifier** : Chaque carte affiche :
  - Titre (sur 1 ligne)
  - Lieu et nombre de bénévoles sur la même ligne
  - Icône d'inscription directe (+ ou -)
- [ ] **Vérifier** : Peu d'espace entre les cartes (design compact)

**✅ Succès** | **❌ Échec** (noter le problème)

---

#### Test F : Inscription rapide depuis la liste
- [ ] Sur une mission, taper sur l'icône d'inscription (bouton vert +)
- [ ] **Vérifier** : Inscription immédiate sans ouvrir la mission
- [ ] **Vérifier** : L'icône devient rouge (-)
- [ ] **Vérifier** : Message de confirmation
- [ ] Taper sur l'icône rouge (-) pour se désinscrire
- [ ] **Vérifier** : Désinscription immédiate

**✅ Succès** | **❌ Échec** (noter le problème)

---

#### Test G : Détails d'une mission (modal)
- [ ] Taper sur le titre d'une mission
- [ ] **Vérifier** : Modal ou nouvelle page s'ouvre
- [ ] **Vérifier** : Tous les détails sont affichés :
  - Description complète
  - Date, heure, lieu
  - Nombre de places
  - Bouton "S'inscrire"
- [ ] Fermer le modal/revenir en arrière
- [ ] **Vérifier** : Retour fluide à la liste

**✅ Succès** | **❌ Échec** (noter le problème)

---

### 5️⃣ FILTRES MOBILE (10 min)

#### Test H : Panneau de filtres
- [ ] Sur la page missions, voir la section "Filtres"
- [ ] **Vérifier** : Les filtres sont accessibles en haut de page

**✅ Succès** | **❌ Échec** (noter le problème)

---

#### Test I : Tester chaque filtre
- [ ] **Catégorie** : Sélectionner "Bar / Restauration"
  - **Vérifier** : Liste filtrée correctement
- [ ] **Jour du Festival** : Sélectionner un jour spécifique
  - **Vérifier** : Liste filtrée par jour
- [ ] **Urgentes** : Cocher la case
  - **Vérifier** : Seules missions urgentes affichées
- [ ] **Réinitialiser** : Taper sur "Réinitialiser les filtres"
  - **Vérifier** : Toutes les missions réapparaissent

**✅ Succès** | **❌ Échec** (noter le problème)

---

### 6️⃣ CALENDRIER MOBILE (5 min)

#### Test J : Calendrier responsive
- [ ] Aller sur "Calendrier"
- [ ] **Vérifier** : Le calendrier s'affiche correctement en mode mobile
- [ ] **Vérifier** : On peut faire défiler pour voir tous les jours
- [ ] Taper sur une mission dans le calendrier
- [ ] **Vérifier** : Détails de la mission s'affichent

**✅ Succès** | **❌ Échec** (noter le problème)

---

### 7️⃣ DASHBOARD MOBILE (5 min)

#### Test K : Dashboard responsive
- [ ] Aller sur "Dashboard"
- [ ] **Vérifier** : En mode mobile, les statistiques sont en grille 2 colonnes
- [ ] **Vérifier** : Le calendrier est affiché en premier
- [ ] **Vérifier** : Tout est lisible et bien espacé
- [ ] Faire défiler vers le bas
- [ ] **Vérifier** : Les statistiques sont en bas de page

**✅ Succès** | **❌ Échec** (noter le problème)

---

### 8️⃣ PROFIL MOBILE (5 min)

#### Test L : Consulter son profil
- [ ] Menu ☰ → "Mon profil"
- [ ] **Vérifier** : Toutes les informations s'affichent correctement
- [ ] **Vérifier** : Les champs sont facilement modifiables
- [ ] Modifier le numéro de téléphone
- [ ] **Vérifier** : Le formatage automatique fonctionne
- [ ] Sauvegarder
- [ ] **Vérifier** : Message de confirmation

**✅ Succès** | **❌ Échec** (noter le problème)

---

### 9️⃣ TESTS TACTILES (5 min)

#### Test M : Interactions tactiles
- [ ] Taper sur différents boutons
  - **Vérifier** : Réponse immédiate au toucher
  - **Vérifier** : Pas de double-clic nécessaire
- [ ] Faire défiler les listes (scroll)
  - **Vérifier** : Défilement fluide
  - **Vérifier** : Pas de saccades
- [ ] Pincer pour zoomer sur une page
  - **Vérifier** : Le zoom fonctionne ou est désactivé (selon design)

**✅ Succès** | **❌ Échec** (noter le problème)

---

### 🔟 TESTS HORS LIGNE (PWA) (5 min)

#### Test N : Mode hors ligne
- [ ] Activer le mode avion sur le téléphone
- [ ] Ouvrir l'application PWA
- [ ] **Vérifier** : Un message indique qu'on est hors ligne
- [ ] Essayer de naviguer
  - **Vérifier** : Les pages déjà visitées s'affichent
  - **Vérifier** : Message d'erreur clair pour les actions nécessitant internet
- [ ] Désactiver le mode avion
- [ ] **Vérifier** : L'application se resynchronise automatiquement

**✅ Succès** | **❌ Échec** (noter le problème)

---

### 1️⃣1️⃣ PERFORMANCES MOBILE (5 min)

#### Test O : Vitesse de chargement
- [ ] Fermer et rouvrir l'application
- [ ] **Vérifier** : Chargement rapide (< 3 secondes)
- [ ] **Vérifier** : Skeletons animés pendant le chargement
- [ ] Naviguer entre plusieurs pages
- [ ] **Vérifier** : Transitions fluides
- [ ] **Vérifier** : Pas de lag ou de freeze

**✅ Succès** | **❌ Échec** (noter le problème)

---

### 1️⃣2️⃣ TESTS VISUELS MOBILE (5 min)

#### Test P : Lisibilité et espacement
- [ ] **Vérifier** : Le texte est lisible sans zoomer
- [ ] **Vérifier** : Les boutons sont assez grands pour être tapés facilement
- [ ] **Vérifier** : L'espacement entre les éléments est suffisant
- [ ] **Vérifier** : Aucun élément ne dépasse de l'écran

**✅ Succès** | **❌ Échec** (noter le problème)

---

#### Test Q : Orientation portrait/paysage
- [ ] Tourner le téléphone en mode paysage
- [ ] **Vérifier** : L'interface s'adapte correctement
- [ ] Revenir en mode portrait
- [ ] **Vérifier** : Retour normal à l'affichage vertical

**✅ Succès** | **❌ Échec** (noter le problème)

---

### 1️⃣3️⃣ TESTS SPÉCIFIQUES MOBILE (5 min)

#### Test R : Notifications (si activées)
- [ ] Regarder si une demande de permission de notifications apparaît
- [ ] Accepter les notifications
- [ ] **Vérifier** : Confirmation de l'activation

**✅ Succès** | **❌ Échec** (noter le problème)

---

#### Test S : Partage (si disponible)
- [ ] Sur une mission, chercher un bouton "Partager"
- [ ] **Vérifier** : Le menu de partage natif du téléphone s'ouvre
- [ ] Annuler le partage

**✅ Succès** | **❌ Échec** (noter le problème)

---

## 📝 NOTES & OBSERVATIONS

### Points positifs observés :
```
(Écrire ici ce qui fonctionne bien sur mobile)




```

### Bugs ou problèmes rencontrés :
```
(Décrire chaque bug : que s'est-il passé ?)




```

### Problèmes spécifiques mobile :
```
(Ex: boutons trop petits, texte illisible, menu difficile à ouvrir, etc.)




```

### Suggestions d'amélioration :
```
(Idées pour améliorer l'expérience mobile)




```

### Note générale (1-5 étoiles) :
⭐ ⭐ ⭐ ⭐ ⭐

---

## 🎯 RÉSUMÉ

**Total tests** : 19
**Tests réussis** : ____ / 19
**Tests échoués** : ____ / 19

**Temps total** : environ 70-80 minutes

---

## 📱 INFORMATIONS TECHNIQUES (à remplir)

**Appareil** : (ex: iPhone 13, Samsung Galaxy S21, etc.)
**Système** : (ex: iOS 16, Android 13, etc.)
**Navigateur** : (ex: Chrome, Safari, Firefox, etc.)
**Taille d'écran** : (ex: 6.1 pouces)

---

**Merci pour votre aide ! 🙏**























