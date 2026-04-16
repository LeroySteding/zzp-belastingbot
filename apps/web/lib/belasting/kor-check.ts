/**
 * KOR (Kleineondernemersregeling) Check Utility
 * KOR allows small businesses with <€20,000 revenue/year to opt out of BTW
 */

export interface KORStatus {
  eligible: boolean
  currentRevenue: number
  threshold: number
  remainingCapacity: number
  percentageUsed: number
  recommendation: string
}

/**
 * Check if user qualifies for KOR based on yearly revenue
 * Note: In real app, this would need actual revenue data
 * For now, we estimate from expenses (rough approximation)
 */
export function checkKOReligibility(
  yearlyExpenses: number,
  threshold: number = 20000
): KORStatus {
  // Very rough estimation: revenue ≈ expenses * 1.5 (assuming 33% margin)
  // In production, this should use actual revenue/invoice data
  const estimatedRevenue = yearlyExpenses * 1.5
  
  const eligible = estimatedRevenue < threshold
  const remainingCapacity = Math.max(0, threshold - estimatedRevenue)
  const percentageUsed = (estimatedRevenue / threshold) * 100
  
  let recommendation = ''
  
  if (eligible) {
    if (percentageUsed < 50) {
      recommendation = 'Je komt waarschijnlijk in aanmerking voor de KOR. Dit kan je BTW-administratie aanzienlijk vereenvoudigen.'
    } else if (percentageUsed < 80) {
      recommendation = 'Je komt mogelijk in aanmerking voor de KOR, maar je zit al wel boven de 50%. Monitor je omzet zorgvuldig.'
    } else {
      recommendation = 'Je komt technisch in aanmerking voor de KOR, maar je zit dicht bij de grens. Wees voorzichtig met je omzet.'
    }
  } else {
    recommendation = `Je omzet ligt boven de KOR-grens van €${threshold.toLocaleString('nl-NL')}. De KOR is niet van toepassing.`
  }
  
  return {
    eligible,
    currentRevenue: Math.round(estimatedRevenue),
    threshold,
    remainingCapacity: Math.round(remainingCapacity),
    percentageUsed: Math.round(percentageUsed * 10) / 10,
    recommendation,
  }
}

/**
 * Get KOR benefits explanation
 */
export function getKORBenefits(): string[] {
  return [
    '✅ Geen BTW aangifte nodig',
    '✅ Eenvoudigere administratie',
    '✅ Geen BTW-nummer verplicht',
    '✅ Minder tijdsinvestering',
    '⚠️ Let op: je mag dan geen BTW in aftrek brengen op je kosten',
    '⚠️ Je moet wel binnen de €20.000 omzet blijven',
  ]
}

/**
 * Get KOR requirements
 */
export function getKORRequirements(): string[] {
  return [
    'Jaaromzet moet onder €20.000 blijven',
    'Je moet de keuze maken bij de Belastingdienst',
    'De keuze geldt voor minimaal 3 jaar',
    'Je mag geen BTW in rekening brengen aan klanten',
    'Je mag geen BTW terugvragen op je inkopen',
  ]
}
