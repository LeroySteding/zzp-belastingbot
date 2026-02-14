import { z } from 'zod'

/**
 * Zod schemas for API validation
 */

// OCR Request
export const ocrRequestSchema = z.object({
  image: z.instanceof(File).refine(
    (file) => file.size <= 10 * 1024 * 1024, // 10MB
    'Afbeelding mag maximaal 10MB zijn'
  ).refine(
    (file) => ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'].includes(file.type),
    'Alleen JPG, PNG, WebP of PDF bestanden toegestaan'
  ),
})

// Expense schemas
export const createExpenseSchema = z.object({
  amount_incl: z.number().positive('Bedrag moet positief zijn').max(999999, 'Bedrag te hoog'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Datum moet formaat YYYY-MM-DD hebben'),
  vendor: z.string().min(1, 'Leverancier is verplicht').max(200, 'Leverancier te lang'),
  description: z.string().max(500, 'Omschrijving te lang').optional(),
  category: z.string().min(1, 'Categorie is verplicht'),
  btw_rate: z.enum(['0', '9', '21'], {
    message: 'BTW-tarief moet 0, 9 of 21 zijn',
  }),
})

export const updateExpenseSchema = createExpenseSchema.partial()

// Report schemas
export const createReportSchema = z.object({
  year: z.number().int().min(2000, 'Jaar moet na 2000 zijn').max(2100, 'Jaar te ver in toekomst'),
  quarter: z.number().int().min(1, 'Kwartaal moet tussen 1 en 4 zijn').max(4, 'Kwartaal moet tussen 1 en 4 zijn'),
})

// Category schemas
export const createCategorySchema = z.object({
  name: z.string().min(1, 'Naam is verplicht').max(100, 'Naam te lang'),
  description: z.string().max(500, 'Omschrijving te lang').optional(),
})

export const updateCategorySchema = createCategorySchema.partial()

// Types derived from schemas
export type CreateExpenseInput = z.infer<typeof createExpenseSchema>
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>
export type CreateReportInput = z.infer<typeof createReportSchema>
export type CreateCategoryInput = z.infer<typeof createCategorySchema>
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>
