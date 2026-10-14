'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useInAppNotifications } from '@/hooks/useNotifications';
import { BellIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import Link from 'next/link';

export function NotificationBell() {
  const { user } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useInAppNotifications(user?.uid);
  const [open, setOpen] = useState(false);

  if (!user || (user.role !== 'admin' && user.role !== 'category_responsible')) {
    return null;
  }

  // Afficher seulement les 5 dernières notifications
  const recentNotifications = notifications.slice(0, 5);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <BellIcon className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-96" align="end">
        <div className="flex items-center justify-between px-2 py-1.5">
          <DropdownMenuLabel className="p-0">Notifications</DropdownMenuLabel>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.preventDefault();
                markAllAsRead();
              }}
              className="text-xs h-auto py-1 px-2"
            >
              Tout marquer comme lu
            </Button>
          )}
        </div>
        <DropdownMenuSeparator />
        {recentNotifications.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <BellIcon className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">Aucune notification</p>
          </div>
        ) : (
          <div className="max-h-[400px] overflow-y-auto">
            {recentNotifications.map((notification, index) => (
              <div key={notification.id}>
                {index > 0 && <DropdownMenuSeparator />}
                <DropdownMenuItem
                  className={`cursor-pointer ${!notification.read ? 'bg-blue-50' : ''}`}
                  onClick={() => {
                    markAsRead(notification.id);
                    setOpen(false);
                    if (notification.missionId) {
                      window.location.href = `/dashboard/missions/${notification.missionId}`;
                    }
                  }}
                >
                  <div className="flex items-start gap-3 w-full py-2">
                    <div className="flex-shrink-0">
                      {!notification.read && (
                        <div className="h-2 w-2 bg-blue-600 rounded-full mt-1"></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{notification.title}</p>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">{notification.message}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {formatDistanceToNow(notification.createdAt, {
                          addSuffix: true,
                          locale: fr,
                        })}
                      </p>
                    </div>
                  </div>
                </DropdownMenuItem>
              </div>
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

