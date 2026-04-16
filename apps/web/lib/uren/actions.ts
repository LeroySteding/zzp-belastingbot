'use server';

import { createClient } from '@/lib/supabase/server';

// ============================================
// Types (camelCase for frontend compatibility)
// ============================================

export interface UrenProject {
  id: string;
  name: string;
  clientId: string;
  clientName: string;
  hourlyRate: number;
  budgetHours: number;
  color: string;
  status: string;
}

export interface UrenClient {
  id: string;
  name: string;
  email: string;
}

export interface UrenTimeEntry {
  id: string;
  projectId: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: number; // in minutes
  description: string;
  billable: boolean;
}

export interface UrenProjectStats {
  totalHours: number;
  revenue: number;
  budgetPercentage: number;
}

// ============================================
// PROJECTS
// ============================================

export async function getUrenProjects(): Promise<UrenProject[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('projects')
    .select(`
      id,
      name,
      client_id,
      hourly_rate,
      budget_hours,
      color,
      status,
      clients (id, name)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error || !data) return [];

  return data.map((p: any) => ({
    id: p.id,
    name: p.name,
    clientId: p.client_id || '',
    clientName: p.clients?.name || '',
    hourlyRate: Number(p.hourly_rate) || 0,
    budgetHours: Number(p.budget_hours) || 0,
    color: p.color || 'bg-gray-500',
    status: p.status || 'active',
  }));
}

export async function createProject(input: {
  name: string;
  clientId: string;
  hourlyRate: number;
  budgetHours: number;
  color?: string;
}): Promise<UrenProject | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500'];
  const randomColor = colors[Math.floor(Math.random() * colors.length)];

  const { data, error } = await supabase
    .from('projects')
    .insert({
      user_id: user.id,
      name: input.name,
      client_id: input.clientId,
      hourly_rate: input.hourlyRate,
      budget_hours: input.budgetHours,
      color: input.color || randomColor,
      status: 'active',
    })
    .select(`
      id,
      name,
      client_id,
      hourly_rate,
      budget_hours,
      color,
      status,
      clients (id, name)
    `)
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    name: data.name,
    clientId: data.client_id || '',
    clientName: (data as any).clients?.name || '',
    hourlyRate: Number(data.hourly_rate) || 0,
    budgetHours: Number(data.budget_hours) || 0,
    color: data.color || 'bg-gray-500',
    status: data.status || 'active',
  };
}

// ============================================
// CLIENTS
// ============================================

export async function getUrenClients(): Promise<UrenClient[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('clients')
    .select('id, name, email')
    .eq('user_id', user.id)
    .order('name', { ascending: true });

  if (error || !data) return [];

  return data.map((c) => ({
    id: c.id,
    name: c.name,
    email: c.email || '',
  }));
}

// ============================================
// TIME ENTRIES
// ============================================

export async function getTimeEntries(projectId?: string): Promise<UrenTimeEntry[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  let query = supabase
    .from('time_entries')
    .select('id, project_id, date, start_time, end_time, duration_minutes, description, billable')
    .eq('user_id', user.id)
    .order('date', { ascending: false })
    .order('start_time', { ascending: false });

  if (projectId) {
    query = query.eq('project_id', projectId);
  }

  const { data, error } = await query;

  if (error || !data) return [];

  return data.map((e) => ({
    id: e.id,
    projectId: e.project_id,
    date: e.date,
    startTime: e.start_time || '',
    endTime: e.end_time || '',
    duration: e.duration_minutes,
    description: e.description || '',
    billable: e.billable,
  }));
}

export async function getTimeEntriesByDateRange(start: string, end: string): Promise<UrenTimeEntry[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('time_entries')
    .select('id, project_id, date, start_time, end_time, duration_minutes, description, billable')
    .eq('user_id', user.id)
    .gte('date', start)
    .lte('date', end)
    .order('date', { ascending: false })
    .order('start_time', { ascending: false });

  if (error || !data) return [];

  return data.map((e) => ({
    id: e.id,
    projectId: e.project_id,
    date: e.date,
    startTime: e.start_time || '',
    endTime: e.end_time || '',
    duration: e.duration_minutes,
    description: e.description || '',
    billable: e.billable,
  }));
}

// ============================================
// CREATE TIME ENTRY
// ============================================

export async function createTimeEntry(input: {
  projectId: string;
  date: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  description?: string;
  billable?: boolean;
}): Promise<UrenTimeEntry | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('time_entries')
    .insert({
      user_id: user.id,
      project_id: input.projectId,
      date: input.date,
      start_time: input.startTime,
      end_time: input.endTime,
      duration_minutes: input.durationMinutes,
      description: input.description || null,
      billable: input.billable !== undefined ? input.billable : true,
    })
    .select('id, project_id, date, start_time, end_time, duration_minutes, description, billable')
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    projectId: data.project_id,
    date: data.date,
    startTime: data.start_time || '',
    endTime: data.end_time || '',
    duration: data.duration_minutes,
    description: data.description || '',
    billable: data.billable,
  };
}

// ============================================
// PROJECT STATS
// ============================================

export async function calculateProjectStats(projectId: string): Promise<UrenProjectStats | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Get project info
  const { data: project } = await supabase
    .from('projects')
    .select('hourly_rate, budget_hours')
    .eq('id', projectId)
    .eq('user_id', user.id)
    .single();

  if (!project) return null;

  // Get total minutes for this project
  const { data: entries } = await supabase
    .from('time_entries')
    .select('duration_minutes')
    .eq('user_id', user.id)
    .eq('project_id', projectId);

  const totalMinutes = (entries || []).reduce((sum, e) => sum + (e.duration_minutes || 0), 0);
  const totalHours = totalMinutes / 60;
  const hourlyRate = Number(project.hourly_rate) || 0;
  const budgetHours = Number(project.budget_hours) || 0;

  return {
    totalHours,
    revenue: totalHours * hourlyRate,
    budgetPercentage: budgetHours > 0 ? (totalHours / budgetHours) * 100 : 0,
  };
}
