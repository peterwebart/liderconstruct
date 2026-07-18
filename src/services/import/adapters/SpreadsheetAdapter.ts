import { readFileSync } from 'node:fs'

import * as XLSX from 'xlsx'

import type { RawRow } from '../types'
import type { SheetData, SourceAdapter } from './SourceAdapter'

/**
 * Startup assertion for the SheetJS API. Under Node ESM (`"type": "module"`)
 * xlsx@0.18.x exposes the parser (`XLSX.read`) and utils, but NOT the
 * fs-backed `XLSX.readFile` — so calling `readFile` fails at import time with
 * "readFile is not a function". We therefore never use `readFile`; we read the
 * bytes ourselves and hand a Buffer to `XLSX.read`. This guard makes a missing
 * API fail loudly and clearly at construction instead of deep inside a run.
 */
function assertSheetJsAvailable(): void {
  const hasRead = typeof (XLSX as { read?: unknown }).read === 'function'
  const hasSheetToJson = typeof XLSX.utils?.sheet_to_json === 'function'
  if (!hasRead || !hasSheetToJson) {
    throw new Error(
      'SheetJS (xlsx) API unavailable: expected XLSX.read() and XLSX.utils.sheet_to_json() to be functions. ' +
        `Got read=${typeof (XLSX as { read?: unknown }).read}, ` +
        `sheet_to_json=${typeof XLSX.utils?.sheet_to_json}. ` +
        'Ensure `xlsx` (^0.18.5) is installed and imported as `import * as XLSX from "xlsx"`.',
    )
  }
}

/**
 * Reads ODS / XLSX / CSV / TSV uniformly via SheetJS. CSV/TSV delimiters and
 * locale specifics come from the import profile; this adapter just yields rows.
 *
 * ESM-safe: reads file bytes with node:fs and parses via XLSX.read(buffer),
 * avoiding XLSX.readFile which is not exported by the xlsx ESM build under
 * Node 24 + "type": "module".
 */
export class SpreadsheetAdapter implements SourceAdapter {
  constructor(public readonly format: string = 'spreadsheet') {
    assertSheetJsAvailable()
  }

  read(filePath: string): SheetData[] {
    const buffer = readFileSync(filePath)
    // `type: 'buffer'` works for XLSX/ODS (binary) and CSV/TSV (text) alike —
    // SheetJS sniffs the container from the bytes.
    const wb = XLSX.read(buffer, { type: 'buffer', cellDates: false, raw: true })
    return wb.SheetNames.map((name) => {
      const ws = wb.Sheets[name]
      const rows = XLSX.utils.sheet_to_json<RawRow>(ws, { defval: null, raw: true })
      return { name, rows }
    })
  }
}
