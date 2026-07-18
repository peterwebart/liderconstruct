# LiderConstruct — Phase 2 Implementation & Dry‑Run Report

**Status:** schema refinements + import services **implemented and verified**; a **dry‑run was executed on the real file**. **No data was written** (dry‑run only). Awaiting your go‑ahead to run the actual import.
**Verification:** `tsc --noEmit` clean · `eslint` 0 warnings / 0 errors · dry‑run executed through the real service code (esbuild‑bundled) on `liderconstruct-price_export_15_mai_2024.ods`.

---

## 1. What was built

### Schema (Payload collections + global) — all typecheck clean
- **Taxonomy** (`categories`): supplier‑independent, self‑nested **Section → Category → Subcategory → Product Family**, with `aliases[]` (one internal node ← many supplier categories) and full page fields (hero, icon, description, buying guide, FAQs, featured products, SEO).
- **Attribute Registry** (`attributes`): the anti‑hard‑coding core — `dataType`, multilingual `displayName`, `unit`, `group` (Technical/Dimensions/Packaging/Performance/Installation), `isSearchable/isFilterable/isSortable/isComparable`, `displayPriority`, `icon`, `options`, `aliases`. Drives filters, facets, comparison tables, spec blocks.
- **Manufacturers** (new) — distinct from **Brands**; Brands extended to first‑class (logo, banner, rich description, country, website, downloadable **catalogues**, aliases, featured).
- **Units** (new) — controlled vocabulary with `aliases[]`.
- **Products**: `legacyKey` (idempotent identity), full **lifecycle** (Draft/Active/Coming Soon/Out of Stock/Price on Request/Discontinued/Hidden/Archived), `manufacturer`, registry‑driven `attributes`, **media** (primary/gallery/assets: installation, lifestyle, technical drawings, PDFs, BIM), the six **relationships** (related/accessories/compatible/replacement/alternative/frequently‑bought), `searchText`, `needsReview`/`reviewNotes`, and future‑ready `barcode`/`netWeight`/`netVolume`/`certifications`.
- **Variations**: `sku` unique (the **sync key**), extended attribute types (incl. packaging kg/litres, sheet, per‑m²), `barcode`, price/price‑on‑request/stock.
- **Import audit**: `import-profiles` (DB‑driven column mapping per supplier), `import-runs` (source, checksum, timing, imported/updated/skipped/deleted, warnings/errors, user, rollback snapshot), `import-logs` (per‑row outcomes).
- **Synonyms** (new) + **Homepage** global (fully configurable section blocks — Featured Brands/Categories/Products, auto Popular/New/Recent/Promotions, Editorial).

