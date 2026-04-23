'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bell,
  AlertTriangle,
  Clock,
  Sparkles,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
} from '@/lib/notifications/actions';
import type { Notification } from '@/lib/notifications/actions';
import { cn } from '@/lib/utils';

function getTypeIcon(type: string) {
  switch (type) {
    case 'invoice_paid':
      return (
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600">
          <CheckCircle2 className="h-5 w-5" />
        </span>
      );
    case 'invoice_overdue':
      return (
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
          <AlertTriangle className="h-5 w-5" />
        </span>
      );
    case 'reminder_sent':
      return (
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-100 text-orange-600">
          <Bell className="h-5 w-5" />
        </span>
      );
    case 'deadline':
      return (
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-yellow-100 text-yellow-600">
          <Clock className="h-5 w-5" />
        </span>
      );
    case 'welcome':
      return (
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
          <Sparkles className="h-5 w-5" />
        </span>
      );
    default:
      return (
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Bell className="h-5 w-5" />
        </span>
      );
  }
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) return 'Zojuist';
  if (diffMinutes < 60) return `${diffMinutes} min geleden`;
  if (diffHours < 24) return `${diffHours} uur geleden`;
  if (diffDays < 7) return `${diffDays} ${diffDays === 1 ? 'dag' : 'dagen'} geleden`;

  return date.toLocaleDateString('nl-NL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function getDateGroup(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();

  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);

  const weekStart = new Date(todayStart);
  weekStart.setDate(weekStart.getDate() - todayStart.getDay() + (todayStart.getDay() === 0 ? -6 : 1));

  if (date >= todayStart) return 'Vandaag';
  if (date >= yesterdayStart) return 'Gisteren';
  if (date >= weekStart) return 'Deze week';
  return 'Eerder';
}

function groupNotifications(notifications: Notification[]): Record<string, Notification[]> {
  const groups: Record<string, Notification[]> = {};
  const order = ['Vandaag', 'Gisteren', 'Deze week', 'Eerder'];

  for (const notification of notifications) {
    const group = getDateGroup(notification.created_at);
    if (!groups[group]) groups[group] = [];
    groups[group].push(notification);
  }

  const ordered: Record<string, Notification[]> = {};
  for (const key of order) {
    if (groups[key]) ordered[key] = groups[key];
  }
  return ordered;
}

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getNotifications(50)
      .then((data) => {
        setNotifications(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAllRead = async () => {
    await markAllAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
      await markAsRead(notification.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n)),
      );
    }

    if (notification.href) {
      router.push(notification.href);
    }
  };

  const grouped = groupNotifications(notifications);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Meldingen</h1>
          {unreadCount > 0 && (
            <p className="text-sm text-muted-foreground mt-1">
              {unreadCount} ongelezen {unreadCount === 1 ? 'melding' : 'meldingen'}
            </p>
          )}
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Alles gelezen markeren
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <Card className="p-6">
          <EmptyState
            icon={Bell}
            title="Geen meldingen"
            description="Je hebt nog geen meldingen ontvangen."
          />
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([group, items]) => (
            <div key={group}>
              <h2 className="text-sm font-semibold text-muted-foreground mb-3 px-1">
                {group}
              </h2>
              <Card className="divide-y py-0 gap-0 overflow-hidden">
                {items.map((notification) => (
                  <button
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={cn(
                      'flex w-full items-start gap-4 px-5 py-4 text-left transition-colors hover:bg-muted/50',
                      !notification.read && 'border-l-4 border-l-blue-500 bg-muted/20',
                      notification.read && 'border-l-4 border-l-transparent',
                    )}
                  >
                    {getTypeIcon(notification.type)}
                    <div className="flex-1 min-w-0">
                      <p
                        className={cn(
                          'text-sm leading-tight',
                          !notification.read ? 'font-semibold' : 'font-medium text-muted-foreground',
                        )}
                      >
                        {notification.title}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground/70 mt-2">
                        {formatRelativeTime(notification.created_at)}
                      </p>
                    </div>
                    {!notification.read && (
                      <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-blue-500" />
                    )}
                  </button>
                ))}
              </Card>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
