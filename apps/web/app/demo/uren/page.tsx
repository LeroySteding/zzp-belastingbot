'use client'

import { useState } from 'react'
import { Clock, Play, Pause, Square, Plus, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DEMO_DATA } from '@/lib/demo/data'
import { useDemoToast } from '../layout'

export default function DemoUrenPage() {
  const { showDemoToast } = useDemoToast()
  const { timeEntries } = DEMO_DATA
  const [timerRunning, setTimerRunning] = useState(false)
  const [timerSeconds, setTimerSeconds] = useState(0)

  const totalHoursThisWeek = timeEntries.reduce((sum, e) => sum + e.hours, 0)
  const uniqueDays = [...new Set(timeEntries.map(e => e.date))].length

  const handleTimerToggle = () => {
    if (!timerRunning) {
      setTimerRunning(true)
      showDemoToast('Timer gestart! In de echte app wordt je tijd bijgehouden.')
    } else {
      setTimerRunning(false)
      showDemoToast('Timer gestopt. In de echte app wordt je tijd opgeslagen.')
    }
  }

  const formatTimer = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  // Group by date
  const grouped = timeEntries.reduce((acc, entry) => {
    if (!acc[entry.date]) acc[entry.date] = []
    acc[entry.date].push(entry)
    return acc
  }, {} as Record<string, typeof timeEntries>)

  return (
    <div className="animate-fade-in space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Urenregistratie</h1>
          <p className="text-muted-foreground mt-1">Registreer en beheer je werkuren</p>
        </div>
        <Button className="gap-2" onClick={() => showDemoToast()}>
          <Plus className="h-4 w-4" />
          Handmatig invoeren
        </Button>
      </div>

      {/* Timer */}
      <div className="card-premium p-6">
        <h2 className="text-lg font-semibold mb-4">Timer</h2>
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="text-center">
            <p className="text-5xl font-mono font-bold tracking-wider">
              {formatTimer(timerSeconds)}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              {timerRunning ? 'Timer loopt...' : 'Klaar om te starten'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="lg"
              onClick={handleTimerToggle}
              className="gap-2"
              variant={timerRunning ? 'destructive' : 'default'}
            >
              {timerRunning ? (
                <>
                  <Pause className="h-5 w-5" />
                  Pauzeren
                </>
              ) : (
                <>
                  <Play className="h-5 w-5" />
                  Start Timer
                </>
              )}
            </Button>
            {timerRunning && (
              <Button
                size="lg"
                variant="outline"
                onClick={() => {
                  setTimerRunning(false)
                  setTimerSeconds(0)
                  showDemoToast()
                }}
                className="gap-2"
              >
                <Square className="h-4 w-4" />
                Stop
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card-premium p-5">
          <p className="text-sm text-muted-foreground">Uren deze week</p>
          <p className="text-2xl font-bold mt-1">{totalHoursThisWeek}u</p>
        </div>
        <div className="card-premium p-5">
          <p className="text-sm text-muted-foreground">Werkdagen</p>
          <p className="text-2xl font-bold mt-1">{uniqueDays} dagen</p>
        </div>
        <div className="card-premium p-5">
          <p className="text-sm text-muted-foreground">Gemiddeld per dag</p>
          <p className="text-2xl font-bold mt-1">{(totalHoursThisWeek / uniqueDays).toFixed(1)}u</p>
        </div>
      </div>

      {/* Time entries by date */}
      <div className="space-y-6">
        {Object.entries(grouped).map(([date, entries]) => {
          const dayTotal = entries.reduce((sum, e) => sum + e.hours, 0)
          const dateObj = new Date(date)
          const dayName = dateObj.toLocaleDateString('nl-NL', { weekday: 'long' })
          const dateFormatted = dateObj.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long' })

          return (
            <div key={date} className="card-premium overflow-hidden">
              <div className="px-6 py-3 bg-secondary/30 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium capitalize">{dayName}</span>
                  <span className="text-sm text-muted-foreground">{dateFormatted}</span>
                </div>
                <span className="text-sm font-medium">{dayTotal}u</span>
              </div>
              <div className="divide-y divide-border/50">
                {entries.map((entry, i) => (
                  <button
                    key={i}
                    onClick={() => showDemoToast()}
                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-secondary/20 transition-colors text-left"
                  >
                    <div>
                      <p className="text-sm font-medium">{entry.project}</p>
                      <p className="text-sm text-muted-foreground">{entry.description}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-4">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{entry.hours}u</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
