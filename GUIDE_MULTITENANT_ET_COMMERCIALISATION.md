# 🚀 Guide de Transformation Multitenant et Commercialisation

## 📋 Table des Matières
1. [Option 1 : Prêter l'application aux associations](#option-1--prêter-lapplication-aux-associations)
2. [Option 2 : Transformation en SaaS Multitenant avec Stripe](#option-2--transformation-en-saas-multitenant-avec-stripe)
3. [Comparaison des deux approches](#comparaison-des-deux-approches)
4. [Roadmap de mise en œuvre](#roadmap-de-mise-en-œuvre)

---

## Option 1 : Prêter l'application aux associations

### 🎯 Vue d'ensemble
Cette approche consiste à déployer des instances séparées de l'application pour chaque association, chacune avec sa propre base de données Firebase.

### ✅ Avantages
- ✅ **Simplicité** : Peu de modifications au code actuel
- ✅ **Isolation totale** : Chaque association a sa propre base de données
- ✅ **Sécurité** : Aucun risque de mélange de données entre associations
- ✅ **Personnalisable** : Chaque instance peut être personnalisée
- ✅ **Mise en place rapide** : 1-2 semaines

### ❌ Inconvénients
- ❌ **Gestion complexe** : Multiplication des projets Firebase et Vercel
- ❌ **Coûts multiples** : Frais Firebase par projet (plan Blaze si > quotas gratuits)
- ❌ **Mises à jour** : Déployer les nouvelles versions sur chaque instance
- ❌ **Monitoring** : Surveiller plusieurs projets séparés
- ❌ **Scalabilité limitée** : Difficile avec plus de 10-15 associations

---

## Option 2 : Transformation en SaaS Multitenant avec Stripe

### 🎯 Vue d'ensemble
Transformer l'application en une plateforme SaaS où plusieurs organisations partagent la même infrastructure mais ont leurs données isolées, avec un système d'abonnement Stripe.

### ✅ Avantages
- ✅ **Scalabilité** : Peut gérer des centaines d'organisations
- ✅ **Une seule codebase** : Mises à jour déployées pour tous
- ✅ **Revenus récurrents** : Système d'abonnement automatisé
- ✅ **Gestion centralisée** : Un seul projet Firebase et Vercel
- ✅ **Professionnalisme** : Solution commerciale pérenne

### ❌ Inconvénients
- ❌ **Complexité technique** : Refactoring important (2-3 mois)
- ❌ **Coûts de développement** : Investissement initial significatif
- ❌ **Architecture complexe** : Nécessite de l'expertise
- ❌ **Tests approfondis** : Crucial pour éviter les fuites de données

---

## 📊 Comparaison des deux approches

| Critère | Option 1 : Instances séparées | Option 2 : Multitenant SaaS |
|---------|-------------------------------|------------------------------|
| **Temps de mise en place** | 1-2 semaines | 2-3 mois |
| **Complexité technique** | ⭐ Faible | ⭐⭐⭐⭐ Élevée |
| **Coût initial** | € Faible | €€€ Élevé |
| **Coût de maintenance** | €€€ Élevé (long terme) | €€ Moyen (long terme) |
| **Scalabilité** | 5-10 clients max | Illimitée |
| **Isolation des données** | ✅ Totale | ✅ Avec sécurité stricte |
| **Personnalisation** | ✅ Totale par client | ⚠️ Limitée |
| **Revenus** | Manuel ou simple | Automatisé (Stripe) |
| **Idéal pour** | Test marché, <10 clients | Croissance, business durable |

---

## 🛠 Mise en œuvre détaillée

---

## Option 1 : Prêter l'application (Instances séparées)

### Étape 1 : Préparer le projet pour le multi-déploiement

#### 1.1 Créer un template de configuration

```bash
# Créer un dossier pour les configurations
mkdir -p config/associations
```

Créer un fichier de configuration par association :

**`config/associations/association-template.json`**
```json
{
  "name": "Association Name",
  "slug": "association-slug",
  "domain": "association-slug.vercel.app",
  "firebase": {
    "projectId": "",
    "apiKey": "",
    "authDomain": "",
    "storageBucket": "",
    "messagingSenderId": "",
    "appId": ""
  },
  "branding": {
    "primaryColor": "#3b82f6",
    "logo": "/logos/association-logo.png",
    "favicon": "/favicons/association-favicon.ico"
  },
  "contact": {
    "email": "contact@association.fr",
    "phone": "+33 1 23 45 67 89"
  }
}
```

#### 1.2 Script de déploiement automatisé

**`scripts/deploy-association.sh`**
```bash
#!/bin/bash

# Usage: ./scripts/deploy-association.sh <association-name>

ASSOCIATION=$1

if [ -z "$ASSOCIATION" ]; then
  echo "Usage: ./deploy-association.sh <association-name>"
  exit 1
fi

CONFIG_FILE="config/associations/$ASSOCIATION.json"

if [ ! -f "$CONFIG_FILE" ]; then
  echo "❌ Configuration file not found: $CONFIG_FILE"
  exit 1
fi

echo "🚀 Deploying for $ASSOCIATION..."

# Lire la configuration
PROJECT_NAME=$(jq -r '.slug' $CONFIG_FILE)
FIREBASE_PROJECT_ID=$(jq -r '.firebase.projectId' $CONFIG_FILE)

# Créer un nouveau projet Vercel
echo "📦 Creating Vercel project..."
vercel link --project=$PROJECT_NAME --scope=your-team

# Configurer les variables d'environnement
echo "🔧 Setting environment variables..."
vercel env add NEXT_PUBLIC_FIREBASE_PROJECT_ID production < <(echo $FIREBASE_PROJECT_ID)
# ... ajouter toutes les autres variables

# Déployer
echo "🚀 Deploying to production..."
vercel --prod

echo "✅ Deployment complete for $ASSOCIATION!"
echo "🌐 URL: https://$PROJECT_NAME.vercel.app"
```

### Étape 2 : Processus pour chaque nouvelle association

#### 2.1 Créer un nouveau projet Firebase

```bash
# 1. Via Firebase Console
# - Aller sur https://console.firebase.google.com
# - Créer un nouveau projet : "festival-benevoles-[nom-association]"
# - Activer Authentication, Firestore, Storage

# 2. Configurer les règles Firestore
# - Copier les règles depuis firestore.rules
# - Les déployer : firebase deploy --only firestore:rules --project [project-id]

# 3. Créer un compte admin par défaut
# - Utiliser le script d'initialisation
```

**`scripts/init-firebase-project.ts`**
```typescript
import * as admin from 'firebase-admin';
import * as fs from 'fs';

async function initFirebaseProject(configPath: string, adminEmail: string, adminPassword: string) {
  const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  
  // Initialiser Firebase Admin
  admin.initializeApp({
    credential: admin.credential.cert(config.firebase.serviceAccount),
    projectId: config.firebase.projectId,
  });

  const auth = admin.auth();
  const db = admin.firestore();

  try {
    // Créer le compte admin
    const userRecord = await auth.createUser({
      email: adminEmail,
      password: adminPassword,
      emailVerified: true,
    });

    // Créer le document utilisateur dans Firestore
    await db.collection('users').doc(userRecord.uid).set({
      uid: userRecord.uid,
      email: adminEmail,
      firstName: 'Admin',
      lastName: config.name,
      role: 'admin',
      phone: config.contact.phone,
      photoURL: null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      consents: {
        dataProcessing: true,
        communications: true,
        consentDate: admin.firestore.FieldValue.serverTimestamp(),
      },
      notificationPreferences: {
        email: true,
        sms: false,
      },
    });

    console.log('✅ Admin account created successfully!');
    console.log(`📧 Email: ${adminEmail}`);
    console.log(`🔑 Password: ${adminPassword}`);
    console.log('⚠️  Please change the password after first login!');

  } catch (error) {
    console.error('❌ Error creating admin account:', error);
    throw error;
  }
}

// Usage
const configPath = process.argv[2];
const adminEmail = process.argv[3];
const adminPassword = process.argv[4];

initFirebaseProject(configPath, adminEmail, adminPassword);
```

#### 2.2 Personnalisation de l'interface

**`lib/branding/config.ts`**
```typescript
// Configuration du branding chargée dynamiquement
export interface BrandingConfig {
  primaryColor: string;
  logo: string;
  favicon: string;
  name: string;
  contact: {
    email: string;
    phone: string;
  };
}

// Chargé depuis les variables d'environnement ou un fichier de config
export const brandingConfig: BrandingConfig = {
  primaryColor: process.env.NEXT_PUBLIC_PRIMARY_COLOR || '#3b82f6',
  logo: process.env.NEXT_PUBLIC_LOGO_URL || '/logo.png',
  favicon: process.env.NEXT_PUBLIC_FAVICON_URL || '/favicon.ico',
  name: process.env.NEXT_PUBLIC_ORG_NAME || 'Festival Films Courts',
  contact: {
    email: process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'contact@festival.fr',
    phone: process.env.NEXT_PUBLIC_CONTACT_PHONE || '',
  },
};
```

#### 2.3 Documentation pour l'association

**`docs/guide-association.md`** (à fournir à chaque association)
```markdown
# Guide d'utilisation - [Nom Association]

## 🔐 Accès à l'application

Votre instance : https://[votre-slug].vercel.app

**Compte administrateur initial :**
- Email : admin@[votre-association].fr
- Mot de passe : [fourni séparément]

⚠️ **Important** : Changez votre mot de passe lors de la première connexion !

## 📱 Accès Firebase Console

Votre projet Firebase : https://console.firebase.google.com/project/[project-id]

Vous avez été ajouté comme propriétaire du projet.

## 🎨 Personnalisation

Pour modifier le logo ou les couleurs, contactez-nous à : contact@votre-entreprise.fr

## 📊 Statistiques et monitoring

- Dashboard Vercel : [lien]
- Firebase Console : [lien]
- Analytics (optionnel) : [lien]

## 💰 Facturation

- Plan Firebase : [Spark / Blaze]
- Coûts estimés : [estimation]
- Plan Vercel : [Hobby / Pro]

## 🆘 Support

Email : support@votre-entreprise.fr
Temps de réponse : 24-48h
```

### Étape 3 : Gestion et maintenance

#### 3.1 Script de mise à jour globale

**`scripts/update-all-instances.sh`**
```bash
#!/bin/bash

echo "🔄 Updating all instances..."

for config in config/associations/*.json; do
  if [ -f "$config" ]; then
    ASSOCIATION=$(basename "$config" .json)
    echo "📦 Updating $ASSOCIATION..."
    ./scripts/deploy-association.sh $ASSOCIATION
  fi
done

echo "✅ All instances updated!"
```

#### 3.2 Monitoring centralisé

**`scripts/check-all-instances.ts`**
```typescript
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

interface HealthCheck {
  association: string;
  url: string;
  status: 'healthy' | 'unhealthy' | 'unknown';
  responseTime: number;
  lastChecked: Date;
}

async function checkInstance(configPath: string): Promise<HealthCheck> {
  const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  const url = `https://${config.domain}/api/health`;
  
  const startTime = Date.now();
  
  try {
    const response = await axios.get(url, { timeout: 10000 });
    const responseTime = Date.now() - startTime;
    
    return {
      association: config.name,
      url: config.domain,
      status: response.status === 200 ? 'healthy' : 'unhealthy',
      responseTime,
      lastChecked: new Date(),
    };
  } catch (error) {
    return {
      association: config.name,
      url: config.domain,
      status: 'unhealthy',
      responseTime: -1,
      lastChecked: new Date(),
    };
  }
}

async function checkAllInstances() {
  const configDir = path.join(__dirname, '../config/associations');
  const files = fs.readdirSync(configDir).filter(f => f.endsWith('.json'));
  
  console.log('🔍 Checking all instances...\n');
  
  const checks = await Promise.all(
    files.map(file => checkInstance(path.join(configDir, file)))
  );
  
  // Afficher les résultats
  console.table(checks);
  
  // Alertes
  const unhealthy = checks.filter(c => c.status === 'unhealthy');
  if (unhealthy.length > 0) {
    console.error(`\n⚠️  ${unhealthy.length} instance(s) unhealthy!`);
    // Envoyer une notification (email, Slack, etc.)
  } else {
    console.log('\n✅ All instances are healthy!');
  }
}

checkAllInstances();
```

### Estimation des coûts (Option 1)

**Par association :**
- Firebase (plan Blaze) : 0-50€/mois selon usage
- Vercel (plan Pro si besoin SSL custom) : 0-20€/mois
- Domaine personnalisé (optionnel) : 10-15€/an
- **Total : 0-70€/mois par association**

**Coûts de gestion :**
- Temps de déploiement initial : 2-3h par association
- Maintenance mensuelle : 1-2h par association
- Mises à jour : 30min-1h par association et par version

**Recommandation de tarification :**
- Setup initial : 200-500€ (selon personnalisation)
- Abonnement mensuel : 50-100€/mois
- Maintenance : incluse dans l'abonnement
- Support prioritaire : +30€/mois

---

## Option 2 : SaaS Multitenant avec Stripe

### Architecture Multitenant

#### Structure de données modifiée

**Collections Firestore avec isolation par organisation :**

```
organizations/                    # Nouvelle collection
├── {orgId}/
    ├── name: string
    ├── slug: string
    ├── domain: string (optionnel)
    ├── status: 'active' | 'suspended' | 'trial'
    ├── subscription: {
    │   stripeCustomerId: string
    │   stripeSubscriptionId: string
    │   plan: 'free' | 'starter' | 'pro' | 'enterprise'
    │   status: 'active' | 'canceled' | 'past_due'
    │   currentPeriodEnd: timestamp
    │   }
    ├── settings: {
    │   branding: {...}
    │   features: {...}
    │   limits: {
    │       maxVolunteers: number
    │       maxMissions: number
    │       maxEvents: number
    │   }
    │   }
    ├── createdAt: timestamp
    └── updatedAt: timestamp

users/                           # Collection modifiée
├── {userId}/
    ├── organizationId: string   # 🆕 Référence à l'organisation
    ├── email: string
    ├── firstName: string
    ├── lastName: string
    ├── role: string            # Role dans l'organisation
    ├── ...

missions/                        # Collection modifiée
├── {missionId}/
    ├── organizationId: string   # 🆕 Référence à l'organisation
    ├── title: string
    ├── ...

volunteerRequests/               # Collection modifiée
├── {requestId}/
    ├── organizationId: string   # 🆕 Référence à l'organisation
    ├── ...
```

### Étape 1 : Modifier le schéma de données

#### 1.1 Créer les nouveaux types

**`types/organization.ts`**
```typescript
export type SubscriptionPlan = 'free' | 'starter' | 'pro' | 'enterprise';

export type SubscriptionStatus = 
  | 'active' 
  | 'canceled' 
  | 'past_due' 
  | 'trialing' 
  | 'incomplete';

export type OrganizationStatus = 'active' | 'suspended' | 'trial';

export interface OrganizationLimits {
  maxVolunteers: number;
  maxMissions: number;
  maxEvents: number;
  maxStorage: number; // en MB
}

export interface OrganizationFeatures {
  customBranding: boolean;
  advancedReporting: boolean;
  apiAccess: boolean;
  prioritySupport: boolean;
  sso: boolean;
  customDomain: boolean;
}

export interface OrganizationBranding {
  primaryColor: string;
  logo: string | null;
  favicon: string | null;
}

export interface OrganizationSubscription {
  stripeCustomerId: string;
  stripeSubscriptionId: string | null;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  domain: string | null;
  status: OrganizationStatus;
  subscription: OrganizationSubscription;
  settings: {
    branding: OrganizationBranding;
    features: OrganizationFeatures;
    limits: OrganizationLimits;
  };
  owner: string; // userId du propriétaire
  createdAt: Date;
  updatedAt: Date;
}

// Plans disponibles
export const SUBSCRIPTION_PLANS: Record<SubscriptionPlan, {
  name: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  features: OrganizationFeatures;
  limits: OrganizationLimits;
  stripeProductId: string;
  stripePriceId: string;
}> = {
  free: {
    name: 'Gratuit',
    price: 0,
    currency: 'EUR',
    interval: 'month',
    features: {
      customBranding: false,
      advancedReporting: false,
      apiAccess: false,
      prioritySupport: false,
      sso: false,
      customDomain: false,
    },
    limits: {
      maxVolunteers: 50,
      maxMissions: 20,
      maxEvents: 1,
      maxStorage: 100,
    },
    stripeProductId: '',
    stripePriceId: '',
  },
  starter: {
    name: 'Starter',
    price: 29,
    currency: 'EUR',
    interval: 'month',
    features: {
      customBranding: true,
      advancedReporting: false,
      apiAccess: false,
      prioritySupport: false,
      sso: false,
      customDomain: false,
    },
    limits: {
      maxVolunteers: 200,
      maxMissions: 100,
      maxEvents: 5,
      maxStorage: 500,
    },
    stripeProductId: 'prod_starter',
    stripePriceId: 'price_starter',
  },
  pro: {
    name: 'Pro',
    price: 79,
    currency: 'EUR',
    interval: 'month',
    features: {
      customBranding: true,
      advancedReporting: true,
      apiAccess: true,
      prioritySupport: true,
      sso: false,
      customDomain: true,
    },
    limits: {
      maxVolunteers: 1000,
      maxMissions: 500,
      maxEvents: 20,
      maxStorage: 5000,
    },
    stripeProductId: 'prod_pro',
    stripePriceId: 'price_pro',
  },
  enterprise: {
    name: 'Enterprise',
    price: 299,
    currency: 'EUR',
    interval: 'month',
    features: {
      customBranding: true,
      advancedReporting: true,
      apiAccess: true,
      prioritySupport: true,
      sso: true,
      customDomain: true,
    },
    limits: {
      maxVolunteers: -1, // illimité
      maxMissions: -1,
      maxEvents: -1,
      maxStorage: 50000,
    },
    stripeProductId: 'prod_enterprise',
    stripePriceId: 'price_enterprise',
  },
};
```

#### 1.2 Modifier le type User

**`types/index.ts`**
```typescript
// Modifier l'interface User existante
export interface User {
  uid: string;
  organizationId: string; // 🆕 NOUVEAU
  email: string | null;
  firstName: string;
  lastName: string;
  phone: string;
  photoURL: string | null;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
  consents: {
    dataProcessing: boolean;
    communications: boolean;
    consentDate: Date;
  };
  notificationPreferences: {
    email: boolean;
    sms: boolean;
  };
}

// Modifier l'interface Mission
export interface Mission {
  id: string;
  organizationId: string; // 🆕 NOUVEAU
  // ... reste inchangé
}

// Ajouter un nouveau type pour les invitations
export interface OrganizationInvitation {
  id: string;
  organizationId: string;
  email: string;
  role: UserRole;
  invitedBy: string; // userId
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  token: string;
  expiresAt: Date;
  createdAt: Date;
}
```

### Étape 2 : Créer un Context pour l'organisation

**`components/providers/organization-provider.tsx`**
```typescript
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Organization } from '@/types/organization';

interface OrganizationContextType {
  organization: Organization | null;
  loading: boolean;
  refreshOrganization: () => Promise<void>;
  hasFeature: (feature: keyof Organization['settings']['features']) => boolean;
  isWithinLimit: (limit: keyof Organization['settings']['limits'], current: number) => boolean;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export function OrganizationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchOrganization = async () => {
    if (!user?.organizationId) {
      setOrganization(null);
      setLoading(false);
      return;
    }

    try {
      const orgDoc = await getDoc(doc(db, 'organizations', user.organizationId));
      if (orgDoc.exists()) {
        setOrganization({ id: orgDoc.id, ...orgDoc.data() } as Organization);
      } else {
        setOrganization(null);
      }
    } catch (error) {
      console.error('Error fetching organization:', error);
      setOrganization(null);
    } finally {
      setLoading(false);
    }
  };

  const hasFeature = (feature: keyof Organization['settings']['features']): boolean => {
    if (!organization) return false;
    return organization.settings.features[feature];
  };

  const isWithinLimit = (
    limit: keyof Organization['settings']['limits'],
    current: number
  ): boolean => {
    if (!organization) return false;
    const maxLimit = organization.settings.limits[limit];
    if (maxLimit === -1) return true; // illimité
    return current < maxLimit;
  };

  useEffect(() => {
    fetchOrganization();
  }, [user?.organizationId]);

  const value = {
    organization,
    loading,
    refreshOrganization: fetchOrganization,
    hasFeature,
    isWithinLimit,
  };

  return (
    <OrganizationContext.Provider value={value}>
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganization() {
  const context = useContext(OrganizationContext);
  if (context === undefined) {
    throw new Error('useOrganization must be used within OrganizationProvider');
  }
  return context;
}
```

### Étape 3 : Modifier les règles Firestore

**`firestore.rules`**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function getUserData() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data;
    }
    
    function isAdmin() {
      return isAuthenticated() && getUserData().role == 'admin';
    }
    
    function belongsToSameOrg(orgId) {
      return isAuthenticated() && getUserData().organizationId == orgId;
    }
    
    function isOrgOwner(orgId) {
      let org = get(/databases/$(database)/documents/organizations/$(orgId)).data;
      return isAuthenticated() && org.owner == request.auth.uid;
    }
    
    // Organizations collection
    match /organizations/{orgId} {
      allow read: if belongsToSameOrg(orgId) || isOrgOwner(orgId);
      allow create: if isAuthenticated(); // Lors de l'inscription
      allow update: if isOrgOwner(orgId) || isAdmin();
      allow delete: if isOrgOwner(orgId);
    }
    
    // Users collection - MODIFIÉ avec isolation par org
    match /users/{userId} {
      allow read: if isAuthenticated() && 
                    belongsToSameOrg(resource.data.organizationId);
      allow create: if isAuthenticated() && 
                      request.auth.uid == userId &&
                      belongsToSameOrg(request.resource.data.organizationId);
      allow update: if isAuthenticated() && 
                      (request.auth.uid == userId || 
                       (isAdmin() && belongsToSameOrg(resource.data.organizationId)));
      allow delete: if isAdmin() && belongsToSameOrg(resource.data.organizationId);
    }
    
    // Missions collection - MODIFIÉ avec isolation par org
    match /missions/{missionId} {
      allow read: if isAuthenticated() && 
                    belongsToSameOrg(resource.data.organizationId);
      allow create: if isAuthenticated() && 
                      belongsToSameOrg(request.resource.data.organizationId) &&
                      (isAdmin() || getUserData().role == 'category_responsible');
      allow update: if isAuthenticated() && 
                      belongsToSameOrg(resource.data.organizationId) &&
                      (isAdmin() || getUserData().role == 'category_responsible');
      allow delete: if isAuthenticated() && 
                      belongsToSameOrg(resource.data.organizationId) &&
                      (isAdmin() || getUserData().role == 'category_responsible');
    }
    
    // Volunteer Requests - MODIFIÉ avec isolation par org
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
    
    // Organization Invitations
    match /organizationInvitations/{invitationId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated() && 
                      (isOrgOwner(request.resource.data.organizationId) || isAdmin());
      allow update: if isAuthenticated();
      allow delete: if isAuthenticated() && 
                      (isOrgOwner(resource.data.organizationId) || isAdmin());
    }
  }
}
```

### Étape 4 : Intégration Stripe

#### 4.1 Installation et configuration

```bash
npm install stripe @stripe/stripe-js
```

**`.env.local`** (ajouter)
```env
# Stripe
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

#### 4.2 Configuration Stripe

**`lib/stripe/config.ts`**
```typescript
import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not defined');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-11-20.acacia',
  typescript: true,
});

export const STRIPE_CONFIG = {
  publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
  currency: 'eur',
  successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
  cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL}/billing/canceled`,
};
```

#### 4.3 API Routes Stripe

**`app/api/stripe/create-checkout-session/route.ts`**
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/config';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { initAdmin } from '@/lib/firebase/admin';
import { SUBSCRIPTION_PLANS } from '@/types/organization';

initAdmin();

export async function POST(request: NextRequest) {
  try {
    const { plan, organizationId } = await request.json();
    
    // Vérifier l'authentification
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const token = authHeader.substring(7);
    const decodedToken = await getAuth().verifyIdToken(token);
    
    // Vérifier que l'utilisateur appartient à l'organisation
    const db = getFirestore();
    const userDoc = await db.collection('users').doc(decodedToken.uid).get();
    const userData = userDoc.data();
    
    if (!userData || userData.organizationId !== organizationId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    // Vérifier que l'utilisateur est propriétaire ou admin
    const orgDoc = await db.collection('organizations').doc(organizationId).get();
    const orgData = orgDoc.data();
    
    if (!orgData || (orgData.owner !== decodedToken.uid && userData.role !== 'admin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    // Récupérer la configuration du plan
    const planConfig = SUBSCRIPTION_PLANS[plan as keyof typeof SUBSCRIPTION_PLANS];
    if (!planConfig) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }
    
    // Créer ou récupérer le customer Stripe
    let customerId = orgData.subscription?.stripeCustomerId;
    
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: userData.email,
        metadata: {
          organizationId,
          userId: decodedToken.uid,
        },
      });
      customerId = customer.id;
      
      // Mettre à jour l'organisation
      await db.collection('organizations').doc(organizationId).update({
        'subscription.stripeCustomerId': customerId,
      });
    }
    
    // Créer la session de checkout
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: planConfig.stripePriceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?checkout=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing?checkout=canceled`,
      metadata: {
        organizationId,
        userId: decodedToken.uid,
        plan,
      },
      subscription_data: {
        metadata: {
          organizationId,
        },
      },
    });
    
    return NextResponse.json({ sessionId: session.id, url: session.url });
    
  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
```

**`app/api/stripe/webhook/route.ts`**
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/config';
import { getFirestore } from 'firebase-admin/firestore';
import { initAdmin } from '@/lib/firebase/admin';
import Stripe from 'stripe';

initAdmin();

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');
  
  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }
  
  let event: Stripe.Event;
  
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error: any) {
    console.error('Webhook signature verification failed:', error.message);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  
  const db = getFirestore();
  
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const organizationId = session.metadata?.organizationId;
        const plan = session.metadata?.plan;
        
        if (!organizationId || !plan) break;
        
        // Récupérer la subscription
        const subscription = await stripe.subscriptions.retrieve(
          session.subscription as string
        );
        
        // Mettre à jour l'organisation
        await db.collection('organizations').doc(organizationId).update({
          'subscription.stripeSubscriptionId': subscription.id,
          'subscription.plan': plan,
          'subscription.status': subscription.status,
          'subscription.currentPeriodStart': new Date(subscription.current_period_start * 1000),
          'subscription.currentPeriodEnd': new Date(subscription.current_period_end * 1000),
          'subscription.cancelAtPeriodEnd': subscription.cancel_at_period_end,
          status: 'active',
          updatedAt: new Date(),
        });
        
        console.log(`✅ Subscription activated for org: ${organizationId}`);
        break;
      }
      
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const organizationId = subscription.metadata?.organizationId;
        
        if (!organizationId) break;
        
        await db.collection('organizations').doc(organizationId).update({
          'subscription.status': subscription.status,
          'subscription.currentPeriodStart': new Date(subscription.current_period_start * 1000),
          'subscription.currentPeriodEnd': new Date(subscription.current_period_end * 1000),
          'subscription.cancelAtPeriodEnd': subscription.cancel_at_period_end,
          updatedAt: new Date(),
        });
        
        console.log(`✅ Subscription updated for org: ${organizationId}`);
        break;
      }
      
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const organizationId = subscription.metadata?.organizationId;
        
        if (!organizationId) break;
        
        // Rétrograder au plan gratuit
        await db.collection('organizations').doc(organizationId).update({
          'subscription.plan': 'free',
          'subscription.status': 'canceled',
          'subscription.stripeSubscriptionId': null,
          status: 'active',
          updatedAt: new Date(),
        });
        
        console.log(`✅ Subscription canceled for org: ${organizationId} - downgraded to free`);
        break;
      }
      
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;
        
        // Trouver l'organisation
        const orgsSnapshot = await db
          .collection('organizations')
          .where('subscription.stripeCustomerId', '==', customerId)
          .limit(1)
          .get();
        
        if (!orgsSnapshot.empty) {
          const orgDoc = orgsSnapshot.docs[0];
          await orgDoc.ref.update({
            'subscription.status': 'past_due',
            status: 'suspended',
            updatedAt: new Date(),
          });
          
          console.log(`⚠️  Payment failed for org: ${orgDoc.id}`);
          // Envoyer un email de notification
        }
        break;
      }
    }
    
    return NextResponse.json({ received: true });
    
  } catch (error: any) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
