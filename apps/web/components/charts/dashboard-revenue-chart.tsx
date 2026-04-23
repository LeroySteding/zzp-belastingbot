'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { formatCurrency } from '@/lib/utils'

interface RevenueChartProps {
  data: { month: string; income: number; expenses: number }[]
}

export default function DashboardRevenueChart({ data }: RevenueChartProps) {
  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis dataKey="month" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
          <Tooltip
            formatter={(value) => formatCurrency(Number(value))}
            labelStyle={{ fontWeight: 600 }}
            contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)' }}
          />
          <Bar dataKey="income" name="Omzet" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          <Bar dataKey="expenses" name="Kosten" fill="#ef4444" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
