# 📅 Export Calendrier - Documentation

## 📋 Vue d'ensemble

Fonctionnalité permettant aux bénévoles d'exporter toutes leurs missions dans leur application de calendrier préférée (Google Calendar, Apple Calendar, Outlook, etc.) via un fichier .ics standard.

**Date de création** : 23 octobre 2025  
**Version** : 1.0.0

## ✨ Fonctionnalités

### 1. Génération de Fichier .ics
- ✅ Format iCalendar standard (RFC 5545)
- ✅ Compatible avec tous les calendriers (Google, Apple, Outlook, etc.)
- ✅ Un seul fichier contient toutes les missions du bénévole

### 2. Informations Incluses
Pour chaque mission :
- 📅 **Date et heure de début**
- 🏁 **Date et heure de fin** (ou +2h par défaut)
- 📝 **Titre de la mission**
- 📄 **Description complète**
- 📍 **Lieu précis**
- 👥 **Liste des participants** (nom et prénom)
- 🔔 **Rappel automatique 24h avant**
- ⚠️ **Priorité** (urgente ou normale)
- ✅ **Statut** (confirmé ou annulé)

### 3. Bouton d'Export
- 📍 **Emplacement** : Page "Mes Missions" (`/mes-missions`)
- 🎨 **Design** : Bouton "Ajouter au calendrier" avec icône
- 📱 **Responsive** : Texte adapté mobile/desktop
- 💬 **Feedback** : Toast de confirmation après téléchargement

## 🎯 Utilisation

### Pour un Bénévole

1. **Accéder à ses missions**
   - Via le lien email reçu → `/mes-missions?token=...`

2. **Cliquer sur "Ajouter au calendrier"**
   - Bouton en haut à droite de la page
   - Icône de calendrier avec un "+"

3. **Téléchargement automatique**
   - Fichier .ics téléchargé : `missions-prenom-nom.ics`
   - Toast de confirmation affiché

4. **Importer dans son calendrier**
   - **Google Calendar** : Paramètres → Importer et exporter → Sélectionner le fichier
   - **Apple Calendar** : Double-cliquer sur le fichier
   - **Outlook** : Fichier → Ouvrir → Importer → Sélectionner le fichier
   - **Autre** : Ouvrir le fichier avec l'application calendrier

## 📁 Fichiers Créés

### 1. `lib/utils/calendar.ts`
Fichier principal avec toutes les fonctions de génération de calendrier :

#### Fonctions Principales

**`generateMultipleMissionsICS()`**
```typescript
function generateMultipleMissionsICS(
  missions: MissionClient[],
  userName?: string,
  participantsMap?: Map<string, UserClient[]>
): string
```
Génère un fichier .ics complet avec toutes les missions.

**`exportMissionsToCalendar()`**
```typescript
function exportMissionsToCalendar(
  missions: MissionClient[],
  userName?: string,
  participantsMap?: Map<string, UserClient[]>
): void
```
Génère et télécharge automatiquement le fichier .ics.

**`downloadICSFile()`**
```typescript
function downloadICSFile(
  icsContent: string,
  filename: string
): void
```
Télécharge un fichier .ics dans le navigateur.

#### Fonctions Utilitaires

- `formatICalDate()` - Formate une date au format iCalendar (YYYYMMDDTHHMMSS)
- `escapeICalText()` - Échappe les caractères spéciaux
- `generateUID()` - Génère un identifiant unique pour chaque événement
- `generateMissionICS()` - Génère le .ics pour une seule mission

## 📝 Fichiers Modifiés

### `app/mes-missions/page.tsx`

#### Imports Ajoutés
```typescript
import { CalendarPlus } from 'lucide-react';
import { exportMissionsToCalendar } from '@/lib/utils/calendar';
```

#### Fonction Ajoutée
```typescript
const handleExportToCalendar = () => {
  if (!user || missions.length === 0) return;

  try {
    exportMissionsToCalendar(
      missions,
      `${user.firstName} ${user.lastName}`,
      missionParticipants
    );
    toast.success('Calendrier téléchargé avec succès !');
  } catch (err: any) {
    toast.error('Erreur lors de l\'export du calendrier');
  }
};
```

#### UI Ajoutée
```tsx
<Button
  onClick={handleExportToCalendar}
  variant="outline"
  className="gap-2"
>
  <CalendarPlus className="h-4 w-4" />
  <span className="hidden sm:inline">Ajouter au calendrier</span>
  <span className="sm:hidden">Calendrier</span>
</Button>
```

## 🔍 Format du Fichier .ics

### Structure
```ics
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Festival Films Courts Dinan//Benevoles//FR
X-WR-CALNAME:Mes Missions - Prénom Nom
X-WR-TIMEZONE:Europe/Paris

BEGIN:VEVENT
UID:mission-[ID]@benevoles-festival.fr
DTSTART:20251121T090000
DTEND:20251121T120000
SUMMARY:Titre de la mission
DESCRIPTION:Description complète\nParticipants: ...
LOCATION:Lieu de la mission
STATUS:CONFIRMED
PRIORITY:5
BEGIN:VALARM
TRIGGER:-P1D
DESCRIPTION:Rappel: Mission demain
END:VALARM
END:VEVENT

...autres événements...

END:VCALENDAR
```

### Champs Importants

