import { api, toIso } from './http';

export interface AdminSettings {
  autoApproveResponsibility: boolean;
  festivalStartDate?: Date;
  festivalEndDate?: Date;
  registrationsBlocked: boolean;
  registrationBlockedMessage?: string;
  updatedAt?: Date;
  updatedBy?: string;
}

const DEFAULTS: AdminSettings = {
  autoApproveResponsibility: false,
  registrationsBlocked: false,
  registrationBlockedMessage: '',
};

export async function getAdminSettings(): Promise<AdminSettings> {
  try {
    const { settings } = await api<{ settings: AdminSettings }>('/api/settings');
    return settings;
  } catch {
    return DEFAULTS;
  }
}

export async function updateAdminSettings(settings: Partial<AdminSettings>, _adminId?: string): Promise<void> {
  const { festivalStartDate, festivalEndDate, updatedAt, updatedBy, ...rest } = settings;
  await api('/api/settings', {
    method: 'PUT',
    body: {
      ...rest,
      ...(festivalStartDate !== undefined && { festivalStartDate: toIso(festivalStartDate) ?? null }),
      ...(festivalEndDate !== undefined && { festivalEndDate: toIso(festivalEndDate) ?? null }),
    },
  });
}
