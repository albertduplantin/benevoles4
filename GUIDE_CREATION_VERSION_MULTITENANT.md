# 🚀 Guide : Créer une Version Multitenant sans Toucher à l'Application Actuelle

## 📋 Vue d'ensemble

Cette approche vous permet de :
- ✅ Garder l'application actuelle fonctionnelle pour le Festival de Dinan
- ✅ Développer la version SaaS multitenant en parallèle
- ✅ Tester sans risque
- ✅ Migrer progressivement quand vous êtes prêt
- ✅ Avoir deux déploiements distincts (production + développement)

---

## 🎯 Architecture des deux projets

```
📁 benevoles3/                           # Projet actuel (PRODUCTION)
   └── Application mono-tenant pour Festival Dinan
   
📁 benevoles-saas/                       # Nouveau projet (DÉVELOPPEMENT)
   └── Version multitenant commerciale
```

---

## Étape 1 : Créer le nouveau projet multitenant

### Option A : Duplication locale (Recommandée)

```bash
# 1. Remonter au dossier parent
cd D:\Documents\aiprojets\benevoles3

# 2. Créer une copie complète du projet
# Sur Windows PowerShell :
Copy-Item -Path "benevoles3" -Destination "benevoles-saas" -Recurse

# Ou en ligne de commande :
xcopy /E /I benevoles3 benevoles-saas

# 3. Accéder au nouveau projet
cd benevoles-saas

# 4. Nettoyer les éléments non nécessaires
Remove-Item -Recurse -Force node_modules
Remove-Item -Recurse -Force .next
Remove-Item -Recurse -Force .vercel
Remove-Item -Force .env.local

# 5. Réinitialiser Git pour avoir un nouveau dépôt
Remove-Item -Recurse -Force .git
git init
git add .
git commit -m "feat: initial commit - fork from benevoles3 for multitenant version"

# 6. Créer un nouveau dépôt GitHub
# Aller sur github.com et créer "benevoles-saas"
git remote add origin https://github.com/VOTRE-USERNAME/benevoles-saas.git
git branch -M main
git push -u origin main
```

### Option B : Fork Git (Alternative)

```bash
# Si vous préférez garder l'historique Git

# 1. Cloner le projet actuel
cd D:\Documents\aiprojets\benevoles3
git clone https://github.com/VOTRE-USERNAME/benevoles3.git benevoles-saas

# 2. Accéder au nouveau projet
cd benevoles-saas

# 3. Changer l'origine Git
git remote remove origin
git remote add origin https://github.com/VOTRE-USERNAME/benevoles-saas.git

# 4. Nettoyer et préparer
Remove-Item -Recurse -Force node_modules
Remove-Item -Recurse -Force .next
Remove-Item -Force .env.local

# 5. Créer une branche de développement multitenant
git checkout -b feature/multitenant-architecture
git push -u origin feature/multitenant-architecture
```

---

## Étape 2 : Adapter la configuration du nouveau projet

### 2.1 Modifier package.json

```bash
cd benevoles-saas
```

**Ouvrir `package.json` et modifier :**

