"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface DialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="fixed inset-0 bg-black/50" 
        onClick={() => onOpenChange(false)}
      />
      <div className="relative z-50">
        {children}
      </div>
    </div>
  )
}

export function DialogContent({ 
  children, 
  className 
}: { 
  children: React.ReactNode
  className?: string 
}) {
  return (
    <div className={cn(
      "bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto",
      className
    )}>
      {children}
    </div>
  )
}

export function DialogHeader({ 
  children, 
  className 
}: { 
  children: React.ReactNode
  className?: string 
}) {
  return (
    <div className={cn("p-6 pb-4", className)}>
      {children}
    </div>
  )
}

export function DialogTitle({ 
  children, 
  className 
}: { 
  children: React.ReactNode
  className?: string 
}) {
  return (
    <h2 className={cn("text-xl font-semibold", className)}>
      {children}
    </h2>
  )
}

export function DialogDescription({
  children,
  className
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <p className={cn("text-sm text-gray-600 mt-2", className)}>
      {children}
    </p>
  )
}

export function DialogTrigger({
  children,
  asChild,
  ...props
}: {
  children: React.ReactNode
  asChild?: boolean
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button {...props}>
      {children}
    </button>
  )
}

export function DialogFooter({
  children,
  className
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("flex justify-end gap-2 p-6 pt-4", className)}>
      {children}
    </div>
  )
}
