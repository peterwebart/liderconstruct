# Supplier Feed & Import Architecture — PIM Design

**Project:** LiderConstruct · **Feed analyzed:** `liderconstruct-price_export_15_mai_2024.ods` · **Status:** Proposed (v2 feed contract) / Shipped (import pipeline)

This document audits the current supplier spreadsheet against evidence from the actual file, then redesigns the feed and import architecture for 10,000+ products, multiple suppliers, AI enrichment, and incremental updates. Two framing rules govern everything below: **the spreadsheet is a feed, never the source of truth** (Payload CMS is), and **imports may create and update but never silently destroy** (lifecycle transitions instead of deletes, review flags instead of guesses).

Because a substantial PIM layer already exists in this codebase, recommendations are marked **[EXISTS]** (built, battle-tested against this file) or **[NEW]** (proposed). This is a gap analysis, not a greenfield fantasy.

---

## 1. Current Structure Analysis (Audit)

### 1.1 Inventory

| Sheet | Rows | Columns | Role |
|---|---|---|---|
| `Produse` | 2,331 | 56 | Product master (identity, category, brand, ~44 attribute columns) |
| `Variații` | 5,701 | 28 | Sellable units (SKU, price, 12 paired variation-attribute columns) |

Relationship: `Produse["Variații"]` holds a **comma-separated list of variation SKUs** — the only join between the sheets. Average 2.44 variations per product, max 12.

### 1.2 What the evidence shows

**Identity is derived, and it broke.** There is no product key column. Product identity is inferred as the base of the first referenced SKU (`LC-15463/2` → `LC-15463`). Measured consequences in this file: **5 base-key collisions** (LC-10378, LC-14977, LC-15463, LC-15508, LC-39055 — two product rows each), **12 SKUs referenced by more than one product**, and one true identity error: **`LC-15463` appears twice on `Variații` as two different products** — *Glet Supraten Eurofin SV+* (209 lei) and *Glet Ceresit CT 127* (215 lei), different brands under one key. The importer now merges duplicate keys defensively and flags for review, but the underlying data is wrong and only the supplier can re-key it.

**The wide format does not scale.** Of 56 `Produse` columns, **28 are under 10% filled**; `Clasa de abraziune` has exactly **1 value in 2,331 rows**, `Capacitate` has 3. Twelve-plus columns exist solely for doors ("Grosime foaie ușă", "Tip lacăt", "Umplutura ușă"…) because doors are 22.5% of the catalog (Uși de interior: 525 products). Every new category will demand new global columns — the classic wide-format death spiral.

**Prices are baked into attribute labels.** `Variații` carries 12 *pairs* of columns: `X fără preț` (clean value: `95cm x 202,5cm`) and `X` (value with price concatenated: `95cm x 202,5cm - 74,5 lei`, comma decimals). This is a WooCommerce variation-label export artifact. Price now lives in two places with two formats; any price update desynchronizes the label.

**Dead and dangerous columns.** `Este` is the constant `1` for all 5,701 rows — zero information. A test row (`LC-0` / "Test product") ships in the production feed. The RU description column (`Область применения`) is filled for **38 rows (1.6%)** vs 740 (31.7%) for Romanian, with trailing whitespace in values.

**Referential integrity is one-directional.** Zero dangling references (good), but **13 orphan variations** exist on `Variații` that no product references (`LC-10387/1..5`, `LC-14986/1..2`, `LC-23066/5`, …) — silently unsellable today.

**Semantics are implicit.** No currency, no VAT flag, no stock column (status is inferred), no lifecycle flag (a product missing from the feed is indistinguishable from a mistake), no supplier identifier, no feed date. Notably, *this* export has **full price coverage** (5,701/5,701 numeric, min 0.20, max 23,199 lei; zero price-on-request rows) — the storefront's price-on-request handling is defensive, and the contract below makes that state explicit rather than encoded as 0.00.

**Reference data is nearly clean, with instructive exceptions.** Brands: 61 raw values → 60 after folding; the single variant pair is `Euro AS` / `Euro As`. But **623 products (26.7%) have no brand at all**. Units: 13 raw values for what are 9 real units — case variants (`kg`/`Kg`), singular/plural (`sac`/`saci`), pack-descriptions-as-units (`1 m2`), and one outright category error: **`Marime` (23×) is a variation-attribute name leaked into the unit column**. Categories: 127 distinct flat strings with a long tail of single-product categories (OSB 3, Placaj, PFL, Tablă zincată… each 1 product); 3 remain intentionally unmapped pending business decision (OSB 3, Bandă adezivă, Plasă "rabița"). Product names are **not** identities: 80 duplicated names ("Lambriu din lemn A" ×9).

