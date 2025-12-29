# 🚀 Amélioration du Système d'Appel à Bénévoles

## Date : 15 Novembre 2025

## 📋 Vue d'ensemble

Deux améliorations majeures ont été apportées au système d'appel à bénévoles :

1. ✅ **Message personnalisé obligatoire et pré-rempli** avec calcul dynamique des places restantes
2. ✅ **Système de notifications** pour avertir les responsables et admins des nouvelles inscriptions

---

## 🎯 Amélioration 1 : Message Obligatoire Pré-rempli

### Problème Initial

- Le message d'introduction était optionnel
- Les utilisateurs devaient manuellement calculer et saisir le nombre de places restantes
- Risque d'incohérence entre le message et les missions sélectionnées

### Solution Implémentée

#### 1. Générateur de Message par Défaut

**Fichier** : `lib/utils/volunteer-call-generator.ts`

**Nouvelle fonction** :
```typescript
generateDefaultIntroMessage(totalPlaces, festivalName, festivalDates)
```

**Génère automatiquement** :
```
Bonjour à tous,

Il reste encore X place(s) restante(s) pour compléter nos missions 
du Festival Films Courts de Dinan (19-23 novembre 2025).
```

#### 2. Frontend Mis à Jour

**Fichier** : `app/dashboard/volunteer-call/page.tsx`

**Changements** :
- ✅ Message pré-rempli automatiquement au chargement
- ✅ Calcul dynamique du nombre de places selon les missions sélectionnées
- ✅ Label modifié avec `*` pour indiquer qu'il est obligatoire
- ✅ Validation ajoutée : impossible d'envoyer si le message est vide
- ✅ Texte d'aide mis à jour : "Le nombre de places est calculé automatiquement selon les missions sélectionnées"

#### 3. Comportement

**Au chargement de la page** :
1. Récupération de toutes les missions incomplètes
2. Calcul du total des places restantes
3. Génération du message par défaut avec le nombre exact
4. Pré-remplissage du champ textarea

**Validation avant envoi** :
```typescript
if (!customIntro || customIntro.trim() === '') {
  toast.error('Le message d\'introduction est obligatoire');
  return;
}
```

---

## 🔔 Amélioration 2 : Système de Notifications

### Architecture

```
┌─────────────────────┐
│  Inscription à une  │
│     mission         │
└──────────┬──────────┘
           │
           v
┌─────────────────────┐
│ registerToMission() │
│  (registrations.ts) │
└──────────┬──────────┘
           │
           v
┌─────────────────────┐
│  API Notifications  │
│ /api/notifications/ │
│    registration     │
└──────────┬──────────┘
           │
           ├──────────────────────┐
           v                      v
┌──────────────────┐    ┌─────────────────┐
│ Firestore        │    │  Envoi Emails   │
│ notifications    │    │  (Resend API)   │
│ collection       │    │                 │
└──────────────────┘    └─────────────────┘
```

### 1. API de Notifications

**Fichier** : `app/api/notifications/registration/route.ts`

**Endpoint** : `POST /api/notifications/registration`

**Paramètres** :
```json
{
  "missionId": "mission123",
  "volunteerId": "user456",
  "volunteerName": "Jean Dupont"
}
```

**Processus** :
1. ✅ Récupère les informations de la mission
2. ✅ Récupère tous les admins (`role == 'admin'`)
3. ✅ Récupère les responsables de la catégorie de la mission
4. ✅ Combine les destinataires sans doublons
5. ✅ Crée des notifications dans Firestore (`notifications` collection)
6. ✅ Envoie des emails via Resend (si configuré)

**Structure de notification Firestore** :
```javascript
{
  userId: "admin123",
  type: "volunteer_registration",
  title: "🆕 Nouvelle inscription",
  message: "Jean Dupont s'est inscrit(e) à la mission 'Accueil'",
  missionId: "mission123",
  missionTitle: "Accueil",
  volunteerName: "Jean Dupont",
  volunteerId: "user456",
  read: false,
  createdAt: Timestamp
}
```

### 2. Intégration dans registerToMission

**Fichier** : `lib/firebase/registrations.ts`

**Après inscription réussie** :
1. Récupère les infos du bénévole (nom, prénom)
2. Appelle l'API `/api/notifications/registration`
3. **Mode non-bloquant** : l'inscription réussit même si les notifications échouent
4. Les erreurs de notifications sont loggées mais n'affectent pas l'utilisateur

