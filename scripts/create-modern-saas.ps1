# Script PowerShell pour creer le projet SaaS avec Neon + Clerk + Drizzle
# Usage: .\scripts\create-modern-saas.ps1

# Forcer l'encodage UTF-8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host ""
Write-Host "=== Creation du projet SaaS Moderne ===" -ForegroundColor Cyan
Write-Host "Architecture: Neon + Clerk + Drizzle + Stripe" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Verifier Node.js
$nodeVersion = node --version 2>$null
if (-Not $nodeVersion) {
    Write-Host "[ERREUR] Node.js n'est pas installe!" -ForegroundColor Red
    Write-Host "         Telechargez-le depuis: https://nodejs.org" -ForegroundColor Yellow
    exit 1
}
Write-Host "[OK] Node.js version: $nodeVersion" -ForegroundColor Green

# Remonter au dossier parent
$currentDir = Get-Location
$parentDir = Split-Path -Parent $currentDir
$targetDir = Join-Path $parentDir "benevoles-saas"

Write-Host ""
Write-Host "Repertoire cible: $targetDir" -ForegroundColor Gray
Write-Host ""

# Verifier si le dossier existe
if (Test-Path $targetDir) {
    Write-Host "[ATTENTION] Le dossier 'benevoles-saas' existe deja!" -ForegroundColor Yellow
    $response = Read-Host "Voulez-vous le supprimer et recommencer? (O/N)"
    
    if ($response -eq "O" -or $response -eq "o") {
        Write-Host "[INFO] Suppression du dossier existant..." -ForegroundColor Yellow
        Remove-Item -Recurse -Force $targetDir
    } else {
        Write-Host "[ANNULE] Operation annulee" -ForegroundColor Red
        exit 1
    }
}

# Creer le dossier
New-Item -ItemType Directory -Force -Path $targetDir | Out-Null
Set-Location $targetDir

Write-Host "[ETAPE 1/7] Initialisation de Next.js..." -ForegroundColor Green
Write-Host "            (Cela peut prendre quelques minutes...)" -ForegroundColor Gray
Write-Host ""

# Creer Next.js avec les bonnes options
npx --yes create-next-app@latest . --typescript --tailwind --app --no-src-dir --import-alias "@/*" --eslint

Write-Host ""
Write-Host "[OK] Next.js initialise!" -ForegroundColor Green
Write-Host ""

# Installer les dependances principales
Write-Host "[ETAPE 2/7] Installation des dependances (Clerk, Drizzle, Stripe)..." -ForegroundColor Yellow

$dependencies = @(
    "@clerk/nextjs",
    "drizzle-orm",
    "@neondatabase/serverless",
    "stripe",
    "@stripe/stripe-js",
    "@vercel/blob",
    "zod",
    "react-hook-form",
    "@hookform/resolvers",
    "@tanstack/react-query",
    "sonner",
    "date-fns",
    "@radix-ui/react-dialog",
    "@radix-ui/react-dropdown-menu",
    "@radix-ui/react-select",
    "@radix-ui/react-separator",
    "@radix-ui/react-tabs",
    "@radix-ui/react-avatar",
    "@radix-ui/react-tooltip",
    "class-variance-authority",
    "clsx",
    "tailwind-merge",
    "lucide-react"
)

npm install --silent $dependencies

Write-Host "[OK] Dependances principales installees!" -ForegroundColor Green
Write-Host ""

# Installer les dependances de developpement
Write-Host "[ETAPE 3/7] Installation des dependances de developpement..." -ForegroundColor Yellow

$devDependencies = @(
    "drizzle-kit",
    "tsx",
    "@types/node"
)

npm install --save-dev --silent $devDependencies

Write-Host "[OK] Dependances de developpement installees!" -ForegroundColor Green
Write-Host ""

# Creer la structure de dossiers
Write-Host "[ETAPE 4/7] Creation de la structure du projet..." -ForegroundColor Yellow

$folders = @(
    "lib/db",
    "lib/stripe",
    "lib/storage",
    "lib/utils",
    "hooks",
    "types",
    "components/ui",
    "components/features/missions",
    "components/features/volunteers",
    "components/features/billing",
    "components/layouts",
    "app/(auth)/sign-in/[[...sign-in]]",
    "app/(auth)/sign-up/[[...sign-up]]",
    "app/(dashboard)/dashboard",
    "app/(dashboard)/missions",
    "app/(dashboard)/volunteers",
    "app/(dashboard)/billing",
    "app/(dashboard)/settings",
    "app/api/webhooks/clerk",
    "app/api/webhooks/stripe",
    "app/api/missions",
    "app/api/users",
    "drizzle",
    "scripts",
    "docs"
)

foreach ($folder in $folders) {
    New-Item -ItemType Directory -Force -Path $folder | Out-Null
}

Write-Host "[OK] Structure de dossiers creee!" -ForegroundColor Green
Write-Host ""

# Creer le fichier .env.local.example
Write-Host "[ETAPE 5/7] Creation de .env.local.example..." -ForegroundColor Yellow

