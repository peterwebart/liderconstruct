# ADR-0016: Dynamic sitemap & robots

## Status
Accepted — 2026-07-18

## Context
The storefront shipped without `sitemap.xml` or `robots.txt`. For a catalog of
~2,325 products plus category and brand pages, that leaves the entire indexable
surface undiscoverable to search engines — a direct miss against the project's
SEO goal. Canonical URLs already exist per page; nothing enumerated them.

## Decision
Use Next.js's native metadata routes under `src/app/(frontend)/`:

- **`sitemap.ts`** returns every indexable URL — published products
  (`lifecycle` not hidden/archived/draft), all category nodes, active brands,
  and the static pages — each with `lastModified` (from `updatedAt`),
  `changeFrequency`, and `priority`.
- **`robots.ts`** allows crawling, disallows `/admin`, `/api/`, `/dev/`,
  `/search` (infinite faceted permutations — kept out of the index, matching the
  `noindex` already on the search page), and the account/wishlist stubs, and
  points to `/sitemap.xml`.

Enumeration lives in **`src/lib/seo.ts`** (`getSitemapEntries`), keeping the
route file thin. It mirrors the exact canonical URL shapes the pages declare
(sections at `/category/<slug>`, deeper nodes at
`/category/<section>/<slug>`), resolving each node's section by walking parents.
Cached via `unstable_cache` under the `catalog` + `navigation` tags
(revalidate 3600s) so it refreshes after imports and taxonomy edits without a
redeploy. Fail-safe: any error returns just the static routes, so the sitemap
is always valid XML.

Base URL comes from `NEXT_PUBLIC_SERVER_URL` (same source as `metadataBase`),
trailing slash stripped.

## Consequences
- Search engines can discover the full catalog; `lastModified` signals
  freshness after price/stock imports.
- Adding a page type means adding its enumeration to `getSitemapEntries` (one
  function), not touching the route.
- Search-result and admin/dev surfaces stay out of the index by construction.

## Verification (2026-07-18)
Enumeration logic run against a live DB (80 categories, 60 brands): correct
section/deep/brand URL shapes, **zero malformed paths**, every category node
resolved to a section (none dropped). `tsc`/`eslint` clean. The `unstable_cache`
wrapper requires a running Next server (verified it is wired; the inner logic
was validated directly).
