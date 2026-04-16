'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Loader2,
  Save,
  ScrollText,
  Eye,
  Edit3,
  Send,
  CheckCircle2,
  Clock,
  XCircle,
  FileText,
  Trash2,
  PenLine,
} from 'lucide-react';
import { formatDate, formatCurrency } from '@/lib/utils';
import {
  getContract,
  updateContract,
  updateContractStatus,
  signContract,
  deleteContract,
  type Contract,
} from '@/lib/contracts/actions';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  concept: { label: 'Concept', color: 'text-gray-700', bg: 'bg-gray-100', icon: FileText },
  verzonden: { label: 'Verzonden', color: 'text-blue-700', bg: 'bg-blue-100', icon: Send },
  ondertekend: { label: 'Ondertekend', color: 'text-green-700', bg: 'bg-green-100', icon: CheckCircle2 },
  actief: { label: 'Actief', color: 'text-emerald-700', bg: 'bg-emerald-100', icon: CheckCircle2 },
  verlopen: { label: 'Verlopen', color: 'text-yellow-700', bg: 'bg-yellow-100', icon: Clock },
  opgezegd: { label: 'Opgezegd', color: 'text-red-700', bg: 'bg-red-100', icon: XCircle },
};

const STATUS_TRANSITIONS: Record<string, string[]> = {
  concept: ['verzonden'],
  verzonden: ['ondertekend', 'concept'],
  ondertekend: ['actief'],
  actief: ['verlopen', 'opgezegd'],
  verlopen: [],
  opgezegd: [],
};

