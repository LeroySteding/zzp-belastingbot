'use client';

import { useState, useEffect } from 'react';
import { Mail, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { getEmailLogs } from '@/lib/email/actions';

interface EmailLog {
  id: string;
  to_email: string;
  subject: string;
  email_type: string;
  status: string;
  created_at: string;
  message_id?: string;
}

const typeBadgeColors: Record<string, string> = {
  factuur: 'bg-blue-100 text-blue-800',
  herinnering: 'bg-orange-100 text-orange-800',
  welkom: 'bg-green-100 text-green-800',
  betaling: 'bg-emerald-100 text-emerald-800',
  portaal: 'bg-purple-100 text-purple-800',
  offerte: 'bg-indigo-100 text-indigo-800',
};

function getTypeBadgeClass(type: string): string {
  return typeBadgeColors[type] || 'bg-muted text-foreground';
}

function getStatusBadgeClass(status: string): string {
  if (status === 'sent') return 'bg-green-100 text-green-800';
  if (status === 'failed') return 'bg-red-100 text-red-800';
  return 'bg-muted text-foreground';
}

function getStatusLabel(status: string): string {
  if (status === 'sent') return 'Verzonden';
  if (status === 'failed') return 'Mislukt';
  return status;
}

function relativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);

  if (diffMinutes < 1) return 'Zojuist';
  if (diffMinutes < 60) return `${diffMinutes} ${diffMinutes === 1 ? 'minuut' : 'minuten'} geleden`;
  if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? 'uur' : 'uur'} geleden`;
  if (diffDays < 7) return `${diffDays} ${diffDays === 1 ? 'dag' : 'dagen'} geleden`;
  if (diffWeeks < 5) return `${diffWeeks} ${diffWeeks === 1 ? 'week' : 'weken'} geleden`;
  return `${diffMonths} ${diffMonths === 1 ? 'maand' : 'maanden'} geleden`;
}

export default function EmailsPage() {
  const [emails, setEmails] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getEmailLogs()
      .then(setEmails)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Stats
  const totalEmails = emails.length;
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const emailsThisMonth = emails.filter(
    (e) => new Date(e.created_at) >= startOfMonth
  ).length;

  const typeBreakdown: Record<string, number> = {};
  for (const email of emails) {
    const type = email.email_type || 'unknown';
    typeBreakdown[type] = (typeBreakdown[type] || 0) + 1;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Verzonden Emails</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Overzicht van alle verzonden emails vanuit het platform.
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Totaal verzonden
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalEmails}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Deze maand
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{emailsThisMonth}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Per type
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {Object.entries(typeBreakdown).map(([type, count]) => (
                <Badge
                  key={type}
                  variant="secondary"
                  className={getTypeBadgeClass(type)}
                >
                  {type} ({count})
                </Badge>
              ))}
              {Object.keys(typeBreakdown).length === 0 && (
                <span className="text-sm text-muted-foreground">-</span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Email table */}
      {emails.length === 0 ? (
        <Card>
          <CardContent className="py-0">
            <EmptyState
              icon={Mail}
              title="Nog geen emails verzonden"
              description="Zodra je facturen, herinneringen of andere emails verstuurt, verschijnen ze hier."
            />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Datum</TableHead>
                  <TableHead>Ontvanger</TableHead>
                  <TableHead>Onderwerp</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {emails.map((email) => (
                  <TableRow key={email.id}>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {relativeTime(email.created_at)}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {email.to_email}
                    </TableCell>
                    <TableCell className="max-w-[250px] truncate">
                      {email.subject}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={getTypeBadgeClass(email.email_type)}
                      >
                        {email.email_type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={getStatusBadgeClass(email.status)}
                      >
                        {getStatusLabel(email.status)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
