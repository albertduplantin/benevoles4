import type { MissionClient, MissionStatus, MissionType } from '@/types';
import { api, toIso } from './http';

export async function createMission(
  missionData: {
    title: string;
    description: string;
    category: string;
    type: MissionType;
    startDate?: Date;
    endDate?: Date;
    location: string;
    maxVolunteers: number;
    isUrgent?: boolean;
    isRecurrent?: boolean;
    status?: MissionStatus;
  },
  // Conservé pour compatibilité : le serveur utilise l'utilisateur connecté
  _createdBy?: string
): Promise<string> {
  const { mission } = await api<{ mission: MissionClient }>('/api/missions', {
    method: 'POST',
    body: {
      ...missionData,
      startDate: toIso(missionData.startDate),
      endDate: toIso(missionData.endDate),
      status: missionData.status === 'published' ? 'published' : 'draft',
    },
  });
  return mission.id;
}

export async function getMissionById(missionId: string): Promise<MissionClient | null> {
  try {
    const { mission } = await api<{ mission: MissionClient }>(`/api/missions/${missionId}`);
    return mission;
  } catch (error: any) {
    if (/introuvable/i.test(error.message)) return null;
    throw error;
  }
}

async function list(scope: string, extra = ''): Promise<MissionClient[]> {
  const { missions } = await api<{ missions: MissionClient[] }>(`/api/missions?scope=${scope}${extra}`);
  return missions;
}

export const getPublishedMissions = () => list('published');
export const getVisibleMissions = () => list('visible');
export const getAllMissions = () => list('all');
export const getUserMissions = (userId: string) => list('mine', `&userId=${encodeURIComponent(userId)}`);

export async function deleteMission(missionId: string): Promise<void> {
  await api(`/api/missions/${missionId}`, { method: 'DELETE' });
}

/** `updates` accepte des Date ou des chaînes datetime-local ; une date vide est ignorée (inchangée). */
export async function updateMission(missionId: string, updates: Record<string, any>): Promise<void> {
  const { startDate, endDate, ...rest } = updates;
  await api(`/api/missions/${missionId}`, {
    method: 'PUT',
    body: {
      ...rest,
      ...(toIso(startDate) && { startDate: toIso(startDate) }),
      ...(toIso(endDate) && { endDate: toIso(endDate) }),
    },
  });
}

export async function registerVolunteerToMission(missionId: string, _userId?: string): Promise<void> {
  await api(`/api/missions/${missionId}/register`, { method: 'POST' });
}

export async function unregisterVolunteerFromMission(missionId: string, _userId?: string): Promise<void> {
  await api(`/api/missions/${missionId}/register`, { method: 'DELETE' });
}

export async function duplicateMission(missionId: string, _duplicatedBy?: string): Promise<string> {
  const { mission } = await api<{ mission: MissionClient }>(`/api/missions/${missionId}/duplicate`, { method: 'POST' });
  return mission.id;
}
