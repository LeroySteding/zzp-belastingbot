'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  CreditCard,
  Landmark,
  Upload,
  BookOpen,
  Loader2,
  CheckCircle,
  XCircle,
  RefreshCw,
  ExternalLink,
  Plug,
  Clock,
} from 'lucide-react';
import {
  getAllIntegrationStatuses,
  saveMollieApiKey,
  disconnectMollie,
  type IntegrationStatus,
} from '@/lib/integrations/actions';
import { getBankConnections } from '@/lib/integrations/psd2/actions';
import type { BankConnection } from '@/lib/integrations/psd2/types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatLastSync(iso?: string): string {
  if (!iso) return 'Nooit';
  try {
    return new Date(iso).toLocaleString('nl-NL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StatusBadge({ connected, comingSoon }: { connected: boolean; comingSoon?: boolean }) {
  if (comingSoon) {
    return (
      <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
        <Clock className="h-3 w-3" />
        Binnenkort beschikbaar
      </Badge>
    );
  }
  if (connected) {
    return (
      <Badge className="bg-green-100 text-green-800 border-green-200">
        <CheckCircle className="h-3 w-3" />
        Verbonden
      </Badge>
    );
  }
  return (
    <Badge className="bg-gray-100 text-gray-600 border-gray-200">
      <XCircle className="h-3 w-3" />
      Niet verbonden
    </Badge>
  );
}

function SectionHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Mollie Card
// ---------------------------------------------------------------------------

function MollieCard({
  status,
  onUpdate,
}: {
  status: IntegrationStatus | undefined;
  onUpdate: () => void;
}) {
  const [apiKey, setApiKey] = useState('');
  const [saving, setSaving] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const connected = status?.connected ?? false;

  const handleConnect = async () => {
    if (!apiKey.trim()) return;
    setSaving(true);
    setError(null);
    setSuccess(false);

    const result = await saveMollieApiKey(apiKey.trim());

    setSaving(false);
    if (result.success) {
      setSuccess(true);
      setApiKey('');
      onUpdate();
      setTimeout(() => setSuccess(false), 3000);
    } else {
      setError(result.error || 'Verbinden mislukt');
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Weet je zeker dat je Mollie wilt ontkoppelen?')) return;
    setDisconnecting(true);
    await disconnectMollie();
    setDisconnecting(false);
    onUpdate();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
              <CreditCard className="h-5 w-5 text-purple-700" aria-hidden="true" />
            </div>
            <div>
              <CardTitle className="text-base">Mollie</CardTitle>
              <CardDescription>
                Ontvang online betalingen via iDEAL, creditcard en meer. Facturen worden
                automatisch als betaald gemarkeerd.
              </CardDescription>
            </div>
          </div>
          <StatusBadge connected={connected} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>
        )}
        {success && (
          <div className="flex items-center gap-2 rounded-md bg-green-50 p-3 text-sm text-green-600">
            <CheckCircle className="h-4 w-4" />
            Mollie succesvol verbonden!
          </div>
        )}

        {!connected ? (
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input
                type="password"
                placeholder="live_... of test_..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleConnect()}
                className="max-w-sm"
              />
              <Button onClick={handleConnect} disabled={saving || !apiKey.trim()}>
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" aria-hidden="true" />
                ) : (
                  <Plug className="h-4 w-4 mr-2" aria-hidden="true" />
                )}
                Verbinden
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              <a
                href="https://my.mollie.com/dashboard/developers/api-keys"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-primary hover:underline"
              >
                Mollie API key vinden
                <ExternalLink className="h-3 w-3" />
              </a>
            </p>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" asChild>
                <Link href="/factuur/integrations">
                  <RefreshCw className="h-4 w-4 mr-2" aria-hidden="true" />
                  Synchroniseren
                </Link>
              </Button>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDisconnect}
              disabled={disconnecting}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              {disconnecting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" aria-hidden="true" />
              ) : (
                <XCircle className="h-4 w-4 mr-2" aria-hidden="true" />
              )}
              Ontkoppelen
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// PSD2 Bank Card
// ---------------------------------------------------------------------------

