/**
 * Runs the catalog import. Usage:
 *   pnpm import:catalog <path-to-file> [mode]
 * mode: dry_run (default for safety) | product_only | full | price_only | stock_only
 * Reversible via the run snapshot recorded in import-runs.
 * Environment is provided by the shared CLI bootstrap (src/scripts/cli).
 */
import type { Payload } from 'payload'

import { runImport } from '../services/import'
import type { Resolvers } from '../services/import/executor'
import { aliasKey } from '../services/import/normalizer'
import { runCli } from './cli/bootstrap'

const MODES = ['dry_run', 'product_only', 'full', 'price_only', 'stock_only'] as const
type Mode = (typeof MODES)[number]

const filePath = process.argv[2]
const modeArg = process.argv[3] ?? 'dry_run'
if (!filePath || !MODES.includes(modeArg as Mode)) {
  console.error(`usage: pnpm import:catalog <file> [${MODES.join('|')}]`)
  process.exit(1)
}
const mode = modeArg as Mode

async function buildResolvers(payload: Payload): Promise<Resolvers> {
  const [brands, units, categories] = await Promise.all([
    payload.find({ collection: 'brands', limit: 5000, pagination: false, depth: 0 }),
    payload.find({ collection: 'units', limit: 200, pagination: false, depth: 0 }),
    payload.find({ collection: 'categories', limit: 5000, pagination: false, depth: 0 }),
  ])
  const r: Resolvers = { brands: new Map(), units: new Map(), categories: new Map() }
  for (const b of brands.docs) {
    if (b.name) r.brands.set(aliasKey(b.name), b.id)
    for (const a of b.aliases ?? []) r.brands.set(aliasKey(a), b.id)
  }
  for (const u of units.docs) {
    if (u.code) r.units.set(aliasKey(u.code), u.id)
    for (const a of u.aliases ?? []) r.units.set(aliasKey(a), u.id)
  }
  // Category aliases are populated only after the mapping proposal is approved.
  for (const c of categories.docs) for (const a of c.aliases ?? []) r.categories.set(aliasKey(a), c.id)
  return r
}

void runCli('import:catalog', async (payload) => {
  const resolvers = await buildResolvers(payload)
  const { report, runId } = await runImport(payload, { filePath, mode, resolvers })
  payload.logger.info(
    `Import (${mode}) ${runId ? `run ${runId}` : '(dry-run)'}: ` +
      `${report.statistics.importableProducts} products / ${report.statistics.importableVariations} variations; ` +
      `${report.issues.filter((i) => i.level === 'error').length} errors, ` +
      `${report.issues.filter((i) => i.level === 'warning').length} warnings.`,
  )
})
