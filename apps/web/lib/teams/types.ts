export type TeamRole = 'boekhouder' | 'medewerker' | 'readonly'

export type TeamStatus = 'uitgenodigd' | 'actief' | 'geblokkeerd'

export interface TeamPermissions {
  factuur: boolean
  uren: boolean
  belasting: boolean
  portal: boolean
}

export interface TeamMember {
  id: string
  owner_id: string
  member_email: string
  member_user_id: string | null
  role: TeamRole
  permissions: TeamPermissions
  status: TeamStatus
  invited_at: string
  accepted_at: string | null
  created_at: string
}

export interface TeamAccess {
  id: string
  owner_id: string
  role: TeamRole
  permissions: TeamPermissions
  status: TeamStatus
  owner_company_name: string | null
  owner_email: string | null
}

export const ROLE_LABELS: Record<TeamRole, string> = {
  boekhouder: 'Boekhouder',
  medewerker: 'Medewerker',
  readonly: 'Alleen lezen',
}

export const PERMISSION_LABELS: Record<keyof TeamPermissions, string> = {
  factuur: 'Factuur',
  uren: 'Uren',
  belasting: 'Belasting',
  portal: 'Portal',
}

export const DEFAULT_PERMISSIONS: Record<TeamRole, TeamPermissions> = {
  boekhouder: { factuur: true, uren: false, belasting: true, portal: false },
  medewerker: { factuur: true, uren: true, belasting: false, portal: false },
  readonly: { factuur: true, uren: true, belasting: true, portal: true },
}
