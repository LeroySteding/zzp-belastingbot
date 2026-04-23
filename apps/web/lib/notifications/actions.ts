'use server';
import { createClient } from '@/lib/supabase/server';

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  href?: string;
  read: boolean;
  created_at: string;
}

export async function getNotifications(limit: number = 20): Promise<Notification[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  return data || [];
}

export async function getUnreadCount(): Promise<number> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;

  const { count } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('read', false);

  return count || 0;
}

export async function markAsRead(id: string): Promise<void> {
  const supabase = await createClient();
  await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', id);
}

export async function markAllAsRead(): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', user.id)
    .eq('read', false);
}

// Helper to create notifications from server-side code
export async function createNotification(params: {
  userId: string;
  type: string;
  title: string;
  message: string;
  href?: string;
}): Promise<void> {
  const supabase = await createClient();
  await supabase.from('notifications').insert({
    user_id: params.userId,
    type: params.type,
    title: params.title,
    message: params.message,
    href: params.href,
  });
}
