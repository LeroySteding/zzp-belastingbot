'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, Save, User, Building2, Target } from 'lucide-react';
import { createLead } from '@/lib/leads/actions';
import type { LeadInput, Lead } from '@/lib/leads/actions';

export default function NewLeadPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState<LeadInput>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    linkedin_url: '',
    job_title: '',
    company_name: '',
    company_domain: '',
    company_linkedin: '',
    company_size: '',
    company_industry: '',
    company_location: '',
    stage: 'nieuw',
    score: 0,
    value: undefined,
    source: 'handmatig',
    notes: '',
    next_followup_at: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.company_name.trim()) {
      setError('Bedrijfsnaam is verplicht');
      return;
    }

    setSaving(true);
    setError('');

    const lead = await createLead({
      ...formData,
      next_followup_at: formData.next_followup_at
        ? new Date(formData.next_followup_at as string).toISOString()
        : undefined,
    });

    if (lead) {
      router.push(`/leads/${lead.id}`);
    } else {
      setError('Er is iets misgegaan bij het aanmaken van de lead.');
      setSaving(false);
    }
  };

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="animate-fade-in space-y-6 max-w-3xl">
      {/* Back link */}
      <Link
        href="/leads"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Terug naar leads
      </Link>

      <div>
        <h1 className="text-2xl font-bold">Nieuwe Lead</h1>
        <p className="text-muted-foreground mt-1">Voeg handmatig een nieuwe lead toe aan je pipeline</p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Contact Info */}
        <div className="card-premium p-6">
          <div className="flex items-center gap-2 mb-4">
            <User className="h-5 w-5 text-muted-foreground" />
            <h2 className="font-semibold">Contactpersoon</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-muted-foreground">Voornaam</label>
              <input
                type="text"
                value={formData.first_name || ''}
                onChange={(e) => updateField('first_name', e.target.value)}
                className="w-full mt-1 px-3 py-2 rounded-lg border border-border text-sm bg-background"
                placeholder="Jan"
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Achternaam</label>
              <input
                type="text"
                value={formData.last_name || ''}
                onChange={(e) => updateField('last_name', e.target.value)}
                className="w-full mt-1 px-3 py-2 rounded-lg border border-border text-sm bg-background"
                placeholder="Jansen"
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Email</label>
              <input
                type="email"
                value={formData.email || ''}
                onChange={(e) => updateField('email', e.target.value)}
                className="w-full mt-1 px-3 py-2 rounded-lg border border-border text-sm bg-background"
                placeholder="jan@bedrijf.nl"
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Telefoon</label>
              <input
                type="tel"
                value={formData.phone || ''}
                onChange={(e) => updateField('phone', e.target.value)}
                className="w-full mt-1 px-3 py-2 rounded-lg border border-border text-sm bg-background"
                placeholder="+31 6 12345678"
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Functie</label>
              <input
                type="text"
                value={formData.job_title || ''}
                onChange={(e) => updateField('job_title', e.target.value)}
                className="w-full mt-1 px-3 py-2 rounded-lg border border-border text-sm bg-background"
                placeholder="CTO"
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">LinkedIn URL</label>
              <input
                type="url"
                value={formData.linkedin_url || ''}
                onChange={(e) => updateField('linkedin_url', e.target.value)}
                className="w-full mt-1 px-3 py-2 rounded-lg border border-border text-sm bg-background"
                placeholder="https://linkedin.com/in/..."
              />
            </div>
          </div>
        </div>

        {/* Company Info */}
        <div className="card-premium p-6">
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="h-5 w-5 text-muted-foreground" />
            <h2 className="font-semibold">Bedrijf</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="text-sm text-muted-foreground">Bedrijfsnaam *</label>
              <input
                type="text"
                value={formData.company_name}
                onChange={(e) => updateField('company_name', e.target.value)}
                className="w-full mt-1 px-3 py-2 rounded-lg border border-border text-sm bg-background"
                placeholder="Acme B.V."
                required
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Website / Domein</label>
              <input
                type="text"
                value={formData.company_domain || ''}
                onChange={(e) => updateField('company_domain', e.target.value)}
                className="w-full mt-1 px-3 py-2 rounded-lg border border-border text-sm bg-background"
                placeholder="acme.nl"
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Industrie</label>
              <input
                type="text"
                value={formData.company_industry || ''}
                onChange={(e) => updateField('company_industry', e.target.value)}
                className="w-full mt-1 px-3 py-2 rounded-lg border border-border text-sm bg-background"
                placeholder="Software & IT"
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Bedrijfsomvang</label>
              <select
                value={formData.company_size || ''}
                onChange={(e) => updateField('company_size', e.target.value)}
                className="w-full mt-1 px-3 py-2 rounded-lg border border-border text-sm bg-background"
              >
                <option value="">Selecteer...</option>
                <option value="1-10">1-10</option>
                <option value="11-50">11-50</option>
                <option value="51-200">51-200</option>
                <option value="201-500">201-500</option>
                <option value="500+">500+</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Locatie</label>
              <input
                type="text"
                value={formData.company_location || ''}
                onChange={(e) => updateField('company_location', e.target.value)}
                className="w-full mt-1 px-3 py-2 rounded-lg border border-border text-sm bg-background"
                placeholder="Amsterdam, Nederland"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm text-muted-foreground">LinkedIn Bedrijfspagina</label>
              <input
                type="url"
                value={formData.company_linkedin || ''}
                onChange={(e) => updateField('company_linkedin', e.target.value)}
                className="w-full mt-1 px-3 py-2 rounded-lg border border-border text-sm bg-background"
                placeholder="https://linkedin.com/company/..."
              />
            </div>
          </div>
        </div>

        {/* Pipeline Settings */}
        <div className="card-premium p-6">
          <div className="flex items-center gap-2 mb-4">
            <Target className="h-5 w-5 text-muted-foreground" />
            <h2 className="font-semibold">Pipeline</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-muted-foreground">Stage</label>
              <select
                value={formData.stage}
                onChange={(e) => updateField('stage', e.target.value)}
                className="w-full mt-1 px-3 py-2 rounded-lg border border-border text-sm bg-background"
              >
                <option value="nieuw">Nieuw</option>
                <option value="gecontacteerd">Gecontacteerd</option>
                <option value="geinteresseerd">Ge&iuml;nteresseerd</option>
                <option value="offerte">Offerte</option>
                <option value="gewonnen">Gewonnen</option>
                <option value="verloren">Verloren</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Bron</label>
              <select
                value={formData.source}
                onChange={(e) => updateField('source', e.target.value)}
                className="w-full mt-1 px-3 py-2 rounded-lg border border-border text-sm bg-background"
              >
                <option value="handmatig">Handmatig</option>
                <option value="apollo">Apollo</option>
                <option value="linkedin">LinkedIn</option>
                <option value="website">Website</option>
                <option value="referral">Referral</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Geschatte waarde (&euro;)</label>
              <input
                type="number"
                step="0.01"
                value={formData.value || ''}
                onChange={(e) => updateField('value', parseFloat(e.target.value) || undefined)}
                className="w-full mt-1 px-3 py-2 rounded-lg border border-border text-sm bg-background"
                placeholder="5000.00"
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Score (0-100)</label>
              <input
                type="number"
                min={0}
                max={100}
                value={formData.score || ''}
                onChange={(e) => updateField('score', parseInt(e.target.value) || 0)}
                className="w-full mt-1 px-3 py-2 rounded-lg border border-border text-sm bg-background"
                placeholder="0"
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Volgende opvolging</label>
              <input
                type="date"
                value={(formData.next_followup_at as string) || ''}
                onChange={(e) => updateField('next_followup_at', e.target.value)}
                className="w-full mt-1 px-3 py-2 rounded-lg border border-border text-sm bg-background"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm text-muted-foreground">Notities</label>
              <textarea
                value={formData.notes || ''}
                onChange={(e) => updateField('notes', e.target.value)}
                className="w-full mt-1 px-3 py-2 rounded-lg border border-border text-sm bg-background min-h-[100px]"
                placeholder="Eerste indruk, context, etc..."
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end gap-3">
          <Link
            href="/leads"
            className="px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-card-hover transition-colors"
          >
            Annuleren
          </Link>
          <button
            type="submit"
            disabled={saving || !formData.company_name.trim()}
            className="inline-flex items-center gap-2 px-6 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-medium disabled:opacity-50 transition-colors"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Lead Toevoegen
          </button>
        </div>
      </form>
    </div>
  );
}
