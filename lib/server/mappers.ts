import type { User as UserRow, Mission as MissionRow, CategoryResponsible as ResponsibleRow, MissionCategoryRow } from '@/lib/db';
import type { UserClient, MissionClient, CategoryResponsibleClient, MissionCategoryClient } from '@/types';

/**
 * Convertit une ligne users en UserClient. Le jeton personnel (accès email-only)
 * n'est exposé qu'aux administrateurs.
 */
export function toUserClient(row: UserRow, opts: { includeToken?: boolean } = {}): UserClient {
  return {
    uid: row.id,
    email: row.email,
    firstName: row.firstName,
    lastName: row.lastName,
    phone: row.phone,
    photoURL: row.photoURL ?? row.image ?? undefined,
    role: row.role as UserClient['role'],
    responsibleForCategories: row.responsibleForCategories ?? [],
    emailOnly: row.emailOnly ?? false,
    personalToken: opts.includeToken ? row.personalToken ?? undefined : undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    consents: {
      dataProcessing: row.dataProcessingConsent,
      communications: row.communicationsConsent,
      consentDate: row.consentDate ?? row.createdAt,
    },
    notificationPreferences: {
      email: row.emailNotifications ?? true,
      sms: row.smsNotifications ?? false,
    },
    preferences: (row.preferences as UserClient['preferences']) ?? undefined,
    fcmTokens: row.fcmTokens ?? [],
    notificationSettings: (row.notificationSettings as UserClient['notificationSettings']) ?? undefined,
  };
}

export function toMissionClient(row: MissionRow): MissionClient {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    category: row.category,
    type: row.type as MissionClient['type'],
    startDate: row.startDate ?? undefined,
    endDate: row.endDate ?? undefined,
    location: row.location,
    maxVolunteers: row.maxVolunteers,
    status: row.status as MissionClient['status'],
    isUrgent: row.isUrgent ?? false,
    isRecurrent: row.isRecurrent ?? false,
    createdBy: row.createdBy,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    volunteers: row.volunteers ?? [],
    waitlist: row.waitlist ?? [],
    responsibles: row.responsibles ?? [],
    pendingResponsibles: row.pendingResponsibles ?? [],
  };
}

export function toResponsibleClient(row: ResponsibleRow): CategoryResponsibleClient {
  return { ...row };
}

export function toCategoryClient(row: MissionCategoryRow): MissionCategoryClient {
  return {
    id: row.id,
    value: row.value,
    label: row.label,
    group: row.group,
    order: row.order,
    active: row.active,
    createdBy: row.createdBy,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt ?? undefined,
  };
}
