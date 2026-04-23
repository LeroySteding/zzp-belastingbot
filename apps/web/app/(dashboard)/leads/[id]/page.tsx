'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Loader2,
  Mail,
  Phone,
  Linkedin,
  Globe,
  Building2,
  MapPin,
  Users,
  Edit,
  Trash2,
  UserCheck,
  MessageSquare,
  PhoneCall,
  Calendar,
  FileText,
  Zap,
  ChevronRight,
  Save,
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  getLead,
  getLeadActivities,
  updateLead,
  updateLeadStage,
  addLeadActivity,
  deleteLead,
  convertLeadToClient,
} from '@/lib/leads/actions';
import type { Lead, LeadActivity, LeadInput } from '@/lib/leads/actions';

const STAGE_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  nieuw: { label: 'Nieuw', color: 'text-foreground', bg: 'bg-muted', border: 'border-border' },
  gecontacteerd: { label: 'Gecontacteerd', color: 'text-blue-700', bg: 'bg-blue-100', border: 'border-blue-300' },
  geinteresseerd: { label: 'Ge\u00EFnteresseerd', color: 'text-yellow-700', bg: 'bg-yellow-100', border: 'border-yellow-300' },
  offerte: { label: 'Offerte', color: 'text-purple-700', bg: 'bg-purple-100', border: 'border-purple-300' },
  gewonnen: { label: 'Gewonnen', color: 'text-green-700', bg: 'bg-green-100', border: 'border-green-300' },
  verloren: { label: 'Verloren', color: 'text-red-700', bg: 'bg-red-100', border: 'border-red-300' },
};

const STAGES_ORDER: Lead['stage'][] = ['nieuw', 'gecontacteerd', 'geinteresseerd', 'offerte', 'gewonnen', 'verloren'];

const ACTIVITY_ICONS: Record<string, React.ElementType> = {
  notitie: MessageSquare,
  email: Mail,
  telefoon: PhoneCall,
  meeting: Calendar,
  offerte: FileText,
  status_change: Zap,
  enrichment: Globe,
};

const ACTIVITY_LABELS: Record<string, string> = {
  notitie: 'Notitie',
  email: 'Email',
  telefoon: 'Telefoon',
  meeting: 'Meeting',
  offerte: 'Offerte',
  status_change: 'Statuswijziging',
  enrichment: 'Verrijking',
};