$envExample = @"
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...

# Clerk URLs
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding

# Neon Database
DATABASE_URL=postgresql://user:password@ep-xxx.region.aws.neon.tech/dbname?sslmode=require

# Stripe
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Vercel Blob (Storage)
BLOB_READ_WRITE_TOKEN=vercel_blob_...

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=Benevoles SaaS
NEXT_PUBLIC_SUPPORT_EMAIL=support@benevoles-saas.com

# Feature Flags
NEXT_PUBLIC_ENABLE_BILLING=true
NEXT_PUBLIC_ENABLE_CUSTOM_DOMAINS=false
"@

Set-Content ".env.local.example" $envExample
Copy-Item ".env.local.example" ".env.local"

Write-Host "[OK] Fichiers d'environnement crees!" -ForegroundColor Green
Write-Host ""

# Creer drizzle.config.ts
Write-Host "[ETAPE 6/7] Configuration de Drizzle..." -ForegroundColor Yellow

$drizzleConfig = @"
import type { Config } from 'drizzle-kit';

export default {
  schema: './lib/db/schema.ts',
  out: './drizzle',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!,
  },
} satisfies Config;
"@

Set-Content "drizzle.config.ts" $drizzleConfig

Write-Host "[OK] Drizzle configure!" -ForegroundColor Green
Write-Host ""

# Creer lib/db/index.ts
$dbIndex = @"
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql, { schema });
"@

Set-Content "lib/db/index.ts" $dbIndex

# Creer un schema de base
$dbSchema = @"
import { pgTable, uuid, varchar, text, timestamp, integer, boolean, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Organizations
export const organizations = pgTable('organizations', {
  id: uuid('id').defaultRandom().primaryKey(),
  clerkOrgId: varchar('clerk_org_id', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  status: varchar('status', { length: 50 }).default('active'),
  
  // Subscription
  stripeCustomerId: varchar('stripe_customer_id', { length: 255 }),
  stripeSubscriptionId: varchar('stripe_subscription_id', { length: 255 }),
  subscriptionPlan: varchar('subscription_plan', { length: 50 }).default('free'),
  subscriptionStatus: varchar('subscription_status', { length: 50 }).default('trialing'),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Users
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  clerkUserId: varchar('clerk_user_id', { length: 255 }).notNull().unique(),
  organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'cascade' }),
  email: varchar('email', { length: 255 }).notNull(),
  firstName: varchar('first_name', { length: 100 }),
  lastName: varchar('last_name', { length: 100 }),
  role: varchar('role', { length: 50 }).default('volunteer'),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Relations
export const organizationsRelations = relations(organizations, ({ many }) => ({
  users: many(users),
}));

export const usersRelations = relations(users, ({ one }) => ({
  organization: one(organizations, {
    fields: [users.organizationId],
    references: [organizations.id],
  }),
}));
"@

Set-Content "lib/db/schema.ts" $dbSchema

# Creer middleware.ts
$middleware = @"
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks(.*)',
  '/',
]);