### 1.3 Hidden assumptions the current feed relies on

That the first SKU in the `Variații` list determines product identity; that SKU order in the list is stable; that a variation's `Denumire` duplicates the product name (fully denormalized labels); that absence of price-on-request will hold; that every attribute deserves a global column; that one supplier (`LC-` namespace) is forever.

---

## 2. Supplier Feed Redesign

Replace the two-sheet wide export with a **four-sheet narrow workbook**. Product facts and sellable-unit facts separate cleanly; sparse attributes go long; feed metadata becomes explicit.

### Sheet split and field ownership

**`products` — one row per product identity.** Fields that describe *what the product is*, independent of how it's sold: `supplier_code`, `product_key`, `name_ro`, `name_ru`, `brand`, `manufacturer`, `supplier_category`, `unit`, `country_of_origin`, `application_ro`, `application_ru`, `lifecycle`. A field belongs here iff it is identical for every sellable variant.

**`variations` — one row per sellable unit.** Fields that determine *what you put in a cart*: `variation_key` (the SKU), `product_key` (explicit foreign key — the comma-list join dies), up to two variation axes as `axis1_key`/`axis1_value`/`axis2_key`/`axis2_value`, `price`, `currency`, `vat_included`, `price_on_request`, `stock_status` (or `stock_qty`), `barcode`. Price, stock, packaging, size, opening direction, per-variant color: always here, never on the product.

**`attributes` — long format, one row per (product, attribute).** `product_key`, `attr_key`, `value`, optional `value_ru`. This absorbs all 44 sparse columns: a door ships 15 attribute rows, a bag of gravel ships 3, and adding a new attribute for a new category costs zero schema changes. Attribute keys must come from the published registry (§7); unknown keys import as warnings, not columns.

**`_meta` — one row of feed facts.** `supplier_code`, `generated_at`, `currency`, `schema_version`, `products_count`, `variations_count`. Counts enable reconciliation (parsed vs declared); `schema_version` lets the import profile evolve without breaking.

The decisive test for placement: *if changing this value should create a new cart line, it is variation-level; if it re-describes the same cart line, it is product-level; if it is sparse or category-specific, it is an attribute row.*

---

## 3. Stable Product Identity Strategy

Names change (80 duplicates prove they never identified anything), categories get remapped, brands get corrected, descriptions get rewritten. Identity must survive all of that. Three keys:

| Key | Level | Issued by | Stability contract |
|---|---|---|---|
| `variation_key` | Sellable unit | Supplier (`LC-15463/2`) | Immutable for the life of the SKU. **The sync key.** [EXISTS as `variations.sku`, unique] |
| `product_key` | Product identity | Supplier, **explicit column** [NEW] | Immutable; groups variations. Today derived as base-SKU → becomes declared. Maps to `products.legacyKey` (unique). |
| `supplier_code` | Namespace | Us, per supplier registry | Scopes both keys: uniqueness is `(supplier_code, key)`, so Supplier B's `1001` never collides with LC's. [NEW column; DB field added at multi-supplier onboarding] |

**Matching precedence at import** [EXISTS in matcher, extended by supplier scope]: (1) exact `(supplier_code, variation_key)` → update variation; (2) exact `(supplier_code, product_key)` → update product, reconcile variation set; (3) no match → create; (4) name similarity is **report-only** — the deduplicator suggests, a human merges, the importer never merges by name. Derivation of `product_key` from base SKU remains as a fallback for v1 feeds only, with the duplicate-key collapse + `DUPLICATE_LEGACY_KEY_MERGED` warning shipped after the LC-15463 incident.

---

## 4. Category Architecture

The supplier's 127 flat strings are *their* vocabulary; the storefront navigates *ours*. Keep them decoupled forever.

**Internal taxonomy** [EXISTS]: four levels — Section → Category → Subcategory → Family (80 nodes seeded). Example: `Amenajări interioare → Uși → Uși de interior → (family by construction)`; `Materiale de bază → Plăci → Gips-carton`.