### Import services — modular, reusable (`src/services/import/`)
Separate stages, single responsibilities, no monolith: **SpreadsheetAdapter** (ODS/XLSX/CSV/TSV) → **mapper** (the LiderConstruct two‑sheet profile) → **normalizer** (locale numbers, aliases, slug) → **validator** (integrity, skip‑don't‑stop) → **deduplicator** (confidence scoring) → **matcher** (by `legacyKey`) → **planner** (field‑scoped modes) → **executor** (batched upserts) → **logger** + **rollback**. Modes: full / incremental / **price‑only** / **stock‑only** / product‑only / **dry‑run**. The pure stages have zero Payload dependency (independently runnable + testable — which is how this dry‑run executed).

### Search — abstracted behind an interface (`src/services/search/`)
`SearchService` interface + `PostgresSearchService` + a Meili‑ready `buildSearchDocument()` + a `getSearchService()` factory keyed on `SEARCH_DRIVER`. The application layer never names the engine, so PostgreSQL → Meilisearch → AI is a swap, not a rewrite. (`unaccent` + `pg_trgm` to be enabled via migration.)

---

## 2. Dry‑run results (executed on the real file)

`sha256 fd614140…` · 8,032 rows processed in **1.9 s** (~**4,200 rows/s**, single‑process, unoptimized).

### Statistics
| Metric | Value |
|---|---|
| Product rows | 2,331 |
| Importable products (test row excluded) | **2,330** |
| Unique products (by `legacyKey`) | **2,325** |
| Variation rows | 5,701 |
| Importable variations (distinct referenced SKUs) | **5,686** |
| Multi‑variation products | 1,122 (max 12, avg 2.44) |
| Distinct supplier categories | 127 |
| Distinct brands | 61 |
| Distinct units (after dropping bogus `Marime`) | 12 |
| Price‑on‑request (this file) | 0 |
| Missing brand | **623** |
| Missing unit | **805** (782 blank + 23 bogus `Marime`) |
| Missing category | 0 |

### Mapping (unknowns reported, never auto‑created)
With no internal taxonomy/brand/unit aliases seeded yet, the engine reports **all** supplier values as unmapped — exactly the intended behaviour:
- **127 supplier categories** → need assignment to internal taxonomy nodes (top: Uși de interior 525, Uși metalice 95, Tencuială mozaicată 86, Mânere și rozete 74, Laminat 67…).
- **61 brands** → need a brand record/alias each (623 products have none).
- **12 unit strings** → map to the Units vocabulary (`buc` 1094, `sac` 168 + `saci` 3, `1 m2` 95 + `m2` 75, `kg` 7 + `Kg` 3, `foi` 33, `val` 25, `ml` 16, `Cutie` 4, `Rulou` 2).

These become aliases once approved, after which re‑runs map automatically.

### Integrity (skipped/quarantined — run never stops)
| Code | Count | Detail |
|---|---|---|
| `DUPLICATE_SKU` | **1** | `LC-15463` on variation rows 993 & 994 → quarantine |
| `ORPHAN_VARIATION` | **13** (+1 test `LC-0`) | `LC-10387/1‑5`, `LC-14986/1‑2`, `LC-23066/5`, `LC-39066/1‑5` |
| `SUSPICIOUS_PRICE` | **11** | prices < 1 lei (e.g. `LC-40911`…`LC-41033`, `LC-11458/1`) → warning |
| `INCOMPLETE_PRODUCT` | **1,276** | imported but flagged `needsReview` (missing brand/unit/category) |

> Note: 2,330 product rows resolve to 2,325 `legacyKey`s — **5 rows share a base SKU** with another and would unify on import (flagged). Truly distinct same‑name products differ by base SKU and appear in the duplicate report below.

### Duplicate candidates (no auto‑merge — review report with confidence)
**145** suspected‑duplicate pairs across same‑name groups; **20 at 0.95** (identical name + same category + brand + unit, e.g. *Vata minerala Isover Rio Alu* `LC-10783`/`LC-10792`), **124 at ≥0.75**. Each pair lists its reasons. Nothing is merged.

### Performance
1.9 s for this catalog. The batched/queued path (500–1,000‑row transactions, GIN indexes, background Jobs) is what scales to the 1M‑product / 5M‑variation target — see the architecture doc.

---

## 3. Confirmation & next step

**No writes occurred.** This was a pure read → analyse → report pass; the database is untouched.

To proceed I need from you:
1. **Go for the real import?** I'd run it in this order: enable `unaccent`/`pg_trgm` (migration) → seed Units + the internal taxonomy and attach the supplier‑category aliases (so categories map instead of reporting unmapped) → run a **first write as `product_only`** (no prices yet) or **full**, your call → then verify counts and the `import-runs`/`import-logs` audit.
2. **Taxonomy assignment:** the importer can't invent your business taxonomy. Either you give me the Section→…→Family tree (or approve my earlier ~8‑section proposal) and I'll encode it + map the 127 supplier categories to it, or we import now with categories left unmapped (products flagged) and map later.
3. **Brand/unit seeding:** OK to auto‑create the 61 brand records and 12 unit records from the distinct values (then refine), or keep them unmapped + flagged until you provide canonical lists?

Say the word and I'll execute the import (still reversible via the run snapshot) and report the written counts. No frontend until the catalog is populated and you're satisfied with the data.
