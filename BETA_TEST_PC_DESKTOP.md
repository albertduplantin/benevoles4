# 🖥️ CHECKLIST BETA TEST - PC DESKTOP

## 👤 Testeur PC Desktop
**Date** : 7 Octobre 2025

---

## ✅ CHECKLIST DES TESTS

### 1️⃣ CONNEXION & INSCRIPTION (10 min)

#### Test A : Inscription nouveau compte
- [ ] Aller sur l'URL de l'application
- [ ] Cliquer sur "S'inscrire"
- [ ] Remplir le formulaire (prénom, nom, email, téléphone, mot de passe)
- [ ] **Vérifier** : Numéro de téléphone formaté automatiquement (06 12 34 56 78)
- [ ] **Vérifier** : Icône œil pour voir/masquer le mot de passe
- [ ] Cliquer sur "S'inscrire"
- [ ] **Résultat attendu** : Redirection vers la page des missions

**✅ Succès** | **❌ Échec** (noter le problème)

---

#### Test B : Déconnexion / Reconnexion
- [ ] Cliquer sur l'avatar en haut à droite
- [ ] Cliquer sur "Se déconnecter"
- [ ] **Vérifier** : Redirection vers la page de connexion
- [ ] Se reconnecter avec les identifiants créés
- [ ] **Résultat attendu** : Redirection vers la page des missions

**✅ Succès** | **❌ Échec** (noter le problème)

---

### 2️⃣ NAVIGATION & INTERFACE (5 min)

#### Test C : Menu de navigation
- [ ] Cliquer sur "Dashboard" dans le menu → Voir le tableau de bord
- [ ] Cliquer sur "Calendrier" dans le menu → Voir le calendrier
- [ ] Cliquer sur "Missions" dans le menu → Voir la liste des missions
- [ ] Cliquer sur "Mes missions" dans le menu → Voir seulement les missions inscrites
- [ ] Cliquer sur "Mon profil" (menu avatar) → Voir le profil

**✅ Succès** | **❌ Échec** (noter le problème)

---

### 3️⃣ MISSIONS - CONSULTATION & FILTRES (15 min)

#### Test D : Page missions
- [ ] Aller sur "Missions"
- [ ] **Vérifier** : La liste des missions s'affiche avec cartes visuelles
- [ ] **Vérifier** : Chaque carte affiche :
  - Titre de la mission
  - Catégorie (badge)
  - Date et lieu
  - Nombre de bénévoles (ex: 3/10)
  - Badge "URGENT" si mission urgente

**✅ Succès** | **❌ Échec** (noter le problème)

---

#### Test E : Filtres
- [ ] **Filtre Catégorie** : Sélectionner une catégorie (ex: "Bar / Restauration")
  - **Vérifier** : Seules les missions de cette catégorie s'affichent
- [ ] **Filtre Jour du Festival** : Sélectionner un jour spécifique
  - **Vérifier** : Seules les missions de ce jour s'affichent
- [ ] **Checkbox "Urgentes uniquement"** : Cocher la case
  - **Vérifier** : Seules les missions urgentes s'affichent
- [ ] **Réinitialiser** : Cliquer sur "Réinitialiser les filtres"
  - **Vérifier** : Toutes les missions réapparaissent

**✅ Succès** | **❌ Échec** (noter le problème)

---

#### Test F : Détails d'une mission
- [ ] Cliquer sur une mission
- [ ] **Vérifier** : Page de détails avec :
  - Titre, description complète
  - Catégorie, date, lieu
  - Nombre de places disponibles
  - Statut de la mission
- [ ] Cliquer sur "Retour aux missions"
- [ ] **Vérifier** : Retour à la liste

**✅ Succès** | **❌ Échec** (noter le problème)

---

### 4️⃣ INSCRIPTION AUX MISSIONS (10 min)

#### Test G : S'inscrire à une mission
- [ ] Depuis la liste des missions, cliquer sur une mission
- [ ] Cliquer sur "S'inscrire"
- [ ] **Vérifier** : Message de confirmation "Inscription réussie"
- [ ] **Vérifier** : Le compteur de bénévoles a augmenté (ex: 4/10)
- [ ] **Vérifier** : Le bouton est devenu "Se désinscrire"

