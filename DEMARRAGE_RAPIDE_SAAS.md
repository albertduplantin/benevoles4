# 🚀 Démarrage Rapide - Version SaaS

## Création automatique du projet SaaS en 5 minutes

### Méthode 1 : Script automatisé (Recommandé) ⚡

```powershell
# 1. Ouvrir PowerShell dans le dossier benevoles3
cd D:\Documents\aiprojets\benevoles3\benevoles3

# 2. Exécuter le script
.\scripts\create-saas-version.ps1

# 3. Suivre les instructions à l'écran
```

Le script va automatiquement :
- ✅ Copier le projet vers `benevoles-saas`
- ✅ Nettoyer les dossiers inutiles
- ✅ Réinitialiser Git
- ✅ Modifier package.json (port 3001)
- ✅ Installer les dépendances (incluant Stripe)
- ✅ Créer la structure de dossiers
- ✅ Créer .env.local.example

### Méthode 2 : Manuelle (Alternative)

```powershell
# Dupliquer le projet
cd D:\Documents\aiprojets\benevoles3
Copy-Item -Path "benevoles3" -Destination "benevoles-saas" -Recurse

# Préparer le nouveau projet
cd benevoles-saas
Remove-Item -Recurse -Force node_modules, .next, .vercel
Remove-Item -Force .env.local

# Réinitialiser Git
Remove-Item -Recurse -Force .git
git init
git add .
git commit -m "feat: initial commit for SaaS version"

# Installer les dépendances
npm install
npm install stripe @stripe/stripe-js
```

---

## Configuration initiale

### 1. Créer le projet Firebase

1. Aller sur https://console.firebase.google.com
2. Créer un nouveau projet : **`benevoles-saas`**
3. Activer :
   - Authentication (Email/Password + Google)
   - Firestore Database (mode production)
   - Storage
4. Copier les clés dans `.env.local`

### 2. Configurer Stripe (mode test)

1. Aller sur https://dashboard.stripe.com
2. Créer un compte ou se connecter
3. Passer en mode **Test**
4. Copier les clés dans `.env.local` :
   - `STRIPE_SECRET_KEY` (commençant par `sk_test_`)
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (commençant par `pk_test_`)

### 3. Remplir .env.local

```env
# Firebase (nouveau projet benevoles-saas)
NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=benevoles-saas
# ... autres valeurs Firebase

# Stripe (mode test)
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3001
```

### 4. Créer le dépôt GitHub

```powershell
# Via l'interface GitHub : créer "benevoles-saas"
# Puis :
git remote add origin https://github.com/VOTRE-USERNAME/benevoles-saas.git
git branch -M main
git push -u origin main
```

### 5. Lancer le projet

```powershell
npm run dev
```

Accéder à http://localhost:3001

---

## Les deux projets en parallèle

### Projet 1 : benevoles3 (Production)
- **Port** : 3000
- **Firebase** : benevoles3-a85b4
- **Usage** : Festival Dinan (production)
- **Déploiement** : Vercel (actuel)

### Projet 2 : benevoles-saas (Développement)
- **Port** : 3001  
- **Firebase** : benevoles-saas (nouveau)
- **Usage** : Développement multitenant
- **Déploiement** : Vercel (nouveau projet)

**Vous pouvez lancer les deux en même temps !**

**Terminal 1 :**
```powershell
cd benevoles3
npm run dev  # → http://localhost:3000
```

**Terminal 2 :**
```powershell
cd benevoles-saas
npm run dev  # → http://localhost:3001
```

---

## Roadmap de développement

### Phase 1 : Fondations (2 semaines)
```powershell
git checkout -b phase1/foundations
```

- [ ] Créer `types/organization.ts`
- [ ] Créer `components/providers/organization-provider.tsx`
- [ ] Mettre à jour les règles Firestore
- [ ] Adapter le modèle de données

