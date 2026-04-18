import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get('q')
  if (!query || query.trim().length < 2) {
    return NextResponse.json({ products: [] })
  }

  // Пробуем несколько endpoints OFF по очереди
  const endpoints = [
    `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=15&fields=product_name,nutriments,brands`,
    `https://world.openfoodfacts.net/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=15&fields=product_name,nutriments,brands`,
  ]

  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'CalorieTracker/1.0 (contact: support@calorie-tracker.app)',
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(8000),
      })

      if (!res.ok) continue

      const data = await res.json()

      const products = (data.products ?? [])
        .filter((p: Record<string, unknown>) => {
          const n = p.nutriments as Record<string, number> | undefined
          return p.product_name && n?.['energy-kcal_100g'] != null
        })
        .map((p: Record<string, unknown>) => {
          const n = p.nutriments as Record<string, number>
          const brand = p.brands ? ` (${String(p.brands).split(',')[0].trim()})` : ''
          return {
            name: `${p.product_name}${brand}`,
            calories: Math.round(n['energy-kcal_100g'] ?? 0),
            protein:  Math.round((n['proteins_100g'] ?? 0) * 10) / 10,
            fat:      Math.round((n['fat_100g'] ?? 0) * 10) / 10,
            carbs:    Math.round((n['carbohydrates_100g'] ?? 0) * 10) / 10,
          }
        })

      return NextResponse.json({ products })
    } catch {
      continue
    }
  }

  return NextResponse.json({ products: [], unavailable: true })
}