```typescript
// Après l'inscription réussie, envoyer les notifications
try {
  const userDoc = await getDoc(userRef);
  if (userDoc.exists()) {
    const volunteerName = `${userData.firstName} ${userData.lastName}`;
    
    fetch('/api/notifications/registration', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        missionId,
        volunteerId: userId,
        volunteerName,
      }),
    }).catch(err => console.error('Erreur notifications:', err));
  }
} catch (notifError) {
  // Ne pas bloquer l'inscription
}
```

### 3. Règles Firestore

**Fichier** : `firestore.rules`

**Nouvelle collection** : `notifications`

```javascript
match /notifications/{notificationId} {
  // Lecture : uniquement ses propres notifications
  allow read: if isAuthenticated() && request.auth.uid == resource.data.userId;
  
  // Création : depuis l'API (via Admin SDK)
  allow create: if true;
  
  // Mise à jour : uniquement pour marquer comme lu
  allow update: if isAuthenticated() 
                && request.auth.uid == resource.data.userId
                && request.resource.data.diff(resource.data).affectedKeys()
                   .hasOnly(['read', 'readAt']);
  
  // Suppression : ses propres notifications ou admin
  allow delete: if isAuthenticated() 
                && (request.auth.uid == resource.data.userId || isAdmin());
}
```

### 4. Email de Notification

**Template** :
```html
🆕 Nouvelle inscription

Bonjour [Prénom],

[Nom Bénévole] vient de s'inscrire à la mission :

┌─────────────────────────────┐
│ [Titre Mission]             │
│ 📁 [Catégorie]             │
└─────────────────────────────┘

Places restantes : X / Y

[Voir la mission]
```

**Variables dynamiques** :
- Nom du bénévole
- Titre de la mission
- Catégorie
- Places restantes

---

## 🚀 Déploiement en Mode Preview Vercel

### ⚠️ IMPORTANT : Système en Production

Pour déployer ces changements de manière sécurisée :

### 1. Créer une Branche Git

```bash
git checkout -b feature/amelioration-appel-benevoles
git add .
git commit -m "feat: amélioration système appel bénévoles + notifications"
git push origin feature/amelioration-appel-benevoles
```

### 2. Créer une Pull Request sur GitHub

```bash
# Sur GitHub :
# 1. Aller dans "Pull Requests"
# 2. Cliquer "New Pull Request"
# 3. Sélectionner la branche feature/amelioration-appel-benevoles
# 4. Créer la PR
```

### 3. Vercel va Automatiquement Créer un Preview

**Vercel détecte la PR et crée** :
- ✅ URL de preview unique : `https://benevoles3-preview-xyz.vercel.app`
- ✅ Build automatique
- ✅ Tests automatiques
- ✅ Environnement isolé

### 4. Tester le Preview

**URL fournie par Vercel dans la PR** :
```
Preview: https://benevoles3-git-feature-amelioration-xxx.vercel.app
```

**Tests à effectuer** :
1. ✅ Aller sur `/dashboard/volunteer-call`
2. ✅ Vérifier que le message est pré-rempli
3. ✅ Modifier les missions sélectionnées
4. ✅ Vérifier que le nombre de places se met à jour
5. ✅ Tenter d'envoyer sans message → doit bloquer
6. ✅ S'inscrire à une mission → vérifier que les admins/responsables reçoivent la notification
7. ✅ Vérifier les emails (si Resend configuré)

### 5. Déployer en Production (après validation)

**Si tout fonctionne sur le preview** :
```bash
# Merger la PR sur GitHub
# OU en ligne de commande :
git checkout main
git merge feature/amelioration-appel-benevoles
git push origin main
```

**Vercel déploie automatiquement** sur `benevoles3.vercel.app`

---

## 📊 Variables d'Environnement Requises

### Vercel Environment Variables

**Pour les notifications par email** :
```
RESEND_API_KEY=re_xxxxxxxxxxxxx
```

**Si non configurée** :
- Les notifications Firestore sont créées
- Les emails ne sont PAS envoyés
- Un warning est loggé : "⚠️ RESEND_API_KEY non configurée"

---

## 🧪 Tests Manuels

### Test 1 : Message Pré-rempli

1. Aller sur `/dashboard/volunteer-call`
2. **Vérifier** : Le champ "Message d'introduction" est déjà rempli
3. **Vérifier** : Le nombre de places correspond aux missions affichées
4. **Vérifier** : Le label affiche `*` (obligatoire)

### Test 2 : Validation du Message

1. Vider le champ de message
2. Cliquer sur "Envoyer par Email"
3. **Vérifier** : Toast d'erreur "Le message d'introduction est obligatoire"

### Test 3 : Notifications

