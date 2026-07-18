# ADR-0006: Search — abstracted interface, staged engines, configurable ranking
Status: Accepted

## Context
Catalog is small but richly faceted, bilingual with RO diacritics. We want
typo-tolerance and good relevance, low cost now, and room for Meilisearch/AI.

## Decision
Search is behind a `SearchService` interface; the app never names the engine.
Stage 1 = PostgreSQL FTS (unaccent + pg_trgm) + facets derived from the
registry; later = Meilisearch; future = AI semantic — each a sibling
implementation chosen via `SEARCH_DRIVER`. One denormalized document per product
feeds whichever engine. Ranking is multi-signal (exact SKU/name, brand,
category, popularity, featured, availability, keywords, synonyms) with weights
configurable from the CMS (SearchSettings).

## Consequences
- Engine swap is additive, no app changes. Synonyms live in one DB table.
