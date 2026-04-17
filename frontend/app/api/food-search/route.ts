import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get('q')
  if (!query || query.trim().length < 2) {
    return NextResponse.json({ products: [] })
  }

  try {
    const url = new URL('https://world.openfoodfacts.org/cgi/search.pl')
    url.searchParams.set('search_terms', query)
    url.searchParams.set('search_simple', '1')
    url.searchParams.set('action', 'process')
    url.searchParams.set('json', '1')
    url.searchParams.set('page_size', '15')
    url.searchParams.set('fields', 'product_name,nutriments,brands,countries_tags')

    const res = await fetch(url.toString(), {
      headers: { 'User-Agent': 'CalorieTracker/1.0 (educational project)' },
      signal: AbortSignal.timeout(6000),
    })

    if (!res.ok) return NextResponse.json({ products: [], unavailable: true })

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
    return NextResponse.json({ products: [], unavailable: true })
  }
}
