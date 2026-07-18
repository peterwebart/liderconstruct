/** Media rules — ARCHITECTURE ONLY (no implementation yet). Defines how future
 * image/PDF/technical-sheet imports will be matched and prioritised. */
export interface MediaRulesConfig {
  /** Filename pattern → SKU, e.g. "{sku}.{ext}" or "{sku}-{n}.{ext}". */
  filenamePattern: string
  /** Supplier folder convention to scan. */
  folderConvention: string
  /** Strategy for matching files to products/variations. */
  matchBy: Array<'sku' | 'filename' | 'manifest'>
  /** First gallery image becomes the primary image unless overridden. */
  firstIsPrimary: boolean
  /** PDF / technical-sheet matching strategy. */
  documentMatchBy: Array<'sku' | 'filename'>
  /** Output optimisation. */
  generateWebp: boolean
  thumbnailWidths: number[]
}
export const defaultMediaRules: MediaRulesConfig = {
  filenamePattern: '{sku}.{ext}',
  folderConvention: 'suppliers/{supplier}/images',
  matchBy: ['sku', 'filename', 'manifest'],
  firstIsPrimary: true,
  documentMatchBy: ['sku', 'filename'],
  generateWebp: true,
  thumbnailWidths: [300, 640, 1280],
}
export interface MediaMatch {
  sku: string
  files: string[]
  primary?: string
}
/** Future implementation: pair files to products/variations + optimise. */
export interface MediaMatcher {
  match(files: string[], config: MediaRulesConfig): MediaMatch[]
}