```json
{
  "name": "benevoles-saas",
  "version": "0.1.0",
  "description": "Plateforme SaaS multitenant pour la gestion de bénévoles",
  "private": true,
  "scripts": {
    "dev": "next dev --port 3001",
    "build": "next build",
    "start": "next start --port 3001",
    "lint": "next lint",
    "format": "prettier --write \"**/*.{js,jsx,ts,tsx,json,md}\"",
    "format:check": "prettier --check \"**/*.{js,jsx,ts,tsx,json,md}\"",
    "prepare": "husky install",
    "migrate:setup": "tsx scripts/setup-multitenant.ts",
    "migrate:data": "tsx scripts/migrate-to-multitenant.ts"
  },
  "dependencies": {
    "@ducanh2912/next-pwa": "^10.2.9",
    "@hookform/resolvers": "^3.10.0",
    "@radix-ui/react-alert-dialog": "^1.1.15",
    "@radix-ui/react-avatar": "^1.1.10",
    "@radix-ui/react-checkbox": "^1.3.3",
    "@radix-ui/react-dialog": "^1.1.15",
    "@radix-ui/react-dropdown-menu": "^2.1.16",
    "@radix-ui/react-label": "^2.1.7",
    "@radix-ui/react-select": "^2.2.6",
    "@radix-ui/react-separator": "^1.1.7",
    "@radix-ui/react-slot": "^1.2.3",
    "@radix-ui/react-switch": "^1.2.6",
    "@radix-ui/react-tabs": "^1.1.13",
    "@radix-ui/react-tooltip": "^1.2.8",
    "@tailwindcss/postcss": "^4.1.14",
    "@tanstack/react-query": "^5.62.14",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "date-fns": "^4.1.0",
    "firebase": "^11.2.0",
    "firebase-admin": "^13.5.0",
    "jspdf": "^3.0.3",
    "jspdf-autotable": "^5.0.2",
    "lucide-react": "^0.544.0",
    "moment": "^2.30.1",
    "next": "15.5.4",
    "next-themes": "^0.4.6",
    "react": "^19.0.0",
    "react-big-calendar": "^1.19.4",
    "react-dom": "^19.0.0",
    "react-hook-form": "^7.63.0",
    "resend": "^6.4.0",
    "sonner": "^2.0.7",
    "stripe": "^17.5.0",
    "@stripe/stripe-js": "^4.12.0",
    "tailwind-merge": "^3.3.1",
    "xlsx": "^0.18.5",
    "xlsx-js-style": "^1.2.0",
    "zod": "^3.25.76"
  },
  "devDependencies": {
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-big-calendar": "^1.16.3",
    "@types/react-dom": "^19",
    "@typescript-eslint/eslint-plugin": "^8.20.0",
    "@typescript-eslint/parser": "^8.20.0",
    "eslint": "^8",
    "eslint-config-next": "15.5.4",
    "eslint-config-prettier": "^9.1.0",
    "husky": "^9.1.7",
    "lint-staged": "^15.3.0",
    "postcss": "^8",
    "prettier": "^3.4.2",
    "tailwindcss": "^4.0.0",
    "tsx": "^4.20.6",
    "typescript": "^5"
  }
}
```

### 2.2 Créer un nouveau fichier .env.local.example

**`.env.local.example`**

```env
# Firebase Web Config (Client)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_VAPID_KEY=

# Firebase Admin SDK (Server)
FIREBASE_ADMIN_PROJECT_ID=
FIREBASE_ADMIN_CLIENT_EMAIL=
FIREBASE_ADMIN_PRIVATE_KEY=

# Stripe Configuration
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3001
NEXT_PUBLIC_APP_NAME=Bénévoles SaaS
NEXT_PUBLIC_SUPPORT_EMAIL=support@benevoles-saas.com

# Email Configuration (Resend)
RESEND_API_KEY=

# Feature Flags (pour activer progressivement les fonctionnalités)
NEXT_PUBLIC_ENABLE_MULTITENANT=true
NEXT_PUBLIC_ENABLE_BILLING=true
NEXT_PUBLIC_ENABLE_CUSTOM_DOMAINS=false
```

### 2.3 Modifier README.md

**`README.md`**

```markdown
# 🚀 Bénévoles SaaS - Plateforme Multitenant

> Version SaaS multitenant de l'application de gestion de bénévoles

## 🎯 Différences avec benevoles3

Cette version est une évolution de l'application `benevoles3` avec les ajouts suivants :

- ✅ **Architecture multitenant** : Plusieurs organisations sur une seule instance
- ✅ **Gestion des abonnements** : Intégration Stripe pour les paiements
- ✅ **Plans tarifaires** : Free, Starter, Pro, Enterprise
- ✅ **Isolation des données** : Sécurité renforcée par organisation
- ✅ **Personnalisation** : Branding par organisation
- ✅ **API publique** : Pour les plans Pro et Enterprise

## 🏗 Architecture

```
organizations/              # Nouvelle collection
├── {orgId}/
    ├── name, slug, domain
    ├── subscription (Stripe)
    ├── settings (branding, features, limits)
    └── owner

