# Configuration des Variables d'Environnement Vercel

## 🔐 Firebase Admin SDK

Pour que l'API de migration fonctionne, tu dois configurer les variables d'environnement Firebase Admin sur Vercel.

## 📋 Étapes à suivre

### 1. Récupère ta clé de service Firebase

Tu as déjà ce fichier : `benevoles3-a85b4-firebase-adminsdk-fbsvc-675562f571.json`

### 2. Ouvre le fichier et copie le contenu

Le fichier contient quelque chose comme :
```json
{
  "type": "service_account",
  "project_id": "benevoles3-a85b4",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-...@benevoles3-a85b4.iam.gserviceaccount.com",
  "client_id": "...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  ...
}
```

### 3. Convertis en une seule ligne (minifié)

Tu peux utiliser ce site : https://jsonformatter.org/json-minify

Ou simplement copier tout le contenu du fichier en une seule ligne.

### 4. Va sur Vercel

1. **Connecte-toi sur** : https://vercel.com
2. **Va dans ton projet** : benevoles3
3. **Settings** → **Environment Variables**

### 5. Ajoute la variable

**Nom** : `FIREBASE_SERVICE_ACCOUNT_KEY`

**Valeur** : Colle tout le contenu JSON minifié (une seule ligne)

**Environnements** : Coche **Production**, **Preview**, **Development**

### 6. Redéploie

Clique sur **Deployments** → Dernier déploiement → Menu (3 points) → **Redeploy**

---

## ✅ Vérification

Une fois configuré, retourne sur :
```
https://benevoles3.vercel.app/api/migrate-categories
```

Et clique sur "Lancer la migration" !

---

## 🆘 Alternative : Utiliser l'interface de gestion des catégories

Si tu préfères, tu peux créer les catégories directement via l'interface admin une fois qu'elle sera déployée :

1. Va sur `/dashboard/admin/categories`
2. Clique sur "Nouvelle catégorie"
3. Crée les catégories manuellement

C'est plus long mais ça évite le problème de configuration.























