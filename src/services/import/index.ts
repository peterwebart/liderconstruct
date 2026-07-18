import type { Payload } from 'payload'

import { SpreadsheetAdapter } from './adapters/SpreadsheetAdapter'
import { findDuplicateCandidates } from './deduplicator'
import { dryRun } from './dryRun'
import { executePlan, emptyResolvers, type Resolvers } from './executor'
import { writeRun } from './logger'
import { matchProducts } from './matcher'
import { buildPlan, type ImportMode } from './planner'
import { loadRulesConfig } from '../rules'
import { mapLiderConstruct } from './profiles/liderconstruct'
import type { ImportReport } from './types'
import { validate } from './validator'

export { dryRun } from './dryRun'
export type { ImportReport } from './types'
export { SpreadsheetAdapter } from './adapters/SpreadsheetAdapter'

export interface RunImportArgs {
  filePath: string
  format?: string
  mode: ImportMode
  resolvers?: Resolvers
  userId?: number
}

/**
 * End-to-end orchestrator. `dry_run` produces the report only (no writes).
 * Any other mode reads → maps → validates → matches → plans → executes →
 * records the run. SKU/legacyKey is the sync key; existing records are updated.
 */
export async function runImport(
  payload: Payload,
  args: RunImportArgs,
): Promise<{ report: ImportReport; runId?: string | number }> {
  const report = dryRun(args.filePath, args.format ?? 'ods')
  if (args.mode === 'dry_run') return { report }

  const sheets = new SpreadsheetAdapter(args.format ?? 'ods').read(args.filePath)
  const { products } = mapLiderConstruct(sheets)
  validate(mapLiderConstruct(sheets), args.filePath)
  findDuplicateCandidates(products)

  const match = await matchProducts(payload, products)
  const plan = buildPlan(match, args.mode)
  const rules = await loadRulesConfig(payload)
  await executePlan(payload, match, plan, args.resolvers ?? emptyResolvers(), rules)
  const runId = await writeRun(payload, { report, mode: args.mode, userId: args.userId })
  return { report, runId }
}
