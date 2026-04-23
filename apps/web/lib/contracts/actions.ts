'use server';

import { createClient } from '@/lib/supabase/server';

// ============================================
// TYPES
// ============================================

export interface Contract {
  id: string;
  userId: string;
  clientId: string | null;
  projectId: string | null;
  title: string;
  description: string | null;
  status: 'concept' | 'verzonden' | 'ondertekend' | 'actief' | 'verlopen' | 'opgezegd';
  template: string;
  startDate: string | null;
  endDate: string | null;
  hourlyRate: number | null;
  fixedPrice: number | null;
  paymentTerms: string;
  content: string | null;
  signedByClient: string | null;
  signedAt: string | null;
  signatureUrl: string | null;
  createdAt: string;
  updatedAt: string;
  // Joined fields
  clientName?: string;
  projectName?: string;
}

export interface ContractInput {
  clientId?: string;
  projectId?: string;
  title: string;
  description?: string;
  template?: string;
  startDate?: string;
  endDate?: string;
  hourlyRate?: number;
  fixedPrice?: number;
  paymentTerms?: string;
  content?: string;
}

// ============================================
// LIST CONTRACTS
// ============================================

export async function getContracts(): Promise<Contract[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('contracts')
    .select(`
      *,
      clients (id, name),
      projects (id, name)
    `)
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });

  if (error || !data) return [];

  return data.map(mapContract);
}

// ============================================
// GET SINGLE CONTRACT
// ============================================

export async function getContract(id: string): Promise<Contract | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('contracts')
    .select(`
      *,
      clients (id, name),
      projects (id, name)
    `)
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (error || !data) return null;

  return mapContract(data);
}

// ============================================
// CREATE CONTRACT
// ============================================

export async function createContract(input: ContractInput): Promise<Contract | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('contracts')
    .insert({
      user_id: user.id,
      client_id: input.clientId || null,
      project_id: input.projectId || null,
      title: input.title,
      description: input.description || null,
      template: input.template || 'freelance',
      start_date: input.startDate || null,
      end_date: input.endDate || null,
      hourly_rate: input.hourlyRate || null,
      fixed_price: input.fixedPrice || null,
      payment_terms: input.paymentTerms || '30 dagen',
      content: input.content || null,
      status: 'concept',
    })
    .select(`
      *,
      clients (id, name),
      projects (id, name)
    `)
    .single();

  if (error || !data) return null;

  return mapContract(data);
}

// ============================================
// UPDATE CONTRACT
// ============================================

export async function updateContract(
  id: string,
  input: Partial<ContractInput> & { content?: string }
): Promise<Contract | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const updateData: Record<string, any> = {};
  if (input.title !== undefined) updateData.title = input.title;
  if (input.description !== undefined) updateData.description = input.description || null;
  if (input.clientId !== undefined) updateData.client_id = input.clientId || null;
  if (input.projectId !== undefined) updateData.project_id = input.projectId || null;
  if (input.template !== undefined) updateData.template = input.template;
  if (input.startDate !== undefined) updateData.start_date = input.startDate || null;
  if (input.endDate !== undefined) updateData.end_date = input.endDate || null;
  if (input.hourlyRate !== undefined) updateData.hourly_rate = input.hourlyRate || null;
  if (input.fixedPrice !== undefined) updateData.fixed_price = input.fixedPrice || null;
  if (input.paymentTerms !== undefined) updateData.payment_terms = input.paymentTerms;
  if (input.content !== undefined) updateData.content = input.content || null;

  const { data, error } = await supabase
    .from('contracts')
    .update(updateData)
    .eq('id', id)
    .eq('user_id', user.id)
    .select(`
      *,
      clients (id, name),
      projects (id, name)
    `)
    .single();

  if (error || !data) return null;

  return mapContract(data);
}

// ============================================
// DELETE CONTRACT
// ============================================

export async function deleteContract(id: string): Promise<boolean> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { error } = await supabase
    .from('contracts')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  return !error;
}

// ============================================
// UPDATE STATUS
// ============================================

export async function updateContractStatus(
  id: string,
  status: Contract['status']
): Promise<boolean> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { error } = await supabase
    .from('contracts')
    .update({ status })
    .eq('id', id)
    .eq('user_id', user.id);

  return !error;
}

// ============================================
// SIGN CONTRACT
// ============================================

export async function signContract(
  id: string,
  signedBy: string
): Promise<boolean> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { error } = await supabase
    .from('contracts')
    .update({
      status: 'ondertekend',
      signed_by_client: signedBy,
      signed_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('user_id', user.id);

  return !error;
}

// ============================================
// HELPER
// ============================================

function mapContract(row: any): Contract {
  return {
    id: row.id,
    userId: row.user_id,
    clientId: row.client_id,
    projectId: row.project_id,
    title: row.title,
    description: row.description,
    status: row.status,
    template: row.template,
    startDate: row.start_date,
    endDate: row.end_date,
    hourlyRate: row.hourly_rate ? Number(row.hourly_rate) : null,
    fixedPrice: row.fixed_price ? Number(row.fixed_price) : null,
    paymentTerms: row.payment_terms || '30 dagen',
    content: row.content,
    signedByClient: row.signed_by_client,
    signedAt: row.signed_at,
    signatureUrl: row.signature_url,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    clientName: (row.clients as any)?.name || undefined,
    projectName: (row.projects as any)?.name || undefined,
  };
}