**Mapping via aliases** [EXISTS]: every taxonomy node carries `aliases[]`; the importer folds the supplier string (lowercase, diacritics stripped, punctuation collapsed) and resolves through the alias registry — 124 aliases approved and seeded. Supplier renames cost one alias row, zero code.

**Unmapped policy** [EXISTS]: an unmapped category never blocks an import; products land with `needsReview` and surface in the admin validation view. Current pending set: **OSB 3, Bandă adezivă, Plasă "rabița"** — awaiting a business decision on placement, exactly as designed.

**Normalization opportunities** (supplier-side, from the audit): the long tail of single-product categories is legitimate but should not spawn taxonomy nodes — map them into existing families (e.g., `OSB 3` → Plăci OSB family; `Tablă zincată` → Tablă). Doors dominating one flat category (525 products) argues for family-level mapping hints in v2: the optional `category_path` column (`Uși > Uși de interior > Cu geam`) is treated as a *hint* for the alias resolver, never trusted as structure.

---

## 5. Brand Architecture

Audit result: 61 raw → **60 canonical brands** [EXISTS, seeded with alias support]; exactly one spelling variant pair found. Mapping table (the interesting rows — everything else maps 1:1):

| Raw value(s) in feed | Canonical | Mechanism |
|---|---|---|
| `Euro AS`, `Euro As` | Euro AS | alias on Brands.aliases [EXISTS] |
| *(empty — 623 products, 26.7%)* | *(no brand)* | Explicitly allowed: generic building materials are legitimately unbranded. Contract: empty means *intentionally unbranded*, not unknown. AI enrichment may *suggest* a brand from the name (e.g., "Rigips" inside `Gips Carton 12,5mm Rigips`) → `ai_suggested`, human confirms. |
| Any future variant (`ROCKWOOL`, `Rockwool SRL`) | Rockwool | one alias row, no code |

Rule: the storefront never renders a raw feed brand string; only canonical registry entries with slugs render, which is what makes `/brand/[slug]` pages and brand facets stable.

---

## 6. Unit Architecture

13 raw values → **9 canonical units** [EXISTS in Units collection with aliases: code, label, symbol]:

| Canonical code | Feed variants observed | Rule applied |
|---|---|---|
| `buc` | `buc` (1,094) | identity |
| `sac` | `sac` (169), `saci` (3) | singular/plural fold |
| `m2` | `m2` (75), `1 m2` (95) | `1 m2` is a **pack description**, not a unit → unit `m2`; the "1" belongs to the variation's packaging axis |
| `kg` | `kg` (7), `Kg` (3) | case fold |
| `foaie` | `foi` (33) | plural fold |
| `rulou` | `val` (25), `Rulou` (2) | synonym + case (val = rulou in trade usage) |
| `ml` | `ml` (16) | identity |
| `cutie` | `Cutie` (4) | case fold |
| `set` | — | registry entry, unused in this feed |
| — | **`Marime` (23)** | **rejected**: a variation-attribute name in the unit column. Validator emits an error with suggested fix; those 23 products need supplier correction. |

Normalization pipeline [EXISTS in `aliasKey`]: trim → lowercase → strip diacritics → collapse punctuation/whitespace → alias lookup. The v2 contract goes further: the `unit` column must contain a **canonical code** from the published list; anything else is a validation error, not a guess.

---

## 7. Attribute Architecture

**Registry** [EXISTS]: 50 attributes seeded, each with `key`, `displayName` (localized), `dataType` (text | number | boolean | enum | range | dimension), `group` (technical | dimensions | packaging | performance | installation | general), `isFilterable`, `isSearchable`, `isComparable`, `displayPriority`. Facets, the spec table, and search indexing are all registry-driven — adding an attribute is a CMS row, not a deploy.

Representative registry entries derived from this feed:

