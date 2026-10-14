import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api/http';

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  missionId?: string;
  missionTitle?: string;
  volunteerName?: string;
  volunteerId?: string;
  read: boolean;
  createdAt: Date;
  readAt?: Date;
}

/** Notifications push : non prises en charge pour l'instant (les notifications in-app ci-dessous suffisent) */
export function useNotifications() {
  return {
    isSupported: false,
    permission: 'default' as NotificationPermission,
    isLoading: false,
    isEnabled: false,
    enableNotifications: async () => false,
    disableNotifications: async () => false,
  };
}

const POLL_INTERVAL_MS = 30_000;

/** Notifications in-app de l'utilisateur, rafraîchies toutes les 30 s (et quand l'onglet reprend le focus) */
export function useInAppNotifications(userId: string | undefined) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const { notifications } = await api<{ notifications: Notification[] }>('/api/notifications');
      setNotifications(notifications);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!userId) {
      setNotifications([]);
      setLoading(false);
      return;
    }
    refresh();
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') refresh();
    }, POLL_INTERVAL_MS);
    const onVisible = () => document.visibilityState === 'visible' && refresh();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [userId, refresh]);

  const markAsRead = async (notificationId: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n)));
    await api('/api/notifications', { method: 'PATCH', body: { id: notificationId } }).catch(() => refresh());
  };

  const markAllAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    await api('/api/notifications', { method: 'PATCH', body: { all: true } }).catch(() => refresh());
  };

  return {
    notifications,
    unreadCount: notifications.filter((n) => !n.read).length,
    loading,
    markAsRead,
    markAllAsRead,
  };
}
