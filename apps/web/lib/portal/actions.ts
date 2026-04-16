'use server'

import { createClient } from '@/lib/supabase/server'
import type {
  Client,
  Project,
  ProjectMilestone,
  ProjectFile,
  ProjectComment,
  PortalSettings,
  ProjectStatus,
} from '@/lib/types'

// ---- Helper types for the portal frontend ----

export interface PortalProject extends Project {
  clientName: string
  milestones: ProjectMilestone[]
  files: PortalFile[]
  comments: PortalComment[]
  progress: number
  needsApproval: boolean
  displayStatus: string
}

export interface PortalFile {
  id: string
  name: string
  size: string
  uploadedAt: string
  type: string
  file_url: string
  portal_visible: boolean
}

export interface PortalComment {
  id: string
  author: string
  content: string
  timestamp: string
  isClient: boolean
}

export interface PortalClient extends Client {
  activeProjects: number
}

export interface PortalActivity {
  id: string
  type: 'project' | 'approval' | 'comment' | 'file'
  message: string
  timestamp: string
  projectId: string
}

// ---- Status mapping helpers ----

const DB_TO_DISPLAY_STATUS: Record<string, string> = {
  offerte: 'offerte',
  active: 'in-uitvoering',
  review: 'review',
  completed: 'afgerond',
  archived: 'archived',
}

const DISPLAY_TO_DB_STATUS: Record<string, ProjectStatus> = {
  offerte: 'offerte',
  'in-uitvoering': 'active',
  review: 'review',
  afgerond: 'completed',
  archived: 'archived',
}

function mapStatusToDisplay(dbStatus: string): string {
  return DB_TO_DISPLAY_STATUS[dbStatus] ?? dbStatus
}

function formatFileSize(bytes: number | null): string {
  if (!bytes) return '0 B'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function computeProgress(milestones: ProjectMilestone[]): number {
  if (milestones.length === 0) return 0
  const completed = milestones.filter((m) => m.completed).length
  return Math.round((completed / milestones.length) * 100)
}

function mapFile(f: ProjectFile): PortalFile {
  return {
    id: f.id,
    name: f.name,
    size: formatFileSize(f.file_size),
    uploadedAt: f.created_at,
    type: f.file_type ?? 'file',
    file_url: f.file_url,
    portal_visible: f.portal_visible,
  }
}

function mapComment(c: ProjectComment): PortalComment {
  return {
    id: c.id,
    author: c.author_name,
    content: c.content,
    timestamp: c.created_at,
    isClient: c.is_client,
  }
}

// ---- Server Actions ----

export async function getPortalClients(): Promise<PortalClient[]> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  const { data: clients, error } = await supabase
    .from('clients')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error || !clients) return []

  // Get active project counts per client
  const { data: projects } = await supabase
    .from('projects')
    .select('id, client_id, status')
    .eq('user_id', user.id)
    .not('status', 'in', '("completed","archived")')

  const countMap: Record<string, number> = {}
  if (projects) {
    for (const p of projects) {
      if (p.client_id) {
        countMap[p.client_id] = (countMap[p.client_id] || 0) + 1
      }
    }
  }

  return clients.map((c) => ({
    ...c,
    activeProjects: countMap[c.id] || 0,
  }))
}

export async function getPortalProjects(): Promise<PortalProject[]> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  const { data: projects, error } = await supabase
    .from('projects')
    .select('*, clients(name, company)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error || !projects) return []

  const projectIds = projects.map((p) => p.id)

  // Fetch all milestones, files, comments in parallel
  const [milestonesRes, filesRes, commentsRes] = await Promise.all([
    supabase
      .from('project_milestones')
      .select('*')
      .in('project_id', projectIds)
      .order('sort_order', { ascending: true }),
    supabase
      .from('project_files')
      .select('*')
      .in('project_id', projectIds)
      .order('created_at', { ascending: false }),
    supabase
      .from('project_comments')
      .select('*')
      .in('project_id', projectIds)
      .order('created_at', { ascending: true }),
  ])

  const milestonesByProject: Record<string, ProjectMilestone[]> = {}
  for (const m of milestonesRes.data ?? []) {
    ;(milestonesByProject[m.project_id] ??= []).push(m)
  }

  const filesByProject: Record<string, ProjectFile[]> = {}
  for (const f of filesRes.data ?? []) {
    ;(filesByProject[f.project_id] ??= []).push(f)
  }

  const commentsByProject: Record<string, ProjectComment[]> = {}
  for (const c of commentsRes.data ?? []) {
    ;(commentsByProject[c.project_id] ??= []).push(c)
  }

  return projects.map((p) => {
    const milestones = milestonesByProject[p.id] ?? []
    const files = filesByProject[p.id] ?? []
    const comments = commentsByProject[p.id] ?? []
    const clientData = p.clients as unknown as { name: string; company: string } | null

    return {
      ...p,
      clientName: clientData?.company ?? clientData?.name ?? 'Onbekend',
      milestones,
      files: files.map(mapFile),
      comments: comments.map(mapComment),
      progress: computeProgress(milestones),
      needsApproval: p.status === 'review',
      displayStatus: mapStatusToDisplay(p.status),
    } as PortalProject
  })
}

