# ADR-0017: Locale routing (/[locale] segment)

## Status
Accepted — 2026-07-18 (implements the routing half of ADR-0009)

## Context
ADR-0009 committed to per-locale URLs with hreflang, RO default + RU. The
storefront shipped RO-only on flat routes with locale hardcoded; the language
switcher was a disabled stub. The data layer already threaded a `locale`
param everywhere, so only routing and plumbing were missing.

## Decision
Introduce a `/[locale]` dynamic segment for the storefront.

- **Routing:** all storefront pages moved under
  `src/app/(frontend)/[locale]/`. `src/app/(frontend)/layout.tsx` is now a
  pass-through; the real `<html lang>` shell + chrome live in
  `[locale]/layout.tsx`, which validates the segment (`notFound()` on unknown
  locales), sets `lang`/OpenGraph/hreflang per locale, and
  `generateStaticParams` pre-renders both.
- **Middleware** (`src/middleware.ts`) redirects un-prefixed paths to the
  default locale, preserving path + query, and skips `/admin`, `/api`,
  `/_next`, files, `sitemap.xml`, `robots.txt`.
- **i18n primitives** (`src/lib/i18n.ts`): `LOCALES`, `DEFAULT_LOCALE`,
  `isLocale`/`toLocale`, `localePath(locale, path)`, `stripLocale(pathname)` —
  single source of truth, unit-tested (14 cases).
- **Locale-aware links:** `LocaleLink` (`as Link`) wraps `next/link`, reading
  the active locale from `useParams` and prefixing internal hrefs, so call
  sites keep locale-agnostic paths. Applied across chrome (Header, Footer,
  MegaMenu, MobileNav, QuoteCart, HomeHero) and catalog cards/listing
  (ProductCard, ProductRow, BrandCard, CategoryCard, Pagination,
  RelatedProducts, BuyPanel, CatalogListing). Client `router.push` sites
  (HomeHero, SmartSearch) prefix via `localePath`. Filter components use
  `pathname` (already locale-prefixed) and needed no change.
- **Switcher** now switches the locale segment while preserving the current
  page (`stripLocale` + `localePath`); both locales live.
- **Sitemap** emits every URL per locale with hreflang alternates.

Pages read `params.locale` (coerced via `toLocale`) and pass it to the data
layer; every page's `params` type gained `locale`.

## Consequences
- URLs are `/ro/…` and `/ru/…`; hreflang tells search engines about both.
- RU renders structurally today; RU *content* fills in via localized fields +
  AI enrichment (ADR-0009) — no schema or routing change needed.
- New pages must live under `[locale]` and read the param; new internal links
  should use `LocaleLink` (or `localePath` for client nav) rather than raw
  `next/link`.

## Follow-ups (next increments)
- Translate remaining hardcoded RO UI microcopy (breadcrumb "Acasă", section
  headings, empty states, quote flow) via a lightweight per-locale string map.
- Verify RU end-to-end in a browser once content lands.

## Verification (2026-07-18)
`tsc` + `eslint` clean after the full migration. i18n helpers 14/14 unit
tests. Route tree confirmed: all storefront pages under `[locale]`; sitemap +
robots correctly locale-agnostic at the (frontend) root. Full browser render
of `/ru` is a follow-up (no DB/browser in the build sandbox).
