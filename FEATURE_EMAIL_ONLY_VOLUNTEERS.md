# Système "Bénévoles Email uniquement" - Phase 1

## 📋 Vue d'ensemble

Ce système permet de gérer des bénévoles réfractaires à l'informatique qui ne peuvent/veulent pas se connecter à la plateforme. Ils consultent leurs missions et se désinscrivent uniquement par email, via un lien personnel unique.

## ✨ Fonctionnalités implémentées (Phase 1)

### 1. Champ `emailOnly` sur les utilisateurs
- Nouveau champ booléen sur le profil utilisateur
- Génération automatique d'un token personnel unique (`personalToken`)
- Badge visible dans toutes les interfaces

### 2. Page `/mes-missions` - Consultation sans connexion
**URL**: `https://benevoles3.vercel.app/mes-missions?token=ABC123`

**Fonctionnalités** :
- ✅ Affichage de toutes les missions assignées
- ✅ Détails complets de chaque mission (date, lieu, description, etc.)
- ✅ Possibilité de se désinscrire en un clic
- ✅ Tri par date (missions à venir en premier)
- ✅ Statuts visuels (publiée, complète, annulée, terminée)
- ✅ Responsive mobile

**Sécurité** :
- Token unique de 32 caractères alphanumériques
- Authentification automatique par le token
- Pas de connexion requise

### 3. Interface admin `/dashboard/admin/email-only`

**Fonctionnalités** :
- ✅ Liste de tous les bénévoles
- ✅ Activation/désactivation du mode "Email uniquement" en un clic
- ✅ Copie du lien personnel dans le presse-papier
- ✅ Régénération d'un nouveau lien si nécessaire
- ✅ Recherche par nom/prénom/email
- ✅ Statistiques (total, email-only, connexion normale)

### 4. Badges d'identification

Le badge "📧 Email uniquement" apparaît dans :
- Modal d'assignation de bénévoles
- Liste des participants
- Interface admin

## 🎯 Utilisation

### Pour l'administrateur

#### 1. Activer le mode "Email uniquement"
1. Menu **Bénévoles Email**
2. Chercher le bénévole
3. Cliquer sur **Inactif** → devient **Activé** (bleu)
4. Un token personnel est généré automatiquement

#### 2. Envoyer le lien au bénévole
1. Cliquer sur l'icône **📋 Copier** à côté du nom
2. Le lien est copié dans le presse-papier
3. L'envoyer par email au bénévole

**Exemple d'email à envoyer** :
```
Bonjour [Prénom],

Voici votre lien personnel pour consulter vos missions du festival :
https://benevoles3.vercel.app/mes-missions?token=ABC123

Conservez ce lien précieusement !

Vous pouvez :
- Voir toutes vos missions
- Consulter les détails (date, heure, lieu)
- Vous désinscrire si nécessaire

Pour toute question, contactez-nous.

Merci pour votre engagement !
L'équipe du festival
```

#### 3. Assigner le bénévole à des missions
1. Aller sur la mission
2. Cliquer sur **Assigner** dans la section Participants
3. Chercher le bénévole (il aura un badge "Email uniquement")
4. Cliquer sur **Assigner**

#### 4. Regénérer un lien (si perdu)
1. Menu **Bénévoles Email**
2. Chercher le bénévole
3. Cliquer sur l'icône **🔄 Regénérer**
4. L'ancien lien ne fonctionnera plus
5. Envoyer le nouveau lien par email

### Pour le bénévole

1. **Recevoir** le lien par email
2. **Cliquer** sur le lien (pas de connexion)
3. **Consulter** ses missions
4. **Se désinscrire** si besoin en cliquant sur le bouton rouge

## 📁 Fichiers créés/modifiés

### Nouveaux fichiers
- `types/index.ts` - Ajout des champs `emailOnly` et `personalToken`
- `lib/utils/token.ts` - Génération de tokens sécurisés
- `lib/firebase/email-only-users.ts` - Gestion des utilisateurs email-only
- `app/mes-missions/page.tsx` - Page de consultation des missions
- `app/dashboard/admin/email-only/page.tsx` - Interface admin

### Fichiers modifiés
- `components/features/missions/assign-volunteer-modal.tsx` - Badge email-only
- `components/layouts/header.tsx` - Ajout du menu "Bénévoles Email"

## 🔐 Sécurité

