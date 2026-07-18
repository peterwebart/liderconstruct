import type { FacetsResult, SearchDocument, SearchQuery, SearchResult, SuggestGroups } from './types'

/**
 * Engine-agnostic search interface. Implementations: PostgreSQL (now),
 * Meilisearch (later), AI semantic (future). The application layer only ever
 * imports this interface + the factory in ./index.
 */
export interface SearchService {
  search(query: SearchQuery): Promise<SearchResult>
  facets(query: SearchQuery): Promise<FacetsResult>
  /** Grouped instant suggestions for the SmartSearch overlay. */
  instant(term: string, locale: 'ro' | 'ru'): Promise<SuggestGroups>
  /** Plain-text completions (future). */
  suggest(term: string, locale: 'ro' | 'ru'): Promise<string[]>
  /** Upsert denormalized documents into the engine's index. */
  index(documents: SearchDocument[]): Promise<void>
  remove(ids: string[]): Promise<void>
  /** Engine identifier for diagnostics. */
  readonly engine: string
}