| key | Display (RO) | Type | Filter | Search | Compare | Role |
|---|---|---|---|---|---|---|
| `tip_material` | Tip material | enum | ✓ | ✓ | ✓ | product spec + filter |
| `grosime_mm` | Grosime (mm) | number | ✓ | — | ✓ | spec + filter; **variation axis** for boards |
| `lungime_mm` / `latime_mm` | Lungime/Lățime (mm) | number | ✓ | — | ✓ | spec + filter |
| `culoare` | Culoare | enum | ✓ | ✓ | — | filter; **variation axis** for paints/doors |
| `consum` | Consum | text | — | — | ✓ | spec only |
| `conductivitate_termica` | Conductivitate termică (W/mK) | number | ✓ | — | ✓ | performance spec + filter (insulation) |
| `densitate_kg_m3` | Densitate (kg/m³) | number | ✓ | — | ✓ | performance spec |
| `fractia_mm` | Fracția (mm) | range | ✓ | — | ✓ | aggregates filter |
| `tip_deschidere` | Tip deschidere | enum | ✓ | — | ✓ | doors filter |
| `dimensiuni_usa` | Dimensiuni ușă (cm) | dimension | ✓ | — | — | **variation axis** (doors, 2,502 rows) |
| `ambalare` | Ambalare | text | — | — | — | **variation axis** (kg/litri/foaie packs) |
| `tara_origine` | Țara de origine | enum | ✓ | — | ✓ | spec + filter |

Three roles, one registry: **variation axes** (drive the buy-panel picker: `dimensiuni_usa`, `ambalare`, `marime`, `grosime`, `lungime`, `culoare`, `deschidere`, `cantitate` — exactly the 12 paired columns, minus the price-in-label disease), **filters** (registry `isFilterable`, rendered by the faceted listing), **specifications** (everything in the registry renders in the grouped spec table). The 12-column door cluster becomes ~15 `attributes` rows per door — the long sheet is what makes category-specific richness free.

---

## 8. Product Variation Strategy

**The rule:** rows are variations of one product iff they share product identity and differ *only* on declared variation axes (size, packaging quantity, opening direction, color-as-variant). If brand differs, composition differs, or the name describes a different thing — standalone products.

Applied to the file: *Gips Carton 12,5mm Rigips* with packs `1 foaie - 75 lei` is one product, one packaging-axis variation [correct as-is, minus price-in-label]. A door in 8 sizes (`45cm x 202,5cm` … `95cm x 202,5cm`) is one product, eight `dimensiuni_usa` variations [correct]. **`LC-15463` is the counter-example:** Supraten Eurofin SV+ and Ceresit CT 127 are different brands and different products sharing one key — must be split into two `product_key`s by the supplier; no variation model can represent it. The 1,209 single-variation products (bare `LC-n` SKUs) stay as *product + one variation* — the uniform Product → Variation → price/stock model [EXISTS] keeps cart, import, and search logic free of special cases. Inventory hangs off the variation (`stock_status` today; `stock_qty` when the supplier can provide it).

---

## 9. Import Strategy

**Pipeline** [EXISTS, verified end-to-end against this file]: adapter (ODS/XLSX/CSV/TSV, ESM-safe) → profile mapper → normalizer → validator → deduplicator (report-only) → matcher → planner → executor (batched, snapshot for rollback) → logger. Modes [EXISTS]: `dry_run` (default — plans and reports, writes nothing), `full`, `product_only`, `price_only`, `stock_only`. Every run persists to ImportRuns/ImportLogs with per-issue codes and suggested fixes.

**Additions [NEW]:**

`delta` mode — the mapper computes a content hash per canonical row; ImportRuns stores the last hash per key; unchanged rows skip the planner entirely. At 10,000+ products this turns the nightly full feed into a seconds-long no-op plus the handful of real changes.

`--deactivate-missing` flag (full mode only, explicit opt-in) — product keys present in the DB but absent from a *complete* feed transition `lifecycle → discontinued` (never deleted; storefront hides, admin retains). Without the flag, absence means nothing — which is the safe default given today's feed can't distinguish "removed" from "forgot".

Slim delta contracts — `price_only` accepts a two-column file (`variation_key`, `price` [+ `price_on_request`]); `stock_only` accepts (`variation_key`, `stock_status|stock_qty`). Suppliers can send these hourly without touching the master workbook.

Reconciliation — validate parsed counts against `_meta` declared counts; mismatch is a hard warning before execute.

Scheduling — once feeds arrive by URL/SFTP, a cron entry through the existing CLI bootstrap (`runCli`) runs `delta` nightly and `stock_only` hourly; the architecture needs no changes, only a fetch step in front of the adapter.

---

## 10. AI Enrichment Layer

The schema already anticipates this: Products carry `enrichmentStatus` (`none` → `ai_suggested` → `human_reviewed`) [EXISTS]. The governing rule is **provenance separation**: supplier-owned fields may be overwritten by imports and never by AI; enrichment-owned fields are never touched by imports.

