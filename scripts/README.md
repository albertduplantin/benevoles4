# 📜 Scripts - Bénévoles3

## Scripts disponibles

### `create-saas-version.ps1` - Créer la version SaaS

Script PowerShell pour créer automatiquement une copie du projet `benevoles3` en tant que nouveau projet `benevoles-saas` pour le développement multitenant.

#### Usage

```powershell
# Depuis le dossier benevoles3
.\scripts\create-saas-version.ps1
```

#### Ce que fait le script

1. ✅ **Copie le projet** vers `../benevoles-saas`
2. ✅ **Nettoie** les dossiers inutiles (node_modules, .next, .vercel)
3. ✅ **Réinitialise Git** (nouveau dépôt propre)
4. ✅ **Modifie package.json** :
   - Nom : `benevoles-saas`
   - Port : 3001
   - Ajoute les dépendances Stripe
5. ✅ **Crée .env.local.example** avec les nouvelles variables
6. ✅ **Installe les dépendances** (npm install)
7. ✅ **Crée la structure de dossiers** pour le multitenant

#### Prérequis

- PowerShell 5.1+ (inclus dans Windows 10/11)
- Node.js et npm installés
- Git installé
- Connexion internet (pour npm install)

#### Options

Le script vous demandera :
- ⚠️ Si le dossier existe déjà, voulez-vous le supprimer ?
- 💡 Voulez-vous ouvrir le projet dans VS Code ?

#### Résultat

Après exécution, vous aurez :

```
D:\Documents\aiprojets\benevoles3\
├── benevoles3/              # Projet original (intact)
└── benevoles-saas/          # Nouveau projet SaaS
    ├── .git/                # Nouveau dépôt Git
    ├── node_modules/        # Dépendances installées
    ├── .env.local          # À configurer
    ├── package.json        # Modifié (port 3001)
    └── ...
```

#### Prochaines étapes

Après avoir exécuté le script :

1. **Créer le projet Firebase** `benevoles-saas`
2. **Configurer Stripe** (mode test)
3. **Remplir `.env.local`** avec les nouvelles clés
4. **Créer le dépôt GitHub** et pousser le code
5. **Lancer le serveur** : `npm run dev`

Voir **[DEMARRAGE_RAPIDE_SAAS.md](../DEMARRAGE_RAPIDE_SAAS.md)** pour plus de détails.

#### Dépannage

**Problème : "Impossible d'exécuter des scripts sur ce système"**

```powershell
# Solution : Modifier la politique d'exécution PowerShell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned

# Puis réessayer
.\scripts\create-saas-version.ps1
```

**Problème : Le dossier existe déjà**

Le script vous demandera si vous voulez le supprimer. Répondez `O` pour continuer.

**Problème : npm install échoue**

```powershell
# Vérifier la connexion internet
# Vérifier que Node.js est installé
node --version
npm --version

# Nettoyer le cache npm
npm cache clean --force

# Réessayer
cd ../benevoles-saas
npm install
```

#### Personnalisation

Pour modifier le comportement du script, éditez `create-saas-version.ps1` :

- **Changer le nom du projet cible** : Ligne 14
- **Modifier le port** : Ligne 84-85
- **Ajouter d'autres dépendances** : Ligne 91-96
- **Changer les dossiers à créer** : Ligne 172-189

---

## Futurs scripts (à venir)

### `migrate-to-multitenant.ts`
Script pour migrer les données existantes vers la structure multitenant.

### `setup-stripe-products.ts`
Script pour créer automatiquement les produits et prix Stripe.

### `init-firebase-project.ts`
Script pour initialiser un nouveau projet Firebase avec les règles de sécurité.

### `check-limits.ts`
Script pour vérifier l'utilisation des quotas par organisation.

---

## Contribution

Pour ajouter un nouveau script :

1. Créer le fichier dans `scripts/`
2. Ajouter la documentation dans ce README
3. Commiter avec un message descriptif

**Convention de nommage** :
- PowerShell : `nom-du-script.ps1`
- TypeScript : `nom-du-script.ts`
- Bash : `nom-du-script.sh`

**Template de documentation** :

```markdown
### `nom-du-script.ext` - Description courte

Description détaillée du script.

#### Usage
[Commande pour exécuter]

#### Ce que fait le script
[Liste des actions]

#### Prérequis
[Liste des prérequis]

#### Options
[Options disponibles]
```

---

**Questions ?** Consultez la documentation principale ou demandez de l'aide !


