# LiderConstruct

E-commerce catalog + inquiry-order platform for liderconstruct.md.
Rebuild of the EOL Drupal 7 / Ubercart site.

## Stack
- **Next.js 15** (App Router, TypeScript strict) — storefront
- **Payload CMS 3** — admin + data layer (runs inside Next.js)
- **PostgreSQL** — database
- **Tailwind CSS 4** — styling
- **pnpm** — package manager

## Model (per project docs)
- **Catalog:** ~2,330 products / ~5,700 priced variations (SKU `LC-#####`),
  doors-heavy, ~60 brands, deeply faceted per-category attributes. Bilingual
  RO/RU (RO primary; RU fills in over time).
- **Ordering:** an *inquiry cart* — no payment, no accounts. Submit name +
  phone → email to `comenzi@liderconstruct.md` + customer → operator calls to
  confirm price/delivery. Statuses: Nouă → Contactată → Confirmată → Livrată →
  Închisă (+ Anulată). Missing price shows **"Preț la cerere"**, never `0,00 lei`.
- **Search:** staged — Postgres full-text + faceted filtering first, Meilisearch
  later when search becomes a conversion lever.

## Local development
```bash
pnpm install
cp .env.example .env   # set DATABASE_URI + PAYLOAD_SECRET
pnpm dev               # storefront at /, admin at /admin
```

## Deployment
GitHub → Coolify → production (automatic on push to `main`). Postgres, secrets,
and transactional email (SMTP) are provided by Coolify as environment variables.

## Scripts
- `pnpm dev` — develop
- `pnpm build` — production build (Payload generates types + runs migrations
  against `DATABASE_URI`)
- `pnpm lint` — ESLint
- `pnpm generate:types` — regenerate `src/payload-types.ts`

## Structure
```
src/
  app/(payload)/   Payload admin + REST/GraphQL routes
  app/(frontend)/  Storefront (Next.js App Router)
  collections/     Users, Media, Categories, Brands, Products, Variations, Orders
  fields/          Reusable fields (slug, SEO)
  hooks/           Order number + email notifications
  access/          Access-control helpers
  lib/             Shared constants
  payload.config.ts
```
