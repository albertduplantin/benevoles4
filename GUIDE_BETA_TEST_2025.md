# 🎬 Guide de Test Beta - Festival Films Courts Dinan 2025

## 📱 Application : FFC Dinan - Gestion Bénévoles

**Date :** Janvier 2025  
**Version :** v1.0  
**Testeur :** _______________  
**Appareil :** _______________  
**Navigateur :** _______________

---

## 🎯 Objectif du Test

Valider le bon fonctionnement de l'application de gestion des bénévoles pour le Festival Films Courts de Dinan (19-23 novembre 2025) sur mobile et desktop.

---

## 🔗 Accès à l'Application

**URL de production :**  
👉 https://benevoles3.vercel.app

**Identifiants de test :**
- Email : _______________
- Mot de passe : _______________

> ⚠️ **Important** : Si vous n'avez pas de compte, utilisez l'option "Créer un compte" depuis la page de connexion.

---

## ✅ Checklist de Test

### 1️⃣ **Connexion et Profil** (5 min)

#### Test : Connexion
- [ ] Ouvrir l'URL https://benevoles3.vercel.app
- [ ] Vérifier que la page d'accueil s'affiche correctement
- [ ] Cliquer sur "Se connecter"
- [ ] Saisir email et mot de passe
- [ ] Cliquer sur "Se connecter"
- [ ] **Vérifier** : Redirection vers la page "Missions"

**❓ Questions :**
- La connexion a-t-elle fonctionné du premier coup ? _______________
- Le chargement était-il rapide ? _______________

#### Test : Profil
- [ ] Cliquer sur l'avatar en haut à droite
- [ ] Sélectionner "Mon profil"
- [ ] **Vérifier** : Affichage de vos informations (nom, prénom, email, téléphone)

**❓ Questions :**
- Les informations sont-elles correctes ? _______________
- Le profil est-il clair et lisible ? _______________

---

### 2️⃣ **Navigation et Dashboard** (10 min)

#### Test : Menu de navigation
- [ ] Cliquer sur "Dashboard" dans le menu
- [ ] **Vérifier** : Affichage de 3 cartes de statistiques
  - Mes Missions
  - À Venir
  - Terminées
- [ ] Cliquer sur "Calendrier" dans le menu
- [ ] **Vérifier** : Affichage du calendrier avec vos missions
- [ ] Cliquer sur "Missions" dans le menu
- [ ] **Vérifier** : Liste de toutes les missions disponibles
- [ ] Cliquer sur "Mes missions" dans le menu
- [ ] **Vérifier** : Affichage uniquement des missions où vous êtes inscrit(e)

**❓ Questions :**
- La navigation est-elle fluide ? _______________
- Les pages se chargent-elles rapidement ? _______________
- Le menu est-il clair et intuitif ? _______________

---

### 3️⃣ **Missions** (15 min)

#### Test : Liste des missions
- [ ] Aller sur "Missions"
- [ ] **Vérifier** : Affichage de toutes les missions avec :
  - Titre
  - Catégorie (badge violet)
  - Date et horaire
  - Lieu
  - Nombre de places (ex: 3/10)
  - Badge "URGENT" si applicable

**Sur mobile :**
- [ ] **Vérifier** : Affichage condensé avec bouton d'inscription direct (icône +/-)
- [ ] Cliquer sur une mission
- [ ] **Vérifier** : Ouverture d'une modale avec tous les détails

**Sur desktop :**
- [ ] Cliquer sur "Voir détails" d'une mission

#### Test : Filtres
- [ ] Utiliser le filtre "Catégorie"
- [ ] Sélectionner une catégorie (ex: "Accueil")
- [ ] **Vérifier** : Affichage uniquement des missions de cette catégorie
- [ ] Cocher "Mes missions uniquement"
- [ ] **Vérifier** : Affichage uniquement de vos missions
- [ ] Cliquer sur "Réinitialiser les filtres"
- [ ] **Vérifier** : Retour à toutes les missions

**❓ Questions :**
- Les filtres fonctionnent-ils correctement ? _______________
- L'affichage mobile est-il lisible et pratique ? _______________
- Les informations essentielles sont-elles visibles ? _______________

