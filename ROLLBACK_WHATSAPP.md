# 🔄 Guide de Rollback - Partage WhatsApp

**Feature** : Partage WhatsApp des missions  
**Branche** : `feature/whatsapp-share`  
**Date** : 22 octobre 2025

---

## ⚡ Rollback Ultra-Rapide (30 secondes)

Si vous constatez un problème et devez désactiver immédiatement :

### Méthode 1 : Commentaire (PLUS RAPIDE)

1. **Ouvrir** `app/dashboard/missions/page.tsx`
2. **Trouver** ligne ~735-738
3. **Commenter** le bloc :

```typescript
{/* ROLLBACK TEMPORAIRE - Désactivé le [date]
{(isAdmin || user?.role === 'category_responsible') && (
  <WhatsAppShareButton mission={mission} size="icon" showLabel={false} />
)}
*/}
```

4. **Commit et push** :
```bash
git add app/dashboard/missions/page.tsx
git commit -m "fix: temporarily disable WhatsApp share button"
git push origin feature/whatsapp-share  # ou main si déjà mergé
```

5. **Vercel redéploie** automatiquement (2-3 min)

---

## 🔄 Rollback Complet (2 minutes)

### Méthode 2 : Revert Git

Si la feature est déjà en production (`main`) :

```bash
# 1. Identifier le commit
git log --oneline -5

# 2. Revert le commit du WhatsApp
git revert [hash-du-commit]

# 3. Push
git push origin main
```

**Exemple** :
```bash
git revert abc1234
git push origin main
```

Vercel redéploie sans le bouton WhatsApp.

---

## 🏥 Rollback Vercel Dashboard (Instantané)

### Méthode 3 : Promote Previous Deployment

1. **Allez sur** https://vercel.com/dashboard
2. **Sélectionnez** le projet `benevoles3`
3. **Onglet** "Deployments"
4. **Trouvez** le déploiement d'AVANT le WhatsApp
5. **Cliquez** sur "..." → "Promote to Production"
6. ✅ **Rollback instantané**

---

## 🧪 Test du Rollback (Preview)

Avant de rollback en production, testez sur le preview :

1. **Commentez** le code comme Méthode 1
2. **Commit et push** sur `feature/whatsapp-share`
3. **Attendez** 2-3 min (Vercel rebuild)
4. **Vérifiez** sur l'URL preview : bouton absent
5. **Si OK** → Mergez en main

---

## 🔍 Vérifications Post-Rollback

Après rollback, vérifier :

- [ ] Page missions charge correctement
- [ ] Aucune erreur dans console
- [ ] Boutons d'action autres (Edit, Duplicate) fonctionnent
- [ ] Inscriptions fonctionnent toujours
- [ ] Pas de message d'erreur utilisateur

---

## 🐛 Problèmes Possibles et Solutions

### Problème 1 : "WhatsAppShareButton is not defined"

**Cause** : Import manquant ou fichier non trouvé

**Solution Rapide** :
```typescript
// Commenter juste l'usage du composant
// {(isAdmin || user?.role === 'category_responsible') && (
//   <WhatsAppShareButton mission={mission} size="icon" showLabel={false} />
// )}
```

---

### Problème 2 : Bouton visible mais ne fonctionne pas

**Cause** : Erreur dans génération message ou ouverture WhatsApp

**Solution** :
1. Ouvrir console navigateur (F12)
2. Voir l'erreur exacte
3. Décider :
   - Fix rapide possible ? → Corriger
   - Complexe ? → Rollback complet

**Rollback immédiat** : Méthode 1 (commentaire)

---

### Problème 3 : Page missions ne charge plus

**Cause** : Erreur de syntaxe ou import cassé

**Solution d'urgence** :
```bash
# Revert immédiat
git revert HEAD
git push origin main
```

Puis investiguer le problème à tête reposée.

---

## 📊 Checklist de Décision

**Dois-je faire un rollback ?**

| Symptôme | Gravité | Action |
|----------|---------|--------|
| Bouton WhatsApp ne s'affiche pas | 🟢 Faible | Pas de rollback nécessaire |
| Clic ne fait rien | 🟡 Moyenne | Rollback si pas de fix rapide |
| Erreur JavaScript console | 🟡 Moyenne | Rollback si affecte autres fonctions |
| Page missions crash | 🔴 Critique | Rollback IMMÉDIAT |
| Inscriptions ne marchent plus | 🔴 Critique | Rollback IMMÉDIAT |

---

## 🎯 Réactivation Après Fix

Une fois le problème corrigé :

```bash
# 1. Fix le code
# 2. Test en local
npm run dev

# 3. Commit
git add .
git commit -m "fix: resolve WhatsApp share issue"

# 4. Push sur feature branch pour preview
git push origin feature/whatsapp-share

# 5. Test sur preview Vercel
# 6. Si OK → Merge en main
```

---

## 📞 Contact

En cas de problème critique :
1. Rollback IMMÉDIAT (Méthode 3 - Vercel Dashboard)
2. Investiguer ensuite
3. Ne pas hésiter à revenir en arrière

**Règle d'or** : En production, la stabilité > nouvelle feature

---

## ✅ Template de Message (si rollback)

Message à envoyer aux responsables :

```
Bonjour,

Nous avons temporairement désactivé le bouton de partage WhatsApp 
suite à [raison].

Toutes les autres fonctionnalités fonctionnent normalement.

Nous travaillons sur un correctif et vous tiendrons informés.

Merci de votre compréhension.
```

---

**Temps de rollback** : 30 sec à 3 min selon méthode  
**Impact** : ✅ Aucun si rollback propre  
**Données** : ✅ Aucune donnée perdue















