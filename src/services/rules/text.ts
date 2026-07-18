/** Text normalization rules. */
export function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, ' ').trim()
}
export function normalizeText(value: unknown): string | null {
  if (value == null) return null
  const s = normalizeWhitespace(String(value))
  return s.length ? s : null
}
export function capitalizeFirst(value: string): string {
  return value.length ? value[0].toUpperCase() + value.slice(1) : value
}
/** Product name: collapse whitespace, fix ALL-CAPS words, keep brand casing. */
export function normalizeProductName(value: unknown): string | null {
  const s = normalizeText(value)
  if (!s) return null
  return s
    .split(' ')
    .map((w) => (w.length > 3 && w === w.toUpperCase() && /[A-ZĂÎȘȚÂ]/.test(w) ? capitalizeFirst(w.toLowerCase()) : w))
    .join(' ')
}
export function aliasKey(value: string): string {
  return value.trim().toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ')
}