### Token personnel
- **Format** : 32 caractères alphanumériques aléatoires
- **Génération** : Crypto API (navigateur) ou crypto module (Node.js)
- **Unicité** : Vérification lors de la génération (max 3 tentatives)
- **Persistance** : Stocké dans Firestore sur l'utilisateur

### Validation
- Vérification du format du token (regex)
- Recherche dans Firestore par `personalToken`
- Pas de token = accès refusé

### Limitations
- Un token par utilisateur
- Token révocable via régénération
- Pas de date d'expiration (pour simplifier pour les bénévoles)

## 📊 Workflow complet

```
┌─────────────────────────────────────────────────────────────┐
│ 1. ADMIN : Active le mode "Email uniquement" pour Jean      │
│    → Token généré automatiquement                            │
└───────────────────────┬─────────────────────────────────────┘
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. ADMIN : Copie le lien et l'envoie à Jean par email      │
│    https://...?token=ABC123                                  │
└───────────────────────┬─────────────────────────────────────┘
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. ADMIN : Assigne Jean à la mission "Photobooth"          │
│    (via le bouton Assigner)                                  │
└───────────────────────┬─────────────────────────────────────┘
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. JEAN : Clique sur le lien dans son email                │
│    → Voit sa mission "Photobooth"                           │
└───────────────────────┬─────────────────────────────────────┘
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. JEAN (optionnel) : Se désinscrit en cliquant            │
│    sur "Me désinscrire"                                      │
└─────────────────────────────────────────────────────────────┘
```

## ⚠️ Limitations actuelles (Phase 1)

### Non implémenté
- ❌ Envoi automatique d'email lors de l'assignation
- ❌ Rappels automatiques (48h avant la mission)
- ❌ Email récapitulatif mensuel
- ❌ Import CSV des préférences
- ❌ Indication des préférences du bénévole

### Processus manuel actuel
L'administrateur doit :
1. Activer le mode email-only
2. Copier manuellement le lien
3. Envoyer l'email manuellement
4. Assigner manuellement le bénévole aux missions

## 🚀 Prochaines étapes (Phase 2)

### Prioritaires
1. **Email automatique lors de l'assignation**
   - Envoi auto du lien lors de la première assignation
   - Notification par email à chaque nouvelle mission
   - Template email personnalisable

2. **Système de rappels**
   - Email 48h avant chaque mission
   - Email récapitulatif hebdomadaire

3. **Gestion des préférences**
   - Champ "préférences" sur le profil
   - Affichage dans l'interface d'assignation
   - Suggestions basées sur les préférences

### Améliorations UX
4. **Section admin dédiée**
   - Vue groupée par catégorie
   - Assignation multiple en un clic
   - Bouton "Renvoyer le lien"

5. **Import/Export CSV**
   - Import des préférences via CSV
   - Export de la liste des bénévoles email-only

## 🧪 Tests recommandés

### Scénarios critiques
1. ✅ Activer/désactiver le mode email-only
2. ✅ Copier le lien personnel
3. ✅ Accéder à `/mes-missions` avec un token valide
4. ✅ Accéder à `/mes-missions` avec un token invalide
5. ✅ Voir ses missions assignées
6. ✅ Se désinscrire d'une mission
7. ✅ Regénérer un token (l'ancien doit être invalide)
8. ✅ Assigner un bénévole email-only à une mission
9. ✅ Badge visible dans le modal d'assignation

### Cas limites
- Token vide ou malformé
- Utilisateur sans missions
- Mission annulée/terminée
- Désinscription d'une mission complète

## 📝 Notes techniques

### Performance
- Les tokens sont indexés dans Firestore pour recherche rapide
- Cache des catégories utilisé pour l'affichage
- Pas de limitation de débit pour l'instant

### Base de données
- Nouveau champ `emailOnly: boolean`
- Nouveau champ `personalToken: string`
- Les deux sont optionnels (undefined par défaut)

### Compatibilité
- Fonctionne sur mobile et desktop
- Pas d'installation requise
- Compatible avec tous les navigateurs modernes

## 🐛 Bugs connus
Aucun bug connu pour le moment.

## 📞 Support

Pour toute question sur cette fonctionnalité :
1. Consulter cette documentation
2. Vérifier les logs dans la console admin
3. Contacter le développeur

---

**Date de déploiement** : 18 octobre 2025  
**Version** : Phase 1 (MVP)  
**Commit** : `5760433` - feat: système bénévoles email-only (Phase 1)


















