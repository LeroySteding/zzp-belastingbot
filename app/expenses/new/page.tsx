'use client'

import { useState } from 'react'
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
import { ReceiptUpload } from '@/components/receipt-upload'
import { expenseSchema, type ExpenseFormValues } from '@/lib/validations'
import { EXPENSE_CATEGORIES, BTW_RATES } from '@/lib/types'
import { ArrowLeft, Sparkles } from 'lucide-react'
import Link from 'next/link'
import type { OCRResult } from '@/app/api/ocr/route'

export default function NewExpensePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [ocrLoading, setOcrLoading] = useState(false)
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [ocrSuggestions, setOcrSuggestions] = useState<OCRResult['data'] | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
    },
  })

  const category = watch('category')
  const btwRate = watch('btw_rate')

  const handleReceiptUpload = async (file: File) => {
    setReceiptFile(file)
    setOcrLoading(true)
    setOcrSuggestions(null)

    try {
      const formData = new FormData()
      formData.append('image', file)

      const response = await fetch('/api/ocr', {
        method: 'POST',
        body: formData,
      })

      const result: OCRResult = await response.json()

      if (result.success && result.data) {
        setOcrSuggestions(result.data)

        // Auto-fill form fields with OCR results
        if (result.data.amount) {
          // Assume amount is including BTW, calculate excl
          const btwRateNum = result.data.btwRate ? parseInt(result.data.btwRate) : 21
          const amountExcl = result.data.amount / (1 + btwRateNum / 100)
          setValue('amount_excl', Math.round(amountExcl * 100) / 100)
        }

        if (result.data.date) {
          setValue('date', result.data.date)
        }

        if (result.data.vendor) {
          setValue('description', result.data.vendor)
        }

        if (result.data.btwRate) {
          setValue('btw_rate', result.data.btwRate)
        }

        if (result.data.category) {
          setValue('category', result.data.category as ExpenseFormValues['category'])
        }
      }
    } catch (error) {
      console.error('OCR error:', error)
    } finally {
      setOcrLoading(false)
    }
  }

  const handleClearReceipt = () => {
    setReceiptFile(null)
    setOcrSuggestions(null)
  }

  const onSubmit = async (data: ExpenseFormValues) => {
    setLoading(true)

    try {
      // TODO: Upload receipt to Supabase Storage
      // TODO: Save expense to Supabase database
      
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500))
      console.log('Expense data:', data)
      console.log('Receipt file:', receiptFile)
      
      router.push('/expenses')
    } catch (error) {
      console.error('Error saving expense:', error)
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
            <h1 className="text-3xl font-bold text-gray-900">Nieuwe uitgave</h1>
            <p className="text-gray-600 mt-2">Voeg een nieuwe uitgave toe</p>
          </div>
        </div>

        {/* Receipt Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-blue-600" />
              Bon uploaden (optioneel)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ReceiptUpload
              onUpload={handleReceiptUpload}
              onClear={handleClearReceipt}
              loading={ocrLoading}
            />
            {ocrSuggestions && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm font-medium text-blue-900">
                  ✨ Gegevens automatisch ingevuld
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  Controleer de gegevens en pas indien nodig aan
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Expense Form */}
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
                <Button type="submit" disabled={loading || ocrLoading}>
                  {loading ? 'Opslaan...' : 'Opslaan'}
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
