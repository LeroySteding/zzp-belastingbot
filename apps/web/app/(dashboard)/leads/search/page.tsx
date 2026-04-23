'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Search,
  Loader2,
  Download,
  Save,
  Building2,
  User,
  Linkedin,
  Mail,
  Phone,
  Globe,
  Check,
  AlertCircle,
  Plus,
} from 'lucide-react';
import { importFromApollo, saveSearch, createLead } from '@/lib/leads/actions';
import type { LeadInput } from '@/lib/leads/actions';

interface ImportContact {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  linkedin_url: string;
  job_title: string;
  selected: boolean;
}

export default function SearchProspectsPage() {
  const [activeTab, setActiveTab] = useState<'manual' | 'import'>('manual');

  // Manual search / import form state
  const [companyDomain, setCompanyDomain] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [companyLinkedin, setCompanyLinkedin] = useState('');
  const [companySize, setCompanySize] = useState('');
  const [companyIndustry, setCompanyIndustry] = useState('');
  const [companyLocation, setCompanyLocation] = useState('');

  // Import contacts state
  const [importContacts, setImportContacts] = useState<ImportContact[]>([]);
  const [importJson, setImportJson] = useState('');
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ imported: number; errors: string[] } | null>(null);

  // Save search state
  const [searchName, setSearchName] = useState('');
  const [savingSearch, setSavingSearch] = useState(false);
  const [searchSaved, setSearchSaved] = useState(false);

  // Single lead creation from search
  const [creatingLead, setCreatingLead] = useState(false);
  const [leadCreated, setLeadCreated] = useState(false);

  const handleParseJson = () => {
    try {
      const parsed = JSON.parse(importJson);
      const contacts: ImportContact[] = (Array.isArray(parsed) ? parsed : [parsed]).map((c: any) => ({
        first_name: c.first_name || c.firstName || c.name?.split(' ')[0] || '',
        last_name: c.last_name || c.lastName || c.name?.split(' ').slice(1).join(' ') || '',
        email: c.email || c.work_email || '',
        phone: c.phone || c.phone_number || c.work_phone || '',
        linkedin_url: c.linkedin_url || c.linkedin || '',
        job_title: c.job_title || c.title || c.position || '',
        selected: true,
      }));
      setImportContacts(contacts);
    } catch {
      alert('Ongeldige JSON. Controleer het formaat en probeer opnieuw.');
    }
  };

  const handleImport = async () => {
    const selectedContacts = importContacts.filter(c => c.selected);
    if (selectedContacts.length === 0) {
      alert('Selecteer minimaal 1 contact om te importeren.');
      return;
    }
    if (!companyName.trim()) {
      alert('Vul een bedrijfsnaam in.');
      return;
    }

    setImporting(true);
    setImportResult(null);

    const result = await importFromApollo(
      selectedContacts.map(c => ({
        first_name: c.first_name,
        last_name: c.last_name,
        email: c.email,
        phone: c.phone,
        linkedin_url: c.linkedin_url,
        job_title: c.job_title,
      })),
      {
        company_name: companyName,
        company_domain: companyDomain || undefined,
        company_linkedin: companyLinkedin || undefined,
        company_size: companySize || undefined,
        company_industry: companyIndustry || undefined,
        company_location: companyLocation || undefined,
      }
    );

    setImportResult(result);
    setImporting(false);
  };

  const handleSaveSearch = async () => {
    if (!searchName.trim()) {
      alert('Geef de zoekopdracht een naam.');
      return;
    }

    setSavingSearch(true);
    const saved = await saveSearch(
      searchName,
      'company',
      {
        company_domain: companyDomain,
        company_name: companyName,
        company_industry: companyIndustry,
        company_size: companySize,
        company_location: companyLocation,
      },
      undefined,
      importContacts.length
    );

    if (saved) {
      setSearchSaved(true);
      setTimeout(() => setSearchSaved(false), 3000);
    }
    setSavingSearch(false);
  };

  const handleQuickAddLead = async () => {
    if (!companyName.trim()) {
      alert('Vul minimaal een bedrijfsnaam in.');
      return;
    }

    setCreatingLead(true);
    const lead = await createLead({
      company_name: companyName,
      company_domain: companyDomain || undefined,
      company_linkedin: companyLinkedin || undefined,
      company_size: companySize || undefined,
      company_industry: companyIndustry || undefined,
      company_location: companyLocation || undefined,
      source: 'handmatig',
    });

    if (lead) {
      setLeadCreated(true);
      setTimeout(() => setLeadCreated(false), 3000);
    }
    setCreatingLead(false);
  };

  const toggleContact = (index: number) => {
    setImportContacts(prev =>
      prev.map((c, i) => i === index ? { ...c, selected: !c.selected } : c)
    );
  };

  const toggleAllContacts = () => {
    const allSelected = importContacts.every(c => c.selected);
    setImportContacts(prev => prev.map(c => ({ ...c, selected: !allSelected })));
  };

  return (
    <div className="animate-fade-in space-y-6 max-w-4xl">
      {/* Back link */}
      <Link
        href="/leads"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Terug naar leads
      </Link>

      <div>
        <h1 className="text-2xl font-bold">Zoek Prospects</h1>
        <p className="text-muted-foreground mt-1">
          Vind nieuwe prospects en importeer ze in je pipeline
        </p>
      </div>

      {/* Info banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
        <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-800">
          <p className="font-medium">Apollo / Clay integratie</p>
          <p className="mt-1">
            Gebruik de Apollo MCP tools in je CLI om bedrijven en contacten te vinden.
            De resultaten kun je hier importeren als JSON of handmatig toevoegen.
            Je kunt ook direct een bedrijf toevoegen als lead.
          </p>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 bg-muted p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('manual')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'manual'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Bedrijf Toevoegen
        </button>
        <button
          onClick={() => setActiveTab('import')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'import'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Contacten Importeren
        </button>
      </div>

      {/* Company info - shared between tabs */}
      <div className="card-premium p-6">
        <div className="flex items-center gap-2 mb-4">
          <Building2 className="h-5 w-5 text-muted-foreground" />
          <h2 className="font-semibold">Bedrijfsgegevens</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="text-sm text-muted-foreground">Bedrijfsnaam *</label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded-lg border border-border text-sm bg-background"
              placeholder="Acme B.V."
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Website / Domein</label>
            <input
              type="text"
              value={companyDomain}
              onChange={(e) => setCompanyDomain(e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded-lg border border-border text-sm bg-background"
              placeholder="acme.nl"
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground">LinkedIn URL</label>
            <input
              type="url"
              value={companyLinkedin}
              onChange={(e) => setCompanyLinkedin(e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded-lg border border-border text-sm bg-background"
              placeholder="https://linkedin.com/company/..."
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Industrie</label>
            <input
              type="text"
              value={companyIndustry}
              onChange={(e) => setCompanyIndustry(e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded-lg border border-border text-sm bg-background"
              placeholder="Software & IT"
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Bedrijfsomvang</label>
            <select
              value={companySize}
              onChange={(e) => setCompanySize(e.target.value)}
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
          <div className="sm:col-span-2">
            <label className="text-sm text-muted-foreground">Locatie</label>
            <input
              type="text"
              value={companyLocation}
              onChange={(e) => setCompanyLocation(e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded-lg border border-border text-sm bg-background"
              placeholder="Amsterdam, Nederland"
            />
          </div>
        </div>

        {/* Actions for company */}
        {activeTab === 'manual' && (
          <div className="flex items-center gap-3 mt-6 pt-4 border-t border-border">
            <button
              onClick={handleQuickAddLead}
              disabled={creatingLead || !companyName.trim()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-medium disabled:opacity-50"
            >
              {creatingLead ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : leadCreated ? (
                <Check className="h-4 w-4" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              {leadCreated ? 'Toegevoegd!' : 'Toevoegen als Lead'}
            </button>
            <Link
              href={`/leads/new?company=${encodeURIComponent(companyName)}`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-card-hover transition-colors"
            >
              Uitgebreid Formulier
            </Link>
          </div>
        )}
      </div>

      {/* Import Tab Content */}
      {activeTab === 'import' && (
        <>
          {/* JSON Import */}
          <div className="card-premium p-6">
            <div className="flex items-center gap-2 mb-4">
              <Download className="h-5 w-5 text-muted-foreground" />
              <h2 className="font-semibold">Contacten Importeren (JSON)</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              Plak hier de JSON-output van Apollo/Clay search. Ondersteunde velden:
              first_name, last_name, email, phone, linkedin_url, job_title.
            </p>
            <textarea
              value={importJson}
              onChange={(e) => setImportJson(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border text-sm bg-background font-mono min-h-[120px]"
              placeholder={`[\n  {\n    "first_name": "Jan",\n    "last_name": "Jansen",\n    "email": "jan@acme.nl",\n    "job_title": "CTO"\n  }\n]`}
            />
            <button
              onClick={handleParseJson}
              disabled={!importJson.trim()}
              className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-card-hover transition-colors disabled:opacity-50"
            >
              <Search className="h-4 w-4" />
              Verwerk JSON
            </button>
          </div>

          {/* Parsed contacts list */}
          {importContacts.length > 0 && (
            <div className="card-premium p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold">Gevonden Contacten ({importContacts.length})</h2>
                <button
                  onClick={toggleAllContacts}
                  className="text-sm text-primary hover:underline"
                >
                  {importContacts.every(c => c.selected) ? 'Deselecteer alles' : 'Selecteer alles'}
                </button>
              </div>
              <div className="space-y-2">
                {importContacts.map((contact, index) => (
                  <div
                    key={index}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                      contact.selected ? 'border-primary/30 bg-primary/5' : 'border-border'
                    }`}
                  >
                    <button
                      onClick={() => toggleContact(index)}
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                        contact.selected
                          ? 'bg-primary border-primary text-primary-foreground'
                          : 'border-border'
                      }`}
                    >
                      {contact.selected && <Check className="h-3 w-3" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">
                        {contact.first_name} {contact.last_name}
                        {contact.job_title && (
                          <span className="text-muted-foreground font-normal"> \u2022 {contact.job_title}</span>
                        )}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                        {contact.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" /> {contact.email}
                          </span>
                        )}
                        {contact.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" /> {contact.phone}
                          </span>
                        )}
                        {contact.linkedin_url && (
                          <span className="flex items-center gap-1">
                            <Linkedin className="h-3 w-3" /> LinkedIn
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-3 mt-4 pt-4 border-t border-border">
                <button
                  onClick={handleImport}
                  disabled={importing || importContacts.filter(c => c.selected).length === 0 || !companyName.trim()}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-medium disabled:opacity-50"
                >
                  {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                  Importeer {importContacts.filter(c => c.selected).length} Contacten als Leads
                </button>
              </div>

              {importResult && (
                <div className={`mt-3 p-3 rounded-lg text-sm ${
                  importResult.errors.length > 0
                    ? 'bg-yellow-50 text-yellow-800'
                    : 'bg-green-50 text-green-800'
                }`}>
                  <p className="font-medium">
                    {importResult.imported} van {importContacts.filter(c => c.selected).length} contacten ge\u00EFmporteerd
                  </p>
                  {importResult.errors.map((err, i) => (
                    <p key={i} className="text-xs mt-1">{err}</p>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Save Search */}
          <div className="card-premium p-6">
            <div className="flex items-center gap-2 mb-4">
              <Save className="h-5 w-5 text-muted-foreground" />
              <h2 className="font-semibold">Zoekopdracht Opslaan</h2>
            </div>
            <div className="flex gap-3">
              <input
                type="text"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg border border-border text-sm bg-background"
                placeholder="Naam van de zoekopdracht..."
              />
              <button
                onClick={handleSaveSearch}
                disabled={savingSearch || !searchName.trim()}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-card-hover transition-colors disabled:opacity-50"
              >
                {savingSearch ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : searchSaved ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {searchSaved ? 'Opgeslagen!' : 'Opslaan'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
