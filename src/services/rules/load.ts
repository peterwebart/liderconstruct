import type { Payload } from 'payload'

import { defaultRulesConfig, type RulesConfig } from './config'

interface BRGlobal {
  status?: Partial<RulesConfig['status']>
  seo?: Partial<RulesConfig['seo']>
}

/** Loads the CMS-configured Business Rules, merged over code defaults. */
export async function loadRulesConfig(payload: Payload): Promise<RulesConfig> {
  try {
    const g = (await payload.findGlobal({ slug: 'business-rules' })) as BRGlobal
    return {
      ...defaultRulesConfig,
      status: { ...defaultRulesConfig.status, ...(g.status ?? {}) },
      seo: { ...defaultRulesConfig.seo, ...(g.seo ?? {}) },
    }
  } catch {
    return defaultRulesConfig
  }
}