| Never from the feed (AI-generated, human-reviewed) | Always from the feed (AI read-only) |
|---|---|
| `seo.metaTitle`, `seo.metaDescription` | identity keys, names |
| `description` (rich), `shortDescription` | price, currency, VAT, stock |
| benefits, `faqs[]`, `keywords` | brand, category string, unit |
| the 9 relation rails (accessories, similar, alternatives, frequentlyBoughtTogether…) | physical attributes, country of origin |
| buying guides (category-level) | lifecycle |

One field sits on the boundary: `applicationArea` — the supplier's value (31.7% filled) imports as fact; AI may *propose* filling the 68% gap, landing as `ai_suggested` until reviewed. AI may also propose brand extraction for the 623 brandless products (§5) and category mappings for new supplier strings — proposals feed the same review queue, never auto-apply. This split is what lets a nightly re-import run without ever clobbering a copywriter's work.

---

## 11. Future Multi-Supplier Readiness

The design scales to Suppliers A/B/C without redesign because identity is namespaced and mapping is per-profile:

`supplier_code` on every feed row + a supplier registry (name, code, default currency, contact). **ImportProfiles** [EXISTS] already model per-source column mapping — onboarding Supplier B is a new profile row (their column names → canonical contract), their alias additions (their brand/category/unit spellings), and their `supplier_code`. Uniqueness becomes `(supplier, product_key)` / `(supplier, variation_key)` — a small schema migration adding `supplier` to Products/Variations when the second supplier arrives, defaulting existing rows to `LC`.

The deliberate deferral: when two suppliers sell the *same physical product*, that is an **offers model** (one product, N supplier offers with price/stock each) — the marketplace pattern. Do not build it now; the identity design keeps the door open because product identity was never conflated with supplier offer (a `Variation` can later grow a `supplier` + become the offer row, or an Offers collection can hang off Variations). Barcode/EAN in the v2 contract is the future cross-supplier matching hint.

---

## 12. Deliverables

### A. Current Spreadsheet Audit
Section 1, evidence-grounded. Headline defects: derived identity (5 collisions; LC-15463 is two different products under one key), 28/56 columns <10% filled, prices baked into attribute labels with comma decimals, dead `Este` column, test row LC-0 in production, 13 orphan variations, 12 multi-referenced SKUs, `Marime` in the unit column (23×), RU coverage 1.6% with whitespace noise, no currency/VAT/stock/lifecycle/supplier/date columns.

### B. Recommended Spreadsheet Structure
Section 2: four sheets — `_meta`, `products`, `variations`, `attributes` (long). Shipped as a fillable template: **`docs/design/supplier-feed-template-v2.xlsx`** (headers, validation notes, three real sample rows per sheet).

### C. Recommended Import Contract
Encoding UTF-8; values trimmed; decimal **point** (no comma), no thousands separators; dates ISO-8601. Required on `products`: `supplier_code`, `product_key`, `name_ro`, `supplier_category`, `unit` (canonical code). Required on `variations`: `variation_key`, `product_key`, `price` **or** `price_on_request=true`, `currency`, `stock_status` ∈ {in_stock, low_stock, out_of_stock} (or `stock_qty` ≥ 0). Keys immutable; `variation_key` unique per supplier; every `variations.product_key` must exist on `products` (dangling = row error). Unknown `attr_key` → warning; unknown `unit` → error with suggestion; duplicate `product_key` → error (no more silent merging once v2 is adopted). `lifecycle` ∈ {active, discontinued}; absence from a full feed changes nothing unless `--deactivate-missing`. Imports never delete.

### D. Recommended Database Mapping

