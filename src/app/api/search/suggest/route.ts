import config from '@payload-config'
import { getPayload } from 'payload'

import { getSearchService } from '@/services/search'

/**
 * Instant-search suggestions for the SmartSearch overlay.
 * GET /api/search/suggest?q=rockwool%20100&locale=ro
 * Engine-agnostic: delegates to the configured SearchService.
 */
export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url)
  const q = url.searchParams.get('q') ?? ''
  const locale = url.searchParams.get('locale') === 'ru' ? 'ru' : 'ro'

  try {
    const payload = await getPayload({ config })
    const groups = await getSearchService(payload).instant(q, locale)
    return Response.json(groups, {
      headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=120' },
    })
  } catch (error) {
    console.error('suggest failed', error)
    return Response.json(
      { term: q, products: [], brands: [], categories: [] },
      { status: 500 },
    )
  }
}