export default function ContractDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [contract, setContract] = useState<Contract | null>(null);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [showSignDialog, setShowSignDialog] = useState(false);
  const [signedBy, setSignedBy] = useState('');

  useEffect(() => {
    async function load() {
      const data = await getContract(id);
      setContract(data);
      if (data?.content) {
        setEditContent(data.content);
      }
      setLoading(false);
    }
    load();
  }, [id]);

  const handleSaveContent = async () => {
    if (!contract) return;
    setSaving(true);
    const updated = await updateContract(contract.id, { content: editContent });
    if (updated) {
      setContract(updated);
      setEditing(false);
    }
    setSaving(false);
  };

  const handleStatusChange = async (newStatus: Contract['status']) => {
    if (!contract) return;
    const success = await updateContractStatus(contract.id, newStatus);
    if (success) {
      setContract({ ...contract, status: newStatus });
    }
  };

  const handleSign = async () => {
    if (!contract || !signedBy.trim()) return;
    setSaving(true);
    const success = await signContract(contract.id, signedBy.trim());
    if (success) {
      setContract({
        ...contract,
        status: 'ondertekend',
        signedByClient: signedBy.trim(),
        signedAt: new Date().toISOString(),
      });
      setShowSignDialog(false);
      setSignedBy('');
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!contract) return;
    if (confirm('Weet je zeker dat je dit contract wilt verwijderen?')) {
      const success = await deleteContract(contract.id);
      if (success) {
        router.push('/contracts');
      }
    }
  };

  if (loading) {
    return (
      <div className="animate-fade-in flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Contract laden...</span>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="animate-fade-in text-center py-20">
        <ScrollText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
        <h2 className="text-xl font-semibold mb-2">Contract niet gevonden</h2>
        <Link
          href="/contracts"
          className="text-sm text-primary hover:underline"
        >
          Terug naar contracten
        </Link>
      </div>
    );
  }

  const statusConf = STATUS_CONFIG[contract.status] || STATUS_CONFIG.concept;
  const StatusIcon = statusConf.icon;
  const nextStatuses = STATUS_TRANSITIONS[contract.status] || [];

  return (
    <div className="animate-fade-in space-y-6 max-w-4xl">
      {/* Back link */}
      <Link
        href="/contracts"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Terug naar contracten
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold">{contract.title}</h1>
            <span
              className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium ${statusConf.bg} ${statusConf.color}`}
            >
              <StatusIcon className="h-3 w-3" />
              {statusConf.label}
            </span>
          </div>
          <p className="text-muted-foreground text-sm">
            {contract.clientName || 'Geen klant'}
            {contract.startDate &&
              ` \u2022 ${formatDate(contract.startDate)}`}
            {contract.endDate && ` t/m ${formatDate(contract.endDate)}`}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Status transitions */}
          {contract.status === 'verzonden' && (
            <button
              onClick={() => setShowSignDialog(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors text-sm font-medium"
            >
              <PenLine className="h-4 w-4" />
              Ondertekenen
            </button>
          )}
          {nextStatuses.map((status) => {
            if (status === 'ondertekend') return null; // Handled by sign button
            const conf = STATUS_CONFIG[status];
            return (
              <button
                key={status}
                onClick={() => handleStatusChange(status as Contract['status'])}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border hover:bg-card-hover transition-colors text-sm font-medium"
              >
                <conf.icon className="h-4 w-4" />
                {status === 'verzonden'
                  ? 'Verstuur'
                  : status === 'actief'
                    ? 'Activeer'
                    : status === 'verlopen'
                      ? 'Markeer als verlopen'
                      : status === 'opgezegd'
                        ? 'Opzeggen'
                        : status === 'concept'
                          ? 'Terug naar concept'
                          : conf.label}
              </button>
            );
          })}
          <button
            onClick={handleDelete}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors text-sm font-medium"
          >
            <Trash2 className="h-4 w-4" />
            Verwijderen
          </button>
        </div>
      </div>

      {/* Contract Info Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {contract.hourlyRate && (
          <div className="card-premium p-4">
            <p className="text-xs text-muted-foreground">Uurtarief</p>
            <p className="text-lg font-bold mt-1">
              {formatCurrency(contract.hourlyRate)}
            </p>
            <p className="text-xs text-muted-foreground">per uur excl. BTW</p>
          </div>
        )}
        {contract.fixedPrice && (
          <div className="card-premium p-4">
            <p className="text-xs text-muted-foreground">Vaste prijs</p>
            <p className="text-lg font-bold mt-1">
              {formatCurrency(contract.fixedPrice)}
            </p>
            <p className="text-xs text-muted-foreground">excl. BTW</p>
          </div>
        )}
        <div className="card-premium p-4">
          <p className="text-xs text-muted-foreground">Betalingstermijn</p>
          <p className="text-lg font-bold mt-1">{contract.paymentTerms}</p>
        </div>
        <div className="card-premium p-4">
          <p className="text-xs text-muted-foreground">Template</p>
          <p className="text-lg font-bold mt-1 capitalize">{contract.template}</p>
        </div>
      </div>

      {/* Signature info */}
      {contract.signedByClient && (
        <div className="card-premium p-4 border-green-200 bg-green-50/50">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <div>
              <p className="font-medium text-sm">
                Ondertekend door {contract.signedByClient}
              </p>
              {contract.signedAt && (
                <p className="text-xs text-muted-foreground">
                  op {formatDate(contract.signedAt)}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Contract Content */}
      <div className="card-premium p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Contractinhoud</h2>
          {!editing ? (
            <button
              onClick={() => {
                setEditContent(contract.content || '');
                setEditing(true);
              }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border hover:bg-card-hover transition-colors text-sm"
            >
              <Edit3 className="h-3.5 w-3.5" />
              Bewerken
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setEditing(false)}
                className="px-3 py-1.5 rounded-lg border border-border hover:bg-card-hover transition-colors text-sm"
              >
                Annuleren
              </button>
              <button
                onClick={handleSaveContent}
                disabled={saving}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Save className="h-3.5 w-3.5" />
                )}
                Opslaan
              </button>
            </div>
          )}
        </div>

        {editing ? (
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-border text-sm bg-background min-h-[500px] font-mono"
          />
        ) : contract.content ? (
          <div className="prose prose-sm max-w-none">
            {contract.content.split('\n').map((line, i) => {
              if (line.startsWith('# ')) {
                return (
                  <h1 key={i} className="text-2xl font-bold mt-6 mb-4">
                    {line.replace('# ', '')}
                  </h1>
                );
              }
              if (line.startsWith('## ')) {
                return (
                  <h2 key={i} className="text-lg font-semibold mt-5 mb-2">
                    {line.replace('## ', '')}
                  </h2>
                );
              }
              if (line.startsWith('- ')) {
                return (
                  <li key={i} className="ml-4 text-sm">
                    {line.replace('- ', '')}
                  </li>
                );
              }
              if (line.trim() === '') {
                return <br key={i} />;
              }
              return (
                <p key={i} className="text-sm leading-relaxed">
                  {line.split('**').map((part, j) =>
                    j % 2 === 1 ? (
                      <strong key={j}>{part}</strong>
                    ) : (
                      <span key={j}>{part}</span>
                    )
                  )}
                </p>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <FileText className="h-10 w-10 mx-auto mb-3 opacity-50" />
            <p className="text-sm">Geen inhoud. Klik op bewerken om inhoud toe te voegen.</p>
          </div>
        )}
      </div>

      {/* Sign Dialog */}
      <Dialog open={showSignDialog} onOpenChange={setShowSignDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Contract ondertekenen</DialogTitle>
            <DialogDescription>
              Vul de naam in van de ondertekenaar om het contract als ondertekend
              te markeren.
            </DialogDescription>
          </DialogHeader>
          <div className="px-6 py-4">
            <label className="text-sm text-muted-foreground">
              Naam ondertekenaar
            </label>
            <input
              type="text"
              value={signedBy}
              onChange={(e) => setSignedBy(e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded-lg border border-border text-sm bg-background"
              placeholder="Naam van de klant"
              autoFocus
            />
          </div>
          <DialogFooter>
            <button
              onClick={() => setShowSignDialog(false)}
              className="px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-card-hover transition-colors"
            >
              Annuleren
            </button>
            <button
              onClick={handleSign}
              disabled={saving || !signedBy.trim()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 text-sm font-medium disabled:opacity-50 transition-colors"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <PenLine className="h-4 w-4" />
              )}
              Ondertekenen
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
