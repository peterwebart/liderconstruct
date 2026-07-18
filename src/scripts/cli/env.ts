/**
 * CLI environment bootstrap — the single place standalone processes load env.
 *
 * Uses @next/env so scripts get EXACTLY the same semantics as `next dev` /
 * `next build`:
 *   1. Variables already present in the process environment ALWAYS win
 *      (Coolify / production inject real env vars — files never override them).
 *   2. Otherwise, files load in Next's order: .env.local, then
 *      .env.$(NODE_ENV), then .env. Missing files are a silent no-op.
 *
 * Loading happens exactly once per process (guarded via a global symbol, so
 * even duplicate module instances under different resolutions stay idempotent).
 * Import this module for its side effect BEFORE anything reads process.env.
 */
// @next/env is bundled CJS — default-import interop is required under the
// Node ESM loader (named imports aren't statically detectable there).
import nextEnv from '@next/env'

const { loadEnvConfig } = nextEnv

const LOADED = Symbol.for('liderconstruct.cli.envLoaded')
const registry = globalThis as unknown as Record<symbol, boolean | undefined>

if (!registry[LOADED]) {
  loadEnvConfig(process.cwd())
  registry[LOADED] = true
}

export {}
