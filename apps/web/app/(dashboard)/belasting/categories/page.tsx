'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tag, TrendingUp, AlertCircle } from 'lucide-react'
import { formatEuro } from '@/lib/belasting/btw-calculations'
import { EXPENSE_CATEGORIES } from '@/lib/types/index'

interface CategoryStats {
  name: string
  count: number
  totalExcl: number
  totalBtw: number
  totalIncl: number
  avgAmount: number
}

interface OverallStats {
  totalExpenses: number
  totalExcl: number
  totalBtw: number
  totalIncl: number
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<CategoryStats[]>([])
  const [overall, setOverall] = useState<OverallStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchCategoryStats()
  }, [])

  async function fetchCategoryStats() {
    try {
      setLoading(true)
      const response = await fetch('/api/categories')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Fout bij ophalen categorie statistieken')
      }

      setCategories(data.categories || [])
      setOverall(data.overall || null)
    } catch (err) {
      console.error('Error fetching category stats:', err)
      setError(err instanceof Error ? err.message : 'Onbekende fout')
    } finally {
      setLoading(false)
    }
  }

  function getCategoryIcon(category: string) {
    const icons: Record<string, string> = {
      Kantoor: '🏢',
      Reizen: '✈️',
      Software: '💻',
      'Telefoon/Internet': '📱',
      Verzekeringen: '🛡️',
      Overig: '📦',
    }
    return icons[category] || '📦'
  }

  function getPercentage(amount: number) {
    if (!overall || overall.totalIncl === 0) return '0%'
    return ((amount / overall.totalIncl) * 100).toFixed(1) + '%'
  }

  return (<>
    
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Categorieën</h1>
          <p className="text-muted-foreground mt-2">
            Overzicht van je uitgaven per categorie
          </p>
        </div>

        {error && (
          <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/30">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
                <div>
                  <h3 className="font-medium text-red-900 dark:text-red-200">Fout</h3>
                  <p className="text-sm text-red-700 dark:text-red-300 mt-1">{error}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Statistieken laden...</p>
          </div>
        ) : (
          <>
            {/* Overall Statistics */}
            {overall && overall.totalExpenses > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-sm text-muted-foreground">Totaal uitgaven</div>
                    <div className="text-2xl font-bold text-foreground mt-1">
                      {overall.totalExpenses}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-sm text-muted-foreground">Excl. BTW</div>
                    <div className="text-2xl font-bold text-foreground mt-1">
                      {formatEuro(overall.totalExcl)}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-sm text-muted-foreground">BTW</div>
                    <div className="text-2xl font-bold text-foreground mt-1">
                      {formatEuro(overall.totalBtw)}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-sm text-muted-foreground">Incl. BTW</div>
                    <div className="text-2xl font-bold text-foreground mt-1">
                      {formatEuro(overall.totalIncl)}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Category Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Uitgaven per categorie</CardTitle>
                <CardDescription>
                  Gedetailleerde breakdown van je zakelijke uitgaven
                </CardDescription>
              </CardHeader>
              <CardContent>
                {categories.length === 0 || overall?.totalExpenses === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Tag className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                    <p>Nog geen uitgaven geregistreerd</p>
                    <p className="text-sm mt-2">
                      Voeg uitgaven toe om statistieken per categorie te zien
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Categorie</TableHead>
                        <TableHead className="text-right">Aantal</TableHead>
                        <TableHead className="text-right">Excl. BTW</TableHead>
                        <TableHead className="text-right">BTW</TableHead>
                        <TableHead className="text-right">Incl. BTW</TableHead>
                        <TableHead className="text-right">Gemiddeld</TableHead>
                        <TableHead className="text-right">% van totaal</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {categories.map((category) => (
                        <TableRow key={category.name}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <span className="text-xl">
                                {getCategoryIcon(category.name)}
                              </span>
                              {category.name}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            {category.count}
                          </TableCell>
                          <TableCell className="text-right">
                            {category.count > 0
                              ? formatEuro(category.totalExcl)
                              : '-'}
                          </TableCell>
                          <TableCell className="text-right">
                            {category.count > 0
                              ? formatEuro(category.totalBtw)
                              : '-'}
                          </TableCell>
                          <TableCell className="text-right">
                            {category.count > 0
                              ? formatEuro(category.totalIncl)
                              : '-'}
                          </TableCell>
                          <TableCell className="text-right">
                            {category.count > 0
                              ? formatEuro(category.avgAmount)
                              : '-'}
                          </TableCell>
                          <TableCell className="text-right">
                            {category.count > 0 ? (
                              <div className="flex items-center justify-end gap-2">
                                <div className="w-24 bg-muted rounded-full h-2">
                                  <div
                                    className="bg-blue-600 h-2 rounded-full"
                                    style={{
                                      width: getPercentage(category.totalIncl),
                                    }}
                                  ></div>
                                </div>
                                <span className="text-sm font-medium w-12">
                                  {getPercentage(category.totalIncl)}
                                </span>
                              </div>
                            ) : (
                              '-'
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            {/* Available Categories Info */}
            <Card className="bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-900 dark:text-blue-200">
                  <Tag className="h-5 w-5" />
                  Beschikbare categorieën
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-blue-700 dark:text-blue-300 mb-4">
                  Je kunt je uitgaven indelen in de volgende categorieën:
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {EXPENSE_CATEGORIES.map((category) => (
                    <div
                      key={category}
                      className="flex items-center gap-2 bg-card rounded-lg p-3 border border-blue-200 dark:border-blue-800"
                    >
                      <span className="text-xl">{getCategoryIcon(category)}</span>
                      <span className="text-sm font-medium text-foreground">
                        {category}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-4">
                  💡 Tip: Gebruik consistente categorieën voor betere rapportage en
                  analyse van je zakelijke uitgaven.
                </p>
              </CardContent>
            </Card>

            {/* Top Categories Card */}
            {overall && overall.totalExpenses > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Top 3 categorieën
                  </CardTitle>
                  <CardDescription>Meeste uitgaven afgelopen periode</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {categories
                      .filter((cat) => cat.count > 0)
                      .slice(0, 3)
                      .map((category, index) => (
                        <div
                          key={category.name}
                          className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`flex items-center justify-center w-10 h-10 rounded-full ${
                                index === 0
                                  ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                                  : index === 1
                                  ? 'bg-muted text-foreground'
                                  : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                              }`}
                            >
                              <span className="text-xl font-bold">#{index + 1}</span>
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-lg">
                                  {getCategoryIcon(category.name)}
                                </span>
                                <span className="font-semibold text-foreground">
                                  {category.name}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {category.count} uitgaven
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-lg text-foreground">
                              {formatEuro(category.totalIncl)}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {getPercentage(category.totalIncl)} van totaal
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    
  </>
  )
}