#### Test : Inscription/Désinscription
- [ ] Choisir une mission avec des places disponibles
- [ ] Cliquer sur "S'inscrire" (ou icône + sur mobile)
- [ ] **Vérifier** : Message de confirmation "Inscription réussie !"
- [ ] **Vérifier** : Mise à jour du compteur de places
- [ ] **Vérifier** : Le bouton devient "Se désinscrire"
- [ ] Cliquer sur "Se désinscrire"
- [ ] **Vérifier** : Message de confirmation "Désinscription réussie !"

**❓ Questions :**
- L'inscription/désinscription est-elle instantanée ? _______________
- Les messages de confirmation sont-ils clairs ? _______________
- Y a-t-il eu des bugs ou erreurs ? _______________

---

### 4️⃣ **Détails de Mission** (10 min)

#### Test : Page détails
- [ ] Cliquer sur une mission
- [ ] **Vérifier** : Affichage rapide des informations :
  - Titre
  - Catégorie
  - Description complète
  - Date et horaires
  - Lieu
  - Nombre de places
  - Statut (Publiée, Complète, etc.)
  - Badge URGENT si applicable

**Si inscrit(e) à la mission :**
- [ ] **Vérifier** : Affichage de la liste des autres bénévoles inscrits
- [ ] **Vérifier** : Affichage des contacts (nom, email, téléphone)

**❓ Questions :**
- Le chargement de la page est-il rapide ? _______________
- Toutes les informations nécessaires sont-elles présentes ? _______________
- La mise en page est-elle claire ? _______________

---

### 5️⃣ **Calendrier** (5 min)

#### Test : Vue calendrier
- [ ] Aller sur "Calendrier"
- [ ] **Vérifier** : Affichage de vos missions sur le calendrier
- [ ] Cliquer sur une mission dans le calendrier
- [ ] **Vérifier** : Ouverture des détails de la mission

**Sur mobile :**
- [ ] **Vérifier** : Le calendrier s'adapte à la taille de l'écran
- [ ] Faire défiler le calendrier
- [ ] **Vérifier** : La navigation est fluide

**❓ Questions :**
- Le calendrier est-il facile à utiliser ? _______________
- Les missions sont-elles bien visibles ? _______________
- La navigation mensuelle fonctionne-t-elle bien ? _______________

---

### 6️⃣ **Installation PWA** (Mobile uniquement - 10 min)

#### Test : Installation de l'application
- [ ] Aller sur le Dashboard (mobile uniquement)
- [ ] Défiler en bas de page
- [ ] **Vérifier** : Présence d'une carte "Installer l'application"
- [ ] Cliquer sur le bouton noir "Installer l'application"

**Sur Android/Chrome :**
- [ ] **Vérifier** : Popup d'installation native
- [ ] Accepter l'installation
- [ ] **Vérifier** : L'icône "FFC Dinan" apparaît sur l'écran d'accueil

**Sur iPhone/Safari :**
- [ ] **Vérifier** : Affichage des instructions pas à pas
- [ ] Suivre les instructions :
  1. Taper sur l'icône Partager (en bas)
  2. Sélectionner "Sur l'écran d'accueil"
  3. Taper sur "Ajouter"
- [ ] **Vérifier** : L'icône "FFC Dinan" apparaît sur l'écran d'accueil

