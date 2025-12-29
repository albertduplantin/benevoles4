# Script PowerShell pour créer la version SaaS du projet
# Usage: .\scripts\create-saas-version.ps1

Write-Host ""
Write-Host "🚀 Création de la version SaaS multitenant" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Vérifier qu'on est dans le bon répertoire
if (-Not (Test-Path "package.json")) {
    Write-Host "❌ Erreur: Ce script doit être exécuté depuis le dossier benevoles3" -ForegroundColor Red
    exit 1
}

# Remonter au dossier parent
$parentDir = Split-Path -Parent (Get-Location)
$sourceDir = Get-Location
$targetDir = Join-Path $parentDir "benevoles-saas"

Write-Host "📁 Répertoire source: $sourceDir" -ForegroundColor Gray
Write-Host "📁 Répertoire cible: $targetDir" -ForegroundColor Gray
Write-Host ""

# Vérifier si le dossier cible existe déjà
if (Test-Path $targetDir) {
    Write-Host "⚠️  Le dossier 'benevoles-saas' existe déjà!" -ForegroundColor Yellow
    $response = Read-Host "Voulez-vous le supprimer et recommencer? (O/N)"
    
    if ($response -eq "O" -or $response -eq "o") {
        Write-Host "🗑️  Suppression du dossier existant..." -ForegroundColor Yellow
        Remove-Item -Recurse -Force $targetDir
    } else {
        Write-Host "❌ Opération annulée" -ForegroundColor Red
        exit 1
    }
}

# Copier le projet
Write-Host "📦 Copie du projet en cours..." -ForegroundColor Green
Copy-Item -Path $sourceDir -Destination $targetDir -Recurse

# Accéder au nouveau dossier
Set-Location $targetDir

Write-Host "✅ Projet copié avec succès!" -ForegroundColor Green
Write-Host ""

# Nettoyer les dossiers inutiles
Write-Host "🧹 Nettoyage des dossiers inutiles..." -ForegroundColor Yellow

$foldersToRemove = @("node_modules", ".next", ".vercel", "out")
foreach ($folder in $foldersToRemove) {
    if (Test-Path $folder) {
        Write-Host "   Suppression de $folder..." -ForegroundColor Gray
        Remove-Item -Recurse -Force $folder -ErrorAction SilentlyContinue
    }
}

# Supprimer .env.local
if (Test-Path ".env.local") {
    Write-Host "   Suppression de .env.local..." -ForegroundColor Gray
    Remove-Item -Force .env.local
}

Write-Host "✅ Nettoyage terminé!" -ForegroundColor Green
Write-Host ""

# Réinitialiser Git
Write-Host "🔄 Réinitialisation de Git..." -ForegroundColor Yellow
if (Test-Path ".git") {
    Remove-Item -Recurse -Force .git
}
git init
git add .
git commit -m "feat: initial commit - fork from benevoles3 for multitenant SaaS version"

Write-Host "✅ Nouveau dépôt Git créé!" -ForegroundColor Green
Write-Host ""

# Modifier package.json
Write-Host "📝 Mise à jour de package.json..." -ForegroundColor Yellow

$packageJson = Get-Content "package.json" -Raw | ConvertFrom-Json
$packageJson.name = "benevoles-saas"
$packageJson.description = "Plateforme SaaS multitenant pour la gestion de bénévoles"
$packageJson.scripts.dev = "next dev --port 3001"
$packageJson.scripts.start = "next start --port 3001"

# Ajouter les dépendances Stripe si elles n'existent pas
if (-Not $packageJson.dependencies.stripe) {
    $packageJson.dependencies | Add-Member -MemberType NoteProperty -Name "stripe" -Value "^17.5.0"
}
if (-Not $packageJson.dependencies."@stripe/stripe-js") {
    $packageJson.dependencies | Add-Member -MemberType NoteProperty -Name "@stripe/stripe-js" -Value "^4.12.0"
}

$packageJson | ConvertTo-Json -Depth 10 | Set-Content "package.json"

Write-Host "✅ package.json mis à jour!" -ForegroundColor Green
Write-Host ""

# Créer le fichier .env.local.example pour SaaS
Write-Host "📝 Création de .env.local.example..." -ForegroundColor Yellow

$envExample = @"
# Firebase Web Config (Client) - NOUVEAU PROJET benevoles-saas
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
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3001
NEXT_PUBLIC_APP_NAME=Bénévoles SaaS
NEXT_PUBLIC_SUPPORT_EMAIL=support@benevoles-saas.com