users/                     # Modifiée
├── {userId}/
    ├── organizationId     # 🆕 AJOUTÉ
    └── ...

missions/                  # Modifiée
├── {missionId}/
    ├── organizationId     # 🆕 AJOUTÉ
    └── ...
```

## 🚀 Installation

```bash
# Installer les dépendances
npm install

# Installer Stripe CLI (pour tester les webhooks)
# https://stripe.com/docs/stripe-cli

# Configurer les variables d'environnement
cp .env.local.example .env.local
# Remplir les valeurs

# Lancer le serveur de développement (port 3001)
npm run dev
```

## 📦 Scripts de migration

```bash
# Initialiser la structure multitenant
npm run migrate:setup

# Migrer des données existantes
npm run migrate:data
```

## 🔐 Configuration Firebase

Ce projet nécessite un **nouveau projet Firebase** distinct de `benevoles3`.

1. Créer un nouveau projet : `benevoles-saas`
2. Activer Authentication, Firestore, Storage
3. Configurer les règles de sécurité (voir `firestore.rules`)

## 💳 Configuration Stripe

1. Créer un compte Stripe (ou utiliser le mode test)
2. Créer les produits et prix
3. Configurer le webhook endpoint
4. Activer le portail client

Voir le guide détaillé dans `GUIDE_MULTITENANT_ET_COMMERCIALISATION.md`

## 🧪 Tests des webhooks Stripe en local

```bash
# Terminal 1 : Lancer l'application
npm run dev

# Terminal 2 : Lancer le CLI Stripe
stripe listen --forward-to localhost:3001/api/stripe/webhook

# Terminal 3 : Tester un événement
stripe trigger checkout.session.completed
```

## 📊 Projets séparés

- **benevoles3** : Application mono-tenant pour Festival Dinan (PRODUCTION)
- **benevoles-saas** : Plateforme multitenant commerciale (CE PROJET)

---

Développé avec ❤️ pour révolutionner la gestion des bénévoles
```

---

## Étape 3 : Configurer les environnements Firebase séparés

### 3.1 Créer un nouveau projet Firebase

```bash
# Ne PAS utiliser le projet Firebase actuel !
```

