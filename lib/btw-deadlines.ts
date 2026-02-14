/**
 * BTW Deadline Calculator for Dutch ZZP
 * Q1: 30 april, Q2: 31 juli, Q3: 31 oktober, Q4: 31 januari (next year)
 */

export interface BTWDeadline {
  quarter: number
  year: number
  deadline: Date
  daysRemaining: number
  urgency: 'green' | 'orange' | 'red'
  label: string
}

export function getNextBTWDeadline(referenceDate: Date = new Date()): BTWDeadline {
  const currentYear = referenceDate.getFullYear()

  // BTW deadlines (month is 0-indexed in Date constructor)
  const deadlines = [
    { quarter: 4, month: 0, day: 31, yearOffset: 0 }, // Q4 deadline is Jan 31
    { quarter: 1, month: 3, day: 30, yearOffset: 0 }, // Q1 deadline is April 30
    { quarter: 2, month: 6, day: 31, yearOffset: 0 }, // Q2 deadline is July 31
    { quarter: 3, month: 9, day: 31, yearOffset: 0 }, // Q3 deadline is October 31
  ]

  // Find next upcoming deadline
  let nextDeadline: Date | null = null
  let nextQuarter = 0
  let deadlineYear = currentYear

  for (const dl of deadlines) {
    let testYear = currentYear
    if (dl.quarter === 4) {
      // Q4 deadline is in January of next year
      testYear = currentYear + 1
    }
    
    const testDate = new Date(testYear, dl.month, dl.day, 23, 59, 59)
    
    if (testDate > referenceDate) {
      nextDeadline = testDate
      nextQuarter = dl.quarter
      deadlineYear = dl.quarter === 4 ? currentYear : testYear
      break
    }
  }

  // If no deadline found this year, wrap to Q4 next year
  if (!nextDeadline) {
    nextDeadline = new Date(currentYear + 1, 0, 31, 23, 59, 59)
    nextQuarter = 4
    deadlineYear = currentYear
  }

  const daysRemaining = Math.ceil((nextDeadline.getTime() - referenceDate.getTime()) / (1000 * 60 * 60 * 24))
  
  let urgency: 'green' | 'orange' | 'red'
  if (daysRemaining > 30) urgency = 'green'
  else if (daysRemaining > 7) urgency = 'orange'
  else urgency = 'red'

  const label = nextDeadline.toLocaleDateString('nl-NL', { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  })

  return {
    quarter: nextQuarter,
    year: deadlineYear,
    deadline: nextDeadline,
    daysRemaining,
    urgency,
    label,
  }
}

export function getAllUpcomingDeadlines(count: number = 4): BTWDeadline[] {
  const deadlines: BTWDeadline[] = []
  let currentDate = new Date()
  
  for (let i = 0; i < count; i++) {
    const deadline = getNextBTWDeadline(currentDate)
    deadlines.push(deadline)
    // Move to day after this deadline
    currentDate = new Date(deadline.deadline.getTime() + 24 * 60 * 60 * 1000)
  }
  
  return deadlines
}