**Fichiers à créer** :
- `types/organization.ts`
- `lib/stripe/config.ts`
- `components/providers/organization-provider.tsx`

### Phase 2 : Auth multitenant (2 semaines)
```powershell
git checkout -b phase2/auth-multitenant
```

- [ ] Modifier `app/(auth)/signup/page.tsx`
- [ ] Créer le système d'invitation
- [ ] Adapter AuthProvider

### Phase 3 : Stripe (2 semaines)
```powershell
git checkout -b phase3/stripe-integration
```

- [ ] Créer `app/api/stripe/create-checkout-session/route.ts`
- [ ] Créer `app/api/stripe/webhook/route.ts`
- [ ] Créer `app/api/stripe/create-portal-session/route.ts`
- [ ] Créer `app/(dashboard)/billing/page.tsx`

### Phase 4 : Interface (2 semaines)
```powershell
git checkout -b phase4/ui-ux
```

- [ ] Dashboard organisation
- [ ] Gestion des membres
- [ ] Personnalisation branding

### Phase 5 : Tests et migration (2 semaines)
```powershell
git checkout -b phase5/migration-testing
```

- [ ] Scripts de migration
- [ ] Tests approfondis
- [ ] Documentation

---

## Commandes utiles

### Développement

```powershell
# Démarrer le serveur (port 3001)
npm run dev

# Build production
npm run build

# Linter
npm run lint

# Formater le code
npm run format
```

### Git

```powershell
# Créer une branche de fonctionnalité
git checkout -b feature/nom-fonctionnalite

# Commiter
git add .
git commit -m "feat: description"

# Pousser
git push origin feature/nom-fonctionnalite
```

### Stripe CLI (tester les webhooks)

```powershell
# Installer Stripe CLI : https://stripe.com/docs/stripe-cli

# Écouter les webhooks
stripe listen --forward-to localhost:3001/api/stripe/webhook

# Tester un événement
stripe trigger checkout.session.completed
```

---

## Documentation complète

- **[GUIDE_CREATION_VERSION_MULTITENANT.md](./GUIDE_CREATION_VERSION_MULTITENANT.md)** - Guide détaillé de création
- **[GUIDE_MULTITENANT_ET_COMMERCIALISATION.md](./GUIDE_MULTITENANT_ET_COMMERCIALISATION.md)** - Architecture et implémentation complète

---

## Checklist de démarrage

### ✅ Installation
- [ ] Script `create-saas-version.ps1` exécuté
- [ ] Dépendances installées
- [ ] Projet démarre sur port 3001

### ✅ Firebase
- [ ] Projet `benevoles-saas` créé
- [ ] Authentication activée
- [ ] Firestore créé
- [ ] Storage activé
- [ ] Clés copiées dans .env.local

### ✅ Stripe
- [ ] Compte créé (mode test)
- [ ] Clés API copiées
- [ ] Stripe CLI installé (optionnel)

### ✅ Git
- [ ] Dépôt local initialisé
- [ ] Dépôt GitHub créé
- [ ] Code poussé sur GitHub
- [ ] Branche develop créée

### ✅ Développement
- [ ] Guide multitenant lu
- [ ] Roadmap planifiée
- [ ] Première branche créée

---

## Support

### 📚 Ressources
- [Documentation Stripe](https://stripe.com/docs)
- [Firebase Docs](https://firebase.google.com/docs)
- [Next.js Docs](https://nextjs.org/docs)

### 💬 Questions ?
Besoin d'aide pour :
- Configuration Firebase/Stripe
- Architecture multitenant
- Implémentation des fonctionnalités

N'hésitez pas à demander !

---

## 🎯 Prêt à commencer !

```powershell
# 1. Exécuter le script
.\scripts\create-saas-version.ps1

# 2. Configurer Firebase et Stripe

# 3. Lancer le développement
cd ../benevoles-saas
npm run dev

# 4. Ouvrir dans le navigateur
# → http://localhost:3001
```

**Bon développement ! 🚀**