**Aller sur [console.firebase.google.com](https://console.firebase.google.com/)**

1. Créer un nouveau projet : `benevoles-saas`
2. Activer les services :
   - Authentication (Email/Password + Google)
   - Firestore Database (mode production)
   - Storage

### 3.2 Configurer Firebase dans le projet

**`.firebaserc`** (nouveau fichier)

```json
{
  "projects": {
    "default": "benevoles-saas",
    "production": "benevoles-saas",
    "development": "benevoles-saas-dev"
  }
}
```

**`firebase.json`**

```json
{
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  },
  "storage": {
    "rules": "storage.rules"
  },
  "hosting": {
    "public": "out",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ]
  }
}
```

### 3.3 Créer les nouvelles règles Firestore

**`firestore.rules`** (remplacer le contenu)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // ============================================
    // HELPER FUNCTIONS
    // ============================================
    
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function getUserData() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data;
    }
    
    function getOrgData(orgId) {
      return get(/databases/$(database)/documents/organizations/$(orgId)).data;
    }
    
    function isAdmin() {
      return isAuthenticated() && getUserData().role == 'admin';
    }
    
    function belongsToSameOrg(orgId) {
      return isAuthenticated() && getUserData().organizationId == orgId;
    }
    
    function isOrgOwner(orgId) {
      let org = getOrgData(orgId);
      return isAuthenticated() && org.owner == request.auth.uid;
    }
    
    function isOrgActive(orgId) {
      let org = getOrgData(orgId);
      return org.status == 'active' || org.status == 'trial';
    }
    
    function hasOrgFeature(orgId, feature) {
      let org = getOrgData(orgId);
      return org.settings.features[feature] == true;
    }
    
    // ============================================
    // ORGANIZATIONS
    // ============================================
    
    match /organizations/{orgId} {
      allow read: if belongsToSameOrg(orgId) || isOrgOwner(orgId);
      
      allow create: if isAuthenticated() && 
                      request.resource.data.owner == request.auth.uid;
      
      allow update: if isOrgOwner(orgId) || 
                      (isAdmin() && belongsToSameOrg(orgId));
      
      allow delete: if isOrgOwner(orgId);
      
      // Sous-collection : paramètres de facturation (lecture seule pour les membres)
      match /billing/{document=**} {
        allow read: if belongsToSameOrg(orgId);
        allow write: if isOrgOwner(orgId);
      }
    }
    
    // ============================================
    // USERS
    // ============================================
    
    match /users/{userId} {
      allow read: if isAuthenticated() && 
                    (belongsToSameOrg(resource.data.organizationId) || 
                     request.auth.uid == userId);
      
      allow create: if isAuthenticated() && 
                      request.auth.uid == userId;
      
      allow update: if isAuthenticated() && 
                      (request.auth.uid == userId || 
                       (isAdmin() && belongsToSameOrg(resource.data.organizationId)));
      
      allow delete: if (isAdmin() && belongsToSameOrg(resource.data.organizationId)) ||
                      request.auth.uid == userId;
    }
    
    // ============================================
    // MISSIONS
    // ============================================
    
    match /missions/{missionId} {
      allow read: if isAuthenticated() && 
                    belongsToSameOrg(resource.data.organizationId) &&
                    isOrgActive(resource.data.organizationId);
      
      allow create: if isAuthenticated() && 
                      belongsToSameOrg(request.resource.data.organizationId) &&
                      isOrgActive(request.resource.data.organizationId) &&
                      (isAdmin() || getUserData().role == 'category_responsible');
      
      allow update: if isAuthenticated() && 
                      belongsToSameOrg(resource.data.organizationId) &&
                      isOrgActive(resource.data.organizationId) &&
                      (isAdmin() || 
                       getUserData().role == 'category_responsible' ||
                       isVolunteerRegistration());
      
      allow delete: if isAuthenticated() && 
                      belongsToSameOrg(resource.data.organizationId) &&
                      (isAdmin() || getUserData().role == 'category_responsible');
    }
    
    function isVolunteerRegistration() {
      let oldVolunteers = resource.data.volunteers;
      let newVolunteers = request.resource.data.volunteers;
      let userAdded = request.auth.uid in newVolunteers && !(request.auth.uid in oldVolunteers);
      let userRemoved = !(request.auth.uid in newVolunteers) && request.auth.uid in oldVolunteers;
      let onlyVolunteersChanged = request.resource.data.diff(resource.data).affectedKeys().hasOnly(['volunteers', 'updatedAt', 'status']);
      
      return (userAdded || userRemoved) && onlyVolunteersChanged;
    }
    
    // ============================================
    // VOLUNTEER REQUESTS
    // ============================================
    
    match /volunteerRequests/{requestId} {
      allow read: if isAuthenticated() && 
                    belongsToSameOrg(resource.data.organizationId);
      
      allow create: if isAuthenticated() && 
                      belongsToSameOrg(request.resource.data.organizationId) &&
                      request.auth.uid == request.resource.data.userId;
      
      allow update: if isAuthenticated() && 
                      belongsToSameOrg(resource.data.organizationId) &&
                      isAdmin();
      
      allow delete: if isAuthenticated() && 
                      belongsToSameOrg(resource.data.organizationId) &&
                      isAdmin();
    }
    
    // ============================================
    // ORGANIZATION INVITATIONS
    // ============================================
    
    match /organizationInvitations/{invitationId} {
      allow read: if isAuthenticated() && 
                    (belongsToSameOrg(resource.data.organizationId) ||
                     request.auth.token.email == resource.data.email);
      
      allow create: if isAuthenticated() && 
                      (isOrgOwner(request.resource.data.organizationId) || 
                       isAdmin());
      
      allow update: if isAuthenticated();
      
      allow delete: if isAuthenticated() && 
                      (isOrgOwner(resource.data.organizationId) || 
                       isAdmin());
    }
    
    // ============================================
    // SUBSCRIPTION EVENTS (logs Stripe)
    // ============================================
    
    match /subscriptionEvents/{eventId} {
      allow read: if false; // Admin uniquement via API
      allow write: if false; // Webhook uniquement
    }
  }
}
```

---

## Étape 4 : Stratégie de développement progressive

### 4.1 Roadmap de développement

**Phase 1 : Fondations (Semaines 1-2)**

```bash
git checkout -b phase1/foundations
```

- [ ] Créer les types TypeScript pour les organisations
- [ ] Mettre à jour le schéma Firestore
- [ ] Adapter les règles de sécurité
- [ ] Créer le contexte OrganizationProvider

**Phase 2 : Authentification multitenant (Semaines 3-4)**

```bash
git checkout -b phase2/auth-multitenant
```

- [ ] Modifier le flux d'inscription (ajout organisation)
- [ ] Créer la page de création d'organisation
- [ ] Implémenter le système d'invitation
- [ ] Adapter le AuthProvider

**Phase 3 : Intégration Stripe (Semaines 5-6)**

```bash
git checkout -b phase3/stripe-integration
```

- [ ] Configurer Stripe
- [ ] Créer les API routes (checkout, webhook, portal)
- [ ] Implémenter la page de facturation
- [ ] Tester les webhooks

**Phase 4 : Interface et UX (Semaines 7-8)**

```bash
git checkout -b phase4/ui-ux
```

- [ ] Créer le dashboard d'administration organisation
- [ ] Page de gestion des membres
- [ ] Personnalisation du branding
- [ ] Gestion des limites et quotas

**Phase 5 : Migration et tests (Semaines 9-10)**

```bash
git checkout -b phase5/migration-testing
```

- [ ] Scripts de migration
- [ ] Tests approfondis
- [ ] Documentation
- [ ] Préparation du déploiement

### 4.2 Structure des branches Git

```
main (stable, prêt pour production)
│
├── develop (intégration continue)
│   │
│   ├── phase1/foundations
│   ├── phase2/auth-multitenant
│   ├── phase3/stripe-integration
│   ├── phase4/ui-ux
│   └── phase5/migration-testing
│
└── feature/xxx (fonctionnalités ponctuelles)
```

**Workflow Git recommandé :**

```bash
# Créer une branche de fonctionnalité
git checkout develop
git checkout -b feature/organizations-model

