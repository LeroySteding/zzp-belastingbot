'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  ArrowLeft,
  Loader2,
  UserPlus,
  Trash2,
  Pencil,
  Mail,
  Shield,
  Eye,
  Users,
  CheckCircle,
  Clock,
  Ban,
} from 'lucide-react'
import {
  getTeamMembers,
  inviteTeamMember,
  removeTeamMember,
  updateMemberRole,
  getPendingInvitations,
  acceptInvitation,
} from '@/lib/teams/actions'
import {
  ROLE_LABELS,
  PERMISSION_LABELS,
  DEFAULT_PERMISSIONS,
} from '@/lib/teams/types'
import type {
  TeamMember,
  TeamAccess,
  TeamRole,
  TeamPermissions,
} from '@/lib/teams/types'

function StatusBadge({ status }: { status: TeamMember['status'] }) {
  switch (status) {
    case 'actief':
      return (
        <Badge variant="default" className="bg-green-600">
          <CheckCircle className="h-3 w-3 mr-1" />
          Actief
        </Badge>
      )
    case 'uitgenodigd':
      return (
        <Badge variant="secondary">
          <Clock className="h-3 w-3 mr-1" />
          Uitgenodigd
        </Badge>
      )
    case 'geblokkeerd':
      return (
        <Badge variant="destructive">
          <Ban className="h-3 w-3 mr-1" />
          Geblokkeerd
        </Badge>
      )
  }
}

function RoleBadge({ role }: { role: TeamRole }) {
  const icons = {
    boekhouder: <Shield className="h-3 w-3 mr-1" />,
    medewerker: <Users className="h-3 w-3 mr-1" />,
    readonly: <Eye className="h-3 w-3 mr-1" />,
  }
  return (
    <Badge variant="outline">
      {icons[role]}
      {ROLE_LABELS[role]}
    </Badge>
  )
}

function PermissionTags({ permissions }: { permissions: TeamPermissions }) {
  const active = (Object.keys(permissions) as (keyof TeamPermissions)[]).filter(
    (key) => permissions[key]
  )
  if (active.length === 0) return <span className="text-muted-foreground text-xs">Geen</span>
  return (
    <div className="flex flex-wrap gap-1">
      {active.map((key) => (
        <Badge key={key} variant="secondary" className="text-xs">
          {PERMISSION_LABELS[key]}
        </Badge>
      ))}
    </div>
  )
}

