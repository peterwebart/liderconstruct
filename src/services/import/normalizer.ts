/**
 * Thin delegation to the Business Rules layer. No transformation logic lives in
 * the importer — these re-exports keep import-stage call sites stable while the
 * actual rules live in src/services/rules.
 */
export { aliasKey, normalizeProductName, normalizeText } from '../rules/text'
export { parseDecimal as parseNumber } from '../rules/numbers'
export { slugify } from '../rules/url'
export { resolveAlias, type AliasResolution } from '../rules/lookups'
