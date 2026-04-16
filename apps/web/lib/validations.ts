import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Ongeldig e-mailadres'),
  password: z.string().min(6, 'Wachtwoord moet minimaal 6 karakters bevatten'),
})

export const signupSchema = z.object({
  email: z.string().email('Ongeldig e-mailadres'),
  password: z.string().min(6, 'Wachtwoord moet minimaal 6 karakters bevatten'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Wachtwoorden komen niet overeen',
  path: ['confirmPassword'],
})

export const profileSchema = z.object({
  company_name: z.string().min(1, 'Bedrijfsnaam is verplicht'),
  btw_number: z.string().regex(/^NL\d{9}B\d{2}$/, 'Ongeldig BTW-nummer (formaat: NL123456789B01)').optional().or(z.literal('')),
  kvk_number: z.string().regex(/^\d{8}$/, 'Ongeldig KvK-nummer (8 cijfers)').optional().or(z.literal('')),
  iban: z.string().regex(/^[A-Z]{2}\d{2}[A-Z0-9]{1,30}$/, 'Ongeldig IBAN').optional().or(z.literal('')),
})

export const expenseSchema = z.object({
  description: z.string().min(1, 'Omschrijving is verplicht'),
  amount_excl: z.number().positive('Bedrag moet positief zijn').multipleOf(0.01, 'Bedrag mag maximaal 2 decimalen hebben'),
  btw_rate: z.enum(['0', '9', '21'], { message: 'BTW-tarief is verplicht' }),
  category: z.enum([
    'Kantoor',
    'Reizen',
    'Software',
    'Telefoon/Internet',
    'Verzekeringen',
    'Overig',
  ], { message: 'Categorie is verplicht' }),
  date: z.string().min(1, 'Datum is verplicht'),
})

export type LoginFormValues = z.infer<typeof loginSchema>
export type SignupFormValues = z.infer<typeof signupSchema>
export type ProfileFormValues = z.infer<typeof profileSchema>
export type ExpenseFormValues = z.infer<typeof expenseSchema>
