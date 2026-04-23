'use server';

import { Resend } from 'resend';
import { createClient } from '@/lib/supabase/server';

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  attachments?: { filename: string; content: Buffer }[];
  replyTo?: string;
  tags?: { name: string; value: string }[];
}

export async function sendEmail(options: SendEmailOptions) {
  const from = process.env.RESEND_FROM_EMAIL || 'ZZP Platform <noreply@zzpplatform.nl>';

  if (!process.env.RESEND_API_KEY) {
    console.error('RESEND_API_KEY is niet geconfigureerd');
    return { success: false, error: 'E-mail is niet geconfigureerd. Stel RESEND_API_KEY in.' };
  }

  try {
    const { data, error } = await getResend().emails.send({
      from,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
      attachments: options.attachments,
      replyTo: options.replyTo,
      tags: options.tags,
    });

    if (error) {
      console.error('Email send error:', error);
      return { success: false, error: error.message };
    }

    // Log email to database
    await logEmail({
      to: options.to,
      subject: options.subject,
      type: options.tags?.find(t => t.name === 'type')?.value || 'unknown',
      messageId: data?.id,
    });

    return { success: true, messageId: data?.id };
  } catch (err) {
    console.error('Email exception:', err);
    return { success: false, error: 'Email verzenden mislukt' };
  }
}

async function logEmail(params: { to: string; subject: string; type: string; messageId?: string }) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('email_logs').insert({
      user_id: user.id,
      to_email: params.to,
      subject: params.subject,
      email_type: params.type,
      message_id: params.messageId,
      status: 'sent',
    });
  } catch {
    // Don't fail email send if logging fails
  }
}
