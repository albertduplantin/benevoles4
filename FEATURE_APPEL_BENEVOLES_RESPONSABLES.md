# Fonctionnalité : Appel à Bénévoles pour Responsables de Catégorie

## Date : 7 Octobre 2025

## Vue d'ensemble

Les **responsables de catégorie** peuvent maintenant générer un appel à bénévoles, exactement comme les administrateurs, mais **uniquement pour les missions de leurs catégories**.

## Cas d'usage

**Problème résolu** : Un responsable de la catégorie "Bar / Restauration" constate que plusieurs missions de cette catégorie manquent encore de bénévoles. Il souhaite envoyer un appel ciblé sur ses réseaux (WhatsApp, Email, Facebook) sans avoir à demander à l'admin.

## Fonctionnement

### 1. 🎯 Filtrage Automatique

Le système filtre automatiquement les missions pour ne montrer que :
- ✅ Les missions des catégories dont l'utilisateur est responsable
- ✅ Les missions incomplètes (qui ont encore besoin de bénévoles)
- ✅ Les missions publiées

**Exemple** :
- Responsable de "Bar / Restauration" et "Billetterie / vente"
- Verra uniquement les missions incomplètes de ces 2 catégories
- Ne verra PAS les missions des autres catégories

### 2. 📢 Interface Utilisateur

**Localisation** : `/dashboard/overview` (Dashboard principal)

**Section** : Actions Responsable > Communication

**Bouton** : "Générer un appel aux bénévoles"

**États du bouton** :
- 🟢 **Actif** : S'il y a des missions incomplètes dans les catégories du responsable
- 🔴 **Badge urgent** : Si des missions urgentes manquent de bénévoles
- ⚪ **Désactivé** : "Toutes complètes" si toutes les missions sont complètes

### 3. 📱 Formats de Message

Identique à l'admin, deux formats disponibles :

#### WhatsApp / SMS / Réseaux Sociaux (Texte)
```
🎬 Festival Films Courts de Dinan 2025 🎬

🙏 Appel aux bénévoles !

Nous avons besoin de votre aide pour les missions suivantes :

📍 Mission 1 : Bar du soir - Samedi 15 juin
🔴 URGENT - 5 bénévoles recherchés
...
```

#### Email (HTML)
- Design moderne et responsive
- Boutons d'action colorés
- Badges pour les missions urgentes
- Liens directs vers les inscriptions

## Architecture Technique

### Filtrage des Missions

Dans `app/dashboard/overview/page.tsx` :

```typescript
// 1. Récupération des catégories du responsable
const responsibleCategories = [/* API call */];
const responsibleCategoryIds = responsibleCategories.map(c => c.categoryId);

// 2. Filtrage des missions
const coordinatingMissions = allMissions.filter((m) =>
  responsibleCategoryIds.includes(m.category)
);

// 3. Passage au composant
<VolunteerCallModal missions={coordinatingMissions} />
```

### Composant Réutilisé

Le composant `VolunteerCallModal` :
- ✅ Est le même pour admin et responsables
- ✅ Filtre automatiquement les missions incomplètes
- ✅ Génère les messages selon les missions reçues

**Pas de modification nécessaire** : Le composant est déjà conçu pour accepter n'importe quelle liste de missions en prop.

## Comparaison Admin vs Responsable

| Fonctionnalité | Admin | Responsable |
|----------------|-------|-------------|
| **Missions visibles** | Toutes | Uniquement ses catégories |
| **Interface** | Identique | Identique |
| **Formats** | WhatsApp + HTML | WhatsApp + HTML |
| **Statistiques** | Toutes missions | Ses missions uniquement |
| **Localisation** | Actions Administrateur | Actions Responsable |

## Expérience Utilisateur

### Pour le Responsable

1. Se connecter avec un compte "Responsable de catégorie"
2. Aller sur `/dashboard/overview`
3. Section "Actions Responsable"
4. Cliquer sur "Générer un appel aux bénévoles"
5. ✅ Voir uniquement les missions de ses catégories
6. Choisir le format (WhatsApp ou Email)
7. Copier le message
8. Coller sur son canal de communication préféré

### Exemple Concret

**Responsable** : Marie (responsable "Bar / Restauration")

