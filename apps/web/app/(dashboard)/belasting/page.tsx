'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getExpenses, calculateQuarterSummary } from '@/lib/belasting/actions'
import type { Expense } from '@/lib/belasting/types'
import { Euro, FileText, Receipt, TrendingUp, CalendarClock, Loader2 } from 'lucide-react'
import { KORBanner } from '@/components/belasting/kor-banner'
import { BTWDeadlineWidget } from '@/components/belasting/btw-deadline-widget'
import { checkKOReligibility } from '@/lib/belasting/kor-check'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts'

// Colors for pie chart
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#6b7280']

export default function DashboardPage() {
  const currentYear = new Date().getFullYear()
  const currentQuarter = Math.ceil((new Date().getMonth() + 1) / 3)

  const [loading, setLoading] = useState(true)
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [summary, setSummary] = useState({ totalExcl: '0.00', totalBTW: '0.00', totalIncl: '0.00', count: 0 })

  useEffect(() => {
    async function loadData() {
      try {
        const [expensesData, summaryData] = await Promise.all([
          getExpenses(currentYear),
          calculateQuarterSummary(currentYear, currentQuarter),
        ])
        setExpenses(expensesData)
        setSummary(summaryData)
      } catch (error) {
        console.error('Error loading dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [currentYear, currentQuarter])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  const btwAmount = parseFloat(summary.totalBTW)

  // Calculate expenses by category for pie chart
  const quarterExpenses = expenses.filter(
    (e) => e.year === currentYear && e.quarter === currentQuarter
  )

  const categoryData = quarterExpenses
    .reduce((acc, expense) => {
      const existing = acc.find((item) => item.name === expense.category)
      if (existing) {
        existing.value += expense.amount_incl
      } else {
        acc.push({
          name: expense.category,
          value: expense.amount_incl,
        })
      }
      return acc
    }, [] as { name: string; value: number }[])
    .sort((a, b) => b.value - a.value)

  // Calculate monthly trend (last 6 months)
  const monthlyData = []
  for (let i = 5; i >= 0; i--) {
    const date = new Date()
    date.setMonth(date.getMonth() - i)
    const month = date.getMonth() + 1
    const year = date.getFullYear()

    const monthExpenses = expenses.filter((e) => {
      const expenseDate = new Date(e.date)
      return expenseDate.getMonth() + 1 === month && expenseDate.getFullYear() === year
    })

    const total = monthExpenses.reduce((sum, e) => sum + e.amount_incl, 0)

    monthlyData.push({
      month: date.toLocaleDateString('nl-NL', { month: 'short' }),
      amount: Math.round(total * 100) / 100,
    })
  }

  // BTW liability gauge calculation
  // Typical quarterly BTW liability threshold for small businesses: ~€2000
  const btwTarget = 2000
  const btwPercentage = Math.min((btwAmount / btwTarget) * 100, 100)

  // Calculate yearly expenses for KOR check
  const yearlyExpenses = expenses
    .filter((e) => e.year === currentYear)
    .reduce((sum, e) => sum + e.amount_incl, 0)

  const korStatus = checkKOReligibility(yearlyExpenses)

  // Calculate recurring expenses forecast for next month
  const recurringExpenses = expenses.filter((e) => e.is_recurring)
  const nextMonthForecast = recurringExpenses
    .filter((e) => e.recurring_frequency === 'monthly')
    .reduce((sum, e) => sum + e.amount_incl, 0)

  return (<>

      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Overzicht van Q{currentQuarter} {currentYear}
          </p>
        </div>

        {/* KOR Banner */}
        <KORBanner korStatus={korStatus} />

        {/* BTW Deadline & Recurring Expenses Row */}
        <div className="grid gap-4 md:grid-cols-2">
          <BTWDeadlineWidget />

          {/* Recurring Expenses Forecast */}
          {nextMonthForecast > 0 && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Verwachte kosten volgende maand
                </CardTitle>
                <CalendarClock className="h-4 w-4 text-gray-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  € {nextMonthForecast.toFixed(2)}
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  {recurringExpenses.filter(e => e.recurring_frequency === 'monthly').length} terugkerende uitgaven
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Gebaseerd op maandelijkse abonnementen
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Key Metrics */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Totaal uitgaven dit kwartaal
              </CardTitle>
              <Receipt className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">€ {summary.totalExcl}</div>
              <p className="text-xs text-gray-600 mt-1">
                excl. BTW
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                BTW te betalen
              </CardTitle>
              <Euro className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">€ {summary.totalBTW}</div>
              <p className="text-xs text-gray-600 mt-1">
                Dit kwartaal
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Aantal boekingen
              </CardTitle>
              <FileText className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.count}</div>
              <p className="text-xs text-gray-600 mt-1">
                Dit kwartaal
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* BTW Liability Gauge */}
          <Card>
            <CardHeader>
              <CardTitle>BTW-verplichting dit kwartaal</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-6">
                <div className="relative w-48 h-48">
                  <svg className="transform -rotate-90 w-48 h-48">
                    <circle
                      cx="96"
                      cy="96"
                      r="88"
                      stroke="#e5e7eb"
                      strokeWidth="12"
                      fill="none"
                    />
                    <circle
                      cx="96"
                      cy="96"
                      r="88"
                      stroke={btwPercentage > 80 ? '#ef4444' : btwPercentage > 50 ? '#f59e0b' : '#3b82f6'}
                      strokeWidth="12"
                      fill="none"
                      strokeDasharray={`${(btwPercentage / 100) * 552.64} 552.64`}
                      strokeLinecap="round"
                      className="transition-all duration-500"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="text-3xl font-bold text-gray-900">€ {btwAmount.toFixed(0)}</div>
                    <div className="text-sm text-gray-600 mt-1">{Math.round(btwPercentage)}% van doel</div>
                  </div>
                </div>
                <div className="text-center mt-4">
                  <p className="text-sm text-gray-600">
                    Streefbedrag: € {btwTarget.toFixed(0)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {btwAmount > btwTarget
                      ? 'Doel bereikt!'
                      : `Nog € ${(btwTarget - btwAmount).toFixed(2)} te gaan`}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Category Pie Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Uitgaven per categorie</CardTitle>
            </CardHeader>
            <CardContent>
              {categoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => `€ ${(Number(value) || 0).toFixed(2)}`}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-64 text-gray-500">
                  Nog geen uitgaven dit kwartaal
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Monthly Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Maandelijkse trend (laatste 6 maanden)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip
                  formatter={(value) => [`€ ${(Number(value) || 0).toFixed(2)}`, 'Uitgaven']}
                  labelStyle={{ color: '#111827' }}
                />
                <Line
                  type="monotone"
                  dataKey="amount"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Summary Card */}
        <Card>
          <CardHeader>
            <CardTitle>Kwartaaloverzicht</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Aantal uitgaven:</span>
                <span className="font-medium">{summary.count}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Totaal excl. BTW:</span>
                <span className="font-medium">€ {summary.totalExcl}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">BTW bedrag:</span>
                <span className="font-medium text-blue-600">€ {summary.totalBTW}</span>
              </div>
              <div className="flex justify-between text-sm border-t pt-3">
                <span className="text-gray-900 font-medium">Totaal incl. BTW:</span>
                <span className="font-bold text-lg">€ {summary.totalIncl}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

  </>
  )
}
