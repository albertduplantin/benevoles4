import { pgTable, text, timestamp, boolean, integer, jsonb, varchar, primaryKey } from 'drizzle-orm/pg-core';

/**
 * Users table - Stocke les métadonnées supplémentaires des utilisateurs
 * L'authentification est gérée par Clerk
 */
export const users = pgTable('users', {
  // Clerk user ID comme clé primaire
  id: text('id').primaryKey(),

  // Informations de base (synchronisées depuis Clerk)
  email: text('email').notNull(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  phone: text('phone').notNull(),
  photoURL: text('photo_url'),

  // Rôle et permissions
  role: text('role').notNull().default('volunteer'), // 'volunteer' | 'category_responsible' | 'admin'
  responsibleForCategories: text('responsible_for_categories').array(),

  // Pour bénévoles email-only (sans compte Clerk)
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

export type Slot = typeof slots.$inferSelect;
export type NewSlot = typeof slots.$inferInsert;

export type Booking = typeof bookings.$inferSelect;
export type NewBooking = typeof bookings.$inferInsert;

export type VolunteerRequest = typeof volunteerRequests.$inferSelect;
export type NewVolunteerRequest = typeof volunteerRequests.$inferInsert;
