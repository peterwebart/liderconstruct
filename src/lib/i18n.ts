/**
 * i18n routing primitives (ADR-0009). RO is the default locale, RU the second.
 * URLs are per-locale under a /[locale] segment (/ro/…, /ru/…). This module is
 * the single source of truth for the locale set, validation, and building
 * locale-prefixed paths so call sites never hardcode the prefix.
 */

export const LOCALES = ['ro', 'ru'] as const
export type Locale = (typeof LOCALES)[number]
export const DEFAULT_LOCALE: Locale = 'ro'

/** Human labels for the switcher. */
export const LOCALE_LABELS: Record<Locale, string> = {
  ro: 'Română',
  ru: 'Русский',
}

/** hreflang codes per locale (with region for RO → Moldova). */
export const LOCALE_HREFLANG: Record<Locale, string> = {
  ro: 'ro-MD',
  ru: 'ru-MD',
}

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value)
}

/** Coerce anything to a valid locale, falling back to the default. */
export function toLocale(value: unknown): Locale {
  return isLocale(value) ? value : DEFAULT_LOCALE
}

/**
 * Build a locale-prefixed path. `path` is the locale-agnostic route
 * (e.g. "/brands", "/products/foo", or "" for the home page). Query strings
 * and hashes are preserved. Always returns a leading-slash path like
 * "/ro/brands".
 */
export function localePath(locale: Locale, path = '/'): string {
  const clean = path.startsWith('/') ? path : `/${path}`
  // Home: "/ro" not "/ro/"
  if (clean === '/') return `/${locale}`
  return `/${locale}${clean}`
}

/**
 * Strip a leading locale segment from a pathname, returning the
 * locale-agnostic remainder (e.g. "/ro/brands" -> "/brands", "/ru" -> "/").
 * Used by the language switcher to preserve the current page when switching.
 */
export function stripLocale(pathname: string): { locale: Locale; rest: string } {
  const parts = pathname.split('/')
  // parts[0] is "" for a leading slash
  const maybe = parts[1]
  if (isLocale(maybe)) {
    const rest = '/' + parts.slice(2).join('/')
    return { locale: maybe, rest: rest === '/' ? '/' : rest.replace(/\/$/, '') || '/' }
  }
  return { locale: DEFAULT_LOCALE, rest: pathname || '/' }
}
