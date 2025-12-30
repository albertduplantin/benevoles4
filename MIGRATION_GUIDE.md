# Guide de Migration: Firestore → Clerk + Neon

Ce guide vous aide à migrer de Firebase (Firestore + Auth) vers Clerk + Neon PostgreSQL.

## Étape 1: Créer un compte Neon

1. Allez sur https://neon.tech
2. Créez un compte gratuit
3. Créez un nouveau projet nommé "benevoles-festival"
4. Copiez la **connection string** qui ressemble à:
   ```
   postgresql://user:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require
   ```

## Étape 2: Configurer les variables d'environnement

Ajoutez dans `.env.local`:

```env
# Neon Database
DATABASE_URL=postgresql://user:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require

# Clerk (déjà configuré)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

## Étape 3: Créer les tables dans Neon

```bash
# Générer les migrations
npm run db:generate

# Pousser le schéma vers Neon
npm run db:push
```

## Étape 4: Remplacer les fichiers

### 4.1 Remplacer useAuth

```bash
# Sauvegarder l'ancien fichier
mv hooks/useAuth.ts hooks/useAuth.old.ts

# Utiliser le nouveau
mv hooks/useAuth.new.ts hooks/useAuth.ts
```

### 4.2 Remplacer complete-profile page

```bash
# Sauvegarder l'ancien fichier
mv app/auth/complete-profile/page.tsx app/auth/complete-profile/page.old.tsx

# Utiliser le nouveau
mv app/auth/complete-profile/page.new.tsx app/auth/complete-profile/page.tsx
```

## Étape 5: Mettre à jour la page d'accueil

Dans `app/page.tsx`, remplacez:

```typescript
const { user, loading, clerkUser, firestoreError } = useAuth();
```

Par:

```typescript
const { clerkUser, loading, isProfileComplete } = useAuth();
```

Et remplacez la logique de redirection par:

```typescript
useEffect(() => {
  if (loading) return;

  if (clerkUser) {
    if (isProfileComplete) {
      router.push('/dashboard/missions');
    } else {
      router.push('/auth/complete-profile');
    }
  }
}, [loading, clerkUser, isProfileComplete, router]);
```

## Étape 6: Supprimer les dépendances Firebase (optionnel)

Une fois que tout fonctionne:

```bash
npm uninstall firebase firebase-admin
```

Supprimer les fichiers:
- `lib/firebase/config.ts`
- `lib/firebase/admin.ts`
- `lib/clerk/sync-user-to-firestore.ts`
- `scripts/sync-clerk-*.js`

## Étape 7: Tester

1. Lancez le serveur de développement:
   ```bash
   npm run dev
   ```

2. Créez un nouveau compte pour tester
3. Vérifiez que:
   - L'inscription fonctionne
   - Le profil se complète correctement
   - L'utilisateur est créé dans Neon
   - La redirection vers le dashboard fonctionne

## Étape 8: Déployer

1. Ajoutez `DATABASE_URL` dans les variables d'environnement Vercel:
   ```bash
   vercel env add DATABASE_URL
   # Entrez votre connection string Neon
   ```

2. Pushez vers GitHub:
   ```bash
   git add -A
   git commit -m "Migration Firestore → Clerk + Neon"
   git push
   ```

## Avantages de cette migration

✅ **Plus de problèmes de connexion Firestore**
✅ **Une seule source de vérité** (Clerk pour l'auth + metadata de base)
✅ **PostgreSQL** pour des requêtes SQL puissantes
✅ **Drizzle ORM** type-safe
✅ **Serverless** avec Neon (pas de serveur à gérer)
✅ **Free tier généreux** (Neon: 0.5GB storage gratuit)

## Prochaines étapes

Après migration, vous pourrez:
- Créer des API routes pour missions, slots, bookings
- Utiliser des requêtes SQL complexes
- Bénéficier du type-safety de Drizzle
- Meilleure performance et fiabilité
