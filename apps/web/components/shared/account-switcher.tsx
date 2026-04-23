'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Building2, ChevronDown, UserCircle, ArrowLeftRight } from 'lucide-react'
import { getMyTeamAccess, getActiveAccount, switchAccount } from '@/lib/teams/actions'
import { ROLE_LABELS } from '@/lib/teams/types'
import type { TeamAccess } from '@/lib/teams/types'

export function AccountSwitcher() {
  const router = useRouter()
  const [accounts, setAccounts] = useState<TeamAccess[]>([])
  const [activeAccount, setActiveAccount] = useState<{
    userId: string
    isOwnAccount: boolean
    ownerCompanyName: string | null
  } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [access, active] = await Promise.all([
        getMyTeamAccess(),
        getActiveAccount(),
      ])
      // Only show active memberships in the switcher
      setAccounts(access.filter((a) => a.status === 'actief'))
      setActiveAccount(active)
      setLoading(false)
    }
    load()
  }, [])

  // Don't render anything if user has no team access
  if (loading || accounts.length === 0) return null

  const handleSwitch = async (ownerUserId: string | null) => {
    await switchAccount(ownerUserId)
    router.refresh()
  }

  const displayName = activeAccount?.isOwnAccount
    ? (activeAccount.ownerCompanyName || 'Mijn account')
    : (activeAccount?.ownerCompanyName || 'Ander account')

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-between gap-2 text-left h-auto py-2 px-3"
        >
          <div className="flex items-center gap-2 min-w-0">
            {activeAccount?.isOwnAccount ? (
              <UserCircle className="h-4 w-4 shrink-0" />
            ) : (
              <ArrowLeftRight className="h-4 w-4 shrink-0 text-orange-500" />
            )}
            <div className="min-w-0">
              <p className="text-xs truncate font-medium">{displayName}</p>
              {!activeAccount?.isOwnAccount && (
                <p className="text-[10px] text-orange-500 truncate">Bekijk ander account</p>
              )}
            </div>
          </div>
          <ChevronDown className="h-3 w-3 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[220px]">
        <DropdownMenuLabel>Account wisselen</DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* Own account */}
        <DropdownMenuItem
          onClick={() => handleSwitch(null)}
          className="flex items-center gap-2"
        >
          <UserCircle className="h-4 w-4" />
          <div className="min-w-0 flex-1">
            <p className="text-sm truncate">
              {activeAccount?.isOwnAccount
                ? activeAccount.ownerCompanyName || 'Mijn account'
                : 'Mijn account'}
            </p>
          </div>
          {activeAccount?.isOwnAccount && (
            <Badge variant="secondary" className="text-[10px] px-1">
              Actief
            </Badge>
          )}
        </DropdownMenuItem>

        {accounts.length > 0 && <DropdownMenuSeparator />}

        {/* Team accounts */}
        {accounts.map((access) => (
          <DropdownMenuItem
            key={access.id}
            onClick={() => handleSwitch(access.owner_id)}
            className="flex items-center gap-2"
          >
            <Building2 className="h-4 w-4" />
            <div className="min-w-0 flex-1">
              <p className="text-sm truncate">
                {access.owner_company_name || access.owner_email || 'Account'}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {ROLE_LABELS[access.role]}
              </p>
            </div>
            {!activeAccount?.isOwnAccount &&
              activeAccount?.userId === access.owner_id && (
                <Badge variant="secondary" className="text-[10px] px-1">
                  Actief
                </Badge>
              )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
