
/**
 * User Roles
 */
export type UserRole = 'volunteer' | 'category_responsible' | 'admin';

/**
 * Mission Status
 */
export type MissionStatus =
  | 'draft'
  | 'published'
  | 'full'
  | 'cancelled'
  | 'completed';

/**
 * Mission Type
 */
export type MissionType = 'scheduled' | 'ongoing';

/**
 * Volunteer Request Status
 */
export type VolunteerRequestStatus = 'pending' | 'approved' | 'rejected';

/**
 * Volunteer Preferences
 */
export interface VolunteerPreferences {
  availableDates?: string[]; // Dates disponibles (format YYYY-MM-DD) - DEPRECATED, remplacé par availableDateSlots
  availableDateSlots?: Record<string, ('morning' | 'afternoon' | 'evening')[]>; // Disponibilités par date avec créneaux (ex: {"2025-11-21": ["morning", "afternoon"]})
  availableForPreFestival?: boolean; // Disponible pour les missions en amont du festival
  preferredCategories?: string[]; // Catégories de missions préférées
  preferredTimeSlots?: ('morning' | 'afternoon' | 'evening' | 'night')[]; // Créneaux horaires préférés
  preferredPostType?: 'static' | 'dynamic' | 'both'; // Type de poste préféré
  preferredDuration?: ('short' | 'medium' | 'long')[]; // Durée de mission préférée
  skills?: string[]; // Compétences (permis, premiers secours, langues, etc.)
  hasCar?: boolean; // Possède un véhicule
  canTransportEquipment?: boolean; // Peut transporter du matériel
  additionalInfo?: string; // Informations supplémentaires
}

/**
 * Notification Settings
 */
export interface NotificationSettings {
  pushEnabled: boolean; // Notifications push activées
  emailEnabled: boolean; // Notifications email activées
  newAssignment: boolean; // Notification pour nouvelle affectation
  missionUpdate: boolean; // Notification pour modification de mission
  missionReminder: boolean; // Rappel avant mission
  missionCancellation: boolean; // Notification pour annulation
  categoryMessages: boolean; // Messages du responsable de catégorie
  generalAnnouncements: boolean; // Annonces générales
}

/**
 * Notification Type
 */
export type NotificationType = 
  | 'new_assignment'
  | 'mission_update'
  | 'mission_reminder'
  | 'mission_cancellation'
  | 'category_message'
  | 'general_announcement';

/**
 * Notification Payload
 */
export interface NotificationPayload {
  type: NotificationType;
  title: string;
  body: string;
  url?: string;
  missionId?: string;
  categoryId?: string;
  data?: Record<string, string>;
}

/**
 * User Model
 */
export interface User {
  uid: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  photoURL?: string;
  role: UserRole;
  responsibleForCategories?: string[]; // Categories where user is responsible
  emailOnly?: boolean; // For volunteers who only use email, no login
  personalToken?: string; // Unique token for email-only access to personal mission list
  createdAt: Date;
  updatedAt?: Date;
  consents: {
    dataProcessing: boolean;
    communications: boolean;
    consentDate: Date;
  };
  notificationPreferences?: {
    email: boolean;
    sms: boolean;
  };
  preferences?: VolunteerPreferences; // Préférences du bénévole
  fcmTokens?: string[]; // Tokens FCM pour notifications push (peut avoir plusieurs appareils)
  notificationSettings?: NotificationSettings; // Paramètres détaillés de notifications
}

/**
 * Mission Model
 */
export interface Mission {
  id: string;
  title: string;
  description: string;
  category: string; // Category of the mission
  type: MissionType;
  startDate?: Date; // Optional for ongoing missions
  endDate?: Date; // Optional for ongoing missions
  location: string;
  maxVolunteers: number;
  status: MissionStatus;
  isUrgent: boolean;
  isRecurrent: boolean;
  createdBy: string; // User UID
  createdAt: Date;
  updatedAt?: Date;
  volunteers: string[]; // Array of User UIDs
  waitlist?: string[]; // Array of User UIDs waiting for a spot
  // DEPRECATED: Use category-responsibles system instead
  responsibles: string[]; // DEPRECATED - Old per-mission responsible system
  pendingResponsibles: string[]; // DEPRECATED - Old responsibility request system
}

/**
 * Category Responsible Model
 */
export interface CategoryResponsible {
  id: string;
  categoryId: string; // Category identifier
  categoryLabel: string; // Category display name
  responsibleId: string; // User UID
  assignedBy: string; // Admin UID who assigned
  assignedAt: Date;
}

/**
 * Volunteer Request Model (DEPRECATED - kept for data migration)
 */
export interface VolunteerRequest {
  id: string;
  missionId: string;
  userId: string;
  status: VolunteerRequestStatus;
  requestedAt: Date;
  processedAt?: Date;
  processedBy?: string; // Admin UID
  message?: string;
}

/**
 * Client-side versions with Date instead of Timestamp
 */
export type UserClient = Omit<User, 'createdAt' | 'updatedAt' | 'consents'> & {
  createdAt: Date;
  updatedAt?: Date;
  consents: {
    dataProcessing: boolean;
    communications: boolean;
    consentDate: Date;
  };
  preferences?: VolunteerPreferences;
};

export type MissionClient = Omit<
  Mission,
  'startDate' | 'endDate' | 'createdAt' | 'updatedAt'
> & {
  startDate?: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt?: Date;
};

export type CategoryResponsibleClient = Omit<
  CategoryResponsible,
  'assignedAt'
> & {
  assignedAt: Date;
};

// Export des types de catégories
export * from './category';

export type VolunteerRequestClient = Omit<
  VolunteerRequest,
  'requestedAt' | 'processedAt'
> & {
  requestedAt: Date;
  processedAt?: Date;
};