function BankCard({
  bankId,
  bankName,
  description,
  available,
  connection,
}: {
  bankId: string;
  bankName: string;
  description: string;
  available: boolean;
  connection?: BankConnection;
}) {
  const connected = connection?.status === 'connected';

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
              <Landmark className="h-5 w-5 text-blue-700" aria-hidden="true" />
            </div>
            <div>
              <CardTitle className="text-base">{bankName}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </div>
          </div>
          <StatusBadge connected={connected} comingSoon={!available} />
        </div>
      </CardHeader>
      <CardContent>
        {connected && connection ? (
          <div className="space-y-3">
            {connection.accounts && connection.accounts.length > 0 && (
              <div className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">IBAN: </span>
                {connection.accounts.map((a) => a.iban).join(', ')}
              </div>
            )}
            <div className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Laatst gesynchroniseerd: </span>
              {formatLastSync(connection.last_sync_at ?? undefined)}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" aria-hidden="true" />
                Synchroniseren
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <XCircle className="h-4 w-4 mr-2" aria-hidden="true" />
                Ontkoppelen
              </Button>
            </div>
          </div>
        ) : available ? (
          <Button variant="outline" size="sm">
            <Plug className="h-4 w-4 mr-2" aria-hidden="true" />
            Verbinden
          </Button>
        ) : (
          <Button variant="outline" size="sm" disabled>
            <Clock className="h-4 w-4 mr-2" aria-hidden="true" />
            Binnenkort
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// CSV Import Card
// ---------------------------------------------------------------------------

function CsvImportCard() {
  const supportedBanks = ['ING', 'Rabobank', 'ABN AMRO', 'Knab', 'Revolut'];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100">
            <Upload className="h-5 w-5 text-emerald-700" aria-hidden="true" />
          </div>
          <div>
            <CardTitle className="text-base">Handmatige import</CardTitle>
            <CardDescription>
              Importeer banktransacties via CSV-bestanden van je bank
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-1.5">
          {supportedBanks.map((bank) => (
            <Badge key={bank} variant="secondary" className="text-xs">
              {bank}
            </Badge>
          ))}
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/belasting/import">
            <Upload className="h-4 w-4 mr-2" aria-hidden="true" />
            Importeren
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Future Integration Card
// ---------------------------------------------------------------------------

function FutureIntegrationCard({
  name,
  description,
}: {
  name: string;
  description: string;
}) {
  return (
    <Card className="opacity-75">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
              <BookOpen className="h-5 w-5 text-gray-500" aria-hidden="true" />
            </div>
            <div>
              <CardTitle className="text-base">{name}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </div>
          </div>
          <StatusBadge connected={false} comingSoon />
        </div>
      </CardHeader>
      <CardContent>
        <Button variant="outline" size="sm" disabled>
          <Clock className="h-4 w-4 mr-2" aria-hidden="true" />
          Binnenkort
        </Button>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function IntegrationsPage() {
  const [loading, setLoading] = useState(true);
  const [statuses, setStatuses] = useState<IntegrationStatus[]>([]);
  const [bankConnections, setBankConnections] = useState<BankConnection[]>([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [allStatuses, connections] = await Promise.all([
        getAllIntegrationStatuses(),
        getBankConnections().catch(() => [] as BankConnection[]),
      ]);
      setStatuses(allStatuses);
      setBankConnections(connections);
    } catch {
      // Continue with empty state
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const mollieStatus = statuses.find((s) => s.id === 'mollie');

  const psd2Banks = [
    {
      bank: 'rabobank',
      displayName: 'Rabobank',
      available: true,
      description: 'Automatisch transacties ophalen via PSD2 Open Banking API',
    },
    {
      bank: 'revolut',
      displayName: 'Revolut Business',
      available: true,
      description: 'Automatisch transacties synchroniseren vanuit Revolut Business',
    },
    {
      bank: 'bunq',
      displayName: 'bunq',
      available: false,
      description: 'bunq API-koppeling (binnenkort beschikbaar)',
    },
    {
      bank: 'knab',
      displayName: 'Knab',
      available: false,
      description: 'Knab PSD2 API-koppeling (binnenkort beschikbaar)',
    },
  ];

  if (loading) {
    return (
      <div className="animate-fade-in flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Integraties laden...</span>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Integraties</h1>
        <p className="text-muted-foreground mt-1">
          Koppel externe diensten aan je account
        </p>
      </div>

      {/* ============================================ */}
      {/* Section 1: Betalingen                       */}
      {/* ============================================ */}
      <section>
        <SectionHeader
          title="Betalingen"
          description="Ontvang en beheer betalingen via externe betaalproviders"
        />
        <MollieCard status={mollieStatus} onUpdate={loadData} />
      </section>

      <Separator />

      {/* ============================================ */}
      {/* Section 2: Bankrekeningen (PSD2)            */}
      {/* ============================================ */}
      <section>
        <SectionHeader
          title="Bankrekeningen"
          description="Koppel je zakelijke bankrekening voor automatische transactie-import via PSD2"
        />
        <div className="grid gap-4 md:grid-cols-2">
          {psd2Banks.map((b) => {
            const connection = bankConnections.find((c) => c.bank === b.bank);
            return (
              <BankCard
                key={b.bank}
                bankId={b.bank}
                bankName={b.displayName}
                description={b.description}
                available={b.available}
                connection={connection}
              />
            );
          })}
        </div>
      </section>

      <Separator />

      {/* ============================================ */}
      {/* Section 3: Bank Import (CSV)                */}
      {/* ============================================ */}
      <section>
        <SectionHeader
          title="Bank Import"
          description="Importeer banktransacties handmatig via CSV-bestanden"
        />
        <CsvImportCard />
      </section>

      <Separator />

      {/* ============================================ */}
      {/* Section 4: Boekhouding (Future)             */}
      {/* ============================================ */}
      <section>
        <SectionHeader
          title="Boekhouding"
          description="Synchroniseer met je boekhoudpakket"
        />
        <div className="grid gap-4 md:grid-cols-3">
          <FutureIntegrationCard
            name="Moneybird"
            description="Synchroniseer facturen en uitgaven met Moneybird"
          />
          <FutureIntegrationCard
            name="e-Boekhouden"
            description="Koppel je e-Boekhouden administratie"
          />
          <FutureIntegrationCard
            name="Exact Online"
            description="Integreer met Exact Online boekhouding"
          />
        </div>
      </section>
    </div>
  );
}
