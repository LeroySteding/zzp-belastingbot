'use client'

import { useState, useEffect } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { profileSchema, type ProfileFormValues } from '@/lib/validations'
import { getProfile, updateProfile } from '@/lib/belasting/actions'
import { getKORBenefits, getKORRequirements } from '@/lib/belasting/kor-check'
import { Loader2 } from 'lucide-react'

export default function SettingsPage() {
  const [pageLoading, setPageLoading] = useState(true)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [korEnabled, setKorEnabled] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      company_name: '',
      btw_number: '',
      kvk_number: '',
      iban: '',
    },
  })

  useEffect(() => {
    async function loadProfile() {
      try {
        const profile = await getProfile()
        if (profile) {
          reset({
            company_name: profile.company_name || '',
            btw_number: profile.btw_number || '',
            kvk_number: profile.kvk_number || '',
            iban: profile.iban || '',
          })
          setKorEnabled(profile.kor_enabled || false)
        }
      } catch (error) {
        console.error('Error loading profile:', error)
      } finally {
        setPageLoading(false)
      }
    }
    loadProfile()
  }, [reset])

  const onSubmit = async (data: ProfileFormValues) => {
    setLoading(true)
    setSuccess(false)

    try {
      const updated = await updateProfile({
        company_name: data.company_name,
        btw_number: data.btw_number || undefined,
        kvk_number: data.kvk_number || undefined,
        iban: data.iban || undefined,
        kor_enabled: korEnabled,
      })

      if (updated) {
        setSuccess(true)
        setTimeout(() => setSuccess(false), 3000)
      }
    } catch (error) {
      console.error('Error updating profile:', error)
    } finally {
      setLoading(false)
    }
  }

  if (pageLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (<>

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
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Opslaan...
                    </>
                  ) : (
                    'Opslaan'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Kleineondernemersregeling (KOR)</CardTitle>
            <CardDescription>
              Voor bedrijven met een jaaromzet onder €20.000
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="kor-enabled" className="text-base">
                    KOR ingeschakeld
                  </Label>
                  <p className="text-sm text-gray-500">
                    Schakel de KOR-modus in als je jaaromzet onder €20.000 blijft
                  </p>
                </div>
                <Switch
                  id="kor-enabled"
                  checked={korEnabled}
                  onCheckedChange={setKorEnabled}
                />
              </div>

              {korEnabled && (
                <div className="border-t pt-4 space-y-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">Voordelen</h4>
                    <ul className="space-y-1 text-sm text-blue-800">
                      {getKORBenefits().map((benefit, idx) => (
                        <li key={idx}>{benefit}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <h4 className="font-medium text-yellow-900 mb-2">Let op</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-yellow-800">
                      {getKORRequirements().map((req, idx) => (
                        <li key={idx}>{req}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
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

  </>
  )
}