| Feed column | Payload target | Notes |
|---|---|---|
| `products.product_key` | `products.legacyKey` (unique) | match key #2 |
| `products.name_ro` / `name_ru` | `products.title` (localized ro/ru) | |
| `products.supplier_category` | `products.category` via Categories.aliases | unmapped → `needsReview` |
| `products.brand` | `products.brand` via Brands.aliases | empty = unbranded |
| `products.unit` | `products.unit` via Units (canonical code) | |
| `products.application_ro/ru` | `products.applicationArea` (localized) | AI may fill gaps as `ai_suggested` |
| `products.lifecycle` | `products.lifecycle` | active/discontinued mapping |
| `attributes.(attr_key,value)` | `products.attributes[]` | registry-validated |
| `variations.variation_key` | `variations.sku` (unique) | match key #1, sync key |
| `variations.product_key` | `variations.product` (relation) | replaces comma-list join |
| `variations.axis*_key/value` | `variations.attributes[]` + `label` | drives buy-panel picker |
| `variations.price`, `price_on_request` | `variations.price`, `priceOnRequest` | never 0-means-something |
| `variations.stock_status/qty` | `variations.stockStatus` | qty maps by threshold rule |
| `_meta.*` | ImportRuns metadata | reconciliation + provenance |

### E. Risks & Data Quality Issues

| # | Risk | Severity | Mitigation |
|---|---|---|---|
| 1 | LC-15463: two products, one key | **Critical** | Supplier must re-key one product; until then the merged record stays `needsReview` |
| 2 | Derived identity → collisions | High | v2 explicit `product_key`; interim collapse + warnings [SHIPPED] |
| 3 | Price duplicated in labels | High | v2 removes labels-with-price; price is one numeric column |
| 4 | Orphan variations (13) | Medium | v2 dangling-FK validation makes them impossible; current ones fixed at source |
| 5 | `Marime` as unit (23 rows) | Medium | validator error + supplier fix list |
| 6 | 26.7% brandless | Low/accepted | contract: empty = intentional; AI suggestion queue |
| 7 | RU nearly empty (1.6%) | Low | RU optional in contract; enrichment fills post-launch |
| 8 | Test row in prod feed | Low | contract forbids; validator rejects `product_key` on a denylist |
| 9 | Absence ≠ discontinuation | Medium | `lifecycle` column + opt-in `--deactivate-missing` |
| 10 | Wide format at 10k products | High | long `attributes` sheet in v2 |

### F. Migration Plan
**Phase 0 (done):** v1 feed imports today through the LC profile — adapter/mapper/collapse handle its defects; 2,325 products / 5,686 variations land with 5 merge warnings. **Phase 1 — source hygiene (supplier, ~days):** split LC-15463; remove LC-0; fix or delete the 13 orphans; correct 23 `Marime` units; fix `Euro As`. **Phase 2 — adopt v2 (supplier + us, ~1–2 weeks):** hand over the template; add a `liderconstruct-v2` ImportProfile (mapper for the four-sheet contract); run both profiles in parallel one cycle; compare dry-run reports; cut over. **Phase 3 — incremental ops:** `delta` mode + content hashes; hourly `stock_only` / `price_only` slim files; optional scheduler through the CLI bootstrap. **Phase 4 — multi-supplier:** supplier registry + `supplier` field migration + Supplier B profile; offers model deferred until two suppliers genuinely overlap.

### G. Example Final Spreadsheet Layout
Real data, v2 shape (full fillable version in the template file):

`_meta` — `supplier_code=LC · generated_at=2024-05-15 · currency=MDL · schema_version=2 · products_count=2325 · variations_count=5686`

`products`

| supplier_code | product_key | name_ro | brand | supplier_category | unit | lifecycle |
|---|---|---|---|---|---|---|
| LC | LC-10009 | Gips Carton 12,5mm Rigips | Rigips | Gips carton | foaie | active |
| LC | LC-15463 | Glet Supraten Eurofin SV+ | Supraten | Gleturi | sac | active |
| LC | LC-15464 | Glet Ceresit CT 127 | Ceresit | Gleturi | sac | active |

`variations`

| variation_key | product_key | axis1_key | axis1_value | price | currency | price_on_request | stock_status |
|---|---|---|---|---|---|---|---|
| LC-10009 | LC-10009 | ambalare | 1 foaie | 75.00 | MDL | false | in_stock |
| LC-15463 | LC-15463 | ambalare | sac 20 kg | 209.00 | MDL | false | in_stock |
| LC-15464 | LC-15464 | ambalare | sac 25 kg | 215.00 | MDL | false | in_stock |

`attributes`

| product_key | attr_key | value |
|---|---|---|
| LC-10009 | grosime_mm | 12.5 |
| LC-10009 | tip_material | Gips-carton |
| LC-15463 | consum | 1.0–1.2 kg/m² |

Note the LC-15463/LC-15464 rows: that is the audit's critical finding *fixed at the source* — two products, two keys.