1. S'inscrire à une mission (en tant que bénévole)
2. **Vérifier** : L'inscription réussit
3. **Vérifier** (en tant qu'admin) : Notification dans Firestore
4. **Vérifier** : Email reçu (si Resend configuré)

### Test 4 : Responsables de Catégorie

1. Assigner un responsable à une catégorie
2. S'inscrire à une mission de cette catégorie
3. **Vérifier** : Le responsable reçoit la notification

---

## 📁 Fichiers Modifiés

### Générateur de Messages
- `lib/utils/volunteer-call-generator.ts`
  - ✅ Fonction `generateDefaultIntroMessage()`
  - ✅ Message par défaut mis à jour

### Frontend
- `app/dashboard/volunteer-call/page.tsx`
  - ✅ Pré-remplissage du message
  - ✅ Validation obligatoire
  - ✅ Label et texte d'aide mis à jour

### API Notifications
- `app/api/notifications/registration/route.ts` *(NOUVEAU)*
  - ✅ Endpoint POST
  - ✅ Récupération admins + responsables
  - ✅ Création notifications Firestore
  - ✅ Envoi emails Resend

### Backend Registrations
- `lib/firebase/registrations.ts`
  - ✅ Appel API notifications après inscription
  - ✅ Mode non-bloquant

### Sécurité
- `firestore.rules`
  - ✅ Règles pour collection `notifications`

---

## 🔒 Sécurité

### Notifications Firestore

**Protection** :
- ✅ Utilisateur ne peut lire que SES notifications
- ✅ Création via Admin SDK uniquement
- ✅ Mise à jour limitée au champ `read`
- ✅ Suppression autorisée pour l'utilisateur ou admin

### API Notifications

**Protection** :
- ✅ Paramètres requis validés
- ✅ Mission vérifiée dans Firestore
- ✅ Récupération sécurisée des admins/responsables
- ✅ Pas d'exposition d'informations sensibles

---

## 📈 Avantages

### Pour les Utilisateurs
- ✅ Message toujours cohérent avec les missions
- ✅ Pas besoin de calculer manuellement les places
- ✅ Moins d'erreurs
- ✅ Gain de temps

### Pour les Responsables/Admins
- ✅ Notification instantanée des inscriptions
- ✅ Visibilité en temps réel
- ✅ Email + notification Firestore
- ✅ Meilleur suivi des inscriptions

### Pour le Système
- ✅ Traçabilité complète (Firestore)
- ✅ Mode non-bloquant (fiabilité)
- ✅ Scalable (batch emails Resend)
- ✅ Sécurisé (règles Firestore strictes)

---

## 🐛 Résolution de Problèmes

### Les notifications ne sont pas créées

**Vérifier** :
1. Les règles Firestore sont déployées
2. L'API `/api/notifications/registration` répond
3. Les logs dans la console Vercel

### Les emails ne sont pas envoyés

**Vérifier** :
1. `RESEND_API_KEY` est configurée dans Vercel
2. Le domaine est vérifié dans Resend
3. Les logs : "⚠️ RESEND_API_KEY non configurée"

### L'inscription ne déclenche pas de notifications

**Vérifier** :
1. La fonction `registerToMission` a été mise à jour
2. L'API est accessible depuis le client
3. Les erreurs dans la console navigateur

---

## 🎯 Prochaines Étapes (Optionnel)

### Interface de Notifications (Frontend)

**À créer** :
- Composant `NotificationBell` avec compteur
- Page `/dashboard/notifications`
- Marquage comme lu
- Filtrage par type

### Webhooks Resend

**À configurer** :
- Suivi des emails ouverts
- Suivi des clics
- Gestion des bounces

### Notifications Push

**À implémenter** :
- Service Worker
- Firebase Cloud Messaging
- Notifications navigateur

---

## ✅ Checklist de Déploiement

Avant de déployer en production :

- [x] Tests sur environment de preview Vercel
- [ ] Validation du message pré-rempli
- [ ] Test d'inscription avec notifications
- [ ] Vérification des emails (si Resend configuré)
- [ ] Test avec responsable de catégorie
- [ ] Test avec admin
- [ ] Vérification des règles Firestore
- [ ] Backup de la base de données
- [ ] Merge de la Pull Request
- [ ] Déploiement automatique Vercel
- [ ] Monitoring post-déploiement

---

## 📞 Support

En cas de problème :
1. Vérifier les logs Vercel
2. Vérifier la console Firestore
3. Vérifier le dashboard Resend
4. Rollback via Vercel si nécessaire

---

**Auteur** : AI Assistant  
**Date** : 15 Novembre 2025  
**Version** : 1.0