export async function getPortalProject(
  id: string,
): Promise<PortalProject | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: project, error } = await supabase
    .from('projects')
    .select('*, clients(name, company)')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error || !project) return null

  const [milestonesRes, filesRes, commentsRes] = await Promise.all([
    supabase
      .from('project_milestones')
      .select('*')
      .eq('project_id', id)
      .order('sort_order', { ascending: true }),
    supabase
      .from('project_files')
      .select('*')
      .eq('project_id', id)
      .order('created_at', { ascending: false }),
    supabase
      .from('project_comments')
      .select('*')
      .eq('project_id', id)
      .order('created_at', { ascending: true }),
  ])

  const milestones = milestonesRes.data ?? []
  const files = filesRes.data ?? []
  const comments = commentsRes.data ?? []
  const clientData = project.clients as { name: string; company: string } | null

  return {
    ...project,
    clientName: clientData?.company ?? clientData?.name ?? 'Onbekend',
    milestones,
    files: files.map(mapFile),
    comments: comments.map(mapComment),
    progress: computeProgress(milestones),
    needsApproval: project.status === 'review',
    displayStatus: mapStatusToDisplay(project.status),
  } as PortalProject
}

export async function getPortalActivities(): Promise<PortalActivity[]> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  // Get user's project IDs
  const { data: projects } = await supabase
    .from('projects')
    .select('id, name, status, clients(name)')
    .eq('user_id', user.id)

  if (!projects || projects.length === 0) return []

  const projectIds = projects.map((p) => p.id)
  const projectMap: Record<
    string,
    { name: string; status: string; clientName: string }
  > = {}
  for (const p of projects) {
    const clientData = p.clients as unknown as { name: string } | null
    projectMap[p.id] = {
      name: p.name,
      status: p.status,
      clientName: clientData?.name ?? 'Onbekend',
    }
  }

  // Fetch recent comments and files in parallel
  const [commentsRes, filesRes] = await Promise.all([
    supabase
      .from('project_comments')
      .select('*')
      .in('project_id', projectIds)
      .order('created_at', { ascending: false })
      .limit(20),
    supabase
      .from('project_files')
      .select('*')
      .in('project_id', projectIds)
      .order('created_at', { ascending: false })
      .limit(20),
  ])

  const activities: PortalActivity[] = []

  // Add comment activities
  for (const c of commentsRes.data ?? []) {
    const proj = projectMap[c.project_id]
    if (!proj) continue
    activities.push({
      id: `comment-${c.id}`,
      type: 'comment',
      message: `${c.author_name} heeft gereageerd op ${proj.name}`,
      timestamp: c.created_at,
      projectId: c.project_id,
    })
  }

  // Add file activities
  for (const f of filesRes.data ?? []) {
    const proj = projectMap[f.project_id]
    if (!proj) continue
    activities.push({
      id: `file-${f.id}`,
      type: 'file',
      message: `Nieuw bestand geüpload: ${f.name}`,
      timestamp: f.created_at,
      projectId: f.project_id,
    })
  }

  // Add approval activities for projects in review status
  for (const p of projects) {
    if (p.status === 'review') {
      const clientData = p.clients as unknown as { name: string } | null
      activities.push({
        id: `approval-${p.id}`,
        type: 'approval',
        message: `${clientData?.name ?? 'Klant'} heeft goedkeuring nodig voor ${p.name}`,
        timestamp: new Date().toISOString(),
        projectId: p.id,
      })
    }
  }

  // Sort by timestamp descending and take top 20
  activities.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  )
  return activities.slice(0, 20)
}

export async function getPortalSettings(): Promise<PortalSettings | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('portal_settings')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (error || !data) return null
  return data as PortalSettings
}

