'use client'

import { useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { ProtectedLayout } from '@/components/layout/protected-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { expenseSchema, type ExpenseFormValues } from '@/lib/validations'
import { EXPENSE_CATEGORIES, BTW_RATES } from '@/lib/types'
import { mockExpenses } from '@/lib/mock-data'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function EditExpensePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  // Find the expense (in a real app, this would fetch from Supabase)
  const expense = mockExpenses.find((e) => e.id === id)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: expense
      ? {
          description: expense.description,
          amount_excl: expense.amount_excl,
          btw_rate: expense.btw_rate.toString() as '0' | '9' | '21',
          category: expense.category,
          date: expense.date,
        }
      : undefined,
  })

  const category = watch('category')
  const btwRate = watch('btw_rate')

  if (!expense) {
    return (
      <ProtectedLayout>
        <div className="text-center py-12">
          <p className="text-gray-600">Uitgave niet gevonden</p>
          <Link href="/expenses">
            <Button className="mt-4">Terug naar uitgaven</Button>
          </Link>
        </div>
      </ProtectedLayout>
    )
  }

  const onSubmit = async (data: ExpenseFormValues) => {
    setLoading(true)

    try {
      // In a real app, this would update in Supabase
      await new Promise((resolve) => setTimeout(resolve, 500))
      console.log('Updated expense data:', data)
      router.push('/expenses')
    } catch (error) {
      console.error('Error updating expense:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <ProtectedLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/expenses">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Terug
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Uitgave bewerken</h1>
            <p className="text-gray-600 mt-2">Wijzig de uitgave gegevens</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Uitgave details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="description">Omschrijving *</Label>
                <Input
                  id="description"
                  placeholder="Bijv. Kantoorbenodigdheden"
                  {...register('description')}
                />
                {errors.description && (
                  <p className="text-sm text-red-600">{errors.description.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amount_excl">Bedrag (excl. BTW) *</Label>
                  <Input
                    id="amount_excl"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    {...register('amount_excl', { valueAsNumber: true })}
                  />
                  {errors.amount_excl && (
                    <p className="text-sm text-red-600">{errors.amount_excl.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="btw_rate">BTW-tarief *</Label>
                  <Select
                    value={btwRate}
                    onValueChange={(value) => setValue('btw_rate', value as '0' | '9' | '21')}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecteer BTW-tarief" />
                    </SelectTrigger>
                    <SelectContent>
                      {BTW_RATES.map((rate) => (
                        <SelectItem key={rate} value={rate.toString()}>
                          {rate}%
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.btw_rate && (
                    <p className="text-sm text-red-600">{errors.btw_rate.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Categorie *</Label>
                  <Select
                    value={category}
                    onValueChange={(value) => setValue('category', value as ExpenseFormValues['category'])}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecteer categorie" />
                    </SelectTrigger>
                    <SelectContent>
                      {EXPENSE_CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.category && (
                    <p className="text-sm text-red-600">{errors.category.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date">Datum *</Label>
                  <Input id="date" type="date" {...register('date')} />
                  {errors.date && (
                    <p className="text-sm text-red-600">{errors.date.message}</p>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" disabled={loading}>
                  {loading ? 'Opslaan...' : 'Wijzigingen opslaan'}
                </Button>
                <Link href="/expenses">
                  <Button type="button" variant="outline">
                    Annuleren
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </ProtectedLayout>
  )
}
