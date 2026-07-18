# LiderConstruct

Construction-materials e-commerce storefront for the Moldovan market — a rebuild
of a legacy Drupal 7 catalog on a modern stack.

- **Framework:** Next.js 15 (App Router, React 19)
- **CMS / backend:** Payload CMS 3 (admin, collections, access control)
- **Database:** PostgreSQL (with `unaccent` + `pg_trgm` extensions)
- **Styling:** Tailwind CSS 4
- **Language:** TypeScript (strict)
- **Package manager:** pnpm (via corepack)
- **Primary content language:** Romanian (Russian locale planned)

---

## Prerequisites

- **Node.js** ≥ 20.9 (the app targets the current LTS; 22.x recommended)
- **pnpm** — enable via corepack: `corepack enable`
- **Docker** (optional, for the local Postgres) or a PostgreSQL 16 instance you manage
- The **supplier price spreadsheet** (`.ods`) — this is **not** in the repository
  (see [Importing the catalog](#importing-the-catalog))

---

## Quick start (local development)

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure environment

Copy the example and fill in values:

```bash
cp .env.example .env.local
```

At minimum you must set `PAYLOAD_SECRET` (any long random string) and
`DATABASE_URI`. All variables and precedence rules are documented in
`.env.example`. `.env.local` is gitignored — never commit real secrets.

### 3. Start PostgreSQL

**Option A — Docker (recommended):** brings up Postgres 16 with the required
extensions already created, on host port **5433**:

```bash
docker compose up -d db
```

Matching `DATABASE_URI` for this container:

```
DATABASE_URI=postgres://lider:StrongPassword123!@localhost:5433/liderconstruct
```

**Option B — your own Postgres:** create a database, then enable the extensions
once:

```sql
CREATE EXTENSION IF NOT EXISTS unaccent;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
```

### 4. Generate types and start the dev server

```bash
pnpm generate:types
pnpm dev
```

- Storefront: <http://localhost:3000>
- Admin panel: <http://localhost:3000/admin> (create the first user on first visit)

On first boot Payload creates its schema in the database automatically.

---

## Seeding reference data

Seed the canonical units, brands, attribute registry, and category taxonomy
before importing the catalog:

```bash
pnpm seed
```

Expected result: units, brands, the attribute registry, taxonomy nodes, and the
approved category aliases are created. Safe to re-run — it upserts.

---

## Importing the catalog

The supplier spreadsheet is **not** tracked in Git. Point the importer at a
local file path:

```bash
# Dry run first (default, makes no changes) — review the report:
pnpm import:catalog "/path/to/price-export.ods" dry_run

# Then the real import:
pnpm import:catalog "/path/to/price-export.ods" full
```

Modes: `dry_run` (default, safe), `full`, `product_only`, `price_only`,
`stock_only`. The importer normalizes, validates, de-duplicates, matches
categories/brands/units, and writes products + variations. A run snapshot is
recorded so imports are reversible.

> **Note:** A small number of source categories may be intentionally left
> pending manual mapping; those products import flagged for review and appear in
> the admin's validation view. Duplicate base-SKU rows are merged automatically
> (reported as warnings).

### Importing from inside the app container

If you run the full stack in Docker (`--profile app`), drop the `.ods` into
`./data` (mounted read-only at `/import`) and run:

```bash
docker compose exec app pnpm import:catalog /import/price-export.ods full
```

---

## Useful scripts

| Script | Purpose |
| --- | --- |
| `pnpm dev` | Start the dev server (Next + Payload admin) |
| `pnpm build` | Production build |
| `pnpm start` | Run the production build |
| `pnpm lint` | Lint |
| `pnpm generate:types` | Regenerate `src/payload-types.ts` from the schema |
| `pnpm seed` | Seed reference data (units, brands, attributes, taxonomy) |
| `pnpm import:catalog <file> [mode]` | Import the supplier catalog |
| `pnpm migrate` / `migrate:status` / `migrate:create` / `migrate:down` | Payload database migrations |

All standalone scripts load environment variables through a shared CLI
bootstrap, so they respect the same `.env` precedence as `next dev` (real env
vars always win — required for hosted environments).

---

## Full local stack (optional)

To run the app in a container alongside Postgres (mirrors the production image):

```bash
docker compose --profile app up --build
```

This uses the `Dockerfile`. See the note in `coolify.md`: the container files
are provided as a starting point and should be validated in your environment.

---

## Deployment

Production runs on **Coolify** (Hetzner). See **[coolify.md](./coolify.md)** for
the full deployment guide: environment variables, database extension setup, and
the seed/import workflow on the server.

---

## Project conventions

- **Infrastructure vs. application:** application code lives here; server
  provisioning, SSH, and deployment operations are managed separately.
- **Architecture decisions** are recorded as ADRs under `docs/adr/`.
- **Design-first:** UI was specified and reviewed before implementation; a
  component gallery lives at `/dev/components` (non-indexed) for visual review.
