'use server'

import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import type { TeamMember, TeamAccess, TeamRole, TeamPermissions } from './types'

// Cookie name for storing the currently-active account context
const ACTIVE_ACCOUNT_COOKIE = 'zzp-active-account'

// ============================================
// GET TEAM MEMBERS (as owner)
// ============================================

export async function getTeamMembers(): Promise<TeamMember[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('team_members')
    .select('*')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false })

  if (error || !data) return []

  return data.map((row) => ({
    id: row.id,
    owner_id: row.owner_id,
    member_email: row.member_email,
    member_user_id: row.member_user_id,
    role: row.role as TeamRole,
    permissions: (row.permissions ?? { factuur: true, uren: false, belasting: true, portal: false }) as TeamPermissions,
    status: row.status as TeamMember['status'],
    invited_at: row.invited_at,
    accepted_at: row.accepted_at,
    created_at: row.created_at,
  }))
}

// ============================================
// INVITE TEAM MEMBER
// ============================================

export async function inviteTeamMember(
  email: string,
  role: TeamRole,
  permissions: TeamPermissions
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Niet ingelogd' }

  // Cannot invite yourself
  if (email.toLowerCase() === user.email?.toLowerCase()) {
    return { success: false, error: 'Je kunt jezelf niet uitnodigen' }
  }

  // Check if the invited email is already a registered user
  // We query profiles by email to find member_user_id (if exists)
  let memberUserId: string | null = null
  const { data: existingProfiles } = await supabase
    .from('profiles')
    .select('id, email')
    .eq('email', email.toLowerCase())
    .limit(1)

  if (existingProfiles && existingProfiles.length > 0) {
    memberUserId = existingProfiles[0].id
  }

  const { error } = await supabase
    .from('team_members')
    .insert({
      owner_id: user.id,
      member_email: email.toLowerCase(),
      member_user_id: memberUserId,
      role,
      permissions,
      status: 'uitgenodigd',
      invited_at: new Date().toISOString(),
    })

  if (error) {
    if (error.code === '23505') {
      return { success: false, error: 'Dit e-mailadres is al uitgenodigd' }
    }
    return { success: false, error: `Uitnodiging mislukt: ${error.message}` }
  }

  return { success: true }
}

// ============================================
// REMOVE TEAM MEMBER
// ============================================

export async function removeTeamMember(id: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Niet ingelogd' }

  const { error } = await supabase
    .from('team_members')
    .delete()
    .eq('id', id)
    .eq('owner_id', user.id)

  if (error) {
    return { success: false, error: `Verwijderen mislukt: ${error.message}` }
  }

  return { success: true }
}

// ============================================
// UPDATE MEMBER ROLE / PERMISSIONS
// ============================================

export async function updateMemberRole(
  id: string,
  role: TeamRole,
  permissions: TeamPermissions
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Niet ingelogd' }

  const { error } = await supabase
    .from('team_members')
    .update({ role, permissions })
    .eq('id', id)
    .eq('owner_id', user.id)

  if (error) {
    return { success: false, error: `Bijwerken mislukt: ${error.message}` }
  }

  return { success: true }
}

// ============================================
// GET MY TEAM ACCESS (as member)
// Which accounts do I have access to?
// ============================================

export async function getMyTeamAccess(): Promise<TeamAccess[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  // Get all team memberships for the current user
  const { data: memberships, error } = await supabase
    .from('team_members')
    .select('*')
    .eq('member_user_id', user.id)
    .in('status', ['actief', 'uitgenodigd'])
    .order('created_at', { ascending: false })

  if (error || !memberships || memberships.length === 0) return []

  // Get owner profile info for each membership
  const ownerIds = [...new Set(memberships.map((m) => m.owner_id))]
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, company_name, email')
    .in('id', ownerIds)

  const profileMap = new Map(
    (profiles || []).map((p) => [p.id, { company_name: p.company_name, email: p.email }])
  )

  return memberships.map((m) => {
    const ownerProfile = profileMap.get(m.owner_id)
    return {
      id: m.id,
      owner_id: m.owner_id,
      role: m.role as TeamRole,
      permissions: (m.permissions ?? { factuur: true, uren: false, belasting: true, portal: false }) as TeamPermissions,
      status: m.status as TeamMember['status'],
      owner_company_name: ownerProfile?.company_name ?? null,
      owner_email: ownerProfile?.email ?? null,
    }
  })
}

// ============================================
// ACCEPT INVITATION
// ============================================

