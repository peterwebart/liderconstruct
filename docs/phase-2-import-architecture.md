# LiderConstruct — Phase 2: Catalog Analysis & Import Architecture

**Scope:** analysis + architecture only. No importer implemented, no schema migrated. Awaiting approval.
**Supersedes:** `catalog-import-analysis.md` (extends it to the full Phase‑2 brief).
**Source analysed:** `liderconstruct-price_export_15_mai_2024.ods` — sheets `Produse` (2,331×56) and `Variații` (5,701×28).
**Governing rules honoured:** nothing hard‑coded (categories, brands, units, attributes, filters are all DB‑driven); products and variations stay separate; **supplier SKU is the primary sync key**; imports update, never recreate; integrity preserved; designed to scale without re‑architecture.

---

## STEP 1 — Dataset analysis

### General statistics (measured)
| Metric | Value | Notes |
|---|---|---|
| Total product rows | **2,331** | incl. 1 test row (`Test product`) |
| Unique products | **2,330** | by `legacyKey`; 135 rows share a *name* but are distinct |
| Product variations | **5,701** | incl. 1 test (`Test produs`, `LC-0`) |
| Variations per product | **2.45 avg** | 1,209 single · 1,122 multi · max **12** |
| Categories | **127** | flat (no hierarchy in source) |
| Subcategories | **0 present** | must be created (see Step 3 taxonomy) |
| Brands | **61** | 623 rows (27%) have **no brand** |
| Manufacturers | **not in source** | only `Brand`; manufacturer is a future entity |
| Suppliers | **not in source** | single consolidated export; supplier dim is future |
| Units of measure | **13 distinct** | inconsistent; 782 rows (34%) missing |
| Languages | **RO (full), RU (negligible)** | RU = 1 field, 38/2,331 values |
| Image references | **none** | no image/photo/URL column anywhere |
| Technical doc references | **none** | no datasheet/certificate/PDF column |
| Barcodes / EAN | **none** | no barcode column |
| Country of origin | **1,017 (44%)** | `Tara de origine`; 56% missing |

### Product structure (determined)
- **Parent products** live in `Produse`; **variants** live in `Variații`. The parent→variant link is **`Produse["Variații"]` = a comma‑separated SKU list** (e.g. `LC-43122/1, LC-43122/2`) → resolves **5,687/5,688** distinct refs to a real SKU. **This is the authoritative linkage and the SKU is the sync key.**
- **SKU grammar:** `LC-<n>` (simple) / `LC-<n>/<k>` (variant member of product `LC-<n>`).
- **Attribute structure:** wide & sparse — **50** populated product attributes, **12** variation attributes. Two natural layers:
  - *Product‑level specifications* (shared): material, colour, dimensions, consumption, thermal conductivity, density, drying/application times, and a large **door** cluster (sheet/box thicknesses, opening type, lock type, glazing, set contents…).
  - *Variation‑defining attributes* (per SKU): see table.
- **Dimensions / colours / sizes / packaging / material / weight / volume / certifications:**
  | Concept | Where it is | Coverage |
  |---|---|---|
  | Dimensions | `Dimensiuni/Lungime/Latime/Grosime/Diametru (mm/m)`, door cutie dims | sparse, category‑specific |
  | Colours | `Culoare` (+ interior/exterior door colours) | 1,148 |
  | Sizes | variation `Mărime` (494), `Dimensiuni usa interior` (2,502) | strong on doors |
  | Packaging | variation `Ambalare kg` (669), `Ambalare Litri` (283), `Bucati/m2 in ambalaj` | partial |
  | Material | `Tip Material` | 858 |
  | Weight | **only packaging** `Ambalare kg` | no net weight |
  | Volume | **only packaging** `Ambalare Litri` | no net volume |
  | Certifications | **none** | future field |

**Variation‑defining attributes (value columns):**
| RO column | Rows | Canonical `type` |
|---|---|---|
| Dimensiuni usa interior | 2,502 | `door_dimensions` |
| Ambalare kg | 669 | `packaging_kg` |
| Lungime | 585 | `length` |
| Mărime | 494 | `size` |
| Cantitate | 378 | `quantity` |
| Deschidere usi metalice | 317 | `door_opening` |
| Ambalare Litri | 283 | `packaging_litres` |
| Foaia | 84 | `sheet` |
| Culoare | 47 | `colour` |
| Grosime | 30 | `thickness` |
| Ochiul | 30 | `eyelet` |
| 1 m2 | 17 | `per_m2` |

