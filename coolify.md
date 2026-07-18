# Deploying LiderConstruct on Coolify

This guide covers deploying the app to **Coolify** (self-hosted on Hetzner),
initializing the database, and running the seed/import workflow on the server.

> **Scope note.** This document describes the application's requirements and the
> operational steps. Provisioning the server, Coolify itself, DNS/TLS, and OS
> packages are infrastructure concerns owned outside this repo. Commands that
> touch the server (SSH, `docker exec`, Coolify UI actions) are yours to run and
> verify in your environment.

---

## 1. Overview

- **Build:** Coolify's **Nixpacks** builder is the default path (no Dockerfile
  required). A `Dockerfile` is also included in the repo as an alternative — use
  one or the other, not both. See [§6](#6-build-options-nixpacks-vs-dockerfile).
- **Runtime:** a Next.js 15 server that also serves the Payload admin at
  `/admin`.
- **Database:** a PostgreSQL 16 service with two extensions
  (`unaccent`, `pg_trgm`).
- **One-off jobs:** database migrations, reference-data seeding, and the catalog
  import are run as **commands against the running service**, not as part of the
  image start.

---

## 2. Environment variables

Set these on the Coolify **application** service. Real environment variables
always take precedence over any `.env` file in the image (the app is built to
guarantee this), so Coolify's values win.

### Required

| Variable | Example | Notes |
| --- | --- | --- |
| `DATABASE_URI` | `postgres://USER:PASS@HOST:5432/liderconstruct` | Point at the Postgres service. If Postgres runs as a Coolify service, use its internal hostname. URL-encode special characters in the password. |
| `PAYLOAD_SECRET` | (32+ random chars) | Signs tokens; keep stable across deploys. Generate with `openssl rand -hex 32`. |
| `NEXT_PUBLIC_SERVER_URL` | `https://liderconstruct.md` | Canonical site URL for SEO, Open Graph, sitemap. **Inlined at build time** — set it before/at build (see §6). |

### Email (transactional order notifications)

Order confirmations and admin notifications send via SMTP. If these are unset,
Payload logs email to the console instead of sending (fine for a first boot).

| Variable | Example |
| --- | --- |
| `SMTP_HOST` | `smtp.postmarkapp.com` |
| `SMTP_PORT` | `587` |
| `SMTP_USER` | (provider token/user) |
| `SMTP_PASS` | (provider token/pass) |
| `EMAIL_FROM_NAME` | `LiderConstruct` |
| `EMAIL_FROM_ADDRESS` | `comenzi@liderconstruct.md` |
| `ORDER_NOTIFICATION_TO` | `comenzi@liderconstruct.md` |

### Public contact details (shown in the UI)

| Variable | Example | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_CONTACT_PHONE` | `+373 22 000 000` | **Inlined at build time.** |
| `NEXT_PUBLIC_CONTACT_EMAIL` | `info@liderconstruct.md` | **Inlined at build time.** |

> **`NEXT_PUBLIC_*` are build-time.** Anything prefixed `NEXT_PUBLIC_` is baked
> into the client bundle during `next build`. If you change one, you must
> **rebuild**, not just restart. Server-only vars (`DATABASE_URI`,
> `PAYLOAD_SECRET`, `SMTP_*`) are read at runtime and only need a restart.

The complete list with inline documentation lives in `.env.example`.

---

## 3. Database initialization (required once)

The search and import layers depend on two PostgreSQL extensions. Create them
**once** against the production database, before the first seed/import.

Connect to the database (via `psql`, a Coolify terminal into the Postgres
service, or `docker exec`), then run:

```sql
CREATE EXTENSION IF NOT EXISTS unaccent;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
```

Example via `docker exec` if Postgres runs as a container:

```bash
docker exec -i <postgres-container> \
  psql -U <user> -d liderconstruct \
  -c "CREATE EXTENSION IF NOT EXISTS unaccent; CREATE EXTENSION IF NOT EXISTS pg_trgm;"
```

Creating the extensions requires a role with sufficient privileges (the database
owner or a superuser). This is idempotent — safe to run again.

Payload creates its own tables on first boot; you do not need to create the
schema manually.

---

## 4. First deploy — order of operations

1. **Create the Postgres service** in Coolify (or attach an external database).
2. **Create the extensions** (§3).
3. **Create the application** from the Git repo; set the environment variables
   (§2). Configure the build (§6).
4. **Deploy.** On first boot the app connects and Payload provisions its schema.
5. **Create the first admin user** at `https<your-domain>/admin`.
6. **Seed reference data**, then **import the catalog** (§5).

---

## 5. Seed & import on the server

Both are one-off commands run against the deployed application (they reuse the
app's environment, so no extra configuration is needed). In Coolify, use the
service's **Terminal/Exec**, or SSH to the host and `docker exec` into the app
container.

### Seed reference data (once, before the first import)

```bash
pnpm seed
```

Creates the canonical units, brands, attribute registry, category taxonomy, and
approved aliases. Idempotent.

### Import the catalog

The supplier spreadsheet is **not** in the repository. Get the `.ods` onto the
server first (see [§7](#7-getting-the-supplier-spreadsheet-onto-the-server)),
then:

```bash
# Safe dry run first — review the reported counts/warnings:
pnpm import:catalog /path/to/price-export.ods dry_run

# Then the real import:
pnpm import:catalog /path/to/price-export.ods full
```

Notes:
- Duplicate base-SKU rows are merged automatically and reported as warnings.
- Some categories may be intentionally pending manual mapping; those products
  import flagged for review (visible in the admin) rather than blocking the run.
- Imports are reversible via the recorded run snapshot.

### Database migrations (when the schema changes)

```bash
pnpm migrate:status   # inspect
pnpm migrate          # apply
```

---

## 6. Build options: Nixpacks vs. Dockerfile

You need exactly one build strategy.

### Option A — Nixpacks (Coolify default)

No Dockerfile needed. Two things make a pnpm build reproducible on Nixpacks:

1. **Pin the package manager.** Add a `packageManager` field to `package.json`
   so corepack selects the right pnpm (replace with your pnpm version):

   ```json
   "packageManager": "pnpm@9.12.3"
   ```

   Without this, Nixpacks may use a pnpm version that disagrees with
   `pnpm-lock.yaml` and fails `pnpm install --frozen-lockfile` (a common cause of
   the "packages field / lockfile" install error).

2. **Keep the lockfile in sync.** If you change dependencies, run `pnpm install`
   locally and commit the updated `pnpm-lock.yaml`. A stale lockfile fails a
   frozen install.

Set the start command to `pnpm start` and the build to `pnpm build` if Coolify
does not detect them automatically. Ensure `NEXT_PUBLIC_*` build-time variables
are present at build.

### Option B — Dockerfile (included)

The repo includes a multi-stage `Dockerfile` that produces a Next.js standalone
image. To use it, set Coolify's build pack to **Dockerfile**.

- It sets `DOCKER_BUILD=1`, which turns on Next's `output: "standalone"` (guarded
  in `next.config.mjs` so the Nixpacks path is unaffected).
- `NEXT_PUBLIC_*` values are build args — pass real values via Coolify's build
  arguments so they are inlined correctly.
- **This Dockerfile has not been built/verified in CI or this environment.**
  Build it locally first (`DOCKER_BUILD=1 docker build -t liderconstruct .`) and
  adjust Node/pnpm versions (the `ARG`s at the top) to match your target.

---

## 7. Getting the supplier spreadsheet onto the server

The `.ods` is deliberately not in Git. Options, simplest first:

1. **Upload temporarily.** Copy the file to the host and into the container for a
   one-time import, then delete it:

   ```bash
   # host -> app container
   docker cp ./price-export.ods <app-container>:/tmp/price-export.ods
   docker exec -it <app-container> pnpm import:catalog /tmp/price-export.ods full
   docker exec -it <app-container> rm /tmp/price-export.ods
   ```

2. **Mount a directory.** Attach a host directory (or Coolify volume) to the app
   service and drop the file there, then import from that path. The included
   `compose.yaml` demonstrates this pattern for local use (`./data` → `/import`).

3. **Admin upload interface (future).** A small authenticated
   upload-and-import screen in the Payload admin would remove the need to touch
   the server for routine price updates. Recommended once import cadence picks
   up; not required for launch.

---

## 8. Post-deploy checklist

- [ ] Extensions created (`unaccent`, `pg_trgm`).
- [ ] App boots; `/admin` reachable; first admin user created.
- [ ] `pnpm seed` run successfully.
- [ ] `pnpm import:catalog … dry_run` reviewed, then `… full` run.
- [ ] Storefront shows products; search returns results (diacritic-insensitive).
- [ ] Order inquiry email arrives (or SMTP configured and verified).
- [ ] `NEXT_PUBLIC_SERVER_URL` correct (check canonical tags / sitemap).
