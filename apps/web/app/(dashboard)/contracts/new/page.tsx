'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Loader2,
  Save,
  ScrollText,
  Eye,
  FileText,
  Building2,
  Calendar,
  DollarSign,
} from 'lucide-react';
import { createContract, type ContractInput } from '@/lib/contracts/actions';
import { getClients } from '@/lib/factuur/actions';
import { CONTRACT_TEMPLATES, fillTemplate } from '@/lib/contracts/templates';
import { getCompanyInfo } from '@/lib/factuur/actions';
import type { Client, CompanyInfo } from '@/lib/factuur/types/invoice';

export default function NewContractPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [clients, setClients] = useState<Client[]>([]);
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState<ContractInput>({
    title: '',
    description: '',
    template: 'freelance',
    clientId: '',
    startDate: '',
    endDate: '',
    hourlyRate: undefined,
    fixedPrice: undefined,
    paymentTerms: '30 dagen',
    content: '',
  });

  useEffect(() => {
    async function load() {
      const [clientsData, company] = await Promise.all([
        getClients(),
        getCompanyInfo(),
      ]);
      setClients(clientsData);
      setCompanyInfo(company);
      setLoading(false);
    }
    load();
  }, []);

  // Generate content from template when template or fields change
  const generateContent = () => {
    const tmpl = CONTRACT_TEMPLATES[formData.template || 'freelance'];
    if (!tmpl) return '';

    const selectedClient = clients.find((c) => c.id === formData.clientId);

    const vars: Record<string, string> = {
      companyName: companyInfo?.name || '[Bedrijfsnaam]',
      kvk: companyInfo?.kvk || '[KVK]',
      clientName: selectedClient?.name || '[Klantnaam]',
      description: formData.description || '[Beschrijving]',
      startDate: formData.startDate || '[Startdatum]',
      endDate: formData.endDate || '[Einddatum]',
      hourlyRate: formData.hourlyRate ? String(formData.hourlyRate) : '[Uurtarief]',
      fixedPrice: formData.fixedPrice ? String(formData.fixedPrice) : '[Vaste prijs]',
      deposit: formData.fixedPrice ? String(Math.round(formData.fixedPrice * 0.3 * 100) / 100) : '[Aanbetaling]',
      paymentTerms: formData.paymentTerms || '30 dagen',
      hoursIncluded: '[Uren inclusief]',
      date: new Date().toLocaleDateString('nl-NL'),
      city: '[Stad]',
    };

    return fillTemplate(tmpl.content, vars);
  };

  const handleTemplateChange = (template: string) => {
    setFormData((prev) => ({ ...prev, template }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setError('Titel is verplicht');
      return;
    }

    setSaving(true);
    setError('');

    const content = formData.content || generateContent();

    const result = await createContract({
      ...formData,
      content,
      clientId: formData.clientId || undefined,
    });

    if (result) {
      router.push(`/contracts/${result.id}`);
    } else {
      setError('Er is iets misgegaan bij het aanmaken van het contract.');
      setSaving(false);
    }
  };

  const updateField = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const previewContent = formData.content || generateContent();

  if (loading) {
    return (
      <div className="animate-fade-in flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Laden...</span>
      </div>
    );
  }

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

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Nieuw Contract</h1>
          <p className="text-muted-foreground mt-1">
            Kies een template en vul de gegevens in
          </p>
        </div>
        <button
          onClick={() => setShowPreview(!showPreview)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border hover:bg-card-hover transition-colors text-sm font-medium"
        >
          <Eye className="h-4 w-4" />
          {showPreview ? 'Bewerken' : 'Voorbeeld'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {showPreview ? (
        /* Preview */
        <div className="card-premium p-8">
          <div className="prose prose-sm max-w-none">
            {previewContent.split('\n').map((line, i) => {
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
              if (line.startsWith('**') && line.endsWith('**')) {
                return (
                  <p key={i} className="font-bold text-sm">
                    {line.replace(/\*\*/g, '')}
                  </p>
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
        </div>
      ) : (
        /* Form */
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Template Selection */}
          <div className="card-premium p-6">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <h2 className="font-semibold">Template</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {Object.entries(CONTRACT_TEMPLATES).map(([key, tmpl]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleTemplateChange(key)}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    formData.template === key
                      ? 'border-primary bg-primary/5 ring-1 ring-primary'
                      : 'border-border hover:border-primary/30'
                  }`}
                >
                  <ScrollText
                    className={`h-5 w-5 mb-2 ${
                      formData.template === key
                        ? 'text-primary'
                        : 'text-muted-foreground'
                    }`}
                  />
                  <p className="font-medium text-sm">{tmpl.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {tmpl.description}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Contract Details */}
          <div className="card-premium p-6">
            <div className="flex items-center gap-2 mb-4">
              <ScrollText className="h-5 w-5 text-muted-foreground" />
              <h2 className="font-semibold">Contractgegevens</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="text-sm text-muted-foreground">
                  Titel *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => updateField('title', e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-lg border border-border text-sm bg-background"
                  placeholder="Freelance Overeenkomst - Klant X"
                  required
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-sm text-muted-foreground">
                  Beschrijving
                </label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => updateField('description', e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-lg border border-border text-sm bg-background min-h-[80px]"
                  placeholder="Korte omschrijving van de werkzaamheden..."
                />
              </div>
            </div>
          </div>

          {/* Client */}
          <div className="card-premium p-6">
            <div className="flex items-center gap-2 mb-4">
              <Building2 className="h-5 w-5 text-muted-foreground" />
              <h2 className="font-semibold">Klant</h2>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">
                Selecteer klant
              </label>
              <select
                value={formData.clientId || ''}
                onChange={(e) => updateField('clientId', e.target.value)}
                className="w-full mt-1 px-3 py-2 rounded-lg border border-border text-sm bg-background"
              >
                <option value="">Geen klant geselecteerd</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Dates & Financials */}
          <div className="card-premium p-6">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <h2 className="font-semibold">Looptijd & Financieel</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-muted-foreground">
                  Startdatum
                </label>
                <input
                  type="date"
                  value={formData.startDate || ''}
                  onChange={(e) => updateField('startDate', e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-lg border border-border text-sm bg-background"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">
                  Einddatum
                </label>
                <input
                  type="date"
                  value={formData.endDate || ''}
                  onChange={(e) => updateField('endDate', e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-lg border border-border text-sm bg-background"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">
                  Uurtarief (excl. BTW)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.hourlyRate || ''}
                  onChange={(e) =>
                    updateField(
                      'hourlyRate',
                      parseFloat(e.target.value) || undefined
                    )
                  }
                  className="w-full mt-1 px-3 py-2 rounded-lg border border-border text-sm bg-background"
                  placeholder="85.00"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">
                  Vaste prijs (excl. BTW)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.fixedPrice || ''}
                  onChange={(e) =>
                    updateField(
                      'fixedPrice',
                      parseFloat(e.target.value) || undefined
                    )
                  }
                  className="w-full mt-1 px-3 py-2 rounded-lg border border-border text-sm bg-background"
                  placeholder="5000.00"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">
                  Betalingstermijn
                </label>
                <select
                  value={formData.paymentTerms || '30 dagen'}
                  onChange={(e) => updateField('paymentTerms', e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-lg border border-border text-sm bg-background"
                >
                  <option value="14 dagen">14 dagen</option>
                  <option value="30 dagen">30 dagen</option>
                  <option value="45 dagen">45 dagen</option>
                  <option value="60 dagen">60 dagen</option>
                </select>
              </div>
            </div>
          </div>

          {/* Custom Content */}
          <div className="card-premium p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <h2 className="font-semibold">Inhoud (optioneel)</h2>
              </div>
              <button
                type="button"
                onClick={() => updateField('content', generateContent())}
                className="text-xs text-primary hover:underline"
              >
                Genereer uit template
              </button>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              Laat leeg om automatisch te genereren uit de geselecteerde
              template, of pas de inhoud hieronder aan.
            </p>
            <textarea
              value={formData.content || ''}
              onChange={(e) => updateField('content', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border text-sm bg-background min-h-[300px] font-mono"
              placeholder="Laat leeg voor automatische template inhoud..."
            />
          </div>

          {/* Submit */}
          <div className="flex items-center justify-end gap-3">
            <Link
              href="/contracts"
              className="px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-card-hover transition-colors"
            >
              Annuleren
            </Link>
            <button
              type="submit"
              disabled={saving || !formData.title.trim()}
              className="inline-flex items-center gap-2 px-6 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-medium disabled:opacity-50 transition-colors"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Contract Aanmaken
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
