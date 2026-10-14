import type { User, UserClient, NotificationSettings, VolunteerPreferences } from '@/types';
import { api } from './http';

export async function getUserById(userId: string): Promise<UserClient | null> {
  try {
    const { user } = await api<{ user: UserClient }>(`/api/users/${encodeURIComponent(userId)}`);
    return user;
  } catch (error: any) {
    if (/introuvable/i.test(error.message)) return null;
    throw error;
  }
}

async function patch(userId: string, body: Record<string, unknown>): Promise<UserClient> {
  const { user } = await api<{ user: UserClient }>(`/api/users/${encodeURIComponent(userId)}`, { method: 'PATCH', body });
  return user;
}

export async function updateUserProfile(
  userId: string,
  updates: { firstName?: string; lastName?: string; phone?: string; photoURL?: string }
): Promise<void> {
  await patch(userId, updates);
}

export function isProfileComplete(user: User | UserClient | null): boolean {
  if (!user) return false;
  return !!(user.firstName?.trim() && user.lastName?.trim() && user.phone?.trim() && user.email?.trim());
}

/** Accepte les anciennes clés pointées ('consents.communications', 'notificationPreferences.email'...) */
export async function updateUserPreferences(
  userId: string,
  preferences: {
    'consents.communications'?: boolean;
    'notificationPreferences.email'?: boolean;
    'notificationPreferences.sms'?: boolean;
  }
): Promise<void> {
  const body: Record<string, unknown> = {};
  if (preferences['consents.communications'] !== undefined) body.communications = preferences['consents.communications'];
  const notif: Record<string, boolean> = {};
  if (preferences['notificationPreferences.email'] !== undefined) notif.email = preferences['notificationPreferences.email'];
  if (preferences['notificationPreferences.sms'] !== undefined) notif.sms = preferences['notificationPreferences.sms'];
  if (Object.keys(notif).length > 0) body.notificationPreferences = notif;
  await patch(userId, body);
}

export async function updateVolunteerPreferences(userId: string, preferences: VolunteerPreferences): Promise<void> {
  await patch(userId, { preferences });
}

// --- Notifications push / paramètres ---

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  pushEnabled: true,
  emailEnabled: true,
  newAssignment: true,
  missionUpdate: true,
  missionReminder: true,
  missionCancellation: true,
  categoryMessages: true,
  generalAnnouncements: true,
};

export async function saveFCMToken(userId: string, token: string): Promise<void> {
  await patch(userId, { addFcmToken: token });
}

export async function removeFCMToken(userId: string, token: string): Promise<void> {
  await patch(userId, { removeFcmToken: token });
}

export async function getUserFCMTokens(userId: string): Promise<string[]> {
  return (await getUserById(userId))?.fcmTokens ?? [];
}

export async function updateNotificationSettings(userId: string, settings: Partial<NotificationSettings>): Promise<void> {
  await patch(userId, { notificationSettings: settings });
}

export async function getNotificationSettings(userId: string): Promise<NotificationSettings> {
  const user = await getUserById(userId);
  return { ...DEFAULT_NOTIFICATION_SETTINGS, ...(user?.notificationSettings ?? {}) };
}

export async function initializeNotificationSettings(userId: string): Promise<void> {
  await patch(userId, { notificationSettings: DEFAULT_NOTIFICATION_SETTINGS });
}

// --- Administration des bénévoles ---

export async function getAllVolunteers(): Promise<UserClient[]> {
  const { users } = await api<{ users: UserClient[] }>('/api/users');
  return users;
}

export async function updateVolunteerInfo(
  volunteerId: string,
  data: { firstName?: string; lastName?: string; phone?: string; email?: string }
): Promise<void> {
  await patch(volunteerId, data);
}

export async function changeVolunteerRole(volunteerId: string, newRole: 'volunteer' | 'category_responsible' | 'admin'): Promise<void> {
  await patch(volunteerId, { role: newRole });
}

export async function deleteVolunteer(volunteerId: string): Promise<void> {
  await api(`/api/users/${encodeURIComponent(volunteerId)}`, { method: 'DELETE' });
}

export async function adminRegisterVolunteer(missionId: string, volunteerId: string): Promise<void> {
  await api(`/api/missions/${missionId}/volunteers`, { method: 'POST', body: { userId: volunteerId } });
}

export async function adminUnregisterVolunteer(missionId: string, volunteerId: string): Promise<void> {
  await api(`/api/missions/${missionId}/volunteers`, { method: 'DELETE', body: { userId: volunteerId } });
}

export interface CreateVolunteerData {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  emailOnly?: boolean;
}

export async function createVolunteerManually(data: CreateVolunteerData): Promise<{ userId: string; token?: string; temporaryPassword?: string }> {
  return api('/api/users', { method: 'POST', body: data });
}

// --- Bénévoles "email-only" (accès par lien personnel) ---

export async function setUserEmailOnly(userId: string, emailOnly: boolean): Promise<string | null> {
  const user = await patch(userId, { emailOnly });
  return user.personalToken ?? null;
}

export async function getEmailOnlyUsers(): Promise<UserClient[]> {
  const { users } = await api<{ users: UserClient[] }>('/api/users?emailOnly=true');
  return users;
}

export async function regeneratePersonalToken(userId: string): Promise<string> {
  const user = await patch(userId, { regenerateToken: true });
  return user.personalToken ?? '';
}

export async function getUserByToken(token: string): Promise<UserClient | null> {
  try {
    const { user } = await api<{ user: UserClient }>(`/api/personal?token=${encodeURIComponent(token)}`);
    return user;
  } catch {
    return null;
  }
}