> Each variation attribute appears as a raw value column **plus** a `… fără preț` formatted twin — the twin is a display string and is dropped on import (the raw value is canonical).

### Attribute classification (searchable / filterable / displayed / hidden)
This is **stored per attribute in an Attribute Registry** (Step 4), never hard‑coded. Defaults proposed:

| Behaviour | Examples |
|---|---|
| **Searchable** (FTS) | name, brand, category/section, SKU, `Tip Material`, `Destinatie`, `Domeniu de aplicare`, `Culoare` |
| **Filterable** (facets) | brand, section/category, `Tip Material`, `Culoare`, `Grosime`, `Dimensiuni usa interior`, `Tip deschidere`/`Deschidere`, `Destinatie`, `Conductivitate termica` (range), `Fractia`, `Diametru`, price (range), stock |
| **Displayed** (spec sheet) | all dimensional/technical attrs (consum, densitate, timp uscare/aplicare, temperatura, door cutie dimensions, acoperire…) |
| **Hidden / internal** | `Este` (constant 1), every `… fără preț` twin, near‑empty legacy (`Clasa de abraziune` n=1), import bookkeeping |

---

## STEP 2 — Data quality audit

| Issue | Finding | Recommended cleaning |
|---|---|---|
| Duplicate products | 135 rows share a name; many are *distinct* products (diff SKUs/specs), some are modelling debt that should be variations | Keep separate (SKU‑identified); produce a **merge‑candidate review list**; never auto‑merge |
| Duplicate SKUs | **1** — `LC-15463` on two products at two prices (209 vs 215) | **Quarantine** both → human review |
| Duplicate barcodes | N/A — no barcodes | add `barcode` field + uniqueness check for future |
| Multi‑referenced SKUs | **13** SKUs referenced by >1 product (`LC-10378/1..3`…) | Quarantine → review |
| Orphan variations | **13** SKUs in `Variații` referenced by no product | Import unattached / report |
| Inconsistent naming | duplicate display names; commas inside names | preserve; rely on SKU; canonical URLs (Step 3) |
| Inconsistent capitalization | brand `Euro As`/`Euro AS` | brand `aliases` → one canonical |
| Inconsistent units | `kg`/`Kg`, `sac`/`saci`, `1 m2`/`m2`, bogus `Marime` | Units vocabulary + alias map; drop `Marime` |
| Broken hierarchy | none exists (flat 127) | build 2‑level taxonomy (Step 3) |
| Missing brands | **623 (27%)** | import `null` + flag; enrich later (no guessing) |
| Missing categories | 0 | — |
| Missing descriptions | rich descriptions effectively absent | generate from specs / enrich later |
| Missing prices | 0 in this file (min 0.20, max 23,199, median 999) | importer still supports **price‑on‑request** (≤0/blank) |
| Missing images | all (none in source) | future ImageMatcher (Step 8) |
| Missing specifications | sparse, wide | flexible spec model; per‑category presets |
| Invalid values | `Marime` as unit; suspicious 0.20 prices | reject/normalize; soft‑warn tiny prices |
| Inconsistent formatting | this file uses `.` decimals; RO suppliers use `,`; comma‑in‑name + comma‑separated SKU column = **CSV hazard** | locale‑aware parsing; require quoting; prefer ODS/XLSX |

**Cleaning recommendation:** run the importer **dry‑run** to produce the quarantine/merge/unmapped reports, fix at source where cheap (the 1 dup SKU, the `Marime` unit, the Euro As variant), and import the rest with gaps flagged for staged enrichment.

---

## STEP 3 — SEO analysis

- **URL structure (human‑readable, bilingual):**
  `/ro/produs/<slug>` · `/ru/produs/<slug>` · `/categorii/<section>/<category>` · `/branduri/<brand>`. Default‑locale RO may omit the prefix; RU always prefixed.
- **Slug generation:** per‑locale, diacritic‑folded, auto from name (already in the model); collision suffixing on the **135 duplicate names**.
- **Canonical strategy:** self‑canonical per product; for duplicate‑name products, canonical to the distinct SKU page; paginated/faceted category views canonical to the base category.
- **Multilingual URLs:** `hreflang` ro/ru + `x-default`; per‑locale slugs.
- **Meta title generation:** template `"{name} {brand} — {section} | LiderConstruct"`, overridable (SEO field group exists).
- **Meta description generation:** from short description else top specs (`{material}, {key dims}, {application}`), ≤155 chars.
- **Structured data:** `Product` + `Offer` (price, `MDL`, availability, "price on request" → no price), `Brand`, `BreadcrumbList`, `ItemList` on category pages, `Organization` site‑wide.
- **Breadcrumbs:** Section → Category → Product (drives `BreadcrumbList`).
- **Category hierarchy (proposed 2‑level, data‑driven via `aliases`):** ~8–12 sections over the 127 categories — e.g. *Uși și accesorii*, *Vopsele și lacuri*, *Gips‑carton și profile*, *Termoizolare*, *Pardoseli*, *Tencuieli și amestecuri*, *Acoperiș*, *Feronerie și fixare*.
- **Internal linking:** related products (same category/brand), brand→category cross‑links, section hubs, "frequently bought" later.

