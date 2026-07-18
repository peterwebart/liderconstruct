/**
 * Filter state ↔ URL search params. Filters live in the URL so results are
 * shareable, back-button friendly, and server-renderable.
 * Shape: ?brand=a,b&f_culoare=Alb&pmin=80&pmax=220&stoc=1&sort=price_asc&view=list
 */

export type SortKey = 'relevance' | 'price_asc' | 'price_desc' | 'newest'
export type ViewKey = 'grid' | 'list'

export interface FilterState {
  brands: string[]
  attrs: Record<string, string[]>
  priceMin: number | null
  priceMax: number | null
  inStockOnly: boolean
  sort: SortKey
  view: ViewKey
}

export const emptyFilters = (): FilterState => ({
  brands: [],
  attrs: {},
  priceMin: null,
  priceMax: null,
  inStockOnly: false,
  sort: 'relevance',
  view: 'grid',
})

const csv = (v: string | null): string[] =>
  (v ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

const num = (v: string | null): number | null => {
  if (v == null || v === '') return null
  const n = Number(v)
  return Number.isFinite(n) && n >= 0 ? n : null
}

export function parseFilters(params: URLSearchParams): FilterState {
  const state = emptyFilters()
  state.brands = csv(params.get('brand'))
  for (const [key, value] of params.entries()) {
    if (key.startsWith('f_')) {
      const attrKey = key.slice(2)
      const values = csv(value)
      if (attrKey && values.length) state.attrs[attrKey] = values
    }
  }
  state.priceMin = num(params.get('pmin'))
  state.priceMax = num(params.get('pmax'))
  state.inStockOnly = params.get('stoc') === '1'
  const sort = params.get('sort')
  if (sort === 'price_asc' || sort === 'price_desc' || sort === 'newest') state.sort = sort
  if (params.get('view') === 'list') state.view = 'list'
  return state
}

/** Serializes state, omitting defaults; preserves unrelated params (e.g. q). */
export function buildFilterParams(state: FilterState, base?: URLSearchParams): URLSearchParams {
  const params = new URLSearchParams()
  if (base) {
    for (const [k, v] of base.entries()) {
      if (k === 'brand' || k.startsWith('f_') || ['pmin', 'pmax', 'stoc', 'sort', 'view', 'page'].includes(k)) continue
      params.append(k, v)
    }
  }
  if (state.brands.length) params.set('brand', state.brands.join(','))
  for (const [key, values] of Object.entries(state.attrs)) {
    if (values.length) params.set(`f_${key}`, values.join(','))
  }
  if (state.priceMin != null) params.set('pmin', String(state.priceMin))
  if (state.priceMax != null) params.set('pmax', String(state.priceMax))
  if (state.inStockOnly) params.set('stoc', '1')
  if (state.sort !== 'relevance') params.set('sort', state.sort)
  if (state.view !== 'grid') params.set('view', state.view)
  return params
}

/** Number of active filter selections (sort/view excluded). */
export function countActiveFilters(state: FilterState): number {
  return (
    state.brands.length +
    Object.values(state.attrs).reduce((n, v) => n + v.length, 0) +
    (state.priceMin != null || state.priceMax != null ? 1 : 0) +
    (state.inStockOnly ? 1 : 0)
  )
}

/** Next.js page `searchParams` record → URLSearchParams (server-side parse). */
export function searchParamsToURLSearchParams(
  sp: Record<string, string | string[] | undefined>,
): URLSearchParams {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(sp)) {
    if (value == null) continue
    if (Array.isArray(value)) for (const v of value) params.append(key, v)
    else params.append(key, value)
  }
  return params
}