export default function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const leadId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lead, setLead] = useState<Lead | null>(null);
  const [activities, setActivities] = useState<LeadActivity[]>([]);

  // Editing state
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<LeadInput>>({});

  // Activity form
  const [activityType, setActivityType] = useState<LeadActivity['type']>('notitie');
  const [activityContent, setActivityContent] = useState('');
  const [addingActivity, setAddingActivity] = useState(false);

  // Follow-up
  const [followupDate, setFollowupDate] = useState('');

  useEffect(() => {
    loadData();
  }, [leadId]);

  async function loadData() {
    setLoading(true);
    const [leadData, activityData] = await Promise.all([
      getLead(leadId),
      getLeadActivities(leadId),
    ]);
    setLead(leadData);
    setActivities(activityData);
    if (leadData) {
      setFollowupDate(leadData.next_followup_at ? leadData.next_followup_at.split('T')[0] : '');
    }
    setLoading(false);
  }

  const handleStageChange = async (newStage: Lead['stage']) => {
    if (!lead || lead.stage === newStage) return;
    setSaving(true);
    const updated = await updateLeadStage(leadId, newStage);
    if (updated) {
      setLead(updated);
      // Reload activities to get the new status_change entry
      const activityData = await getLeadActivities(leadId);
      setActivities(activityData);
    }
    setSaving(false);
  };

  const handleSaveEdit = async () => {
    if (!lead) return;
    setSaving(true);
    const updated = await updateLead(leadId, editData);
    if (updated) {
      setLead(updated);
      setIsEditing(false);
      setEditData({});
    }
    setSaving(false);
  };

  const handleAddActivity = async () => {
    if (!activityContent.trim()) return;
    setAddingActivity(true);
    const activity = await addLeadActivity(leadId, activityType, activityContent.trim());
    if (activity) {
      setActivities([activity, ...activities]);
      setActivityContent('');
    }
    setAddingActivity(false);
  };

  const handleFollowupUpdate = async () => {
    if (!lead) return;
    setSaving(true);
    const updated = await updateLead(leadId, {
      next_followup_at: followupDate ? new Date(followupDate).toISOString() : undefined,
    });
    if (updated) setLead(updated);
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!confirm('Weet je zeker dat je deze lead wilt verwijderen? Dit kan niet ongedaan worden.')) return;
    const success = await deleteLead(leadId);
    if (success) {
      router.push('/leads');
    }
  };

  const handleConvert = async () => {
    if (!lead) return;
    if (!confirm(`Wil je "${lead.company_name}" converteren naar een klant?`)) return;
    setSaving(true);
    const result = await convertLeadToClient(leadId);
    if (result) {
      // Reload lead to get updated state
      const updated = await getLead(leadId);
      if (updated) setLead(updated);
      const activityData = await getLeadActivities(leadId);
      setActivities(activityData);
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="animate-fade-in flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Lead laden...</span>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="animate-fade-in text-center py-20">
        <p className="text-muted-foreground">Lead niet gevonden.</p>
        <Link href="/leads" className="text-primary hover:underline mt-2 inline-block">
          Terug naar leads
        </Link>
      </div>
    );
  }

  const stageConfig = STAGE_CONFIG[lead.stage];
  const displayName = [lead.first_name, lead.last_name].filter(Boolean).join(' ') || lead.company_name;

  return (
    <div className="animate-fade-in space-y-6 max-w-5xl">
      {/* Back link */}
      <Link
        href="/leads"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Terug naar leads
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{displayName}</h1>
          <p className="text-muted-foreground mt-1">
            {lead.company_name}{lead.job_title ? ` \u2022 ${lead.job_title}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {lead.stage !== 'gewonnen' && lead.stage !== 'verloren' && !lead.converted_client_id && (
            <button
              onClick={handleConvert}
              disabled={saving}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors text-sm font-medium disabled:opacity-50"
            >
              <UserCheck className="h-4 w-4" />
              Converteer naar Klant
            </button>
          )}
          {lead.converted_client_id && (
            <Link
              href={`/factuur/clients`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-100 text-green-700 text-sm font-medium"
            >
              <UserCheck className="h-4 w-4" />
              Geconverteerd
            </Link>
          )}
          <button
            onClick={() => {
              if (isEditing) {
                setIsEditing(false);
                setEditData({});
              } else {
                setIsEditing(true);
                setEditData({
                  first_name: lead.first_name || undefined,
                  last_name: lead.last_name || undefined,
                  email: lead.email || undefined,
                  phone: lead.phone || undefined,
                  linkedin_url: lead.linkedin_url || undefined,
                  job_title: lead.job_title || undefined,
                  company_name: lead.company_name,
                  company_domain: lead.company_domain || undefined,
                  company_linkedin: lead.company_linkedin || undefined,
                  company_size: lead.company_size || undefined,
                  company_industry: lead.company_industry || undefined,
                  company_location: lead.company_location || undefined,
                  value: lead.value || undefined,
                  score: lead.score,
                  notes: lead.notes || undefined,
                });
              }
            }}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border hover:bg-card-hover transition-colors text-sm"
          >
            <Edit className="h-4 w-4" />
            {isEditing ? 'Annuleren' : 'Bewerken'}
          </button>
          <button
            onClick={handleDelete}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors text-sm"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Stage Pipeline */}
      <div className="card-premium p-4">
        <div className="flex items-center gap-1">
          {STAGES_ORDER.map((stage, index) => {
            const config = STAGE_CONFIG[stage];
            const isActive = lead.stage === stage;
            const isPast = STAGES_ORDER.indexOf(lead.stage) > index;
            return (
              <div key={stage} className="flex items-center flex-1">
                <button
                  onClick={() => handleStageChange(stage)}
                  disabled={saving}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all text-center
                    ${isActive
                      ? `${config.bg} ${config.color} ring-2 ring-offset-1 ${config.border.replace('border', 'ring')}`
                      : isPast
                        ? `${config.bg} ${config.color} opacity-60`
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }
                    disabled:cursor-not-allowed`}
                >
                  {config.label}
                </button>
                {index < STAGES_ORDER.length - 1 && (
                  <ChevronRight className="h-4 w-4 text-muted-foreground/30 flex-shrink-0 mx-0.5" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Contact & Company Info */}
        <div className="lg:col-span-1 space-y-6">
          {/* Contact Info */}
          <div className="card-premium p-6">
            <h3 className="font-semibold mb-4">Contactgegevens</h3>
            {isEditing ? (
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground">Voornaam</label>
                  <input
                    type="text"
                    value={editData.first_name || ''}
                    onChange={(e) => setEditData({ ...editData, first_name: e.target.value })}
                    className="w-full mt-1 px-3 py-1.5 rounded-lg border border-border text-sm bg-background"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Achternaam</label>
                  <input
                    type="text"
                    value={editData.last_name || ''}
                    onChange={(e) => setEditData({ ...editData, last_name: e.target.value })}
                    className="w-full mt-1 px-3 py-1.5 rounded-lg border border-border text-sm bg-background"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Functie</label>
                  <input
                    type="text"
                    value={editData.job_title || ''}
                    onChange={(e) => setEditData({ ...editData, job_title: e.target.value })}
                    className="w-full mt-1 px-3 py-1.5 rounded-lg border border-border text-sm bg-background"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Email</label>
                  <input
                    type="email"
                    value={editData.email || ''}
                    onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                    className="w-full mt-1 px-3 py-1.5 rounded-lg border border-border text-sm bg-background"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Telefoon</label>
                  <input
                    type="text"
                    value={editData.phone || ''}
                    onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                    className="w-full mt-1 px-3 py-1.5 rounded-lg border border-border text-sm bg-background"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">LinkedIn URL</label>
                  <input
                    type="url"
                    value={editData.linkedin_url || ''}
                    onChange={(e) => setEditData({ ...editData, linkedin_url: e.target.value })}
                    className="w-full mt-1 px-3 py-1.5 rounded-lg border border-border text-sm bg-background"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {lead.email && (
                  <a href={`mailto:${lead.email}`} className="flex items-center gap-2 text-sm hover:text-primary transition-colors">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    {lead.email}
                  </a>
                )}
                {lead.phone && (
                  <a href={`tel:${lead.phone}`} className="flex items-center gap-2 text-sm hover:text-primary transition-colors">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    {lead.phone}
                  </a>
                )}
                {lead.linkedin_url && (
                  <a href={lead.linkedin_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm hover:text-primary transition-colors">
                    <Linkedin className="h-4 w-4 text-muted-foreground" />
                    LinkedIn Profiel
                  </a>
                )}
                {lead.job_title && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    {lead.job_title}
                  </div>
                )}
                {!lead.email && !lead.phone && !lead.linkedin_url && (
                  <p className="text-sm text-muted-foreground">Geen contactgegevens beschikbaar</p>
                )}
              </div>
            )}
          </div>

          {/* Company Info */}
          <div className="card-premium p-6">
            <h3 className="font-semibold mb-4">Bedrijfsgegevens</h3>
            {isEditing ? (
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground">Bedrijfsnaam *</label>
                  <input
                    type="text"
                    value={editData.company_name || ''}
                    onChange={(e) => setEditData({ ...editData, company_name: e.target.value })}
                    className="w-full mt-1 px-3 py-1.5 rounded-lg border border-border text-sm bg-background"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Domein</label>
                  <input
                    type="text"
                    value={editData.company_domain || ''}
                    onChange={(e) => setEditData({ ...editData, company_domain: e.target.value })}
                    className="w-full mt-1 px-3 py-1.5 rounded-lg border border-border text-sm bg-background"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Industrie</label>
                  <input
                    type="text"
                    value={editData.company_industry || ''}
                    onChange={(e) => setEditData({ ...editData, company_industry: e.target.value })}
                    className="w-full mt-1 px-3 py-1.5 rounded-lg border border-border text-sm bg-background"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Bedrijfsomvang</label>
                  <input
                    type="text"
                    value={editData.company_size || ''}
                    onChange={(e) => setEditData({ ...editData, company_size: e.target.value })}
                    className="w-full mt-1 px-3 py-1.5 rounded-lg border border-border text-sm bg-background"
                    placeholder="bijv. 11-50"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Locatie</label>
                  <input
                    type="text"
                    value={editData.company_location || ''}
                    onChange={(e) => setEditData({ ...editData, company_location: e.target.value })}
                    className="w-full mt-1 px-3 py-1.5 rounded-lg border border-border text-sm bg-background"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">LinkedIn Bedrijf</label>
                  <input
                    type="url"
                    value={editData.company_linkedin || ''}
                    onChange={(e) => setEditData({ ...editData, company_linkedin: e.target.value })}
                    className="w-full mt-1 px-3 py-1.5 rounded-lg border border-border text-sm bg-background"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{lead.company_name}</span>
                </div>
                {lead.company_domain && (
                  <a href={`https://${lead.company_domain}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm hover:text-primary transition-colors">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    {lead.company_domain}
                  </a>
                )}
                {lead.company_industry && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Building2 className="h-4 w-4" />
                    {lead.company_industry}
                  </div>
                )}
                {lead.company_size && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    {lead.company_size} medewerkers
                  </div>
                )}
                {lead.company_location && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    {lead.company_location}
                  </div>
                )}
                {lead.company_linkedin && (
                  <a href={lead.company_linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm hover:text-primary transition-colors">
                    <Linkedin className="h-4 w-4 text-muted-foreground" />
                    LinkedIn Bedrijfspagina
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Lead Score & Value */}
          <div className="card-premium p-6">
            <h3 className="font-semibold mb-4">Score & Waarde</h3>
            {isEditing ? (
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground">Score (0-100)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={editData.score || 0}
                    onChange={(e) => setEditData({ ...editData, score: parseInt(e.target.value) || 0 })}
                    className="w-full mt-1 px-3 py-1.5 rounded-lg border border-border text-sm bg-background"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Geschatte waarde</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editData.value || ''}
                    onChange={(e) => setEditData({ ...editData, value: parseFloat(e.target.value) || undefined })}
                    className="w-full mt-1 px-3 py-1.5 rounded-lg border border-border text-sm bg-background"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Notities</label>
                  <textarea
                    value={editData.notes || ''}
                    onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                    className="w-full mt-1 px-3 py-1.5 rounded-lg border border-border text-sm bg-background min-h-[80px]"
                  />
                </div>
                <button
                  onClick={handleSaveEdit}
                  disabled={saving}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-medium disabled:opacity-50"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Opslaan
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Lead Score</p>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-muted rounded-full h-2.5">
                      <div
                        className={`h-2.5 rounded-full transition-all ${
                          lead.score >= 70 ? 'bg-green-500' : lead.score >= 40 ? 'bg-yellow-500' : 'bg-gray-300'
                        }`}
                        style={{ width: `${lead.score}%` }}
                      />
                    </div>
                    <span className="text-sm font-bold">{lead.score}</span>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Geschatte Waarde</p>
                  <p className="text-lg font-bold">{lead.value ? formatCurrency(lead.value) : '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Bron</p>
                  <p className="text-sm capitalize">{lead.source}</p>
                </div>
                {lead.notes && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Notities</p>
                    <p className="text-sm whitespace-pre-wrap">{lead.notes}</p>
                  </div>
                )}
                {lead.last_contacted_at && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Laatst Gecontacteerd</p>
                    <p className="text-sm">{formatDate(lead.last_contacted_at)}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Follow-up */}
          <div className="card-premium p-6">
            <h3 className="font-semibold mb-4">Opvolging</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground">Volgende opvolging</label>
                <div className="flex gap-2 mt-1">
                  <input
                    type="date"
                    value={followupDate}
                    onChange={(e) => setFollowupDate(e.target.value)}
                    className="flex-1 px-3 py-1.5 rounded-lg border border-border text-sm bg-background"
                  />
                  <button
                    onClick={handleFollowupUpdate}
                    disabled={saving}
                    className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm hover:bg-primary/90 disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              {lead.next_followup_at && (
                <p className="text-xs text-muted-foreground">
                  Gepland: {formatDate(lead.next_followup_at)}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Activities */}
        <div className="lg:col-span-2 space-y-6">
          {/* Add Activity */}
          <div className="card-premium p-6">
            <h3 className="font-semibold mb-4">Activiteit Toevoegen</h3>
            <div className="space-y-3">
              <div className="flex gap-2 flex-wrap">
                {(['notitie', 'email', 'telefoon', 'meeting', 'offerte'] as const).map((type) => {
                  const Icon = ACTIVITY_ICONS[type];
                  return (
                    <button
                      key={type}
                      onClick={() => setActivityType(type)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
                        ${activityType === type
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground hover:bg-muted/80'
                        }`}
                    >
                      <Icon className="h-3 w-3" />
                      {ACTIVITY_LABELS[type]}
                    </button>
                  );
                })}
              </div>
              <textarea
                value={activityContent}
                onChange={(e) => setActivityContent(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border text-sm bg-background min-h-[80px]"
                placeholder={`Beschrijf je ${ACTIVITY_LABELS[activityType].toLowerCase()}...`}
              />
              <button
                onClick={handleAddActivity}
                disabled={addingActivity || !activityContent.trim()}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-medium disabled:opacity-50"
              >
                {addingActivity ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageSquare className="h-4 w-4" />}
                Toevoegen
              </button>
            </div>
          </div>

          {/* Activity Timeline */}
          <div className="card-premium p-6">
            <h3 className="font-semibold mb-4">Activiteiten ({activities.length})</h3>
            {activities.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Nog geen activiteiten. Voeg je eerste notitie toe!
              </p>
            ) : (
              <div className="space-y-0">
                {activities.map((activity, index) => {
                  const Icon = ACTIVITY_ICONS[activity.type] || MessageSquare;
                  const isLast = index === activities.length - 1;
                  return (
                    <div key={activity.id} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className={`p-1.5 rounded-full border-2 border-border bg-background ${
                          activity.type === 'status_change' ? 'border-purple-300' : ''
                        }`}>
                          <Icon className="h-3 w-3 text-muted-foreground" />
                        </div>
                        {!isLast && (
                          <div className="w-px flex-1 bg-border my-1" />
                        )}
                      </div>
                      <div className={`flex-1 pb-4 ${isLast ? '' : ''}`}>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-muted-foreground uppercase">
                            {ACTIVITY_LABELS[activity.type]}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(activity.created_at)}
                          </span>
                        </div>
                        <p className="text-sm mt-1 whitespace-pre-wrap">{activity.content}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
