import { LucideIcon } from 'lucide-react'
import { ReactNode } from 'react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: ReactNode
  illustration?: ReactNode
}

export function EmptyState({ 
  icon: Icon, 
  title, 
  description, 
  action,
  illustration 
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center animate-fade-in">
      {illustration ? (
        <div className="mb-6">
          {illustration}
        </div>
      ) : (
        <div className="mb-6 rounded-full bg-muted p-6">
          <Icon className="h-12 w-12 text-muted-foreground" />
        </div>
      )}
      
      <h3 className="text-lg font-semibold text-foreground mb-2">
        {title}
      </h3>
      
      <p className="text-sm text-muted-foreground max-w-md mb-6">
        {description}
      </p>
      
      {action && (
        <div>
          {action}
        </div>
      )}
    </div>
  )
}

/* Illustration Components */
export function InvoiceIllustration() {
  return (
    <svg
      width="120"
      height="120"
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="text-muted-foreground"
    >
      <rect x="30" y="20" width="60" height="80" rx="4" stroke="currentColor" strokeWidth="2" fill="none" />
      <line x1="40" y1="35" x2="80" y2="35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="40" y1="45" x2="70" y2="45" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="40" y1="60" x2="80" y2="60" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="40" y1="70" x2="65" y2="70" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="85" cy="85" r="15" fill="currentColor" opacity="0.1" />
      <path d="M78 85l5 5 10-10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function TimeIllustration() {
  return (
    <svg
      width="120"
      height="120"
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="text-muted-foreground"
    >
      <circle cx="60" cy="60" r="30" stroke="currentColor" strokeWidth="2" fill="none" />
      <path d="M60 40v20l14 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="60" cy="60" r="3" fill="currentColor" />
    </svg>
  )
}

export function ClientIllustration() {
  return (
    <svg
      width="120"
      height="120"
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="text-muted-foreground"
    >
      <circle cx="60" cy="45" r="15" stroke="currentColor" strokeWidth="2" fill="none" />
      <path d="M35 90c0-13.807 11.193-25 25-25s25 11.193 25 25" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

export function ReceiptIllustration() {
  return (
    <svg
      width="120"
      height="120"
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="text-muted-foreground"
    >
      <path d="M40 20h40l-5 5 5 5-5 5 5 5-5 5 5 5-5 5 5 5-5 5 5 5-5 5H40l5-5-5-5 5-5-5-5 5-5-5-5 5-5-5-5 5-5-5-5z" stroke="currentColor" strokeWidth="2" fill="none" />
      <line x1="50" y1="35" x2="70" y2="35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="50" y1="45" x2="70" y2="45" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="50" y1="55" x2="70" y2="55" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="50" y1="70" x2="70" y2="70" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}