# Développer et commiter
git add .
git commit -m "feat(org): add organization TypeScript types"

# Merger dans develop
git checkout develop
git merge feature/organizations-model

# Quand une phase est terminée et testée
git checkout main
git merge develop
git tag -a v0.2.0 -m "Phase 1: Foundations complete"
git push origin main --tags
```

---

## Étape 5 : Configuration des déploiements séparés

### 5.1 Vercel - Deux projets distincts

**Projet 1 : benevoles3 (Production actuelle)**
- URL : `benevoles-dinan.vercel.app`
- Branche : `main`
- Variables d'environnement : Firebase projet `benevoles3-a85b4`

**Projet 2 : benevoles-saas (Nouveau)**
- URL : `benevoles-saas.vercel.app` (ou `app.benevoles-saas.com`)
- Branche : `main`
- Variables d'environnement : Firebase projet `benevoles-saas`

### 5.2 Déployer le nouveau projet sur Vercel

```bash
cd benevoles-saas

# Installer Vercel CLI si nécessaire
npm install -g vercel

# Se connecter
vercel login

# Lier le projet (créer un NOUVEAU projet)
vercel link --project=benevoles-saas

# Configurer les variables d'environnement
vercel env add NEXT_PUBLIC_FIREBASE_API_KEY production
vercel env add NEXT_PUBLIC_FIREBASE_PROJECT_ID production
# ... (toutes les variables)

