'use client'

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { formatCurrency } from '@/lib/utils'

// Invoice Aging Pie Chart
interface InvoiceAgingData {
  label: string
  count: number
  total: number
  color: string
}

interface InvoiceAgingChartProps {
  data: InvoiceAgingData[]
}

export function InvoiceAgingChart({ data }: InvoiceAgingChartProps) {
  const filtered = data.filter(a => a.count > 0)
  return (
    <div className="h-48">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={filtered}
            dataKey="count"
            nameKey="label"
            cx="50%"
            cy="50%"
            outerRadius={70}
            innerRadius={40}
          >
            {filtered.map((entry, idx) => (
              <Cell key={idx} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value, name, props) => [
              `${value} facturen (${formatCurrency(props.payload.total)})`,
              name,
            ]}
            contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

// Expense Categories Pie Chart
interface ExpenseCategoryData {
  category: string
  amount: number
  percentage: number
}

interface ExpenseCategoriesChartProps {
  data: ExpenseCategoryData[]
  colors: string[]
}

export function ExpenseCategoriesChart({ data, colors }: ExpenseCategoriesChartProps) {
  return (
    <div className="h-48 w-48 shrink-0">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="amount"
            nameKey="category"
            cx="50%"
            cy="50%"
            outerRadius={70}
            innerRadius={35}
          >
            {data.map((_, idx) => (
              <Cell key={idx} fill={colors[idx % colors.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value) => formatCurrency(Number(value))}
            contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
