'use client';

import { useState, useEffect, useCallback } from 'react';
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
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Loader2,
  CheckCircle,
  XCircle,
  RefreshCw,
  Plug,
  Landmark,
  ArrowDownLeft,
  ArrowUpRight,
  FileText,
  Receipt,
  EyeOff,
  Link2,
  AlertTriangle,
  Plus,
} from 'lucide-react';
import {
  getAggregatorConfig,
  saveAggregatorConfig,
  removeAggregatorConfig,
  getAggregatorConnections,
  syncAggregatorTransactions,
  getAggregatorTransactions,
} from '@/lib/integrations/bank-aggregator/actions';
import {
  matchTransactions,
  createExpenseFromTransaction,
  matchTransactionToInvoice,
} from '@/lib/integrations/bank-aggregator/matcher';
import { AGGREGATOR_PROVIDERS } from '@/lib/integrations/bank-aggregator';
import type {
  AggregatorProvider,
  BankConnection,
  BankTransaction,
  TransactionMatch,
} from '@/lib/integrations/bank-aggregator/types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('nl-NL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

function formatDateTime(iso?: string): string {
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

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
}

// ---------------------------------------------------------------------------
// Provider Selection
// ---------------------------------------------------------------------------

function ProviderSelection({
  onConfigured,
}: {
  onConfigured: () => void;
}) {
  const [selectedProvider, setSelectedProvider] = useState<AggregatorProvider | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedProviderInfo = AGGREGATOR_PROVIDERS.find(
    (p) => p.id === selectedProvider
  );

  const handleConnect = async () => {
    if (!selectedProvider || !apiKey.trim()) return;
    setSaving(true);
    setError(null);

    const result = await saveAggregatorConfig({
      provider: selectedProvider,
      apiKey: apiKey.trim(),
      apiSecret: apiSecret.trim() || undefined,
      sandboxMode: true,
    });

    setSaving(false);

    if (result.success) {
      onConfigured();
    } else {
      setError(result.error || 'Verbinden mislukt');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-2">Kies een provider</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Selecteer een PSD2 bank aggregator om je bankrekeningen te koppelen
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {AGGREGATOR_PROVIDERS.map((provider) => (
          <Card
            key={provider.id}
            className={`cursor-pointer transition-all ${
              selectedProvider === provider.id
                ? 'ring-2 ring-primary border-primary'
                : 'hover:border-primary/50'
            }`}
            onClick={() => {
              setSelectedProvider(provider.id);
              setError(null);
            }}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                  <Landmark className="h-5 w-5 text-blue-700" aria-hidden="true" />
                </div>
                <div>
                  <CardTitle className="text-base">{provider.name}</CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {provider.description}
              </p>
              {selectedProvider === provider.id && (
                <Badge className="mt-2 bg-primary/10 text-primary border-primary/20">
                  Geselecteerd
                </Badge>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedProvider && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {selectedProviderInfo?.name} configureren
            </CardTitle>
            <CardDescription>
              Voer je API key in om te verbinden met {selectedProviderInfo?.name}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-600 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="api-key">API Key</Label>
              <Input
                id="api-key"
                type="password"
                placeholder="Voer je API key in..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleConnect()}
              />
            </div>

            {selectedProviderInfo?.requiresSecret && (
              <div className="space-y-2">
                <Label htmlFor="api-secret">API Secret</Label>
                <Input
                  id="api-secret"
                  type="password"
                  placeholder="Voer je API secret in..."
                  value={apiSecret}
                  onChange={(e) => setApiSecret(e.target.value)}
                />
              </div>
            )}

            <Button
              onClick={handleConnect}
              disabled={saving || !apiKey.trim()}
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" aria-hidden="true" />
              ) : (
                <Plug className="h-4 w-4 mr-2" aria-hidden="true" />
              )}
              Verbinden
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Connected Banks Section
// ---------------------------------------------------------------------------

function ConnectedBanks({
  connections,
  onSync,
  syncing,
}: {
  connections: BankConnection[];
  onSync: () => void;
  syncing: boolean;
}) {
  const activeConnections = connections.filter((c) => c.status === 'active');

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">Verbonden bankrekeningen</CardTitle>
            <CardDescription>
              {activeConnections.length === 0
                ? 'Geen actieve verbindingen'
                : `${activeConnections.length} actieve verbinding${activeConnections.length > 1 ? 'en' : ''}`}
            </CardDescription>
          </div>
          <Button variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
            Bank toevoegen
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {activeConnections.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            Nog geen bankrekeningen verbonden. Voeg een bank toe om transacties te synchroniseren.
          </p>
        ) : (
          <div className="space-y-4">
            {activeConnections.map((connection) => (
              <div
                key={connection.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                    <Landmark className="h-5 w-5 text-blue-700" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="font-medium">{connection.bankName}</p>
                    {connection.accounts.map((account) => (
                      <div key={account.id} className="text-sm text-muted-foreground">
                        <span className="font-mono">{account.iban}</span>
                        {account.name && <span> - {account.name}</span>}
                        {account.balance != null && (
                          <span className="ml-2 font-medium text-foreground">
                            {formatCurrency(account.balance)}
                          </span>
                        )}
                      </div>
                    ))}
                    <p className="text-xs text-muted-foreground mt-1">
                      Laatst gesynchroniseerd: {formatDateTime(connection.lastSyncAt)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onSync}
                    disabled={syncing}
                  >
                    {syncing ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" aria-hidden="true" />
                    ) : (
                      <RefreshCw className="h-4 w-4 mr-2" aria-hidden="true" />
                    )}
                    Synchroniseren
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Transaction Table
// ---------------------------------------------------------------------------

function TransactionTable({
  transactions,
  matches,
  onCreateExpense,
  onMatchInvoice,
  onIgnore,
}: {
  transactions: BankTransaction[];
  matches: TransactionMatch[];
  onCreateExpense: (transactionId: string, category: string) => void;
  onMatchInvoice: (transactionId: string, invoiceId: string) => void;
  onIgnore: (transactionId: string) => void;
}) {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const filteredTransactions = transactions.filter((tx) => {
    if (dateFrom && tx.date < dateFrom) return false;
    if (dateTo && tx.date > dateTo) return false;
    return true;
  });

  const getMatch = (transactionId: string) =>
    matches.find((m) => m.transactionId === transactionId);

  const handleCreateExpense = async (transactionId: string, category: string) => {
    setActionLoading(transactionId);
    await onCreateExpense(transactionId, category);
    setActionLoading(null);
  };

  const handleMatchInvoice = async (transactionId: string, invoiceId: string) => {
    setActionLoading(transactionId);
    await onMatchInvoice(transactionId, invoiceId);
    setActionLoading(null);
  };

  const handleIgnore = async (transactionId: string) => {
    setActionLoading(transactionId);
    await onIgnore(transactionId);
    setActionLoading(null);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base">Recente transacties</CardTitle>
            <CardDescription>
              {filteredTransactions.length} transactie{filteredTransactions.length !== 1 ? 's' : ''}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="date-from" className="text-sm whitespace-nowrap">
                Van
              </Label>
              <Input
                id="date-from"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-auto"
              />
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="date-to" className="text-sm whitespace-nowrap">
                Tot
              </Label>
              <Input
                id="date-to"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-auto"
              />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredTransactions.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">
            Geen transacties gevonden voor het geselecteerde datumbereik.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Datum</TableHead>
                  <TableHead>Omschrijving</TableHead>
                  <TableHead>Tegenpartij</TableHead>
                  <TableHead className="text-right">Bedrag</TableHead>
                  <TableHead>Match</TableHead>
                  <TableHead className="text-right">Acties</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.map((tx) => {
                  const match = getMatch(tx.id);
                  const isPositive = tx.amount > 0;
                  const isLoading = actionLoading === tx.id;

                  return (
                    <TableRow key={tx.id}>
                      <TableCell className="whitespace-nowrap">
                        {formatDate(tx.date)}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {tx.description}
                      </TableCell>
                      <TableCell className="max-w-[150px] truncate">
                        {tx.counterpartyName || '-'}
                      </TableCell>
                      <TableCell
                        className={`text-right font-mono whitespace-nowrap ${
                          isPositive ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {isPositive ? '+' : ''}
                        {formatCurrency(tx.amount)}
                      </TableCell>
                      <TableCell>
                        {match && match.matchType !== 'suggestion' ? (
                          <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            {match.matchedDescription
                              ? match.matchedDescription.substring(0, 30)
                              : 'Gematcht'}
                          </Badge>
                        ) : match?.suggestedCategory ? (
                          <Badge variant="secondary" className="text-xs">
                            {match.suggestedCategory}
                          </Badge>
                        ) : null}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              {!isPositive && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-xs h-7 px-2"
                                  onClick={() =>
                                    handleCreateExpense(
                                      tx.id,
                                      match?.suggestedCategory || 'Overig'
                                    )
                                  }
                                  title="Maak uitgave"
                                >
                                  <Receipt className="h-3 w-3 mr-1" aria-hidden="true" />
                                  <span className="hidden sm:inline">Maak uitgave</span>
                                </Button>
                              )}
                              {isPositive && match?.matchedId && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-xs h-7 px-2"
                                  onClick={() =>
                                    handleMatchInvoice(tx.id, match.matchedId!)
                                  }
                                  title="Koppel aan factuur"
                                >
                                  <Link2 className="h-3 w-3 mr-1" aria-hidden="true" />
                                  <span className="hidden sm:inline">Koppel aan factuur</span>
                                </Button>
                              )}
                              {isPositive && !match?.matchedId && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-xs h-7 px-2"
                                  title="Koppel aan factuur"
                                >
                                  <FileText className="h-3 w-3 mr-1" aria-hidden="true" />
                                  <span className="hidden sm:inline">Koppel aan factuur</span>
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-xs h-7 px-2 text-muted-foreground"
                                onClick={() => handleIgnore(tx.id)}
                                title="Negeer"
                              >
                                <EyeOff className="h-3 w-3" aria-hidden="true" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Sync Status
// ---------------------------------------------------------------------------

function SyncStatus({
  lastSync,
  totalTransactions,
  matchedCount,
  unmatchedCount,
}: {
  lastSync?: string;
  totalTransactions: number;
  matchedCount: number;
  unmatchedCount: number;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Synchronisatiestatus</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Laatste sync</p>
            <p className="font-medium text-sm">{formatDateTime(lastSync)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Totaal transacties</p>
            <p className="font-medium text-lg">{totalTransactions}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Gematcht</p>
            <p className="font-medium text-lg text-green-600">{matchedCount}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Niet gematcht</p>
            <p className="font-medium text-lg text-amber-600">{unmatchedCount}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function BankSyncPage() {
  const [loading, setLoading] = useState(true);
  const [configured, setConfigured] = useState(false);
  const [provider, setProvider] = useState<AggregatorProvider | null>(null);
  const [connections, setConnections] = useState<BankConnection[]>([]);
  const [transactions, setTransactions] = useState<BankTransaction[]>([]);
  const [matches, setMatches] = useState<TransactionMatch[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{
    success: boolean;
    synced: number;
    errors: string[];
  } | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [config, conns, txs] = await Promise.all([
        getAggregatorConfig(),
        getAggregatorConnections(),
        getAggregatorTransactions(),
      ]);

      setConfigured(config.configured);
      setProvider(config.provider);
      setConnections(conns);
      setTransactions(txs);

      // Match transactions
      if (txs.length > 0) {
        const matchResults = await matchTransactions(txs);
        setMatches(matchResults);
      }
    } catch {
      // Continue with empty state
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSync = async () => {
    setSyncing(true);
    setSyncResult(null);

    try {
      const result = await syncAggregatorTransactions();
      setSyncResult(result);

      // Reload transactions after sync
      const txs = await getAggregatorTransactions();
      setTransactions(txs);

      if (txs.length > 0) {
        const matchResults = await matchTransactions(txs);
        setMatches(matchResults);
      }

      // Reload connections for updated lastSyncAt
      const conns = await getAggregatorConnections();
      setConnections(conns);
    } catch {
      setSyncResult({
        success: false,
        synced: 0,
        errors: ['Synchronisatie mislukt'],
      });
    } finally {
      setSyncing(false);
    }
  };

  const handleCreateExpense = async (transactionId: string, category: string) => {
    const result = await createExpenseFromTransaction(transactionId, category);
    if (result.success) {
      await loadData();
    }
  };

  const handleMatchInvoice = async (transactionId: string, invoiceId: string) => {
    const result = await matchTransactionToInvoice(transactionId, invoiceId);
    if (result.success) {
      await loadData();
    }
  };

  const handleIgnore = async (_transactionId: string) => {
    // For now, just remove from the visible list by reloading
    await loadData();
  };

  const handleDisconnect = async () => {
    if (!confirm('Weet je zeker dat je de bank aggregator wilt ontkoppelen?')) return;
    await removeAggregatorConfig();
    setConfigured(false);
    setProvider(null);
    setConnections([]);
    setTransactions([]);
    setMatches([]);
  };

  // Stats
  const matchedCount = matches.filter(
    (m) => m.matchType === 'invoice' || m.matchType === 'expense'
  ).length;
  const unmatchedCount = matches.filter(
    (m) => m.matchType === 'suggestion'
  ).length;
  const lastSync = connections.find((c) => c.lastSyncAt)?.lastSyncAt;

  if (loading) {
    return (
      <div className="animate-fade-in flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Bank sync laden...</span>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Bank Synchronisatie</h1>
          <p className="text-muted-foreground mt-1">
            Synchroniseer je bankrekeningen en koppel transacties automatisch
          </p>
        </div>
        {configured && (
          <div className="flex items-center gap-2">
            <Badge className="bg-green-100 text-green-800 border-green-200">
              <CheckCircle className="h-3 w-3 mr-1" />
              {AGGREGATOR_PROVIDERS.find((p) => p.id === provider)?.name || provider}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSync}
              disabled={syncing}
            >
              {syncing ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" aria-hidden="true" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" aria-hidden="true" />
              )}
              Alles synchroniseren
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDisconnect}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <XCircle className="h-4 w-4 mr-2" aria-hidden="true" />
              Ontkoppelen
            </Button>
          </div>
        )}
      </div>

      {/* Sync result notification */}
      {syncResult && (
        <div
          className={`rounded-md p-3 text-sm flex items-center gap-2 ${
            syncResult.success
              ? 'bg-green-50 text-green-700'
              : 'bg-red-50 text-red-700'
          }`}
        >
          {syncResult.success ? (
            <CheckCircle className="h-4 w-4 shrink-0" />
          ) : (
            <AlertTriangle className="h-4 w-4 shrink-0" />
          )}
          <span>
            {syncResult.success
              ? `Synchronisatie voltooid: ${syncResult.synced} transacties geimporteerd`
              : `Synchronisatie mislukt: ${syncResult.errors.join(', ')}`}
          </span>
        </div>
      )}

      {!configured ? (
        /* Section 1: Provider configuratie */
        <ProviderSelection onConfigured={loadData} />
      ) : (
        <>
          {/* Section 4: Sync Status */}
          <SyncStatus
            lastSync={lastSync}
            totalTransactions={transactions.length}
            matchedCount={matchedCount}
            unmatchedCount={unmatchedCount}
          />

          {/* Section 2: Connected banks */}
          <ConnectedBanks
            connections={connections}
            onSync={handleSync}
            syncing={syncing}
          />

          <Separator />

          {/* Section 3: Recent transactions */}
          <TransactionTable
            transactions={transactions}
            matches={matches}
            onCreateExpense={handleCreateExpense}
            onMatchInvoice={handleMatchInvoice}
            onIgnore={handleIgnore}
          />
        </>
      )}
    </div>
  );
}
