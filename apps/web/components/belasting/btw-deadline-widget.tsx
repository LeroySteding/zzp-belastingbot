'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, AlertCircle } from 'lucide-react'
import { getNextBTWDeadline } from '@/lib/belasting/btw-deadlines'

export function BTWDeadlineWidget() {
  const deadline = getNextBTWDeadline()
  
  const urgencyColor = {
    green: 'bg-green-100 text-green-800 border-green-200',
    orange: 'bg-orange-100 text-orange-800 border-orange-200',
    red: 'bg-red-100 text-red-800 border-red-200',
  }[deadline.urgency]

  const urgencyIcon = deadline.urgency === 'red'

  return (
    <Card className={`border-l-4 ${
      deadline.urgency === 'green' 
        ? 'border-l-green-500' 
        : deadline.urgency === 'orange'
          ? 'border-l-orange-500'
          : 'border-l-red-500'
    }`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          {urgencyIcon && <AlertCircle className="h-4 w-4 text-red-500" />}
          BTW Aangifte Deadline
        </CardTitle>
        <Calendar className="h-4 w-4 text-gray-600" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div>
            <div className="text-2xl font-bold">
              {deadline.daysRemaining} {deadline.daysRemaining === 1 ? 'dag' : 'dagen'}
            </div>
            <p className="text-xs text-gray-600 mt-1">
              Q{deadline.quarter} {deadline.year}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={urgencyColor}>
              {deadline.label}
            </Badge>
          </div>

          {deadline.urgency === 'red' && (
            <p className="text-xs text-red-600 font-medium">
              ⚠️ Deadline is zeer dichtbij!
            </p>
          )}
          {deadline.urgency === 'orange' && (
            <p className="text-xs text-orange-600">
              Let op: deadline nadert
            </p>
          )}
          {deadline.urgency === 'green' && (
            <p className="text-xs text-green-600">
              Voldoende tijd tot de deadline
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
