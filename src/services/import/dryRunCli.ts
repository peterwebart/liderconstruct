/* Standalone dry-run entry. Bundled with esbuild and run on the real file.
 * Usage: node dryrun.mjs <path-to-file> [format] */
import { dryRun } from './dryRun'

const [, , filePath, format] = process.argv
if (!filePath) {
  console.error('usage: dryRunCli <file> [format]')
  process.exit(1)
}
const report = dryRun(filePath, format ?? 'ods')
process.stdout.write(JSON.stringify(report, null, 2))