export default function TeamSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [members, setMembers] = useState<TeamMember[]>([])
  const [pendingInvites, setPendingInvites] = useState<TeamAccess[]>([])
  const [showInviteDialog, setShowInviteDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Invite form state
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<TeamRole>('boekhouder')
  const [invitePermissions, setInvitePermissions] = useState<TeamPermissions>(
    DEFAULT_PERMISSIONS.boekhouder
  )

  // Edit form state
  const [editRole, setEditRole] = useState<TeamRole>('boekhouder')
  const [editPermissions, setEditPermissions] = useState<TeamPermissions>(
    DEFAULT_PERMISSIONS.boekhouder
  )

  const loadData = async () => {
    setLoading(true)
    const [teamMembers, invites] = await Promise.all([
      getTeamMembers(),
      getPendingInvitations(),
    ])
    setMembers(teamMembers)
    setPendingInvites(invites)
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleRoleChange = (
    role: TeamRole,
    setRole: (r: TeamRole) => void,
    setPerms: (p: TeamPermissions) => void
  ) => {
    setRole(role)
    setPerms(DEFAULT_PERMISSIONS[role])
  }

  const handleInvite = async () => {
    setSaving(true)
    setError(null)
    const result = await inviteTeamMember(inviteEmail, inviteRole, invitePermissions)
    setSaving(false)

    if (result.success) {
      setSuccess('Uitnodiging verstuurd!')
      setShowInviteDialog(false)
      setInviteEmail('')
      setInviteRole('boekhouder')
      setInvitePermissions(DEFAULT_PERMISSIONS.boekhouder)
      loadData()
      setTimeout(() => setSuccess(null), 3000)
    } else {
      setError(result.error || 'Er ging iets mis')
    }
  }

  const handleRemove = async (id: string) => {
    if (!confirm('Weet je zeker dat je dit teamlid wilt verwijderen?')) return
    const result = await removeTeamMember(id)
    if (result.success) {
      setSuccess('Teamlid verwijderd')
      loadData()
      setTimeout(() => setSuccess(null), 3000)
    } else {
      setError(result.error || 'Verwijderen mislukt')
      setTimeout(() => setError(null), 3000)
    }
  }

  const handleEditOpen = (member: TeamMember) => {
    setEditingMember(member)
    setEditRole(member.role)
    setEditPermissions({ ...member.permissions })
    setShowEditDialog(true)
  }

  const handleEditSave = async () => {
    if (!editingMember) return
    setSaving(true)
    setError(null)
    const result = await updateMemberRole(editingMember.id, editRole, editPermissions)
    setSaving(false)

    if (result.success) {
      setSuccess('Rol en rechten bijgewerkt')
      setShowEditDialog(false)
      setEditingMember(null)
      loadData()
      setTimeout(() => setSuccess(null), 3000)
    } else {
      setError(result.error || 'Bijwerken mislukt')
    }
  }

  const handleAcceptInvite = async (inviteId: string) => {
    const result = await acceptInvitation(inviteId)
    if (result.success) {
      setSuccess('Uitnodiging geaccepteerd!')
      loadData()
      setTimeout(() => setSuccess(null), 3000)
    } else {
      setError(result.error || 'Accepteren mislukt')
      setTimeout(() => setError(null), 3000)
    }
  }

  if (loading) {
    return (
      <div className="animate-fade-in flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Team laden...</span>
      </div>
    )
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/settings">
          <Button variant="outline" size="icon" aria-label="Terug naar instellingen">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Team beheer</h1>
          <p className="text-muted-foreground mt-1">
            Nodig boekhouders, medewerkers of andere teamleden uit om toegang te krijgen tot je administratie
          </p>
        </div>
        <Button onClick={() => setShowInviteDialog(true)} className="gap-2">
          <UserPlus className="h-4 w-4" />
          Uitnodigen
        </Button>
      </div>

      {success && (
        <div className="p-3 text-sm text-green-600 bg-green-50 rounded-md">
          {success}
        </div>
      )}

      {error && (
        <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
          {error}
        </div>
      )}

      {/* Pending invitations for the current user */}
      {pendingInvites.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Openstaande uitnodigingen voor jou
            </CardTitle>
            <CardDescription>
              Je bent uitgenodigd om toegang te krijgen tot de volgende accounts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingInvites.map((invite) => (
                <div
                  key={invite.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-blue-50/50"
                >
                  <div>
                    <p className="font-medium">
                      {invite.owner_company_name || invite.owner_email || 'Onbekend account'}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <RoleBadge role={invite.role} />
                      <PermissionTags permissions={invite.permissions} />
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleAcceptInvite(invite.id)}
                    className="gap-2"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Accepteren
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Team members list */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Teamleden</CardTitle>
          <CardDescription>
            Mensen die toegang hebben tot jouw administratie
          </CardDescription>
        </CardHeader>
        <CardContent>
          {members.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-10 w-10 mx-auto mb-3 opacity-50" />
              <p>Nog geen teamleden uitgenodigd</p>
              <p className="text-sm mt-1">Klik op &quot;Uitnodigen&quot; om je eerste teamlid toe te voegen</p>
            </div>
          ) : (
            <div className="space-y-3">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-4 rounded-lg border"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{member.member_email}</p>
                      <StatusBadge status={member.status} />
                    </div>
                    <div className="flex items-center gap-2">
                      <RoleBadge role={member.role} />
                      <PermissionTags permissions={member.permissions} />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Uitgenodigd op {new Date(member.invited_at).toLocaleDateString('nl-NL')}
                      {member.accepted_at && (
                        <> &middot; Geaccepteerd op {new Date(member.accepted_at).toLocaleDateString('nl-NL')}</>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleEditOpen(member)}
                      aria-label="Bewerken"
                    >
                      <Pencil className="h-4 w-4" aria-hidden="true" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleRemove(member.id)}
                      aria-label="Verwijderen"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invite Dialog */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Teamlid uitnodigen</DialogTitle>
            <DialogDescription>
              Nodig een boekhouder, medewerker of andere gebruiker uit om toegang te krijgen tot je administratie.
            </DialogDescription>
          </DialogHeader>
          <div className="p-6 pt-0 space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="inviteEmail">E-mailadres</Label>
              <Input
                id="inviteEmail"
                type="email"
                placeholder="boekhouder@voorbeeld.nl"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Rol</Label>
              <Select
                value={inviteRole}
                onValueChange={(val) =>
                  handleRoleChange(
                    val as TeamRole,
                    setInviteRole,
                    setInvitePermissions
                  )
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="boekhouder">Boekhouder</SelectItem>
                  <SelectItem value="medewerker">Medewerker</SelectItem>
                  <SelectItem value="readonly">Alleen lezen</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {inviteRole === 'boekhouder' &&
                  'Leestoegang tot facturen en belasting, kan rapporten genereren'}
                {inviteRole === 'medewerker' &&
                  'Kan facturen aanmaken, uren bijhouden en klanten beheren'}
                {inviteRole === 'readonly' &&
                  'Alleen-lezen toegang tot geselecteerde modules'}
              </p>
            </div>
            <div className="space-y-3">
              <Label>Modulerechten</Label>
              {(Object.keys(PERMISSION_LABELS) as (keyof TeamPermissions)[]).map(
                (key) => (
                  <div
                    key={key}
                    className="flex items-center justify-between py-1"
                  >
                    <Label htmlFor={`perm-${key}`} className="font-normal cursor-pointer">
                      {PERMISSION_LABELS[key]}
                    </Label>
                    <Switch
                      id={`perm-${key}`}
                      checked={invitePermissions[key]}
                      onCheckedChange={(checked) =>
                        setInvitePermissions((prev) => ({
                          ...prev,
                          [key]: checked,
                        }))
                      }
                    />
                  </div>
                )
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInviteDialog(false)}>
              Annuleren
            </Button>
            <Button
              onClick={handleInvite}
              disabled={saving || !inviteEmail}
              className="gap-2"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Uitnodigen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rol en rechten bewerken</DialogTitle>
            <DialogDescription>
              Pas de rol en modulerechten aan voor {editingMember?.member_email}
            </DialogDescription>
          </DialogHeader>
          <div className="p-6 pt-0 space-y-4">
            <div className="space-y-2">
              <Label>Rol</Label>
              <Select
                value={editRole}
                onValueChange={(val) =>
                  handleRoleChange(
                    val as TeamRole,
                    setEditRole,
                    setEditPermissions
                  )
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="boekhouder">Boekhouder</SelectItem>
                  <SelectItem value="medewerker">Medewerker</SelectItem>
                  <SelectItem value="readonly">Alleen lezen</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-3">
              <Label>Modulerechten</Label>
              {(Object.keys(PERMISSION_LABELS) as (keyof TeamPermissions)[]).map(
                (key) => (
                  <div
                    key={key}
                    className="flex items-center justify-between py-1"
                  >
                    <Label htmlFor={`edit-perm-${key}`} className="font-normal cursor-pointer">
                      {PERMISSION_LABELS[key]}
                    </Label>
                    <Switch
                      id={`edit-perm-${key}`}
                      checked={editPermissions[key]}
                      onCheckedChange={(checked) =>
                        setEditPermissions((prev) => ({
                          ...prev,
                          [key]: checked,
                        }))
                      }
                    />
                  </div>
                )
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Annuleren
            </Button>
            <Button onClick={handleEditSave} disabled={saving} className="gap-2">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Opslaan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
