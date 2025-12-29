# Configuration des Notifications Push (FCM)

## 📋 Vue d'ensemble

Le système de notifications push utilise **Firebase Cloud Messaging (FCM)** et permet :
- ✅ Notifications push en temps réel (gratuit et illimité)
- ✅ Support multi-appareils
- ✅ Notifications personnalisées par type d'événement
- ✅ Interface admin pour envoi manuel
- ✅ Notifications automatiques (affectations, rappels, etc.)

---

## 🔧 Configuration requise

### 1. Générer une clé VAPID dans Firebase

1. Allez sur [Firebase Console](https://console.firebase.google.com/)
2. Sélectionnez votre projet `benevoles3-a85b4`
3. Allez dans **Paramètres du projet** (⚙️) → **Cloud Messaging**
4. Dans la section **Configuration Web**, sous **Web Push certificates**
5. Si vous n'avez pas encore de clé, cliquez sur **Générer une nouvelle paire de clés**
6. Copiez la clé générée (commence par `B...`)

### 2. Ajouter la clé VAPID aux variables d'environnement

Ajoutez cette ligne à votre fichier `.env.local` :

```bash
NEXT_PUBLIC_FIREBASE_VAPID_KEY=votre_cle_vapid_ici
```

**⚠️ IMPORTANT** : Cette variable doit aussi être ajoutée sur **Vercel** :
1. Allez dans votre projet sur Vercel
2. **Settings** → **Environment Variables**
3. Ajoutez `NEXT_PUBLIC_FIREBASE_VAPID_KEY` avec votre clé
4. Redéployez l'application

---

## 📁 Fichiers créés

### Configuration Firebase
- `lib/firebase/messaging.ts` - Configuration FCM et gestion des permissions
- `lib/firebase/fcm-tokens.ts` - Stockage des tokens dans Firestore
- `public/firebase-messaging-sw.js` - Service Worker pour notifications en arrière-plan

### Hooks & Components
- `hooks/useNotifications.ts` - Hook React pour gérer les notifications côté client

### API Routes
- `app/api/notifications/send/route.ts` - Envoi de notifications à des utilisateurs spécifiques
- `app/api/notifications/broadcast/route.ts` - Envoi de notifications broadcast

### Helpers
- `lib/notifications/send.ts` - Fonctions helper pour envoyer les notifications

### Pages
- `app/dashboard/admin/notifications/page.tsx` - Interface admin pour envoi manuel
- `app/dashboard/profile/notifications/page.tsx` - Paramètres utilisateur

### Types
- Ajout de `NotificationSettings`, `NotificationType`, `NotificationPayload` dans `types/index.ts`
- Ajout des champs `fcmTokens` et `notificationSettings` dans `User`

---

## 🚀 Utilisation

### Pour les utilisateurs

1. **Activer les notifications** :
   - Menu profil → **Notifications**
   - Cliquer sur **Activer**
   - Autoriser les notifications dans le navigateur

2. **Personnaliser les préférences** :
   - Choisir les types de notifications à recevoir
   - Activer/désactiver email ou push
   - Sauvegarder

### Pour les admins

1. **Envoyer une notification manuelle** :
   - Menu **Maintenance** → **Envoyer notifications**
   - Choisir les destinataires (tous, par rôle, par catégorie, ou personnalisé)
   - Rédiger le titre et le message
   - Envoyer

2. **Notifications automatiques** :
   Les notifications sont automatiquement envoyées lors de :
   - ✅ Nouvelle affectation à une mission
   - ✅ Désaffectation d'une mission
   - ✅ Modification d'une mission
   - ✅ Annulation d'une mission
   - ✅ Rappel 24h avant une mission (à implémenter avec un cron job)

---

## 🔔 Types de notifications

| Type | Description | Icône |
|------|-------------|-------|
| `new_assignment` | Affectation à une mission | 🎯 |
| `mission_update` | Modification de mission | ⚠️ |
| `mission_reminder` | Rappel avant mission | 🔔 |
| `mission_cancellation` | Annulation de mission | ❌ |
| `category_message` | Message du responsable | 💬 |
| `general_announcement` | Annonce générale | 📢 |

---

## 📊 Données Firestore

### Structure User avec notifications

```typescript
{
  uid: string;
  // ... autres champs
  fcmTokens?: string[]; // Tokens FCM (multi-appareils)
  notificationSettings?: {
    pushEnabled: boolean;
    emailEnabled: boolean;
    newAssignment: boolean;
    missionUpdate: boolean;
    missionReminder: boolean;
    missionCancellation: boolean;
    categoryMessages: boolean;
    generalAnnouncements: boolean;
  };
}
```

---

## 🧪 Tester les notifications

### En développement

1. Lancer l'app : `npm run dev`
2. Ouvrir deux onglets :
   - Onglet 1 : Compte bénévole → Activer les notifications
   - Onglet 2 : Compte admin → Envoyer une notification

3. Vérifier que la notification apparaît dans l'onglet 1

### En production

1. Activer les notifications sur votre compte
2. Fermer complètement le navigateur
3. Demander à un admin d'envoyer une notification
4. Vérifier que la notification apparaît même navigateur fermé

---

## 🐛 Dépannage

### Les notifications ne s'affichent pas

1. **Vérifier la permission du navigateur** :
   - Chrome : `chrome://settings/content/notifications`
   - Firefox : Paramètres → Vie privée et sécurité → Notifications
   - Autoriser les notifications pour votre domaine

2. **Vérifier la clé VAPID** :
   ```bash
   # Dans la console du navigateur
   console.log(process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY)
   ```

3. **Vérifier le Service Worker** :
   - Ouvrir DevTools → Application → Service Workers
   - Vérifier que `firebase-messaging-sw.js` est enregistré

4. **Vérifier les tokens FCM** :
   - Aller dans Firestore → Collection `users` → Votre document
   - Vérifier que le champ `fcmTokens` contient des tokens

### Erreur "messaging/invalid-registration-token"

- Token invalide ou expiré
- Le système nettoie automatiquement les tokens invalides
- L'utilisateur doit réactiver les notifications

---

## 📈 Prochaines améliorations

- [ ] Système de rappel automatique 24h avant missions (Cron job)
- [ ] Historique des notifications envoyées
- [ ] Statistiques de réception (taux d'ouverture)
- [ ] Notifications par catégorie pour les responsables
- [ ] Templates de notifications prédéfinis

---

## 💡 Notes importantes

- **Gratuit et illimité** : FCM est 100% gratuit
- **Multi-appareils** : Un utilisateur peut recevoir des notifications sur plusieurs appareils
- **Respect de la vie privée** : Les utilisateurs contrôlent leurs préférences
- **Fallback email** : Si push échoue, l'email est envoyé automatiquement
- **Nettoyage automatique** : Les tokens invalides sont supprimés automatiquement

---

## 📚 Ressources

- [Documentation Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)
- [Web Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)











