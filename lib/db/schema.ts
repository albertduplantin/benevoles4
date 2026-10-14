import { pgTable, text, timestamp, boolean, integer, jsonb, varchar, primaryKey } from 'drizzle-orm/pg-core';

/**
 * Users table - Utilisateurs de l'application
 * L'authentification est gérée par Auth.js (Google + lien magique par email).
 * Les colonnes name/emailVerified/image sont requises par l'adaptateur Auth.js.
 * Les anciens identifiants Clerk sont conservés tels quels (rattachement par email).
 */
export const users = pgTable('users', {
  // ID utilisateur (ancien ID Clerk pour les comptes existants, UUID sinon)
  id: text('id').primaryKey(),

  // Champs Auth.js
  name: text('name'),
  emailVerified: timestamp('email_verified', { mode: 'date' }),
  image: text('image'),

  // Informations de base ('' tant que le profil n'est pas complété)
  email: text('email').notNull(),
  firstName: text('first_name').notNull().default(''),
  lastName: text('last_name').notNull().default(''),
  phone: text('phone').notNull().default(''),
  photoURL: text('photo_url'),

  // Rôle et permissions
  role: text('role').notNull().default('volunteer'), // 'volunteer' | 'category_responsible' | 'admin'
  responsibleForCategories: text('responsible_for_categories').array(),

  // Pour bénévoles email-only (sans compte de connexion)
  emailOnly: boolean('email_only').default(false),
  personalToken: text('personal_token'),

  // Consentements
  dataProcessingConsent: boolean('data_processing_consent').notNull().default(false),
  communicationsConsent: boolean('communications_consent').notNull().default(false),
  consentDate: timestamp('consent_date'),

  // Préférences de notification
  emailNotifications: boolean('email_notifications').default(true),
  smsNotifications: boolean('sms_notifications').default(false),

  // Préférences du bénévole (JSON)
  preferences: jsonb('preferences'), // VolunteerPreferences

  // Tokens FCM pour notifications push
  fcmTokens: text('fcm_tokens').array(),

  // Paramètres de notifications détaillés (JSON)
  notificationSettings: jsonb('notification_settings'), // NotificationSettings

  // Timestamps
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

/**
 * Comptes externes (Google) liés à un utilisateur - table Auth.js
 */
export const accounts = pgTable(
  'accounts',
  {
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    type: text('type').notNull(),
    provider: text('provider').notNull(),
    providerAccountId: text('provider_account_id').notNull(),
    refresh_token: text('refresh_token'),
    access_token: text('access_token'),
    expires_at: integer('expires_at'),
    token_type: text('token_type'),
    scope: text('scope'),
    id_token: text('id_token'),
    session_state: text('session_state'),
  },
  (account) => [primaryKey({ columns: [account.provider, account.providerAccountId] })]
);

/**
 * Jetons de lien magique par email - table Auth.js
 */
export const verificationTokens = pgTable(
  'verification_tokens',
  {
    identifier: text('identifier').notNull(),
    token: text('token').notNull(),
    expires: timestamp('expires', { mode: 'date' }).notNull(),
  },
  (vt) => [primaryKey({ columns: [vt.identifier, vt.token] })]
);

/**
 * Missions table
 */
export const missions = pgTable('missions', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  category: text('category').notNull(),
  type: text('type').notNull(), // 'scheduled' | 'ongoing'

  // Dates (optionnelles pour missions continues)
  startDate: timestamp('start_date'),
  endDate: timestamp('end_date'),

  location: text('location').notNull(),
  maxVolunteers: integer('max_volunteers').notNull(),
  status: text('status').notNull().default('draft'), // 'draft' | 'published' | 'full' | 'cancelled' | 'completed'

  // Flags
  isUrgent: boolean('is_urgent').default(false),
  isRecurrent: boolean('is_recurrent').default(false),

  // Créateur
  createdBy: text('created_by').notNull().references(() => users.id),

  // Arrays de user IDs
  volunteers: text('volunteers').array().default([]),
  waitlist: text('waitlist').array().default([]),

  // DEPRECATED fields (gardés pour migration)
  responsibles: text('responsibles').array().default([]),
  pendingResponsibles: text('pending_responsibles').array().default([]),

  // Timestamps
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

/**
 * Category Responsibles table
 */
export const categoryResponsibles = pgTable('category_responsibles', {
  id: text('id').primaryKey(),
  categoryId: text('category_id').notNull(),
  categoryLabel: text('category_label').notNull(),
  responsibleId: text('responsible_id').notNull().references(() => users.id),
  assignedBy: text('assigned_by').notNull().references(() => users.id),
  assignedAt: timestamp('assigned_at').notNull().defaultNow(),
});

/**
 * Catégories de missions (id = value : identifiant unique lisible, utilisé aussi par les missions)
 */
export const missionCategories = pgTable('mission_categories', {
  id: text('id').primaryKey(),
  value: text('value').notNull(),
  label: text('label').notNull(),
  group: text('group_name').notNull(),
  order: integer('sort_order').notNull().default(0),
  active: boolean('active').notNull().default(true),
  createdBy: text('created_by').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at'),
});

/**
 * Paramètres globaux de l'administration (une seule ligne, id = 'admin')
 */
export const adminSettings = pgTable('admin_settings', {
  id: text('id').primaryKey(),
  autoApproveResponsibility: boolean('auto_approve_responsibility').notNull().default(false),
  festivalStartDate: timestamp('festival_start_date'),
  festivalEndDate: timestamp('festival_end_date'),
  registrationsBlocked: boolean('registrations_blocked').notNull().default(false),
  registrationBlockedMessage: text('registration_blocked_message').default(''),
  updatedAt: timestamp('updated_at'),
  updatedBy: text('updated_by'),
});

/**
 * Notifications in-app
 */
export const notifications = pgTable('notifications', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  missionId: text('mission_id'),
  missionTitle: text('mission_title'),
  volunteerName: text('volunteer_name'),
  volunteerId: text('volunteer_id'),
  read: boolean('read').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  readAt: timestamp('read_at'),
});

/**
 * Slots table - Pour missions avec créneaux horaires spécifiques
 */
export const slots = pgTable('slots', {
  id: text('id').primaryKey(),
  missionId: text('mission_id').notNull().references(() => missions.id, { onDelete: 'cascade' }),

  // Informations du créneau
  startTime: timestamp('start_time').notNull(),
  endTime: timestamp('end_time').notNull(),
  maxVolunteers: integer('max_volunteers').notNull(),

  // Bénévoles assignés
  volunteers: text('volunteers').array().default([]),

  // Timestamps
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

/**
 * Bookings table - Réservations de bénévoles pour missions/slots
 */
export const bookings = pgTable('bookings', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  missionId: text('mission_id').notNull().references(() => missions.id, { onDelete: 'cascade' }),
  slotId: text('slot_id').references(() => slots.id, { onDelete: 'cascade' }), // Optionnel si pas de slot

  status: text('status').notNull().default('confirmed'), // 'pending' | 'confirmed' | 'cancelled'

  // Timestamps
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

/**
 * Volunteer Requests table (DEPRECATED - kept for data migration)
 */
export const volunteerRequests = pgTable('volunteer_requests', {
  id: text('id').primaryKey(),
  missionId: text('mission_id').notNull().references(() => missions.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id),
  status: text('status').notNull().default('pending'), // 'pending' | 'approved' | 'rejected'
  message: text('message'),

  requestedAt: timestamp('requested_at').notNull().defaultNow(),
  processedAt: timestamp('processed_at'),
  processedBy: text('processed_by').references(() => users.id),
});

// Export types
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Mission = typeof missions.$inferSelect;
export type NewMission = typeof missions.$inferInsert;

export type CategoryResponsible = typeof categoryResponsibles.$inferSelect;
export type NewCategoryResponsible = typeof categoryResponsibles.$inferInsert;

export type MissionCategoryRow = typeof missionCategories.$inferSelect;
export type NotificationRow = typeof notifications.$inferSelect;

export type Slot = typeof slots.$inferSelect;
export type NewSlot = typeof slots.$inferInsert;

export type Booking = typeof bookings.$inferSelect;
export type NewBooking = typeof bookings.$inferInsert;

export type VolunteerRequest = typeof volunteerRequests.$inferSelect;
export type NewVolunteerRequest = typeof volunteerRequests.$inferInsert;
