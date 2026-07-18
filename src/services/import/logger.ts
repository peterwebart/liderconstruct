import type { Payload } from 'payload'

import type { ImportRun } from '../../payload-types'
import type { ImportReport } from './types'

/** Persists an import run + per-row logs for full auditability. */
export async function writeRun(
  payload: Payload,
  args: {
    report: ImportReport
    mode: ImportRun['mode']
    userId?: number
    status?: ImportRun['status']
  },
): Promise<number> {
  const { report, mode, userId, status = 'completed' } = args
  const run = await payload.create({
    collection: 'import-runs',
    data: {
      sourceFile: report.sourceFile,
      checksum: report.checksum,
      mode,
      status,
      importedRows: report.statistics.importableVariations,
      createdRows: report.statistics.importableProducts,
      updatedRows: 0,
      skippedRows: report.issues.filter((i) => i.action === 'quarantine' || i.action === 'skip').length,
      deletedRows: 0,
      warnings: report.issues.filter((i) => i.level === 'warning').length,
      errors: report.issues.filter((i) => i.level === 'error').length,
      executionTimeMs: report.performance.durationMs,
      user: userId,
      report: report as unknown as ImportRun['report'],
      finishedAt: new Date().toISOString(),
    },
    depth: 0,
  })

  for (const issue of report.issues.slice(0, 5000)) {
    await payload.create({
      collection: 'import-logs',
      data: {
        run: run.id,
        rowNumber: issue.rowNumber,
        sku: issue.sku,
        action: issue.action === 'warning' ? 'warning' : issue.action,
        level: issue.level,
        field: issue.field,
        message: issue.message,
        suggestedFix: issue.suggestedFix,
        sourceFile: issue.sourceFile,
      },
      depth: 0,
    })
  }
  return run.id
}
