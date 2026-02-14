import { NextRequest, NextResponse } from 'next/server'
import vision from '@google-cloud/vision'
import { checkRateLimit } from '@/lib/rate-limit'

// Types for the OCR response
export interface OCRResult {
  success: boolean
  data?: {
    amount: number | null
    date: string | null
    vendor: string | null
    btwRate: '0' | '9' | '21' | null
    category: string | null
  }
  error?: string
  rawText?: string
}

// Initialize Google Cloud Vision client
// In production, use service account credentials
const getVisionClient = () => {
  const apiKey = process.env.GOOGLE_VISION_API_KEY
  
  if (!apiKey) {
    return null
  }

  // Use API key authentication
  return new vision.ImageAnnotatorClient({
    apiKey: apiKey,
  })
}

// Helper: Extract amount from text
function extractAmount(text: string): number | null {
  // Look for patterns like: €123.45, € 123,45, 123.45, EUR 123.45
  const patterns = [
    /(?:€|EUR|euro)\s*(\d+[.,]\d{2})/i,
    /totaal\s*:?\s*(?:€|EUR)?\s*(\d+[.,]\d{2})/i,
    /bedrag\s*:?\s*(?:€|EUR)?\s*(\d+[.,]\d{2})/i,
    /\btotal\s*:?\s*(?:€|EUR)?\s*(\d+[.,]\d{2})/i,
  ]

  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) {
      const amount = parseFloat(match[1].replace(',', '.'))
      if (!isNaN(amount) && amount > 0) {
        return amount
      }
    }
  }

  return null
}

// Helper: Extract date from text
function extractDate(text: string): string | null {
  // Look for date patterns: DD-MM-YYYY, DD/MM/YYYY, DD.MM.YYYY
  const patterns = [
    /(\d{1,2})[-.\/](\d{1,2})[-.\/](\d{4})/,
    /(\d{4})[-.\/](\d{1,2})[-.\/](\d{1,2})/,
  ]

  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) {
      const [, p1, p2, p3] = match
      
      // Try DD-MM-YYYY format
      if (parseInt(p1) <= 31 && parseInt(p2) <= 12) {
        const day = p1.padStart(2, '0')
        const month = p2.padStart(2, '0')
        const year = p3
        const date = new Date(`${year}-${month}-${day}`)
        if (!isNaN(date.getTime())) {
          return `${year}-${month}-${day}`
        }
      }
      
      // Try YYYY-MM-DD format
      if (parseInt(p2) <= 12 && parseInt(p3) <= 31) {
        const year = p1
        const month = p2.padStart(2, '0')
        const day = p3.padStart(2, '0')
        const date = new Date(`${year}-${month}-${day}`)
        if (!isNaN(date.getTime())) {
          return `${year}-${month}-${day}`
        }
      }
    }
  }

  return null
}

// Helper: Extract BTW rate from text
function extractBTWRate(text: string): '0' | '9' | '21' | null {
  const lowerText = text.toLowerCase()
  
  // Look for explicit BTW mentions
  if (/btw\s*21%|21%\s*btw|vat\s*21%/i.test(lowerText)) return '21'
  if (/btw\s*9%|9%\s*btw|vat\s*9%/i.test(lowerText)) return '9'
  if (/btw\s*0%|0%\s*btw|vat\s*0%|vrijgesteld|geen btw/i.test(lowerText)) return '0'
  
  // Default to 21% for most purchases in NL
  return '21'
}

// Helper: Suggest category based on vendor/text
function suggestCategory(text: string): string | null {
  const lowerText = text.toLowerCase()
  
  // Define keyword mapping
  const categoryKeywords: Record<string, string[]> = {
    'Kantoor': ['staples', 'officecentre', 'bureau', 'kantoor', 'office'],
    'Reizen': ['ns', 'train', 'trein', 'uber', 'taxi', 'hotel', 'booking', 'vliegtuig', 'flight'],
    'Software': ['adobe', 'microsoft', 'google', 'aws', 'software', 'saas', 'subscription', 'licentie'],
    'Telefoon/Internet': ['vodafone', 'kpn', 't-mobile', 'ziggo', 'telecom', 'internet', 'mobiel'],
    'Verzekeringen': ['verzekering', 'insurance', 'aon', 'allianz', 'polis'],
  }

  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some(keyword => lowerText.includes(keyword))) {
      return category
    }
  }

  return 'Overig'
}

// Helper: Extract vendor name
function extractVendor(text: string): string | null {
  // Take first meaningful line (usually company name)
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0)
  
  for (const line of lines.slice(0, 5)) {
    // Skip lines that look like addresses, dates, or amounts
    if (!/\d{4}|\d{1,2}[-.\/]\d{1,2}|€|\d+[.,]\d{2}|straat|laan|weg/i.test(line) && line.length < 50) {
      return line
    }
  }
  
  return null
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting by IP address
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const rateLimit = checkRateLimit(ip, 20, 60 * 1000) // 20 requests per minute

    if (!rateLimit.allowed) {
      const retryAfter = Math.ceil((rateLimit.resetAt - Date.now()) / 1000)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Te veel verzoeken. Probeer het over een minuut opnieuw.' 
        },
        { 
          status: 429,
          headers: {
            'Retry-After': retryAfter.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(rateLimit.resetAt).toISOString(),
          }
        }
      )
    }

    const formData = await request.formData()
    const file = formData.get('image') as File | null

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'Geen afbeelding geüpload' },
        { status: 400 }
      )
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: 'Afbeelding mag maximaal 10MB zijn' },
        { status: 400 }
      )
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Alleen JPG, PNG, WebP of PDF bestanden toegestaan' },
        { status: 400 }
      )
    }

    // Check if API key is configured
    const visionClient = getVisionClient()
    if (!visionClient) {
      return NextResponse.json({
        success: false,
        error: 'Google Vision API niet geconfigureerd. Gebruik handmatige invoer.',
      })
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Perform text detection
    const [result] = await visionClient.textDetection({
      image: { content: buffer },
    })

    const detections = result.textAnnotations
    if (!detections || detections.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Geen tekst gevonden op de bon. Gebruik handmatige invoer.',
      })
    }

    // Full text is in the first annotation
    const fullText = detections[0].description || ''

    // Extract structured data
    const amount = extractAmount(fullText)
    const date = extractDate(fullText)
    const vendor = extractVendor(fullText)
    const btwRate = extractBTWRate(fullText)
    const category = suggestCategory(fullText)

    const response = NextResponse.json({
      success: true,
      data: {
        amount,
        date,
        vendor,
        btwRate,
        category,
      },
      rawText: fullText,
    })

    // Add rate limit headers to successful response
    response.headers.set('X-RateLimit-Remaining', rateLimit.remaining.toString())
    response.headers.set('X-RateLimit-Reset', new Date(rateLimit.resetAt).toISOString())

    return response
  } catch (error) {
    console.error('OCR Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Fout bij het verwerken van de bon. Probeer handmatige invoer.',
      },
      { status: 500 }
    )
  }
}