**✅ Succès** | **❌ Échec** (noter le problème)

---

#### Test H : Voir "Mes missions"
- [ ] Cliquer sur "Mes missions" dans le menu
- [ ] **Vérifier** : Seules les missions inscrites sont affichées
- [ ] Cliquer sur "Missions" dans le menu
- [ ] **Vérifier** : Le filtre "Mes missions" est automatiquement décoché

**✅ Succès** | **❌ Échec** (noter le problème)

---

#### Test I : Se désinscrire d'une mission
- [ ] Aller sur une mission où vous êtes inscrit
- [ ] Cliquer sur "Se désinscrire"
- [ ] **Vérifier** : Message "Désinscription réussie"
- [ ] **Vérifier** : Le compteur de bénévoles a diminué

**✅ Succès** | **❌ Échec** (noter le problème)

---

### 5️⃣ CALENDRIER (5 min)

#### Test J : Visualisation calendrier
- [ ] Cliquer sur "Calendrier" dans le menu
- [ ] **Vérifier** : Le calendrier affiche les missions inscrites
- [ ] **Vérifier** : Les missions sont cliquables
- [ ] Cliquer sur une mission dans le calendrier
- [ ] **Vérifier** : Popup ou redirection vers la mission

**✅ Succès** | **❌ Échec** (noter le problème)

---

### 6️⃣ PROFIL UTILISATEUR (5 min)

#### Test K : Consulter et modifier son profil
- [ ] Cliquer sur l'avatar → "Mon profil"
- [ ] **Vérifier** : Affichage des informations personnelles
- [ ] **Vérifier** : Badge du rôle (Bénévole)
- [ ] **Tenter** de modifier une information (ex: téléphone)
- [ ] Sauvegarder
- [ ] **Vérifier** : Message de confirmation

**✅ Succès** | **❌ Échec** (noter le problème)

---

### 7️⃣ TESTS DE PERFORMANCE & UX (5 min)

#### Test L : Vitesse de chargement
- [ ] Rafraîchir la page des missions (F5)
- [ ] **Vérifier** : Des "skeletons" animés apparaissent pendant le chargement
- [ ] **Vérifier** : La page se charge rapidement (< 3 secondes)

**✅ Succès** | **❌ Échec** (noter le problème)

---

#### Test M : Navigation fluide
- [ ] Naviguer entre plusieurs pages (Missions → Calendrier → Dashboard → Profil)
- [ ] **Vérifier** : Pas de rechargement complet de la page
- [ ] **Vérifier** : Navigation fluide et rapide

**✅ Succès** | **❌ Échec** (noter le problème)

---

### 8️⃣ TESTS VISUELS & RESPONSIVE DESKTOP (5 min)

#### Test N : Redimensionnement fenêtre
- [ ] Réduire la largeur de la fenêtre (simuler une petite résolution)
- [ ] **Vérifier** : L'interface s'adapte correctement
- [ ] **Vérifier** : Aucun élément ne dépasse ou ne se chevauche
- [ ] Remettre en plein écran

**✅ Succès** | **❌ Échec** (noter le problème)

---

### 9️⃣ TESTS D'ERREURS (5 min)

#### Test O : Tenter des actions invalides
- [ ] Essayer de s'inscrire à une mission complète
  - **Vérifier** : Message d'erreur approprié ou bouton désactivé
- [ ] Essayer d'accéder à une page admin (taper `/dashboard/admin` dans l'URL)
  - **Vérifier** : Accès refusé ou redirection

**✅ Succès** | **❌ Échec** (noter le problème)

---

## 📝 NOTES & OBSERVATIONS

### Points positifs observés :
```
(Écrire ici ce qui fonctionne bien)




```

### Bugs ou problèmes rencontrés :
```
(Décrire chaque bug : que s'est-il passé ? quelle était l'action ?)




```

### Suggestions d'amélioration :
```
(Idées pour améliorer l'UX ou les fonctionnalités)




```

### Note générale (1-5 étoiles) :
⭐ ⭐ ⭐ ⭐ ⭐

---

## 🎯 RÉSUMÉ

**Total tests** : 15
**Tests réussis** : ____ / 15
**Tests échoués** : ____ / 15

**Temps total** : environ 60-70 minutes

---

**Merci pour votre aide ! 🙏**























