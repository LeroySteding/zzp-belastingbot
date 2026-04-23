'use server';
import { createClient } from '@/lib/supabase/server';

interface EmailLog {
  id: string;
  to_email: string;
  subject: string;
  email_type: string;
  status: string;
  created_at: string;
  message_id?: string;
}

export async function getEmailLogs(): Promise<EmailLog[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('email_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);

  if (error || !data) return [];
  return data;
}
