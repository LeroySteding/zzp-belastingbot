'use client'

import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { ProtectedLayout } from '@/components/layout/protected-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { profileSchema, type ProfileFormValues } from '@/lib/validations'
import { mockProfile } from '@/lib/mock-data'

export default function SettingsPage() {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      company_name: mockProfile.company_name || '',
      btw_number: mockProfile.btw_number || '',
      kvk_number: mockProfile.kvk_number || '',
      iban: mockProfile.iban || '',
    },
  })

  const onSubmit = async (data: ProfileFormValues) => {
    setLoading(true)
    setSuccess(false)

    try {
      // In a real app, this would update in Supabase
      await new Promise((resolve) => setTimeout(resolve, 500))
      console.log('Profile data:', data)
      setSuccess(true)
      
      setTimeout(() => setSuccess(false), 3000)
    } catch (error) {
      console.error('Error updating profile:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <ProtectedLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Instellingen</h1>
          <p className="text-gray-600 mt-2">
            Beheer je bedrijfsprofiel en instellingen
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Bedrijfsgegevens</CardTitle>
            <CardDescription>
              Update je bedrijfsinformatie voor facturen en rapporten
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {success && (
                <div className="p-3 text-sm text-green-600 bg-green-50 rounded-md">
                  Gegevens succesvol opgeslagen!
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="company_name">Bedrijfsnaam *</Label>
                <Input
                  id="company_name"
                  placeholder="Mijn ZZP Bedrijf"
                  {...register('company_name')}
                />
                {errors.company_name && (
                  <p className="text-sm text-red-600">{errors.company_name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="btw_number">BTW-nummer</Label>
                <Input
                  id="btw_number"
                  placeholder="NL123456789B01"
                  {...register('btw_number')}
                />
                {errors.btw_number && (
                  <p className="text-sm text-red-600">{errors.btw_number.message}</p>
                )}
                <p className="text-xs text-gray-500">
                  Formaat: NL123456789B01
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="kvk_number">KvK-nummer</Label>
                <Input
                  id="kvk_number"
                  placeholder="12345678"
                  {...register('kvk_number')}
                />
                {errors.kvk_number && (
                  <p className="text-sm text-red-600">{errors.kvk_number.message}</p>
                )}
                <p className="text-xs text-gray-500">
                  8 cijfers
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="iban">IBAN</Label>
                <Input
                  id="iban"
                  placeholder="NL91ABNA0417164300"
                  {...register('iban')}
                />
                {errors.iban && (
                  <p className="text-sm text-red-600">{errors.iban.message}</p>
                )}
                <p className="text-xs text-gray-500">
                  Voor automatische incasso belastingdienst
                </p>
              </div>

              <div className="pt-4">
                <Button type="submit" disabled={loading}>
                  {loading ? 'Opslaan...' : 'Opslaan'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
            <CardDescription>
              Beheer je account instellingen
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label>E-mailadres</Label>
                <p className="text-sm text-gray-600 mt-1">
                  gebruiker@voorbeeld.nl
                </p>
              </div>
              <div className="pt-4 border-t">
                <Button variant="outline" className="text-red-600 hover:text-red-700">
                  Wachtwoord wijzigen
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </ProtectedLayout>
  )
}