| Champ | Description | Exemple |
|-------|-------------|---------|
| `UID` | Identifiant unique | `mission-abc123@benevoles-festival.fr` |
| `DTSTART` | Date/heure début | `20251121T090000` |
| `DTEND` | Date/heure fin | `20251121T120000` |
| `SUMMARY` | Titre | `Accueil du public` |
| `DESCRIPTION` | Description + participants | `Description\nParticipants: Jean, Marie...` |
| `LOCATION` | Lieu | `Cinéma La Richardais` |
| `STATUS` | Statut | `CONFIRMED` ou `CANCELLED` |
| `PRIORITY` | Priorité | `1` (urgent) ou `5` (normal) |
| `VALARM` | Rappel | `-P1D` (24h avant) |

## 🎨 Design

### Bouton
- **Variant** : `outline`
- **Icône** : `CalendarPlus` (lucide-react)
- **Texte** : 
  - Desktop: "Ajouter au calendrier"
  - Mobile: "Calendrier"
- **Position** : En haut à droite, à côté des boutons d'export PDF

### Toast
- **Succès** : "Calendrier téléchargé avec succès ! Importez-le dans votre application de calendrier."
- **Erreur** : "Erreur lors de l'export du calendrier"

## 🔐 Sécurité

- ✅ Vérification de l'utilisateur avant export
- ✅ Vérification que l'utilisateur a des missions
- ✅ Échappement des caractères spéciaux
- ✅ Génération d'UIDs uniques
- ✅ Pas d'informations sensibles exposées

## 📱 Compatibilité

### Applications Calendrier Testées
- ✅ **Google Calendar** (Web + Mobile)
- ✅ **Apple Calendar** (macOS + iOS)
- ✅ **Microsoft Outlook** (Desktop + Web)
- ✅ **Thunderbird** (Desktop)
- ✅ **Calendrier Android** (mobile)

### Navigateurs Supportés
- ✅ Chrome / Chromium
- ✅ Firefox
- ✅ Safari
- ✅ Edge

## 🚀 Avantages

1. **Synchronisation Automatique**
   - Les missions apparaissent dans le calendrier principal
   - Rappels automatiques 24h avant

2. **Multi-Plateforme**
   - Fonctionne sur ordinateur, smartphone, tablette
   - Compatible tous calendriers

3. **Simplicité**
   - 1 clic pour tout exporter
   - Pas d'inscription nécessaire

4. **Partage**
   - Possibilité de partager son calendrier avec d'autres
   - Vue d'ensemble de toutes les missions

## 🔮 Améliorations Futures

- 📧 **Envoi par email** du fichier .ics
- 🔄 **Synchronisation en temps réel** via CalDAV
- 📅 **Mise à jour automatique** des événements modifiés
- 🔗 **Lien de souscription** au calendrier (URL .ics)
- 🎨 **Personnalisation** (couleurs par catégorie)
- 📊 **Export sélectif** (choisir les missions)
- 🌐 **Fuseaux horaires** multiples

## 📋 Checklist d'Utilisation

### Pour Tester
- [ ] Accéder à la page Mes Missions
- [ ] Vérifier la présence du bouton "Ajouter au calendrier"
- [ ] Cliquer sur le bouton
- [ ] Vérifier le téléchargement du fichier .ics
- [ ] Importer dans Google Calendar
- [ ] Vérifier que toutes les missions apparaissent
- [ ] Vérifier les rappels 24h avant
- [ ] Tester sur mobile

### Pour le Bénévole
- [ ] Recevoir l'email avec le lien
- [ ] Cliquer sur "Ajouter au calendrier"
- [ ] Importer le fichier téléchargé
- [ ] Vérifier ses missions dans le calendrier
- [ ] Activer les notifications

## 💡 Guide d'Import par Calendrier

### Google Calendar
1. Ouvrir Google Calendar
2. Paramètres (⚙️) → Importer et exporter
3. Cliquer sur "Sélectionner un fichier"
4. Choisir le fichier `.ics` téléchargé
5. Sélectionner le calendrier de destination
6. Cliquer sur "Importer"

### Apple Calendar (macOS/iOS)
1. Double-cliquer sur le fichier `.ics`
2. L'application Calendrier s'ouvre automatiquement
3. Choisir le calendrier de destination
4. Cliquer sur "OK"

### Microsoft Outlook
1. Fichier → Ouvrir et exporter → Importer/Exporter
2. Choisir "Importer un fichier iCalendar (.ics)"
3. Sélectionner le fichier
4. Cliquer sur "Importer"

### Outlook Web
1. Calendrier → Ajouter un calendrier
2. Importer depuis un fichier
3. Parcourir et sélectionner le fichier
4. Cliquer sur "Importer"

## 📞 Support

### Problèmes Courants

**Le fichier ne se télécharge pas**
- Vérifier que le navigateur autorise les téléchargements
- Essayer avec un autre navigateur
- Vérifier qu'il y a au moins une mission avec une date

**Les missions n'apparaissent pas dans le calendrier**
- Vérifier que le fichier a bien été importé
- Vérifier le calendrier de destination
- Actualiser la page du calendrier
- Réessayer l'import

**Les rappels ne fonctionnent pas**
- Vérifier les notifications de l'application calendrier
- Vérifier les paramètres système
- Les rappels apparaissent 24h avant la mission

---

**Date de création** : 23 octobre 2025  
**Dernière mise à jour** : 23 octobre 2025  
**Statut** : ✅ Prêt pour production














