import './env'

import type { Payload } from 'payload'

/**
 * Shared CLI runtime for every standalone command (seed, importer, future
 * maintenance scripts, cron jobs). Guarantees, in order:
 *   1. env is loaded once with Next-identical semantics (see ./env),
 *   2. required variables are asserted with an actionable message,
 *   3. payload.config is imported ONLY AFTER env exists — dynamic imports
 *      make this true regardless of import hoisting in caller scripts,
 *   4. uniform exit codes: 0 on success, 1 on failure.
 */

const REQUIRED_ENV = ['PAYLOAD_SECRET', 'DATABASE_URI'] as const

export function requireEnv(keys: readonly string[] = REQUIRED_ENV): void {
  const missing = keys.filter((key) => !process.env[key])
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variable(s): ${missing.join(', ')}.\n` +
        `  • Local development: define them in .env.local (see .env.example).\n` +
        `  • Production / Coolify: set them on the service — real environment variables always take precedence over files.`,
    )
  }
}

/** Env-safe Payload instance for CLI use. */
export async function getCliPayload(): Promise<Payload> {
  requireEnv()
  const [{ getPayload }, { default: config }] = await Promise.all([
    import('payload'),
    import('../../payload.config'),
  ])
  return getPayload({ config })
}

/** Uniform entrypoint: `void runCli('name', async (payload) => { … })`. */
export async function runCli(name: string, main: (payload: Payload) => Promise<void>): Promise<void> {
  try {
    const payload = await getCliPayload()
    await main(payload)
    process.exit(0)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error(`\n[${name}] failed: ${message}\n`)
    if (process.env.DEBUG && error instanceof Error) console.error(error.stack)
    process.exit(1)
  }
}
