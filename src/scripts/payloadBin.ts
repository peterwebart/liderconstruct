/**
 * Env-aware wrapper around the official Payload CLI, so `migrate`,
 * `migrate:create`, `generate:types`, etc. run with the exact same
 * environment semantics as the app (see ./cli/env). Keeps Payload's own
 * migration tooling as the single source of truth instead of re-implementing
 * it — 3.x best practice.
 *
 * Usage: tsx src/scripts/payloadBin.ts <payload-command> [...args]
 */
import './cli/env'

import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const bin = path.join(process.cwd(), 'node_modules', 'payload', 'bin.js')
if (!fs.existsSync(bin)) {
  console.error('Payload CLI not found — run `pnpm install` first.')
  process.exit(1)
}

// Pass the loaded environment through, but strip tsx's NODE_OPTIONS — the
// Payload bin bootstraps its own TS support (tsx/SWC) and child tooling
// should not inherit our runner's ESM loader flags.
// Note: `generate:types` intentionally logs nothing and skips the write when
// the compiled output is identical to the existing file (no-op diff).
const env = { ...process.env }
delete env.NODE_OPTIONS

const result = spawnSync(process.execPath, [bin, ...process.argv.slice(2)], {
  stdio: 'inherit',
  env,
})
process.exit(result.status ?? 1)
