# ADR-0007: Import pipeline — modular, dry-run default, snapshot rollback
Status: Accepted

## Context
Supplier files arrive in varied formats/cadences; must update without
duplication, never break data, and scale to large catalogs.

## Decision
A modular service pipeline (adapter → mapper → normalizer → validator →
deduplicator → matcher → planner → executor → logger → rollback). Column maps
are DB-driven import profiles. Modes are field-scoped: full / incremental /
price-only / stock-only / product-only / dry-run. Dry-run is the default and
produces statistics/warnings/errors/mappings/duplicates. Every run is recorded
(import-runs) with per-row logs (import-logs) and a snapshot for rollback.

## Consequences
- Price lists never clobber enriched data. Bad rows are skipped, not fatal.
- New formats = new adapter; new suppliers = new profile row.
