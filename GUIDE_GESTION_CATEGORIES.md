# 📂 Guide : Gestion des Catégories de Missions

## 🎯 Vue d'ensemble

Le système de gestion des catégories permet aux admins de :
- ✅ Créer de nouvelles catégories de missions
- ✅ Modifier les catégories existantes
- ✅ Archiver les catégories obsolètes
- ✅ Organiser les catégories par groupes
- ✅ Supprimer les catégories non utilisées

## 📍 Accès

**En tant qu'Admin :**
- Menu : **Catégories** dans le header
- URL : `/dashboard/admin/categories`

## 🚀 Migration initiale (À faire une seule fois)

### Étape 1 : Préparer le script

1. Ouvre `scripts/migrate-categories-to-firestore.ts`
2. Remplace `YOUR_ADMIN_UID_HERE` par ton UID admin :
   ```typescript
   const ADMIN_UID = 'ton-uid-ici'; // Trouve-le dans Firebase Console
   ```

### Étape 2 : Créer un fichier de configuration

Crée `.env.local` à la racine si tu ne l'as pas déjà :

```env
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

### Étape 3 : Exécuter la migration

```bash
# Installer les dépendances si nécessaire
npm install

# Exécuter le script
npx tsx scripts/migrate-categories-to-firestore.ts
```

✅ Tu devrais voir :
```
🚀 Début de la migration des catégories...
✅ Catégorie "Accueil public et professionnels" migrée (ID: xxx)
✅ Catégorie "Accréditations (outil)" migrée (ID: xxx)
...
🎉 Migration terminée avec succès !
📊 12 catégories migrées
```

## 📖 Utilisation de l'interface

### Créer une nouvelle catégorie

1. Clique sur **"Nouvelle catégorie"**
2. Remplis les champs :
   - **Identifiant** : `ma_nouvelle_categorie` (unique, sans espaces)
   - **Libellé** : `Ma nouvelle catégorie` (affiché aux utilisateurs)
   - **Groupe** : Choisis un groupe existant ou crée-en un nouveau
   - **Ordre** : Position dans le groupe (1, 2, 3...)
3. Clique sur **"Enregistrer"**

### Modifier une catégorie

1. Trouve la catégorie dans la liste
2. Clique sur l'icône ✏️ (éditer)
3. Modifie les champs souhaités
4. Clique sur **"Enregistrer"**

⚠️ **Note** : L'identifiant ne peut pas être modifié après création

### Archiver une catégorie

**Quand archiver ?**
- La catégorie est obsolète mais utilisée dans des missions existantes
- Tu veux la masquer sans perdre l'historique

**Comment ?**
1. Clique sur l'icône 📦 (archiver) sur la catégorie active
2. Confirme l'archivage

**Résultat :**
- ❌ N'apparaît plus dans les formulaires de création de mission
- ✅ Les missions existantes conservent cette catégorie
- 🔍 Visible dans la liste admin avec badge "Archivée"

### Supprimer une catégorie

**⚠️ ATTENTION** : La suppression est définitive !

**Conditions pour supprimer :**
- ❌ La catégorie NE DOIT PAS être utilisée par des missions
- ❌ La catégorie NE DOIT PAS avoir de responsable assigné

**Comment ?**
1. Archive d'abord la catégorie (si elle est active)
2. Vérifie qu'aucune mission ne l'utilise
3. Clique sur l'icône 🗑️ (supprimer) sur la catégorie archivée
4. Confirme la suppression

**Si la suppression est bloquée :**
```
❌ Cette catégorie est utilisée par des missions. Archivez-la plutôt.
```
→ Garde-la archivée, ne la supprime pas

## 🏗️ Organisation par groupes

### Groupes actuels

1. **Accueil public et professionnels**
   - Accueil public et professionnels
   - Accréditations (outil)
   - Accueil VIP

2. **Gestion & logistique**
   - Billetterie / vente
   - Contrôle d'accès
   - Transports & accompagnement
   - Logistique & technique

3. **Communication**
   - Communication & réseaux sociaux
   - Développement des publics
   - Volet professionnel
   - Affichage / flyers

4. **Bar & restauration**
   - Bar / Restauration générale
   - Samedi soir : coordination restauration

### Créer un nouveau groupe

Simplement crée une catégorie avec un nouveau nom de groupe :
```
Identifiant : nouvelle_categorie
Libellé : Nouvelle catégorie
Groupe : Mon nouveau groupe  ← Nouveau !
Ordre : 1
```

Le groupe sera automatiquement créé et affiché dans l'interface.

## 🔗 Lien avec les responsables

Chaque catégorie peut avoir **un seul responsable** assigné via :
- Menu : **Responsables** → `/dashboard/admin/category-responsibles`

**Workflow :**
1. Crée la catégorie ici
2. Assigne un responsable dans l'interface "Responsables"
3. Le responsable peut maintenant créer/éditer des missions de cette catégorie

## 📊 Statistiques

L'interface affiche :
- **Total Catégories** : Nombre total (actives + archivées)
- **Actives** : Catégories disponibles pour les missions
- **Groupes** : Nombre de groupes distincts

## ⚙️ Technique

### Structure Firestore

Collection : `missionCategories`

Document :
```typescript
{
  id: "auto-generated",
  value: "accueil_public_pro",       // Identifiant unique
  label: "Accueil public et pro",    // Libellé affiché
  group: "Accueil...",                // Groupe parent
  order: 1,                            // Ordre d'affichage
  active: true,                        // Actif ou archivé
  createdAt: Timestamp,
  updatedAt: Timestamp,
  createdBy: "admin-uid"
}
```

### Règles Firestore

```javascript
match /missionCategories/{categoryId} {
  allow read: if isAuthenticated();
  allow create, update, delete: if isAdmin();
}
```

## 🆘 Dépannage

### Problème : La migration échoue

**Erreur Firebase Admin**
```bash
# Solution : Vérifie tes variables d'environnement
cat .env.local
```

### Problème : Impossible de supprimer une catégorie

**Message** : "Cette catégorie est utilisée par des missions"

**Solution** :
1. Archive la catégorie au lieu de la supprimer
2. Ou supprime d'abord les missions qui l'utilisent
3. Ou change la catégorie des missions existantes

### Problème : Les catégories n'apparaissent pas dans les formulaires

**Causes possibles** :
1. Les catégories sont archivées → Réactive-les
2. La migration n'a pas été exécutée → Lance le script
3. Problème de permissions Firestore → Vérifie les règles

## 🎨 Bonnes pratiques

### Nommage des identifiants

✅ **Bon** :
- `accueil_public`
- `bar_restauration`
- `logistique_technique`

❌ **Mauvais** :
- `Accueil Public` (espaces)
- `bar/restauration` (caractères spéciaux)
- `123` (seulement des chiffres)

### Organisation

- Groupe les catégories similaires ensemble
- Utilise des noms de groupes clairs
- Ordre : Place les catégories les plus utilisées en premier

### Maintenance

- Archive les catégories obsolètes plutôt que de les supprimer
- Revois régulièrement les catégories actives
- Documente les changements importants

## 📝 Évolutions futures

- [ ] Import/Export des catégories en CSV
- [ ] Duplication de catégories
- [ ] Historique des modifications
- [ ] Catégories multilingues
- [ ] Permissions granulaires par catégorie

---

**Besoin d'aide ?** Contacte l'équipe technique ! 🚀























