/** URL + slug normalization. */
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
}
export function normalizeUrl(value: unknown): string | null {
  if (value == null) return null
  let s = String(value).trim()
  if (!s) return null
  if (/^www\./i.test(s)) s = `https://${s}`
  return s.replace(/\/+$/, '')
}