# Déployer en preview d'abord
vercel

# Puis en production quand prêt
vercel --prod
```

### 5.3 Configuration des domaines

**Projet actuel (benevoles3)** :
- Garder le domaine actuel si vous en avez un
- Ou `festival-dinan.vercel.app`

**Nouveau projet (benevoles-saas)** :
- Acheter un domaine : `benevoles-saas.com` ou `gestion-benevoles.fr`
- Configurer dans Vercel : `app.benevoles-saas.com`
- Sous-domaine marketing : `www.benevoles-saas.com` (site vitrine)

---

## Étape 6 : Script d'initialisation du projet

Créer un script pour automatiser la mise en place initiale :

**`scripts/init-project.sh`**

```bash
#!/bin/bash

echo "🚀 Initialisation du projet benevoles-saas"
echo "==========================================="

# Vérifier qu'on est dans le bon répertoire
if [ ! -f "package.json" ]; then
    echo "❌ Erreur: package.json introuvable. Êtes-vous dans le bon répertoire ?"
    exit 1
fi

# Installer les dépendances
echo "📦 Installation des dépendances..."
npm install

# Installer Stripe CLI si pas présent (macOS/Linux)
if ! command -v stripe &> /dev/null; then
    echo "⚠️  Stripe CLI non trouvé."
    echo "Installez-le depuis : https://stripe.com/docs/stripe-cli"
fi

# Créer le fichier .env.local s'il n'existe pas
if [ ! -f ".env.local" ]; then
    echo "📝 Création du fichier .env.local..."
    cp .env.local.example .env.local
    echo "⚠️  IMPORTANT: Remplissez .env.local avec vos valeurs Firebase et Stripe"
else
    echo "✅ .env.local existe déjà"
fi

# Installer Husky
echo "🐶 Configuration de Husky..."
npm run prepare

# Créer les dossiers nécessaires
mkdir -p scripts
mkdir -p docs
mkdir -p public/logos

echo ""
echo "✅ Initialisation terminée !"
echo ""
echo "📋 Prochaines étapes :"
echo "   1. Remplir .env.local avec vos valeurs"
echo "   2. Créer le projet Firebase 'benevoles-saas'"
echo "   3. Configurer Stripe"
echo "   4. Lancer le serveur : npm run dev"
echo ""
```

**Pour Windows, créer `scripts/init-project.ps1` :**

```powershell
Write-Host "🚀 Initialisation du projet benevoles-saas" -ForegroundColor Green
Write-Host "==========================================="

# Vérifier le répertoire
if (-Not (Test-Path "package.json")) {
    Write-Host "❌ Erreur: package.json introuvable" -ForegroundColor Red
    exit 1
}

# Installer les dépendances
Write-Host "📦 Installation des dépendances..."
npm install

# Créer .env.local
if (-Not (Test-Path ".env.local")) {
    Write-Host "📝 Création du fichier .env.local..."
    Copy-Item ".env.local.example" ".env.local"
    Write-Host "⚠️  IMPORTANT: Remplissez .env.local" -ForegroundColor Yellow
}

# Installer Husky
Write-Host "🐶 Configuration de Husky..."
npm run prepare

# Créer les dossiers
New-Item -ItemType Directory -Force -Path "scripts" | Out-Null
New-Item -ItemType Directory -Force -Path "docs" | Out-Null
New-Item -ItemType Directory -Force -Path "public/logos" | Out-Null

