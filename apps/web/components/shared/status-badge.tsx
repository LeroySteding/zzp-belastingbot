import { cn } from '@/lib/utils'

type StatusVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral'

interface StatusBadgeProps {
  variant: StatusVariant
  children: React.ReactNode
  className?: string
  dot?: boolean
}

const variantStyles: Record<StatusVariant, string> = {
  success: 'bg-success/10 text-success border-success/20',
  warning: 'bg-warning/10 text-warning border-warning/20',
  error: 'bg-error/10 text-error border-error/20',
  info: 'bg-info/10 text-info border-info/20',
  neutral: 'bg-muted text-muted-foreground border-border',
}

const dotStyles: Record<StatusVariant, string> = {
  success: 'bg-success',
  warning: 'bg-warning',
  error: 'bg-error',
  info: 'bg-info',
  neutral: 'bg-muted-foreground',
}

export function StatusBadge({ variant, children, className, dot = false }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium border',
        variantStyles[variant],
        className
      )}
    >
      {dot && (
        <span 
          className={cn(
            'w-1.5 h-1.5 rounded-full',
            dotStyles[variant]
          )}
        />
      )}
      {children}
    </span>
  )
}

/* Predefined status badges for common use cases */

export function BetaaldBadge() {
  return <StatusBadge variant="success" dot>Betaald</StatusBadge>
}

export function OnbetaaldBadge() {
  return <StatusBadge variant="warning" dot>Onbetaald</StatusBadge>
}

export function VerlatenBadge() {
  return <StatusBadge variant="error" dot>Verlopen</StatusBadge>
}

export function ConceptBadge() {
  return <StatusBadge variant="neutral" dot>Concept</StatusBadge>
}

export function ActiefBadge() {
  return <StatusBadge variant="success" dot>Actief</StatusBadge>
}

export function InactiefBadge() {
  return <StatusBadge variant="neutral" dot>Inactief</StatusBadge>
}

export function GoedgekeurdBadge() {
  return <StatusBadge variant="success" dot>Goedgekeurd</StatusBadge>
}

export function InBehandelingBadge() {
  return <StatusBadge variant="info" dot>In behandeling</StatusBadge>
}

export function AfgekeurdBadge() {
  return <StatusBadge variant="error" dot>Afgekeurd</StatusBadge>
}
