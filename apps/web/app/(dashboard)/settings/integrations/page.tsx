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
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
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
  ShieldCheck,
  MapPin,
  Building2,
  Copy,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Settings2,
} from 'lucide-react';
import {
  getAllIntegrationStatuses,
  saveMollieApiKey,
  disconnectMollie,
  getMollieSettings,
  updateMollieSettings,
  getMollieApiKeyPrefix,
  type IntegrationStatus,
  type MollieSettings,
} from '@/lib/integrations/actions';
import { getBankConnections } from '@/lib/integrations/psd2/actions';
import type { BankConnection } from '@/lib/integrations/psd2/types';
import { getGoCardlessStatus } from '@/lib/integrations/gocardless';
import { getAggregatorConfig } from '@/lib/integrations/bank-aggregator/actions';
import { AGGREGATOR_PROVIDERS } from '@/lib/integrations/bank-aggregator';

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
    <Badge className="bg-muted text-muted-foreground border-border">
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

  // Configuration panel state
  const [configOpen, setConfigOpen] = useState(false);
  const [settings, setSettings] = useState<MollieSettings | null>(null);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [keyPrefix, setKeyPrefix] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const connected = status?.connected ?? false;

  const appUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const webhookUrl = `${appUrl}/api/integrations/mollie/webhook`;

  // Load settings when connected and config panel opens
  useEffect(() => {
    if (connected && configOpen && !settings) {
      setSettingsLoading(true);
      Promise.all([getMollieSettings(), getMollieApiKeyPrefix()])
        .then(([s, prefix]) => {
          setSettings(s);
          setKeyPrefix(prefix);
        })
        .catch(() => {
          // Defaults will be used
        })
        .finally(() => setSettingsLoading(false));
    }
  }, [connected, configOpen, settings]);

  // Also load prefix when connected (for badge display outside config panel)
  useEffect(() => {
    if (connected && keyPrefix === null) {
      getMollieApiKeyPrefix().then(setKeyPrefix).catch(() => {});
    }
  }, [connected, keyPrefix]);

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
      setSettings(null); // Reset so they reload
      setKeyPrefix(null);
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
    setSettings(null);
    setKeyPrefix(null);
    setConfigOpen(false);
    onUpdate();
  };

  const handleSettingChange = async (patch: Partial<MollieSettings>) => {
    if (!settings) return;
    const updated = {
      ...settings,
      ...patch,
      payment_methods: {
        ...settings.payment_methods,
        ...(patch.payment_methods || {}),
      },
    };
    setSettings(updated);
    setSettingsSaving(true);
    await updateMollieSettings(patch);
    setSettingsSaving(false);
  };

  const handlePaymentMethodToggle = async (
    method: keyof MollieSettings['payment_methods'],
    enabled: boolean,
  ) => {
    if (!settings) return;
    const updatedMethods = { ...settings.payment_methods, [method]: enabled };
    setSettings({ ...settings, payment_methods: updatedMethods });
    setSettingsSaving(true);
    await updateMollieSettings({ payment_methods: updatedMethods });
    setSettingsSaving(false);
  };

  const handleCopyWebhook = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isTestMode = keyPrefix === 'test_';
  const isLiveMode = keyPrefix === 'live_';

  // Payment method labels in Dutch
  const paymentMethodLabels: Record<
    keyof MollieSettings['payment_methods'],
    string
  > = {
    ideal: 'iDEAL',
    creditcard: 'Creditcard',
    bancontact: 'Bancontact',
    sepa_direct_debit: 'SEPA Automatische Incasso',
    paypal: 'PayPal',
    klarna: 'Klarna Achteraf Betalen',
    bank_transfer: 'Bankoverschrijving',
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
          <div className="flex items-center gap-2">
            {connected && isTestMode && (
              <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                Testmodus
              </Badge>
            )}
            {connected && isLiveMode && (
              <Badge className="bg-green-100 text-green-800 border-green-200">
                Live modus
              </Badge>
            )}
            <StatusBadge connected={connected} />
          </div>
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
          <>
            {/* Action buttons */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href="/factuur/integrations">
                    <RefreshCw className="h-4 w-4 mr-2" aria-hidden="true" />
                    Synchroniseren
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setConfigOpen(!configOpen)}
                >
                  <Settings2 className="h-4 w-4 mr-2" aria-hidden="true" />
                  Instellingen
                  {configOpen ? (
                    <ChevronUp className="h-4 w-4 ml-1" aria-hidden="true" />
                  ) : (
                    <ChevronDown className="h-4 w-4 ml-1" aria-hidden="true" />
                  )}
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

            {/* ============================================ */}
            {/* Configuration Panel                         */}
            {/* ============================================ */}
            {configOpen && (
              <div className="mt-4 space-y-6 border-t pt-4">
                {settingsLoading ? (
                  <div className="flex items-center gap-2 py-4">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Instellingen laden...
                    </span>
                  </div>
                ) : settings ? (
                  <>
                    {/* --- Test Modus --- */}
                    {isTestMode && (
                      <div className="rounded-md bg-yellow-50 border border-yellow-200 p-3">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-yellow-600" />
                          <span className="text-sm font-medium text-yellow-800">
                            Testmodus actief
                          </span>
                        </div>
                        <p className="text-sm text-yellow-700 mt-1">
                          In testmodus worden geen echte betalingen verwerkt. Gebruik een
                          live API key voor productiebetalingen.
                        </p>
                      </div>
                    )}

                    {/* --- Betaalmethoden --- */}
                    <div>
                      <h3 className="text-sm font-semibold mb-3">Betaalmethoden</h3>
                      <p className="text-xs text-muted-foreground mb-3">
                        Kies welke betaalmethoden je aanbiedt op facturen. De methoden
                        moeten ook geactiveerd zijn in je Mollie dashboard.
                      </p>
                      <div className="space-y-3">
                        {(
                          Object.entries(paymentMethodLabels) as [
                            keyof MollieSettings['payment_methods'],
                            string,
                          ][]
                        ).map(([method, label]) => (
                          <div
                            key={method}
                            className="flex items-center justify-between"
                          >
                            <Label
                              htmlFor={`pm-${method}`}
                              className="text-sm font-normal cursor-pointer"
                            >
                              {label}
                            </Label>
                            <Switch
                              id={`pm-${method}`}
                              checked={settings.payment_methods[method]}
                              onCheckedChange={(checked) =>
                                handlePaymentMethodToggle(method, checked)
                              }
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    <Separator />

                    {/* --- Factuur Instellingen --- */}
                    <div>
                      <h3 className="text-sm font-semibold mb-3">
                        Factuur Instellingen
                      </h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label
                              htmlFor="payment-link-emails"
                              className="text-sm font-normal cursor-pointer"
                            >
                              Betaallink toevoegen aan factuur e-mails
                            </Label>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Voegt een betaalknop toe aan de e-mail die naar klanten
                              wordt verstuurd
                            </p>
                          </div>
                          <Switch
                            id="payment-link-emails"
                            checked={settings.add_payment_link_to_emails}
                            onCheckedChange={(checked) =>
                              handleSettingChange({
                                add_payment_link_to_emails: checked,
                              })
                            }
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <Label
                              htmlFor="auto-mark-paid"
                              className="text-sm font-normal cursor-pointer"
                            >
                              Automatisch markeren als betaald bij ontvangst
                            </Label>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Facturen worden automatisch als &quot;betaald&quot;
                              gemarkeerd wanneer de betaling binnenkomt
                            </p>
                          </div>
                          <Switch
                            id="auto-mark-paid"
                            checked={settings.auto_mark_paid}
                            onCheckedChange={(checked) =>
                              handleSettingChange({ auto_mark_paid: checked })
                            }
                          />
                        </div>

                        {/* Webhook URL */}
                        <div>
                          <Label className="text-sm font-normal">Webhook URL</Label>
                          <p className="text-xs text-muted-foreground mt-0.5 mb-2">
                            Stel deze URL in bij{' '}
                            <a
                              href="https://my.mollie.com/dashboard/developers/webhooks"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline"
                            >
                              Mollie Dashboard
                            </a>{' '}
                            om automatisch betalingsupdates te ontvangen
                          </p>
                          <div className="flex items-center gap-2">
                            <code className="flex-1 rounded-md bg-muted px-3 py-2 text-xs font-mono break-all">
                              {webhookUrl}
                            </code>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleCopyWebhook}
                              className="shrink-0"
                            >
                              {copied ? (
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* --- Terugkerende Betalingen --- */}
                    <div>
                      <h3 className="text-sm font-semibold mb-3">
                        Terugkerende Betalingen
                      </h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label
                              htmlFor="recurring-enabled"
                              className="text-sm font-normal cursor-pointer"
                            >
                              Automatische incasso voor terugkerende facturen
                            </Label>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Bij de eerste factuur wordt toestemming gevraagd via iDEAL.
                              Volgende facturen worden automatisch afgeschreven.
                            </p>
                          </div>
                          <Switch
                            id="recurring-enabled"
                            checked={settings.recurring_enabled}
                            onCheckedChange={(checked) =>
                              handleSettingChange({ recurring_enabled: checked })
                            }
                          />
                        </div>
                        {settings.recurring_enabled && (
                          <div className="rounded-md bg-amber-50 border border-amber-200 p-3">
                            <div className="flex items-start gap-2">
                              <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                              <p className="text-xs text-amber-800">
                                Vereist SEPA Automatische Incasso activatie in je Mollie
                                account. Controleer dit via{' '}
                                <a
                                  href="https://my.mollie.com/dashboard/settings/payment-methods"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="underline font-medium"
                                >
                                  Mollie betaalmethoden
                                </a>
                                .
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Saving indicator */}
                    {settingsSaving && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Opslaan...
                      </div>
                    )}
                  </>
                ) : null}
              </div>
            )}
          </>
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
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
              <BookOpen className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
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
// KVK Card
// ---------------------------------------------------------------------------

function KvkCard() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100">
              <Building2 className="h-5 w-5 text-orange-700" aria-hidden="true" />
            </div>
            <div>
              <CardTitle className="text-base">KVK (Kamer van Koophandel)</CardTitle>
              <CardDescription>
                Zoek bedrijfsgegevens op via KVK-nummer. Vul automatisch bedrijfsnaam en adres in.
              </CardDescription>
            </div>
          </div>
          <Badge className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle className="h-3 w-3" />
            Actief
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Zonder API key wordt de KVK testomgeving gebruikt. Stel{' '}
          <code className="rounded bg-muted px-1 py-0.5 text-xs font-mono">KVK_API_KEY</code>{' '}
          in als omgevingsvariabele voor productiegebruik.{' '}
          <a
            href="https://developers.kvk.nl/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-primary hover:underline"
          >
            KVK Developer Portal
            <ExternalLink className="h-3 w-3" />
          </a>
        </p>
        <div className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Status: </span>
          Actief -- KVK-opzoeken is beschikbaar bij onboarding en klantbeheer.
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// VIES Card
// ---------------------------------------------------------------------------

function ViesCard() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100">
              <ShieldCheck className="h-5 w-5 text-indigo-700" aria-hidden="true" />
            </div>
            <div>
              <CardTitle className="text-base">EU BTW Validatie (VIES)</CardTitle>
              <CardDescription>
                Valideer BTW-nummers van klanten in de EU. Automatisch ingevuld bij het
                aanmaken van klanten.
              </CardDescription>
            </div>
          </div>
          <Badge className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle className="h-3 w-3" />
            Actief
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          De VIES-dienst van de Europese Commissie wordt gebruikt om BTW-nummers te
          controleren. Geen configuratie nodig — deze integratie is altijd beschikbaar.
        </p>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// PDOK Adresservice Card
// ---------------------------------------------------------------------------

function PdokAdresserviceCard() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-100">
              <MapPin className="h-5 w-5 text-teal-700" aria-hidden="true" />
            </div>
            <div>
              <CardTitle className="text-base">PDOK Adresservice</CardTitle>
              <CardDescription>
                Vul automatisch straatnaam en stad in op basis van postcode en huisnummer.
              </CardDescription>
            </div>
          </div>
          <Badge className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle className="h-3 w-3" />
            Actief
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Bron: Basisregistratie Adressen (overheidsdata). Geen configuratie nodig — deze
          integratie is altijd beschikbaar en wordt gebruikt bij het invullen van adresgegevens
          in je profiel, onboarding en klantbeheer.
        </p>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// GoCardless Card
// ---------------------------------------------------------------------------

function GoCardlessCard({
  connected,
  environment,
}: {
  connected: boolean;
  environment: 'sandbox' | 'live';
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-100">
              <CreditCard className="h-5 w-5 text-teal-700" aria-hidden="true" />
            </div>
            <div>
              <CardTitle className="text-base">GoCardless</CardTitle>
              <CardDescription>
                SEPA Automatische Incasso voor terugkerende facturen.
                Ideaal voor maandelijkse of driemaandelijkse betalingen.
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {connected && environment === 'sandbox' && (
              <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                Sandbox
              </Badge>
            )}
            {connected && environment === 'live' && (
              <Badge className="bg-green-100 text-green-800 border-green-200">
                Live
              </Badge>
            )}
            <StatusBadge connected={connected} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {connected ? (
          <div className="space-y-3">
            <div className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Omgeving: </span>
              {environment === 'live' ? 'Productie (live)' : 'Sandbox (test)'}
            </div>
            <p className="text-sm text-muted-foreground">
              GoCardless is verbonden. SEPA Direct Debit betalingen worden
              automatisch verwerkt en facturen worden als betaald gemarkeerd.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Stel de volgende omgevingsvariabelen in om GoCardless te activeren:
            </p>
            <div className="space-y-1">
              <code className="block rounded bg-muted px-3 py-1 text-xs font-mono">
                GOCARDLESS_ACCESS_TOKEN=your-access-token
              </code>
              <code className="block rounded bg-muted px-3 py-1 text-xs font-mono">
                GOCARDLESS_ENVIRONMENT=sandbox
              </code>
              <code className="block rounded bg-muted px-3 py-1 text-xs font-mono">
                GOCARDLESS_WEBHOOK_SECRET=your-webhook-secret
              </code>
            </div>
            <p className="text-xs text-muted-foreground">
              <a
                href="https://manage.gocardless.com/developers"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-primary hover:underline"
              >
                GoCardless Developer Dashboard
                <ExternalLink className="h-3 w-3" />
              </a>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Bank Aggregator Card
// ---------------------------------------------------------------------------

function BankAggregatorCard({
  configured,
  providerName,
}: {
  configured: boolean;
  providerName: string | null;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-100">
              <Landmark className="h-5 w-5 text-violet-700" aria-hidden="true" />
            </div>
            <div>
              <CardTitle className="text-base">Bank Aggregator</CardTitle>
              <CardDescription>
                Synchroniseer transacties via PSD2 aggregators (IBANXS, Enable Banking, Yapily)
              </CardDescription>
            </div>
          </div>
          <StatusBadge connected={configured} />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {configured && providerName ? (
          <div className="space-y-3">
            <div className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Provider: </span>
              {providerName}
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/belasting/bank-sync">
                <RefreshCw className="h-4 w-4 mr-2" aria-hidden="true" />
                Bank Sync openen
              </Link>
            </Button>
          </div>
        ) : (
          <Button variant="outline" size="sm" asChild>
            <Link href="/belasting/bank-sync">
              <Plug className="h-4 w-4 mr-2" aria-hidden="true" />
              Configureren
            </Link>
          </Button>
        )}
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
  const [goCardlessStatus, setGoCardlessStatus] = useState<{
    configured: boolean;
    environment: 'sandbox' | 'live';
  }>({ configured: false, environment: 'sandbox' });
  const [aggregatorConfig, setAggregatorConfig] = useState<{
    provider: string | null;
    configured: boolean;
  }>({ provider: null, configured: false });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [allStatuses, connections, gcStatus, aggConfig] = await Promise.all([
        getAllIntegrationStatuses(),
        getBankConnections().catch(() => [] as BankConnection[]),
        getGoCardlessStatus().catch(() => ({ configured: false, environment: 'sandbox' as const })),
        getAggregatorConfig().catch(() => ({ provider: null, configured: false, sandboxMode: true })),
      ]);
      setStatuses(allStatuses);
      setBankConnections(connections);
      setGoCardlessStatus(gcStatus);
      setAggregatorConfig({ provider: aggConfig.provider, configured: aggConfig.configured });
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
  const aggregatorProviderName = aggregatorConfig.provider
    ? AGGREGATOR_PROVIDERS.find((p) => p.id === aggregatorConfig.provider)?.name || aggregatorConfig.provider
    : null;

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
        <div className="grid gap-4">
          <MollieCard status={mollieStatus} onUpdate={loadData} />
          <GoCardlessCard
            connected={goCardlessStatus.configured}
            environment={goCardlessStatus.environment}
          />
        </div>
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
          <BankAggregatorCard
            configured={aggregatorConfig.configured}
            providerName={aggregatorProviderName}
          />
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
      {/* Section 4: Overheid                         */}
      {/* ============================================ */}
      <section>
        <SectionHeader
          title="Overheid"
          description="Koppelingen met overheidsdiensten voor validatie en controle"
        />
        <div className="grid gap-4 md:grid-cols-2">
          <KvkCard />
          <ViesCard />
          <PdokAdresserviceCard />
        </div>
      </section>

      <Separator />

      {/* ============================================ */}
      {/* Section 5: Boekhouding (Future)             */}
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