# Email Configuration (Resend)
RESEND_API_KEY=

# Feature Flags
NEXT_PUBLIC_ENABLE_MULTITENANT=true
NEXT_PUBLIC_ENABLE_BILLING=true
NEXT_PUBLIC_ENABLE_CUSTOM_DOMAINS=false
"@

Set-Content ".env.local.example" $envExample
Copy-Item ".env.local.example" ".env.local"

Write-Host "✅ Fichiers d'environnement créés!" -ForegroundColor Green
Write-Host ""

# Installer les dépendances
Write-Host "📦 Installation des dépendances..." -ForegroundColor Yellow
Write-Host "   (Cela peut prendre quelques minutes...)" -ForegroundColor Gray
npm install --silent

Write-Host "✅ Dépendances installées!" -ForegroundColor Green
Write-Host ""

# Créer les dossiers nécessaires
Write-Host "📁 Création de la structure de dossiers..." -ForegroundColor Yellow

$foldersToCreate = @(
    "types",
    "lib/stripe",
    "lib/middleware",
    "app/api/stripe/create-checkout-session",
    "app/api/stripe/webhook",
    "app/api/stripe/create-portal-session",
    "app/(dashboard)/billing",
    "app/(dashboard)/organization",
    "components/providers",
    "scripts",
    "docs",
    "public/logos"
)

foreach ($folder in $foldersToCreate) {
    if (-Not (Test-Path $folder)) {
        New-Item -ItemType Directory -Force -Path $folder | Out-Null
        Write-Host "   Créé: $folder" -ForegroundColor Gray
    }
}

Write-Host "✅ Structure de dossiers créée!" -ForegroundColor Green
Write-Host ""

# Commit final
git add .
git commit -m "chore: setup project structure and dependencies for SaaS version"

Write-Host ""
Write-Host "🎉 Projet SaaS créé avec succès!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Prochaines étapes:" -ForegroundColor Cyan
Write-Host ""
Write-Host "   1. Créer un nouveau projet Firebase 'benevoles-saas'" -ForegroundColor White
Write-Host "      → https://console.firebase.google.com" -ForegroundColor Gray
Write-Host ""
Write-Host "   2. Créer un compte Stripe (mode test)" -ForegroundColor White
Write-Host "      → https://dashboard.stripe.com/register" -ForegroundColor Gray
Write-Host ""
Write-Host "   3. Remplir le fichier .env.local avec vos clés" -ForegroundColor White
Write-Host "      → Éditer: $targetDir\.env.local" -ForegroundColor Gray
Write-Host ""
Write-Host "   4. Créer le dépôt GitHub 'benevoles-saas'" -ForegroundColor White
Write-Host "      → https://github.com/new" -ForegroundColor Gray
Write-Host ""
Write-Host "   5. Pousser le code:" -ForegroundColor White
Write-Host "      git remote add origin https://github.com/VOTRE-USERNAME/benevoles-saas.git" -ForegroundColor Gray
Write-Host "      git branch -M main" -ForegroundColor Gray
Write-Host "      git push -u origin main" -ForegroundColor Gray
Write-Host ""
Write-Host "   6. Lancer le serveur de développement:" -ForegroundColor White
Write-Host "      npm run dev" -ForegroundColor Gray
Write-Host "      → http://localhost:3001" -ForegroundColor Gray
Write-Host ""
Write-Host "📚 Documentation:" -ForegroundColor Cyan
Write-Host "   → GUIDE_CREATION_VERSION_MULTITENANT.md" -ForegroundColor Gray
Write-Host "   → GUIDE_MULTITENANT_ET_COMMERCIALISATION.md" -ForegroundColor Gray
Write-Host ""
Write-Host "💡 Astuce: Vous pouvez lancer les deux projets simultanément:" -ForegroundColor Yellow
Write-Host "   - benevoles3 sur http://localhost:3000" -ForegroundColor Gray
Write-Host "   - benevoles-saas sur http://localhost:3001" -ForegroundColor Gray
Write-Host ""
Write-Host "✨ Bon développement!" -ForegroundColor Green
Write-Host ""

# Demander si on doit ouvrir VS Code
$response = Read-Host "Voulez-vous ouvrir le projet dans VS Code? (O/N)"
if ($response -eq "O" -or $response -eq "o") {
    code .
}


