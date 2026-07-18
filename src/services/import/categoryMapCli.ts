/* Generates the supplier->internal category mapping proposal. */
import { SpreadsheetAdapter } from './adapters/SpreadsheetAdapter'
import { proposeCategoryMappings } from './categoryMatcher'
import { normalizeText } from './normalizer'

const [, , filePath] = process.argv
const sheets = new SpreadsheetAdapter('ods').read(filePath)
const produse = sheets.find((s) => s.name.toLowerCase().startsWith('produse'))
const counts = new Map<string, number>()
for (const row of produse?.rows ?? []) {
  const c = normalizeText(row['Categorie'])
  if (c) counts.set(c, (counts.get(c) ?? 0) + 1)
}
const proposals = proposeCategoryMappings([...counts.entries()].map(([value, count]) => ({ value, count })))
process.stdout.write(JSON.stringify(proposals, null, 2))
