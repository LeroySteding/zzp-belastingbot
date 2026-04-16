'use client'

import { Component, ReactNode } from 'react'
import { AlertCircle } from 'lucide-react'
import { Button } from './button'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-6 text-center">
          <AlertCircle className="h-12 w-12 text-destructive mb-4" />
          <h2 className="text-2xl font-bold mb-2">Er is iets misgegaan</h2>
          <p className="text-muted-foreground mb-6 max-w-md">
            {this.state.error?.message || 'We konden deze pagina niet laden. Probeer het opnieuw.'}
          </p>
          <div className="flex gap-3">
            <Button
              onClick={() => this.setState({ hasError: false })}
              variant="outline"
            >
              Probeer opnieuw
            </Button>
            <Button
              onClick={() => window.location.href = '/dashboard'}
            >
              Ga naar Dashboard
            </Button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