Write-Host ""
Write-Host "✅ Initialisation terminée !" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Prochaines étapes :"
Write-Host "   1. Remplir .env.local avec vos valeurs"
Write-Host "   2. Créer le projet Firebase 'benevoles-saas'"
Write-Host "   3. Configurer Stripe"
Write-Host "   4. Lancer le serveur : npm run dev"
```

---

## Étape 7 : Checklist de démarrage

### ✅ Préparation

- [ ] Créer une copie du projet dans `benevoles-saas`
- [ ] Nettoyer node_modules, .next, .vercel
- [ ] Initialiser un nouveau dépôt Git
- [ ] Créer le dépôt GitHub `benevoles-saas`
- [ ] Pousser le code initial

### ✅ Configuration Firebase

- [ ] Créer le projet Firebase `benevoles-saas`
- [ ] Activer Authentication
- [ ] Activer Firestore Database
- [ ] Activer Storage
- [ ] Copier les clés dans .env.local
- [ ] Déployer les règles de sécurité

### ✅ Configuration Stripe

- [ ] Créer un compte Stripe (mode test)
- [ ] Créer les produits (Starter, Pro, Enterprise)
- [ ] Créer les prix mensuels
- [ ] Générer les clés API
- [ ] Configurer le webhook endpoint (plus tard)
- [ ] Copier les clés dans .env.local

### ✅ Développement

- [ ] Installer les dépendances (npm install)
- [ ] Installer Stripe CLI
- [ ] Lancer le serveur de dev (port 3001)
- [ ] Vérifier que l'app démarre sans erreur
- [ ] Commencer la Phase 1

### ✅ Documentation

- [ ] Lire le guide multitenant complet
- [ ] Créer un projet board (Trello/GitHub Projects)
- [ ] Définir les priorités
- [ ] Planifier les phases

---

## Étape 8 : Organisation du travail

### Structure de dossiers recommandée

```
D:\Documents\aiprojets\benevoles3\
│
├── benevoles3/                          # Projet PRODUCTION (ne pas toucher)
│   ├── .git/
│   ├── node_modules/
│   ├── .env.local                       # Variables Firebase benevoles3-a85b4
│   └── ...
│
├── benevoles-saas/                      # Projet DÉVELOPPEMENT (nouveau)
│   ├── .git/                            # Nouveau dépôt Git
│   ├── node_modules/
│   ├── .env.local                       # Variables Firebase benevoles-saas
│   ├── types/
│   │   ├── index.ts                     # Types existants
│   │   └── organization.ts              # 🆕 Nouveaux types
│   ├── lib/
│   │   ├── stripe/                      # 🆕 Configuration Stripe
│   │   └── middleware/                  # 🆕 Vérification limites
│   ├── components/
│   │   └── providers/
│   │       └── organization-provider.tsx # 🆕 Context organisation
│   ├── app/
│   │   ├── (auth)/
│   │   │   └── signup/                  # Modifié pour multitenant
│   │   ├── (dashboard)/
│   │   │   ├── billing/                 # 🆕 Page facturation
│   │   │   └── organization/            # 🆕 Gestion organisation
│   │   └── api/
│   │       └── stripe/                  # 🆕 API routes Stripe
│   ├── scripts/
│   │   ├── init-project.ps1
│   │   ├── setup-multitenant.ts         # 🆕 Configuration initiale
│   │   └── migrate-to-multitenant.ts    # 🆕 Migration données
│   ├── docs/
│   │   └── GUIDE_*.md                   # Documentation
│   └── README.md                        # Nouveau README
│
└── docs-communs/                        # Documentation partagée (optionnel)
    ├── business-plan.md
    ├── tarification.md
    └── roadmap.md
```

### Workflow quotidien

**Travailler sur benevoles3 (production) :**

```bash
cd D:\Documents\aiprojets\benevoles3\benevoles3
code .  # Ouvrir dans VS Code

# Faire vos modifications
git add .
git commit -m "fix: correction bug xxx"
git push origin main

# Déploie automatiquement sur Vercel
```

**Travailler sur benevoles-saas (développement) :**

```bash
cd D:\Documents\aiprojets\benevoles3\benevoles-saas
code .  # Ouvrir dans une nouvelle fenêtre VS Code

