/** Numeric / decimal / dimension / packaging / quantity normalization. */
export function parseDecimal(value: unknown, decimalSeparator: ',' | '.' = '.'): number | null {
  if (value == null || value === '') return null
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  let s = String(value).trim().replace(/\s/g, '')
  if (decimalSeparator === ',') s = s.replace(/\./g, '').replace(',', '.')
  else s = s.replace(/,/g, '')
  const n = Number(s)
  return Number.isFinite(n) ? n : null
}
export function normalizeQuantity(value: unknown): number | null {
  const n = parseDecimal(value)
  return n == null ? null : Math.round(n)
}
/** Extracts a numeric magnitude from a dimension/packaging string (e.g. "12,5 mm"). */
export function normalizeDimension(value: unknown, decimalSeparator: ',' | '.' = '.'): number | null {
  if (value == null) return null
  const m = String(value).match(/-?\d+[.,]?\d*/)
  return m ? parseDecimal(m[0], decimalSeparator) : null
}
export function normalizePackaging(value: unknown): string | null {
  if (value == null) return null
  return String(value).replace(/\s+/g, ' ').trim() || null
}
