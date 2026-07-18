import type { Payload } from 'payload'

import { PostgresSearchService } from './PostgresSearchService'
import type { SearchService } from './SearchService'

export type { SearchService } from './SearchService'
export * from './types'
export { buildSearchDocument } from './buildSearchDocument'

/**
 * Returns the configured search engine. Driven by SEARCH_DRIVER so the engine
 * can change (postgres -> meilisearch -> ai) without touching the app layer.
 */
export function getSearchService(payload: Payload): SearchService {
  const driver = process.env.SEARCH_DRIVER ?? 'postgres'
  switch (driver) {
    case 'postgres':
    default:
      return new PostgresSearchService(payload)
  }
}