export async function updatePortalSettings(
  updates: Partial<
    Pick<
      PortalSettings,
      | 'company_name'
      | 'logo_url'
      | 'primary_color'
      | 'portal_slug'
      | 'custom_domain'
      | 'welcome_email_subject'
      | 'welcome_email_body'
    >
  >,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Niet ingelogd' }

  // Upsert: create if not exists, update if exists
  const { error } = await supabase.from('portal_settings').upsert(
    {
      user_id: user.id,
      ...updates,
    },
    { onConflict: 'user_id' },
  )

  if (error) return { success: false, error: error.message }
  return { success: true }
}

export async function addComment(
  projectId: string,
  content: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Niet ingelogd' }

  const { error } = await supabase.from('project_comments').insert({
    project_id: projectId,
    author_id: user.id,
    author_name: 'Jij',
    content,
    is_client: false,
  })

  if (error) return { success: false, error: error.message }
  return { success: true }
}

export async function toggleMilestone(
  id: string,
  completed: boolean,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Niet ingelogd' }

  const { error } = await supabase
    .from('project_milestones')
    .update({ completed })
    .eq('id', id)

  if (error) return { success: false, error: error.message }
  return { success: true }
}

export async function updateProjectStatus(
  id: string,
  status: ProjectStatus,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Niet ingelogd' }

  const { error } = await supabase
    .from('projects')
    .update({ status })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { success: false, error: error.message }
  return { success: true }
}

// ---- Public portal actions (no auth required, use slug) ----

export async function getPublicPortalProject(
  slug: string,
  projectId: string,
): Promise<{
  project: PortalProject | null
  branding: { companyName: string; primaryColor: string; portalUrl: string } | null
}> {
  const supabase = await createClient()

  // Look up portal settings by slug
  const { data: settings, error: settingsError } = await supabase
    .from('portal_settings')
    .select('*')
    .eq('portal_slug', slug)
    .single()

  if (settingsError || !settings) {
    return { project: null, branding: null }
  }

  const userId = settings.user_id

  const branding = {
    companyName: settings.company_name ?? 'Bedrijf',
    primaryColor: settings.primary_color ?? '#3b82f6',
    portalUrl: settings.portal_slug ?? '',
  }

  // Load project owned by that user
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('*, clients(name, company)')
    .eq('id', projectId)
    .eq('user_id', userId)
    .eq('portal_visible', true)
    .single()

  if (projectError || !project) {
    return { project: null, branding }
  }

  const [milestonesRes, filesRes, commentsRes] = await Promise.all([
    supabase
      .from('project_milestones')
      .select('*')
      .eq('project_id', projectId)
      .order('sort_order', { ascending: true }),
    supabase
      .from('project_files')
      .select('*')
      .eq('project_id', projectId)
      .eq('portal_visible', true)
      .order('created_at', { ascending: false }),
    supabase
      .from('project_comments')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true }),
  ])

  const milestones = milestonesRes.data ?? []
  const files = filesRes.data ?? []
  const comments = commentsRes.data ?? []
  const clientData = project.clients as { name: string; company: string } | null

  const portalProject: PortalProject = {
    ...project,
    clientName: clientData?.company ?? clientData?.name ?? 'Onbekend',
    milestones,
    files: files.map(mapFile),
    comments: comments.map(mapComment),
    progress: computeProgress(milestones),
    needsApproval: project.status === 'review',
    displayStatus: mapStatusToDisplay(project.status),
  } as PortalProject

  return { project: portalProject, branding }
}

export async function addPublicComment(
  slug: string,
  projectId: string,
  authorName: string,
  content: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  // Verify slug
  const { data: settings } = await supabase
    .from('portal_settings')
    .select('user_id')
    .eq('portal_slug', slug)
    .single()

  if (!settings) return { success: false, error: 'Portaal niet gevonden' }

  // Verify project belongs to the portal owner and is visible
  const { data: project } = await supabase
    .from('projects')
    .select('id')
    .eq('id', projectId)
    .eq('user_id', settings.user_id)
    .eq('portal_visible', true)
    .single()

  if (!project) return { success: false, error: 'Project niet gevonden' }

  const { error } = await supabase.from('project_comments').insert({
    project_id: projectId,
    author_id: null,
    author_name: authorName,
    content,
    is_client: true,
  })

  if (error) return { success: false, error: error.message }
  return { success: true }
}