export default clerkMiddleware((auth, request) => {
  if (!isPublicRoute(request)) {
    auth().protect();
  }
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
"@

Set-Content "middleware.ts" $middleware

# Modifier package.json pour ajouter les scripts
Write-Host "[ETAPE 7/7] Mise a jour de package.json..." -ForegroundColor Yellow

$packageJson = Get-Content "package.json" -Raw | ConvertFrom-Json
$packageJson.name = "benevoles-saas"
$packageJson.description = "Plateforme SaaS multitenant pour la gestion de benevoles - Architecture moderne"

# Ajouter les scripts Drizzle
$packageJson.scripts | Add-Member -MemberType NoteProperty -Name "db:generate" -Value "drizzle-kit generate:pg" -Force
$packageJson.scripts | Add-Member -MemberType NoteProperty -Name "db:push" -Value "drizzle-kit push:pg" -Force
$packageJson.scripts | Add-Member -MemberType NoteProperty -Name "db:studio" -Value "drizzle-kit studio" -Force
$packageJson.scripts | Add-Member -MemberType NoteProperty -Name "db:migrate" -Value "tsx lib/db/migrate.ts" -Force

$packageJson | ConvertTo-Json -Depth 10 | Set-Content "package.json"

Write-Host "[OK] package.json mis a jour!" -ForegroundColor Green
Write-Host ""

# Creer README.md
Write-Host "Creation du README..." -ForegroundColor Yellow

$readme = @"
# Benevoles SaaS - Plateforme Multitenant

> Plateforme SaaS moderne pour la gestion de benevoles

## Stack Technique

- **Frontend**: Next.js 15 (App Router) + TypeScript
- **UI**: Tailwind CSS + Radix UI
- **Base de donnees**: Neon (PostgreSQL serverless)
- **ORM**: Drizzle ORM
- **Auth**: Clerk (avec support multitenant)
- **Paiements**: Stripe
- **Storage**: Vercel Blob
- **Hosting**: Vercel

## Installation

\`\`\`bash
# Installer les dependances
npm install

# Configurer les variables d'environnement
cp .env.local.example .env.local
# Remplir avec vos cles

# Creer la base de donnees
npm run db:push

# Lancer le serveur de developpement
npm run dev
\`\`\`

## Scripts disponibles

\`\`\`bash
npm run dev          # Serveur de developpement
npm run build        # Build production
npm run start        # Serveur production
npm run lint         # Linter

# Base de donnees
npm run db:generate  # Generer les migrations
npm run db:push      # Appliquer les migrations
npm run db:studio    # Interface web Drizzle
\`\`\`

## Configuration

### 1. Clerk (Authentication)

1. Creer un compte sur https://clerk.com
2. Creer une application
3. Activer Organizations
4. Copier les cles dans .env.local

### 2. Neon (Database)

1. Creer un compte sur https://neon.tech
2. Creer un projet
3. Copier la connection string dans .env.local
4. Executer: \`npm run db:push\`

### 3. Stripe (Billing)

1. Creer un compte sur https://stripe.com
2. Passer en mode Test
3. Copier les cles dans .env.local

## Documentation

Voir les guides dans le dossier docs/

---

Developpe avec amour pour revolutionner la gestion des benevoles
"@

Set-Content "README.md" $readme

Write-Host "[OK] README cree!" -ForegroundColor Green
Write-Host ""

# Initialiser Git
Write-Host "Initialisation de Git..." -ForegroundColor Yellow

git init
git add .
git commit -m "feat: initial setup with Clerk + Neon + Drizzle + Stripe

Architecture moderne pour SaaS multitenant:
- Authentication: Clerk
- Database: Neon (PostgreSQL)
- ORM: Drizzle
- Billing: Stripe
- Storage: Vercel Blob
"

Write-Host "[OK] Git initialise!" -ForegroundColor Green
Write-Host ""

# Message final
Write-Host ""
Write-Host "=========================================" -ForegroundColor Green
Write-Host "    PROJET CREE AVEC SUCCES!" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green
Write-Host ""
Write-Host "PROCHAINES ETAPES:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Creer un compte Clerk" -ForegroundColor White
Write-Host "   -> https://clerk.com" -ForegroundColor Gray
Write-Host "   -> Activer Organizations dans les settings" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Creer une base de donnees Neon" -ForegroundColor White
Write-Host "   -> https://neon.tech" -ForegroundColor Gray
Write-Host "   -> Gratuit, pas de carte bancaire requise" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Creer un compte Stripe" -ForegroundColor White
Write-Host "   -> https://stripe.com" -ForegroundColor Gray
Write-Host "   -> Utiliser le mode Test pour developper" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Remplir le fichier .env.local" -ForegroundColor White
Write-Host "   -> Editer: $targetDir\.env.local" -ForegroundColor Gray
Write-Host ""
Write-Host "5. Creer la base de donnees" -ForegroundColor White
Write-Host "   cd benevoles-saas" -ForegroundColor Gray
Write-Host "   npm run db:push" -ForegroundColor Gray
Write-Host ""
Write-Host "6. Lancer le serveur" -ForegroundColor White
Write-Host "   npm run dev" -ForegroundColor Gray
Write-Host "   -> http://localhost:3000" -ForegroundColor Gray
Write-Host ""
Write-Host "7. Creer le depot GitHub" -ForegroundColor White
Write-Host "   -> https://github.com/new (nom: benevoles-saas)" -ForegroundColor Gray
Write-Host "   git remote add origin https://github.com/VOTRE-USERNAME/benevoles-saas.git" -ForegroundColor Gray
Write-Host "   git branch -M main" -ForegroundColor Gray
Write-Host "   git push -u origin main" -ForegroundColor Gray
Write-Host ""
Write-Host "DOCUMENTATION:" -ForegroundColor Cyan
Write-Host "   -> $targetDir\README.md" -ForegroundColor Gray
Write-Host "   -> docs/GUIDE_ARCHITECTURE_MODERNE_SAAS.md" -ForegroundColor Gray
Write-Host ""
Write-Host "COUTS (tous gratuits pour demarrer):" -ForegroundColor Yellow
Write-Host "   - Clerk: Gratuit jusqu'a 10k utilisateurs" -ForegroundColor Gray
Write-Host "   - Neon: Gratuit jusqu'a 500h/mois" -ForegroundColor Gray
Write-Host "   - Stripe: Gratuit (1.4% + 0.25 EUR par transaction)" -ForegroundColor Gray
Write-Host "   - Vercel: Plan Hobby gratuit" -ForegroundColor Gray
Write-Host ""
Write-Host "Bon developpement!" -ForegroundColor Green
Write-Host ""

# Demander d'ouvrir VS Code
$response = Read-Host "Voulez-vous ouvrir le projet dans VS Code? (O/N)"
if ($response -eq "O" -or $response -eq "o") {
    code .
}