**Missions dans le festival** :
- 10 missions "Bar / Restauration" (3 incomplètes)
- 8 missions "Billetterie" (2 incomplètes)
- 12 missions "Accueil" (4 incomplètes)

**Ce que Marie voit** :
- ✅ 3 missions "Bar / Restauration" incomplètes
- ❌ Ne voit pas les autres catégories

**Message généré** :
```
🎬 Festival Films Courts de Dinan 2025 🎬

🙏 Appel aux bénévoles !

Nous avons besoin de votre aide pour 3 missions :

📍 Mission 1 : Bar du soir - Samedi 15 juin
Recherche 5 bénévoles
...
```

## Avantages

✅ **Autonomie** : Les responsables n'ont plus besoin de demander à l'admin

✅ **Rapidité** : Communication directe vers leurs réseaux

✅ **Pertinence** : Messages ciblés sur leurs catégories uniquement

✅ **Sécurité** : Impossible de voir/communiquer sur d'autres catégories

✅ **Simplicité** : Interface identique à celle de l'admin (pas de formation nécessaire)

## Sécurité & Permissions

### Contrôle d'Accès

- ✅ Seuls les utilisateurs avec le rôle `category_responsible` voient cette fonctionnalité
- ✅ Les missions sont filtrées côté client ET serveur
- ✅ Les responsables ne peuvent pas accéder aux missions d'autres catégories

### Filtrage des Données

```typescript
// Les responsables reçoivent déjà leurs missions filtrées
// Pas de risque de voir des données d'autres catégories
const coordinatingMissions = allMissions.filter((m) =>
  responsibleCategoryIds.includes(m.category)
);
```

## Tests Recommandés

### Test 1 : Responsable avec 1 catégorie
1. ✅ Assigner un responsable à "Bar / Restauration"
2. ✅ Créer 3 missions "Bar / Restauration" (2 incomplètes)
3. ✅ Créer 2 missions "Accueil" (1 incomplète)
4. ✅ Vérifier que le responsable ne voit que les 2 missions "Bar / Restauration"

### Test 2 : Responsable avec plusieurs catégories
1. ✅ Assigner un responsable à "Bar" ET "Billetterie"
2. ✅ Créer des missions dans les deux catégories
3. ✅ Vérifier qu'il voit les missions des deux catégories

### Test 3 : Toutes missions complètes
1. ✅ Toutes les missions du responsable sont complètes
2. ✅ Vérifier que le bouton est désactivé avec le message "Toutes complètes"

### Test 4 : Missions urgentes
1. ✅ Créer une mission urgente incomplète
2. ✅ Vérifier que le badge rouge "URGENT" apparaît sur le bouton

## Impact sur l'Existant

### Modifications

**Fichier** : `app/dashboard/overview/page.tsx`
- Ajout de la section "Communication" pour les responsables
- Réutilisation du composant `VolunteerCallModal` existant

**Aucune modification** des autres fichiers (composants, utils, etc.)

### Compatibilité

- ✅ Aucun impact sur les administrateurs
- ✅ Aucun impact sur les bénévoles
- ✅ Fonctionnalité additive uniquement

## Améliorations Futures Possibles

1. **Notifications automatiques** : Envoyer un email automatique quand une mission devient incomplète

2. **Planification** : Programmer l'envoi d'appels à bénévoles (ex: tous les lundis)

3. **Templates personnalisés** : Permettre aux responsables de créer leurs propres templates de messages

4. **Suivi** : Statistiques sur le taux de conversion des appels (combien de bénévoles inscrits après un appel)

5. **Multi-langues** : Générer des messages en plusieurs langues

6. **Intégrations** : Connexion directe avec WhatsApp Business API, Mailchimp, etc.

## Conclusion

Cette fonctionnalité **autonomise les responsables de catégorie** en leur donnant les outils de communication nécessaires pour recruter des bénévoles pour leurs missions, tout en maintenant une **séparation claire des responsabilités** entre les différentes catégories.

**Statut** : ✅ **Déployée et fonctionnelle**

**Rôles concernés** : Responsables de catégorie uniquement

**Localisation** : `/dashboard/overview` > Actions Responsable > Communication