#### Test : Utilisation de l'app installée
- [ ] Fermer le navigateur
- [ ] Ouvrir l'application depuis l'icône "FFC Dinan"
- [ ] **Vérifier** : L'app s'ouvre en mode standalone (sans barre d'adresse)
- [ ] Naviguer dans l'application
- [ ] **Vérifier** : Toutes les fonctionnalités marchent comme dans le navigateur

#### Test : Mode hors ligne (optionnel)
- [ ] Activer le mode avion
- [ ] Ouvrir l'application
- [ ] **Vérifier** : Affichage d'un message indiquant que vous êtes hors ligne
- [ ] Désactiver le mode avion
- [ ] **Vérifier** : Reconnexion automatique

**❓ Questions :**
- L'installation était-elle simple ? _______________
- L'icône de l'app est-elle visible et jolie ? _______________
- L'app fonctionne-t-elle comme une vraie application ? _______________
- Le mode hors ligne fonctionne-t-il ? _______________

---

### 7️⃣ **Tests Ergonomie Mobile** (10 min)

#### Test : Affichage et navigation
- [ ] **Vérifier** : Tous les textes sont lisibles sans zoom
- [ ] **Vérifier** : Les boutons sont assez grands pour être cliqués facilement
- [ ] **Vérifier** : Le menu burger (☰) s'ouvre correctement
- [ ] **Vérifier** : Les cartes de missions sont bien espacées
- [ ] **Vérifier** : Le scroll est fluide

#### Test : Actions rapides
- [ ] Essayer de s'inscrire à une mission depuis la liste (icône +)
- [ ] **Vérifier** : L'inscription se fait sans ouvrir la page détails
- [ ] Essayer de se désinscrire rapidement (icône -)
- [ ] **Vérifier** : La désinscription est immédiate

**❓ Questions :**
- L'application est-elle agréable à utiliser sur mobile ? _______________
- Y a-t-il des éléments trop petits ou difficiles à cliquer ? _______________
- La navigation est-elle intuitive ? _______________

---

### 8️⃣ **Tests Desktop** (10 min)

#### Test : Affichage et mise en page
- [ ] Ouvrir l'application sur un ordinateur
- [ ] **Vérifier** : Le dashboard affiche les statistiques à gauche et le calendrier à droite
- [ ] **Vérifier** : Les missions s'affichent en grille (2-3 colonnes)
- [ ] **Vérifier** : Le menu de navigation est horizontal en haut
- [ ] Réduire la taille de la fenêtre
- [ ] **Vérifier** : L'interface s'adapte et passe en mode mobile

**❓ Questions :**
- L'affichage desktop est-il agréable ? _______________
- L'espace est-il bien utilisé ? _______________
- Le passage desktop ↔ mobile est-il fluide ? _______________

---

### 9️⃣ **Tests de Performance** (5 min)

#### Test : Vitesse de chargement
- [ ] Vider le cache du navigateur
- [ ] Ouvrir l'application
- [ ] **Chronométrer** : Temps de chargement de la page d'accueil : _____ secondes
- [ ] Se connecter
- [ ] **Chronométrer** : Temps d'affichage du dashboard : _____ secondes
- [ ] Cliquer sur une mission
- [ ] **Chronométrer** : Temps d'affichage des détails : _____ secondes

**Évaluation :**
- Moins de 1 seconde : ⭐⭐⭐ Excellent
- 1-2 secondes : ⭐⭐ Bon
- 2-3 secondes : ⭐ Acceptable
- Plus de 3 secondes : ❌ Trop lent

**❓ Questions :**
- L'application vous semble-t-elle rapide ? _______________
- Y a-t-il des pages qui se chargent lentement ? _______________

---

## 🐛 Rapport de Bugs

Si vous rencontrez un problème, notez-le ici :

### Bug #1
- **Page/Section :** _______________
- **Action effectuée :** _______________
- **Comportement attendu :** _______________
- **Comportement observé :** _______________
- **Gravité :** ☐ Bloquant  ☐ Majeur  ☐ Mineur  ☐ Cosmétique
- **Captures d'écran :** (si possible)

### Bug #2
- **Page/Section :** _______________
- **Action effectuée :** _______________
- **Comportement attendu :** _______________
- **Comportement observé :** _______________
- **Gravité :** ☐ Bloquant  ☐ Majeur  ☐ Mineur  ☐ Cosmétique

### Bug #3
- **Page/Section :** _______________
- **Action effectuée :** _______________
- **Comportement attendu :** _______________
- **Comportement observé :** _______________
- **Gravité :** ☐ Bloquant  ☐ Majeur  ☐ Mineur  ☐ Cosmétique

---

## 💡 Suggestions et Améliorations

**Ce que j'ai aimé :**
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________

**Ce qui pourrait être amélioré :**
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________

**Fonctionnalités manquantes :**
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________

**Note globale de l'application : ____/10**

---

## 📝 Commentaires Libres

Utilisez cet espace pour tout autre commentaire :

_________________________________________________________________
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________

---

## ✅ Validation Finale

- [ ] J'ai complété tous les tests de cette checklist
- [ ] J'ai reporté tous les bugs rencontrés
- [ ] J'ai donné mon avis et mes suggestions
- [ ] Je recommande cette application pour le festival : ☐ Oui  ☐ Non  ☐ Avec réserves

**Date de fin de test :** _______________  
**Durée totale du test :** _____ minutes

---

## 🙏 Merci !

Merci d'avoir participé à ce test beta ! Vos retours sont précieux pour améliorer l'application avant le festival.

**Contact support :** _______________