```

**`app/api/stripe/create-portal-session/route.ts`**
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/config';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { initAdmin } from '@/lib/firebase/admin';

initAdmin();

export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const token = authHeader.substring(7);
    const decodedToken = await getAuth().verifyIdToken(token);
    
    // Récupérer l'organisation de l'utilisateur
    const db = getFirestore();
    const userDoc = await db.collection('users').doc(decodedToken.uid).get();
    const userData = userDoc.data();
    
    if (!userData?.organizationId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }
    
    const orgDoc = await db.collection('organizations').doc(userData.organizationId).get();
    const orgData = orgDoc.data();
    
    if (!orgData?.subscription?.stripeCustomerId) {
      return NextResponse.json({ error: 'No Stripe customer found' }, { status: 404 });
    }
    
    // Créer une session du portail client
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: orgData.subscription.stripeCustomerId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing`,
    });
    
    return NextResponse.json({ url: portalSession.url });
    
  } catch (error: any) {
    console.error('Error creating portal session:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### Étape 5 : Pages d'inscription et onboarding

**`app/(auth)/signup/page.tsx`** (Modification)
```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signUpWithEmail } from '@/lib/firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { SUBSCRIPTION_PLANS } from '@/types/organization';

export default function SignUpPage() {
  const router = useRouter();
  const [step, setStep] = useState(1); // 1: Account, 2: Organization, 3: Complete
  
  // Étape 1 : Informations personnelles
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  
  // Étape 2 : Informations organisation
  const [orgName, setOrgName] = useState('');
  const [orgSlug, setOrgSlug] = useState('');
  
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // 1. Créer le compte utilisateur
      const user = await signUpWithEmail(
        email,
        password,
        firstName,
        lastName,
        phone,
        true,
        true
      );
      
      // 2. Créer l'organisation
      const orgRef = doc(db, 'organizations');
      const orgId = orgRef.id;
      
      await setDoc(orgRef, {
        name: orgName,
        slug: orgSlug,
        domain: null,
        status: 'trial',
        subscription: {
          stripeCustomerId: '',
          stripeSubscriptionId: null,
          plan: 'free',
          status: 'trialing',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 jours
          cancelAtPeriodEnd: false,
        },
        settings: {
          branding: {
            primaryColor: '#3b82f6',
            logo: null,
            favicon: null,
          },
          features: SUBSCRIPTION_PLANS.free.features,
          limits: SUBSCRIPTION_PLANS.free.limits,
        },
        owner: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      
      // 3. Mettre à jour l'utilisateur avec l'organizationId
      await setDoc(doc(db, 'users', user.uid), {
        organizationId: orgId,
      }, { merge: true });
      
      // 4. Rediriger vers le dashboard
      router.push('/dashboard?welcome=true');
      
    } catch (error: any) {
      console.error('Error signing up:', error);
      // Gérer les erreurs
    }
  };
  
  return (
    <div>
      {/* Interface d'inscription en 2 étapes */}
      {step === 1 && (
        <form>
          {/* Formulaire compte utilisateur */}
        </form>
      )}
      
      {step === 2 && (
        <form onSubmit={handleSignUp}>
          {/* Formulaire organisation */}
        </form>
      )}
    </div>
  );
}
```

### Étape 6 : Page de facturation

**`app/(dashboard)/billing/page.tsx`**
```typescript
'use client';

import { useAuth } from '@/hooks/useAuth';
import { useOrganization } from '@/components/providers/organization-provider';
import { SUBSCRIPTION_PLANS } from '@/types/organization';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Check, X } from 'lucide-react';
import { useState } from 'react';

export default function BillingPage() {
  const { user, firebaseUser } = useAuth();
  const { organization } = useOrganization();
  const [loading, setLoading] = useState(false);
  
  const handleSubscribe = async (plan: string) => {
    if (!firebaseUser || !organization) return;
    
    setLoading(true);
    
    try {
      const token = await firebaseUser.getIdToken();
      
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          plan,
          organizationId: organization.id,
        }),
      });
      
      const { url } = await response.json();
      
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleManageSubscription = async () => {
    if (!firebaseUser) return;
    
    setLoading(true);
    
    try {
      const token = await firebaseUser.getIdToken();
      
      const response = await fetch('/api/stripe/create-portal-session', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      const { url } = await response.json();
      
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error('Error creating portal session:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Facturation & Abonnement</h1>
      
      {/* Abonnement actuel */}
      <Card className="p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Votre abonnement actuel</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-lg font-medium">
              Plan {SUBSCRIPTION_PLANS[organization?.subscription.plan || 'free'].name}
            </p>
            <p className="text-sm text-muted-foreground">
              {organization?.subscription.plan !== 'free'
                ? `Renouvellement le ${organization?.subscription.currentPeriodEnd.toLocaleDateString()}`
                : 'Plan gratuit'}
            </p>
          </div>
          
          {organization?.subscription.plan !== 'free' && (
            <Button onClick={handleManageSubscription} disabled={loading}>
              Gérer l'abonnement
            </Button>
          )}
        </div>
      </Card>
      
      {/* Grille des plans */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Object.entries(SUBSCRIPTION_PLANS).map(([planKey, plan]) => {
          const isCurrentPlan = organization?.subscription.plan === planKey;
          
          return (
            <Card key={planKey} className={`p-6 ${isCurrentPlan ? 'border-primary' : ''}`}>
              <div className="mb-4">
                <h3 className="text-xl font-bold">{plan.name}</h3>
                <div className="mt-2">
                  <span className="text-3xl font-bold">{plan.price}€</span>
                  <span className="text-muted-foreground">/mois</span>
                </div>
              </div>
              
              <ul className="space-y-2 mb-6">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-sm">
                    {plan.limits.maxVolunteers === -1
                      ? 'Bénévoles illimités'
                      : `${plan.limits.maxVolunteers} bénévoles`}
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-sm">
                    {plan.limits.maxMissions === -1
                      ? 'Missions illimitées'
                      : `${plan.limits.maxMissions} missions`}
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  {plan.features.customBranding ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <X className="h-4 w-4 text-red-500" />
                  )}
                  <span className="text-sm">Personnalisation</span>
                </li>
                <li className="flex items-center gap-2">
                  {plan.features.advancedReporting ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <X className="h-4 w-4 text-red-500" />
                  )}
                  <span className="text-sm">Rapports avancés</span>
                </li>
                <li className="flex items-center gap-2">
                  {plan.features.prioritySupport ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <X className="h-4 w-4 text-red-500" />
                  )}
                  <span className="text-sm">Support prioritaire</span>
                </li>
              </ul>
              
              {isCurrentPlan ? (
                <Button className="w-full" disabled>
                  Plan actuel
                </Button>
              ) : (
                <Button
                  className="w-full"
                  onClick={() => handleSubscribe(planKey)}
                  disabled={loading}
                >
                  {planKey === 'free' ? 'Rétrograder' : 'Choisir ce plan'}
                </Button>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
```

### Étape 7 : Middleware de vérification des limites

**`lib/middleware/check-limits.ts`**
```typescript
import { Organization } from '@/types/organization';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export async function checkVolunteerLimit(organizationId: string): Promise<boolean> {
  const orgDoc = await getDocs(
    query(collection(db, 'organizations'), where('id', '==', organizationId))
  );
  
  if (orgDoc.empty) return false;
  
  const org = orgDoc.docs[0].data() as Organization;
  const limit = org.settings.limits.maxVolunteers;
  
  if (limit === -1) return true; // illimité
  
  const volunteersSnapshot = await getDocs(
    query(collection(db, 'users'), where('organizationId', '==', organizationId))
  );
  
  return volunteersSnapshot.size < limit;
}

export async function checkMissionLimit(organizationId: string): Promise<boolean> {
  const orgDoc = await getDocs(
    query(collection(db, 'organizations'), where('id', '==', organizationId))
  );
  
  if (orgDoc.empty) return false;
  
  const org = orgDoc.docs[0].data() as Organization;
  const limit = org.settings.limits.maxMissions;
  
  if (limit === -1) return true;
  
  const missionsSnapshot = await getDocs(
    query(collection(db, 'missions'), where('organizationId', '==', organizationId))
  );
  
  return missionsSnapshot.size < limit;
}
```

### Étape 8 : Configuration Stripe (Stripe Dashboard)

1. **Créer les produits et prix dans Stripe Dashboard :**
   - Aller sur https://dashboard.stripe.com/products
   - Créer 3 produits :
     - "Starter" : 29€/mois
     - "Pro" : 79€/mois
     - "Enterprise" : 299€/mois
   - Copier les IDs `prod_xxx` et `price_xxx` dans `SUBSCRIPTION_PLANS`

2. **Configurer le webhook :**
   - Aller sur https://dashboard.stripe.com/webhooks
   - Créer un endpoint : `https://votre-app.vercel.app/api/stripe/webhook`
   - Événements à écouter :
     - `checkout.session.completed`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_failed`
   - Copier le secret du webhook dans `STRIPE_WEBHOOK_SECRET`

3. **Configurer le portail client :**
   - Aller sur https://dashboard.stripe.com/settings/billing/portal
   - Activer le portail client
   - Personnaliser selon vos besoins

### Étape 9 : Migration des données existantes

**`scripts/migrate-to-multitenant.ts`**
```typescript
import * as admin from 'firebase-admin';
import { SUBSCRIPTION_PLANS } from '../types/organization';

async function migrateToMultitenant() {
  admin.initializeApp();
  const db = admin.firestore();
  
  console.log('🚀 Starting migration to multitenant...');
  
  try {
    // 1. Créer une organisation par défaut pour les données existantes
    const defaultOrgRef = db.collection('organizations').doc();
    const defaultOrgId = defaultOrgRef.id;
    
    await defaultOrgRef.set({
      name: 'Festival Films Courts de Dinan',
      slug: 'festival-dinan',
      domain: null,
      status: 'active',
      subscription: {
        stripeCustomerId: '',
        stripeSubscriptionId: null,
        plan: 'pro', // Donner le plan Pro gratuitement
        status: 'active',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 an
        cancelAtPeriodEnd: false,
      },
      settings: {
        branding: {
          primaryColor: '#3b82f6',
          logo: null,
          favicon: null,
        },
        features: SUBSCRIPTION_PLANS.pro.features,
        limits: SUBSCRIPTION_PLANS.pro.limits,
      },
      owner: '', // À définir avec le premier admin trouvé
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    
    console.log(`✅ Default organization created: ${defaultOrgId}`);
    
    // 2. Migrer tous les utilisateurs
    const usersSnapshot = await db.collection('users').get();
    let firstAdmin = '';
    
    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      
      if (!firstAdmin && userData.role === 'admin') {
        firstAdmin = userDoc.id;
      }
      
      await userDoc.ref.update({
        organizationId: defaultOrgId,
      });
    }
    
    console.log(`✅ Migrated ${usersSnapshot.size} users`);
    
    // 3. Définir le propriétaire de l'organisation
    if (firstAdmin) {
      await defaultOrgRef.update({ owner: firstAdmin });
      console.log(`✅ Set owner to ${firstAdmin}`);
    }
    
    // 4. Migrer toutes les missions
    const missionsSnapshot = await db.collection('missions').get();
    
    for (const missionDoc of missionsSnapshot.docs) {
      await missionDoc.ref.update({
        organizationId: defaultOrgId,
      });
    }
    
    console.log(`✅ Migrated ${missionsSnapshot.size} missions`);
    
    // 5. Migrer toutes les demandes de bénévoles
    const requestsSnapshot = await db.collection('volunteerRequests').get();
    
    for (const requestDoc of requestsSnapshot.docs) {
      await requestDoc.ref.update({
        organizationId: defaultOrgId,
      });
    }
    
    console.log(`✅ Migrated ${requestsSnapshot.size} volunteer requests`);
    
    console.log('\n✅ Migration completed successfully!');
    console.log(`Default Organization ID: ${defaultOrgId}`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

migrateToMultitenant();
```

### Estimation des coûts (Option 2)

**Développement initial (une seule fois) :**
- Architecture multitenant : 40-60h
- Intégration Stripe : 20-30h
- Interface de facturation : 15-20h
- Migration des données : 10-15h
- Tests approfondis : 30-40h
- **Total : 115-165 heures** (8 000-15 000€ selon taux)

**Coûts d'exploitation mensuels :**
- Firebase (plan Blaze) : 50-200€/mois (selon le nombre d'utilisateurs)
- Vercel (plan Pro) : 20€/mois
- Stripe : 1,4% + 0,25€ par transaction
- Domaine : 1-2€/mois
- **Total : ~70-225€/mois + % des revenus**

**Projection de revenus :**
Avec 20 associations clientes :
- 5 sur plan Starter (29€) = 145€/mois
- 10 sur plan Pro (79€) = 790€/mois
- 5 sur plan Enterprise (299€) = 1 495€/mois
- **Total : 2 430€/mois = 29 160€/an**
- Coûts opérationnels : ~1 500€/an
- Frais Stripe (~2%) : ~600€/an
- **Bénéfice net : ~27 000€/an**

ROI : 2-3 mois avec 20 clients

---

## 🎯 Recommandation

### Pour démarrer rapidement (0-5 clients) : **Option 1**
- Temps de mise en place : 1-2 semaines
- Permet de tester le marché
- Investissement minimal
- Facile à mettre en place

### Pour une croissance à long terme (>5 clients) : **Option 2**
- Investissement initial plus important
- Solution professionnelle et scalable
- Revenus automatisés
- Meilleure expérience utilisateur

### Approche hybride recommandée :

1. **Phase 1 (Mois 1-3)** : Option 1
   - Déployer 3-5 instances séparées pour les premières associations
   - Valider le besoin et le modèle économique
   - Collecter des retours utilisateurs

2. **Phase 2 (Mois 4-6)** : Développement Option 2
   - Commencer le développement du multitenant
   - Intégrer Stripe
   - Préparer la migration

3. **Phase 3 (Mois 7+)** : Migration et croissance
   - Migrer les clients existants vers le multitenant
   - Ouvrir à de nouveaux clients
   - Scaler l'activité

---

## 📞 Prochaines étapes

1. **Définir votre objectif** : Combien d'associations visez-vous ?
2. **Choisir votre approche** : Option 1, 2, ou hybride ?
3. **Planifier le développement** : Timeline et ressources
4. **Préparer les aspects business** :
   - Tarification
   - Conditions générales d'utilisation
   - Politique de confidentialité
   - Support client
   - Facturation et comptabilité

---

**Questions ? Besoin d'aide pour la mise en œuvre ?**

Je peux vous aider à :
- Implémenter l'une ou l'autre des solutions
- Créer les scripts de déploiement
- Configurer Stripe
- Migrer les données
- Créer la documentation

