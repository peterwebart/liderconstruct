# ADR-0015: CLI environment bootstrap

## Status
Accepted — 2026-07-04

## Context
Standalone commands (`pnpm seed`, `pnpm import:catalog`, Payload migrations)
run under `tsx`, outside Next.js. Next loads `.env.local`/`.env` itself, so
`pnpm dev` worked while the CLI crashed: `payload.config.ts` reads
`PAYLOAD_SECRET` and `DATABASE_URI` at module scope, and both were undefined.
Static `import config from '../payload.config'` in each script made this
unfixable in-place — ESM hoisting evaluates the config before any script body
could load env files.

## Decision
One bootstrap, three small modules under `src/scripts/`:

1. **`cli/env.ts`** — side-effect module that calls `@next/env`'s
   `loadEnvConfig(process.cwd())` exactly once (global-symbol guard). This
   gives the CLI byte-identical semantics to `next dev`/`next build`:
   already-set environment variables (Coolify, CI) always win and are never
   overridden; otherwise `.env.local` → `.env.$(NODE_ENV)` → `.env`; missing
   files are a no-op. `@next/env` is a direct dependency (pinned to the Next
   version) and is imported via CJS default-interop — its bundled CJS build
   exposes no statically-detectable named exports under the Node ESM loader.
2. **`cli/bootstrap.ts`** — `requireEnv()` (aggregated, actionable error
   naming every missing variable and where to set it) and
   `getCliPayload()` / `runCli(name, fn)`. Payload and `payload.config` are
   imported **dynamically inside** `getCliPayload`, guaranteeing the config
   evaluates only after env exists, regardless of import order in caller
   scripts. `runCli` standardises exit codes (0/1) and error reporting.
3. **`payloadBin.ts`** — env-aware wrapper that spawns the official Payload
   CLI with the loaded environment. All `payload` commands
   (`migrate`, `migrate:create/status/down`, `generate:types`,
   `generate:importmap`) route through it, keeping Payload's own migration
   tooling as the single source of truth instead of re-implementing it.

Every current and future standalone script starts with
`void runCli('name', async (payload) => { … })` — no per-script env logic,
no duplicated boilerplate, no hardcoded secrets anywhere.

## Consequences
- `pnpm seed` / `pnpm import:catalog` / `pnpm migrate*` / `pnpm generate:*`
  work with `.env.local` locally and with injected variables on Coolify,
  zero extra configuration; `pnpm dev` / `pnpm build` are untouched.
- Missing configuration fails fast with a human message instead of a Payload
  stack trace.
- Cron jobs and maintenance scripts inherit the same contract by construction.

## Verification (2026-07-04, sandbox)
- No env anywhere → `[seed] failed: Missing required environment
  variable(s): PAYLOAD_SECRET, DATABASE_URI …`, exit 1.
- `.env.local` only → Payload initialised and attempted the file's
  `127.0.0.1:5433` (ECONNREFUSED — no DB in sandbox): file loading proven.
- `.env.local` present + inline `DATABASE_URI` (port 6543) → all connect
  attempts hit 6543, zero hit 5433: real env beats files (Coolify semantics).
- `pnpm generate:types` via the wrapper with only `.env.local` → exit 0;
  with the types file perturbed it rewrites and logs `Types written to …`,
  and with an unchanged schema it exits 0 silently by design (the bin diffs
  the compiled output and skips identical writes). Previously this command
  required inline variables.
- Payload's bin internally uses the same `@next/env` loader — the wrapper
  adds one documented precedence for every command rather than a second
  mechanism.
- `pnpm import:catalog` with no args → usage + exit 1 before any env/DB work.
