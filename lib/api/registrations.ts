import type { Mission, MissionClient } from '@/types';
import { api } from './http';
import { getMissionById, getUserMissions } from './missions';

/** Deux missions se chevauchent si leurs plages horaires se croisent (sans date : jamais) */
export function doMissionsOverlap(
  mission1: Pick<Mission, 'startDate' | 'endDate'>,
  mission2: Pick<Mission, 'startDate' | 'endDate'>
): boolean {
  if (!mission1.startDate || !mission2.startDate) return false;
  const start1 = new Date(mission1.startDate);
  const end1 = mission1.endDate ? new Date(mission1.endDate) : start1;
  const start2 = new Date(mission2.startDate);
  const end2 = mission2.endDate ? new Date(mission2.endDate) : start2;
  return start1 < end2 && end1 > start2;
}

/** Missions de l'utilisateur qui chevauchent la mission cible (le serveur revérifie à l'inscription) */
export async function checkUserMissionConflicts(userId: string, targetMission: Mission | MissionClient): Promise<MissionClient[]> {
  const mine = await getUserMissions(userId);
  return mine.filter((m) => m.id !== targetMission.id && doMissionsOverlap(targetMission, m));
}

export async function registerToMission(missionId: string, _userId?: string): Promise<void> {
  await api(`/api/missions/${missionId}/register`, { method: 'POST' });
}

export async function unregisterFromMission(missionId: string, _userId?: string): Promise<void> {
  await api(`/api/missions/${missionId}/register`, { method: 'DELETE' });
}

export async function joinWaitlist(missionId: string, _userId?: string): Promise<void> {
  await api(`/api/missions/${missionId}/register?waitlist=true`, { method: 'POST' });
}

export async function leaveWaitlist(missionId: string, _userId?: string): Promise<void> {
  await api(`/api/missions/${missionId}/register?waitlist=true`, { method: 'DELETE' });
}

export async function isUserRegistered(missionId: string, userId: string): Promise<boolean> {
  const mission = await getMissionById(missionId);
  return !!mission?.volunteers.includes(userId);
}

export async function isUserOnWaitlist(missionId: string, userId: string): Promise<boolean> {
  const mission = await getMissionById(missionId);
  return !!mission?.waitlist?.includes(userId);
}

export async function getAvailableSpots(missionId: string): Promise<number> {
  const mission = await getMissionById(missionId);
  return mission ? Math.max(0, mission.maxVolunteers - mission.volunteers.length) : 0;
}