# Créer une branche de fonctionnalité
git checkout -b feature/organizations-model

# Développer
npm run dev  # Port 3001 pour ne pas conflit avec 3000

# Commiter
git add .
git commit -m "feat(org): add organization types"
git push origin feature/organizations-model

# Créer une Pull Request sur GitHub
# Après review, merger dans develop
```

### Utiliser les deux projets simultanément

Vous pouvez lancer les deux applications en même temps :

**Terminal 1 (benevoles3 - port 3000) :**
```bash
cd benevoles3
npm run dev
```

**Terminal 2 (benevoles-saas - port 3001) :**
```bash
cd benevoles-saas
npm run dev
```

Accès :
- Application production : http://localhost:3000
- Application SaaS (dev) : http://localhost:3001

---

## Étape 9 : Premier commit du nouveau projet

```bash
cd D:\Documents\aiprojets\benevoles3\benevoles-saas

# Vérifier le statut
git status

# Ajouter tous les fichiers
git add .

# Premier commit
git commit -m "feat: initial setup of multitenant SaaS version

- Fork from benevoles3
- Setup for multitenant architecture
- Added Stripe dependencies
- Updated README for SaaS version
- Configured for port 3001
- Created separate Firebase project structure

This is the foundation for the commercial SaaS platform.
The original benevoles3 remains untouched for production use."

# Créer le dépôt sur GitHub (via interface web)
# Puis pousser
git remote add origin https://github.com/VOTRE-USERNAME/benevoles-saas.git
git branch -M main
git push -u origin main

# Créer la branche develop
git checkout -b develop
git push -u origin develop

# Créer la première branche de fonctionnalité
git checkout -b phase1/foundations
```

---

## 🎯 Résumé des commandes à exécuter

```powershell
# 1. Dupliquer le projet
cd D:\Documents\aiprojets\benevoles3
Copy-Item -Path "benevoles3" -Destination "benevoles-saas" -Recurse

# 2. Préparer le nouveau projet
cd benevoles-saas
Remove-Item -Recurse -Force node_modules, .next, .vercel
Remove-Item -Force .env.local

# 3. Réinitialiser Git
Remove-Item -Recurse -Force .git
git init

# 4. Installer les dépendances
npm install
npm install stripe @stripe/stripe-js

# 5. Créer .env.local
cp .env.local.example .env.local
# Remplir avec les nouvelles valeurs Firebase

# 6. Premier commit
git add .
git commit -m "feat: initial setup of multitenant SaaS version"

# 7. Créer le dépôt GitHub et pousser
# (créer via interface GitHub d'abord)
git remote add origin https://github.com/VOTRE-USERNAME/benevoles-saas.git
git branch -M main
git push -u origin main

# 8. Lancer le serveur
npm run dev

# L'application démarre sur http://localhost:3001
```

---

## 📞 Support et ressources

### Documentation utile

- [Guide multitenant complet](./GUIDE_MULTITENANT_ET_COMMERCIALISATION.md)
- [Documentation Stripe](https://stripe.com/docs)
- [Firebase Multitenant](https://firebase.google.com/docs/projects/multitenancy)
- [Next.js App Router](https://nextjs.org/docs/app)

### Aide et questions

Si vous avez besoin d'aide pour :
- Configurer Firebase ou Stripe
- Implémenter une fonctionnalité spécifique
- Déboguer un problème
- Planifier l'architecture

N'hésitez pas à demander !

---

## ✅ Vous êtes prêt !

Vous avez maintenant :
- ✅ Un projet `benevoles3` intact pour la production
- ✅ Un nouveau projet `benevoles-saas` pour le développement
- ✅ Une stratégie claire de développement par phases
- ✅ Deux environnements Firebase séparés
- ✅ Une roadmap de développement structurée

**Prochaine étape** : Créer le nouveau projet et commencer la Phase 1 ! 🚀