---

## STEP 4 — Database review & proposed normalized model

The increment‑1 model already separates **Products/Variations**, localizes RO/RU, and carries SEO. To satisfy the no‑hard‑coding rule and the future‑scale requirements **without over‑engineering today**, the model splits into *build‑now* and *future‑ready seams*.

### Build now (needed for import + catalog + search)
- **Sections/Categories** — existing self‑`parent`; add `aliases: text[]` (auto category mapping).
- **Brands** — add `aliases: text[]` (auto brand mapping + normalization).
- **Units** *(new, controlled vocabulary)* — `{ code, label(ro/ru), aliases[] }`. Replaces free‑text unit.
- **Attributes registry** *(new — the anti‑hard‑coding core)* — one row per attribute: `{ key, label(ro/ru), datatype (text|number|enum|range|bool), unit?, group, isSearchable, isFilterable, isDisplayed, isInternal, options[]? }`. Filters/specs/search are computed **from this table**, never from code.
- **Products** — add `legacyKey` (unique, indexed = product base SKU, for idempotent matching), `searchText`/tsvector (Step 9), `attributes: {key,value(ro/ru)}[]` (validated against the registry; replaces ad‑hoc `specs` so everything is registry‑driven), `lifecycle` enum `active | discontinued | archived`, plus future‑ready nullable `barcode`, `netWeight`, `netVolume`, `certifications[]`.
- **Variations** — `sku` stays **unique + indexed (sync key)**; extend `attributes.type` with `packaging_kg|packaging_litres|sheet|per_m2`; add nullable `barcode`; keep `price`/`priceOnRequest`/`stockStatus` (today's single price + simple stock).
- **ImportProfiles** *(new)* — per‑supplier/source config: `{ name, format, delimiter, decimalSeparator, sheet, columnMap (sourceHeader→canonicalField), defaults }`. New supplier = new profile **row**, not new code.
- **ImportRuns** *(new)* — `{ source, format, mode, profile, counts{created,updated,skipped,failed}, status, startedAt, finishedAt, snapshotRef }`.
- **ImportLogs** *(new)* — `{ run, rowNumber, sku, action (create|update|skip|error|quarantine), field?, message }`, exportable as the error/validation report.

### Future‑ready seams (designed, **not built today** — attach without refactor)
- **Suppliers** + **SupplierSkus** `{ supplier, variation, supplierSku, supplierPrice, currency, lastSeen }` → supplier‑specific SKUs + supplier sync. (Our `Variations.sku` remains the canonical internal key.)
- **PriceLists** + **Prices** `{ priceList, variation, amount, currency, validFrom/To }` → multiple price lists; **CustomerPriceGroups** later for B2B pricing. Today's `Variations.price` is "the default price list, denormalized"; migration path is additive.
- **Warehouses** + **StockLevels** `{ warehouse, variation, quantity }` → future inventory; today's `stockStatus` becomes a derived projection.
- **TechnicalDocuments** `{ product, type (datasheet|certificate|manual), file }` and **ProductImages** `{ product/variation, media, position, hash }` → docs & images later (Step 8).

```
Section(parent=null) ─┐
 Category(parent) ─────┼─ aliases[]
   Product ── legacyKey, brand→Brand(aliases[]), category→Category,
              attributes[]→Attribute(registry), lifecycle, searchText/tsv, SEO, ro/ru
     Variation ── sku(unique, SYNC KEY), price|priceOnRequest, stockStatus, attributes[]
Unit(aliases[])   Attribute(registry: searchable/filterable/displayed/internal)
ImportProfile     ImportRun 1─* ImportLog
[future] Supplier 1─* SupplierSku ;  PriceList 1─* Price ;  Warehouse 1─* StockLevel ;
         TechnicalDocument ; ProductImage
```

---

## STEP 5 — Import pipeline design (modular, reusable)

Service layer under `src/services/import/`, each stage a pure, independently‑testable unit with a single responsibility (no monolithic script). Orchestrated by a Payload **Job** (background, on the existing stack — no extra infra).

```
SourceAdapter → Parser → Mapper → Normalizer → Validator → Matcher → Planner → Importer/Updater → Logger/RollbackManager
   (format)     (rows)   (profile) (clean)     (integrity) (sku)    (dry-run)   (upsert/modes)     (audit/restore)
```

| Stage | Responsibility |
|---|---|
| **SourceAdapter** | one interface; `Ods/Xlsx/Csv/Tsv/Xml` + future `feed`/`api` implementations. SheetJS covers ODS/XLSX/CSV/TSV; a streaming XML adapter for feeds. |
| **Parser** | adapter → uniform raw‑row stream + sheet metadata (streamed, not all‑in‑memory). |
| **Mapper** | applies the **ImportProfile** `columnMap` → canonical fields (DB‑driven; no per‑supplier code). |
| **Normalizer** | locale‑aware numbers (`,`/`.`), Units/Brand/Category **alias resolution**, slug gen, trim, RU passthrough, attribute coercion via the registry. |
| **Validator** | schema + integrity rules: duplicate/conflict/orphan SKU, missing required, price sanity, test‑row exclusion → structured issues. |
| **Matcher** | variation by `sku`; product by `legacyKey` (then SKU‑set; **never name**) → create vs update. |
| **Planner** | builds the change set **without writing** → this *is* dry‑run; returns plan + issues + unmapped report. |
| **Importer/Updater** | applies change set in transactional batches; idempotent upserts; field‑scoped **modes** (below). |
| **Logger** | `ImportRun` + per‑row `ImportLogs` + performance metrics. |
| **RollbackManager** | snapshots affected records pre‑write; restores a given run. |

**No‑duplicate / update guarantee:** every write is an upsert keyed on `sku` / `legacyKey`; re‑imports update in place.

---

## STEP 6 — Import features (all supported)
- **Full** · **incremental** (changed rows only) · **price‑only** (touch `price`/`priceOnRequest`) · **stock‑only** (touch `stockStatus`) · **product‑only** (specs/attributes, never price) — modes are field‑scoped so a price list **never clobbers enriched data**.
- **Discontinued / archived** — `lifecycle` transitions (a SKU absent from a full supplier file → optionally mark discontinued, configurable per run).
- **Dry‑run** (default) · **rollback** (snapshot restore) · **validation report** · **duplicate & conflict detection** (Step 2 rules) · **import history** (`ImportRuns`) · **execution & error logs** (`ImportLogs`, CSV export) · **performance metrics** (rows/s, batch timings, counts).

---

## STEP 7 — Mapping engine (intelligent, report‑don't‑create)
- Auto‑maps **brands, categories, subcategories, units, attributes/specs** via DB `aliases`/registry + the ImportProfile `columnMap`.
- Resolution order: exact → alias → fuzzy suggestion (trigram) → **unmapped**.
- **Unknown values are reported, never silently created.** The dry‑run emits an "unmapped" list (new brand/category/unit/attribute candidates); a human approves them (which adds an alias/registry row), then re‑runs. This is the mechanism that keeps the catalog clean and **everything DB‑driven**.

---

## STEP 8 — Images (design now, build later)
- **ProductImages** + **Media** (sharp already configured; add **WebP** output + thumbnail sizes).
- Matching strategies: **filename**, **SKU** (`LC-43122-1.webp`), **URL import**, **supplier folder** scan, optional manifest.
- **Duplicate detection** by content hash (`ProductImages.hash`); **automatic optimization** (resize + WebP + thumbnails) on ingest.
- Runs as an `ImageMatcher` stage reusing the same Run/Log/rollback machinery. Not built this phase.

---

## STEP 9 — Search preparation (PG FTS now → Meilisearch later)
- **PostgreSQL FTS:** maintained `searchText` + a generated `tsvector` (GIN), `unaccent` + `simple` so RO diacritics match (`ușă`/`usa`); per‑locale documents for RO/RU.
- **Faceted filtering:** facets are generated **from the Attribute registry** (`isFilterable`) over a `jsonb` attribute store (GIN) + relationship filters (brand, section/category) + price range + stock; facet counts via aggregates. (A denormalized `product_search` projection keeps this fast at scale.)
- **Synonyms:** a DB **Synonyms** table (RO↔RU + RO variants, e.g. `gips carton ↔ гипсокартон`) feeding PG (`ts_rewrite`/custom dictionary) now and Meilisearch later — same source of truth.
- **Typo tolerance:** `pg_trgm` similarity as the PG‑era fallback; native in Meilisearch later.
- **Meilisearch‑ready:** the importer emits **one denormalized document per product** (RO+RU name, section/category path, brand, SKUs, filterable facets, variation attributes) — the same shape feeds PG FTS today and drops into a Meili index later with **no model change**.
- *Extension note:* `unaccent` and `pg_trgm` must be enabled on the managed Postgres (Coolify) — flagged as an infra dependency, enabled via migration `CREATE EXTENSION`, not a server package install.

---

## STEP 10 — Performance (100k+ products / 500k+ variations)
- **Batching:** stream‑parse; upsert in batches of **500–1,000 rows/transaction**; bulk `INSERT … ON CONFLICT` for create‑heavy loads; raw `COPY` path for very large full loads.
- **Indexing:** unique `variations.sku`; `products.legacyKey`; FKs `products.category/brand`, `variations.product`; **GIN** on tsvector + `jsonb` attributes; `pg_trgm` indexes for fuzzy mapping; partial index on `lifecycle='active'`.
- **Transactions:** per‑batch transactions with savepoints; a failed batch rolls back only itself and is logged; the Run captures a snapshot for full rollback.
- **Queue:** Payload **Jobs/Tasks** run imports in the background, chunked, resumable; large files processed in chunks so requests never block. At true scale, add a dedicated worker + read replica; consider **partitioning** `variations` (hash on product / by supplier) and a separate `product_search` table.
- **Headroom:** current 2.3k/5.7k load runs in‑process in seconds; the same batched/queued path scales to the 100k/500k targets on Postgres with the indexes above.

---

## DELIVERABLES SUMMARY
1. **Dataset analysis** — Step 1. 2. **Data‑quality audit** — Step 2. 3. **Normalized model** — Step 4 (build‑now + seams). 4. **DB improvements** — Step 4 (`legacyKey`, `aliases`, Units, **Attribute registry**, ImportProfiles/Runs/Logs, lifecycle, search fields). 5. **Import architecture** — Step 5. 6. **Mapping strategy** — Step 7 (report‑don't‑create). 7. **Search prep** — Step 9. 8. **Performance** — Step 10. 9. **Risks** — below. 10. **Final recommendations** — below.

### Risks
- Integrity errors imported as truth → dry‑run quarantine (1 dup SKU, 13 conflicts, 13 orphans).
- Wrong identity on re‑import (name drift / dup names) → `legacyKey`/SKU matching, never name.
- Price list clobbering enriched data → field‑scoped price‑only/stock‑only modes.
- CSV corruption (commas/locale decimals) → quoting + per‑file profiles; prefer ODS/XLSX.
- Taxonomy/brand/unit drift across suppliers → `aliases` + unmapped reports.
- Over‑engineering vs future scale → build‑now core only; future entities are documented seams, additive migrations.
- Postgres extension availability (`unaccent`, `pg_trgm`) on managed DB → confirm/enable.

### Final recommendations
1. Approve the **2‑level taxonomy** and **Attribute registry** (these make the platform fully DB‑driven).
2. Match strictly on **SKU/`legacyKey`**; names are display‑only.
3. **Dry‑run first**, always; review quarantine/unmapped/merge reports before any write.
4. Ship **price‑only** + **stock‑only** from day one (the ~95% ongoing case).
5. Build the **denormalized search document** during import so Meilisearch is a later switch, not a rebuild.
6. Add future seams (Supplier/PriceList/Warehouse/Docs/Images) only when needed — schema already accommodates them.

---

## Decisions needed before implementation
- **A. Taxonomy** — approve the ~8 sections (Step 3) or supply your grouping.
- **B. Attribute registry + Units vocabulary** — approve as the no‑hard‑coding mechanism (replaces ad‑hoc specs/free‑text units).
- **C. Future seams** — confirm "design now, build later" for Suppliers / PriceLists / Inventory / Images / Docs (i.e., I add only the build‑now collections this phase).
- **D. Missing brand (623) / unit (782)** — import `null` + flagged (recommended) vs hold.
- **E. Duplicate‑name products (135)** — keep separate + emit merge‑review list (recommended).
- **F. Integrity exceptions** — skip + report the dup/conflict/orphan SKUs (recommended).
- **G. First execution** — dry‑run on this file, review reports, then approve the write.
- **H. Postgres extensions** — OK to enable `unaccent` + `pg_trgm` via migration on the Coolify Postgres?

On approval I'll implement the Step‑4 schema changes + the Step‑5 services, run a **dry‑run** on this file, and present the change set, quarantine list, and unmapped report before anything is written.