export async function acceptInvitation(teamMemberId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Niet ingelogd' }

  // Verify the invitation exists and is for this user
  const { data: member, error: fetchError } = await supabase
    .from('team_members')
    .select('*')
    .eq('id', teamMemberId)
    .single()

  if (fetchError || !member) {
    return { success: false, error: 'Uitnodiging niet gevonden' }
  }

  // Check if the invitation email matches the current user's email
  if (member.member_email !== user.email?.toLowerCase()) {
    return { success: false, error: 'Deze uitnodiging is niet voor jou' }
  }

  if (member.status === 'actief') {
    return { success: false, error: 'Uitnodiging is al geaccepteerd' }
  }

  if (member.status === 'geblokkeerd') {
    return { success: false, error: 'Je toegang is geblokkeerd' }
  }

  const { error } = await supabase
    .from('team_members')
    .update({
      status: 'actief',
      member_user_id: user.id,
      accepted_at: new Date().toISOString(),
    })
    .eq('id', teamMemberId)

  if (error) {
    return { success: false, error: `Accepteren mislukt: ${error.message}` }
  }

  return { success: true }
}

// ============================================
// SWITCH ACCOUNT CONTEXT
// ============================================

export async function switchAccount(ownerUserId: string | null): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Niet ingelogd' }

  const cookieStore = await cookies()

  // If null, switch back to own account
  if (!ownerUserId || ownerUserId === user.id) {
    cookieStore.set(ACTIVE_ACCOUNT_COOKIE, '', { maxAge: 0, path: '/' })
    return { success: true }
  }

  // Verify the user has an active team membership for this owner
  const { data: membership, error } = await supabase
    .from('team_members')
    .select('id, status')
    .eq('owner_id', ownerUserId)
    .eq('member_user_id', user.id)
    .eq('status', 'actief')
    .single()

  if (error || !membership) {
    return { success: false, error: 'Geen toegang tot dit account' }
  }

  cookieStore.set(ACTIVE_ACCOUNT_COOKIE, ownerUserId, {
    maxAge: 60 * 60 * 24, // 24 hours
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
  })

  return { success: true }
}

// ============================================
// GET ACTIVE ACCOUNT
// Returns the currently active account owner ID
// (either the logged-in user or the switched-to owner)
// ============================================

export async function getActiveAccount(): Promise<{
  userId: string
  isOwnAccount: boolean
  ownerCompanyName: string | null
} | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const cookieStore = await cookies()
  const activeAccountId = cookieStore.get(ACTIVE_ACCOUNT_COOKIE)?.value

  if (!activeAccountId || activeAccountId === user.id) {
    // Own account
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_name')
      .eq('id', user.id)
      .single()

    return {
      userId: user.id,
      isOwnAccount: true,
      ownerCompanyName: profile?.company_name ?? null,
    }
  }

  // Verify the membership is still active
  const { data: membership } = await supabase
    .from('team_members')
    .select('id')
    .eq('owner_id', activeAccountId)
    .eq('member_user_id', user.id)
    .eq('status', 'actief')
    .single()

  if (!membership) {
    // Membership no longer active, clear cookie
    cookieStore.set(ACTIVE_ACCOUNT_COOKIE, '', { maxAge: 0, path: '/' })
    return {
      userId: user.id,
      isOwnAccount: true,
      ownerCompanyName: null,
    }
  }

  // Get owner's profile info
  const { data: ownerProfile } = await supabase
    .from('profiles')
    .select('company_name')
    .eq('id', activeAccountId)
    .single()

  return {
    userId: activeAccountId,
    isOwnAccount: false,
    ownerCompanyName: ownerProfile?.company_name ?? null,
  }
}

// ============================================
// GET PENDING INVITATIONS FOR CURRENT USER
// ============================================

export async function getPendingInvitations(): Promise<TeamAccess[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data: memberships, error } = await supabase
    .from('team_members')
    .select('*')
    .eq('member_email', user.email?.toLowerCase())
    .eq('status', 'uitgenodigd')
    .order('invited_at', { ascending: false })

  if (error || !memberships || memberships.length === 0) return []

  const ownerIds = [...new Set(memberships.map((m) => m.owner_id))]
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, company_name, email')
    .in('id', ownerIds)

  const profileMap = new Map(
    (profiles || []).map((p) => [p.id, { company_name: p.company_name, email: p.email }])
  )

  return memberships.map((m) => {
    const ownerProfile = profileMap.get(m.owner_id)
    return {
      id: m.id,
      owner_id: m.owner_id,
      role: m.role as TeamRole,
      permissions: (m.permissions ?? { factuur: true, uren: false, belasting: true, portal: false }) as TeamPermissions,
      status: m.status as TeamMember['status'],
      owner_company_name: ownerProfile?.company_name ?? null,
      owner_email: ownerProfile?.email ?? null,
    }
  })
}
