# LiderConstruct — Catalog Data Analysis & Import System Design

Source analysed: `liderconstruct-price_export_15_mai_2024.ods` (2 sheets: **Produse**, **Variații**).
Status: **analysis & design only — nothing imported.** Implementation awaits your approval.

---

## 0. Executive summary — the five things that decide the design

1. **The product→variation key is a SKU list, not the name.** `Produse["Variații"]` is a comma‑separated list of that product's variation SKUs (e.g. `LC-43122/1, LC-43122/2`). It resolves **5,687 of 5,688** distinct references to a real `Variații.SKU` (99.98%). This is the authoritative join and the backbone of the importer. Names are *not* safe (see #2).
2. **Names are unreliable; SKU is the synchronization key.** 135 product rows share a name with another row, and many "same name" rows are actually different products (different SKUs/specs) — some are modelling debt that *should* be variations. Never dedupe or match on name.
3. **There are real integrity errors that must be caught, not silently imported.** One SKU (`LC-15463`) is assigned to **two different products** at two different prices; **13** variation SKUs are referenced by **more than one** product; **13** variation SKUs are **orphans** (in `Variații`, referenced by no product). These need flagging + human review, never auto‑merge.
4. **The catalog is RO‑only and lightly enriched.** RU exists for **38 of 2,331** products (one field). **623 (27%)** products have no brand; **782 (34%)** have no unit; units are inconsistent (`kg`/`Kg`, `sac`/`saci`, `1 m2`/`m2`, and a bogus `Marime`). This is enrichment/build work, not something the import invents.
5. **Attributes are wide and sparse — a flexible spec model is correct.** 50 product‑level attribute columns are populated, dominated by a door cluster; variation attributes are led by `Dimensiuni usa interior` (2,502 rows). Fixed columns would be wrong; a typed key/value model with per‑category presets fits.

---

## 1. Dataset overview

| | Produse (Products) | Variații (Variations) |
|---|---|---|
| Rows | **2,331** | **5,701** |
| Columns | 56 | 28 (12 attribute pairs + base) |
| Distinct names | 2,251 | 2,255 |
| Role | Product‑level record + shared specs | One row per sellable SKU + price |

Average **2.45 variations per product**; 1,209 products are single‑variation, 1,122 are multi‑variation, structural max **12** variations per product (name‑grouping inflates this to 16 because of duplicate‑name rows).

---

## 2. Catalog composition

### Product count
**2,331** products / **5,701** priced variations (one test row in each — `Test product` / `Test produs` SKU `LC-0` — excluded on import).

### Categories
**127** distinct categories, **0 null**. Heavily skewed: the largest are `Uși de interior` (525), `Uși metalice` (95), `Tencuială mozaicată` (86), `Mânere și rozete` (74), `Laminat` (67), `Emailuri` (66), `Lacăte și accesorii` (55). A long tail of **35 categories with ≤3 products** (10 with exactly 1).

### Subcategories
**None exist in the data** — the taxonomy is flat. This is both a problem (127 flat categories is poor UX/SEO) and an opportunity. Proposed: a curated **two‑level taxonomy** (~8–12 top sections → existing 127 as subcategories), e.g.:

- **Uși și accesorii** ← Uși de interior, Uși metalice, Mânere și rozete, Lacăte și accesorii…
- **Vopsele și lacuri** ← Emailuri, Vopsea interior, Vopsea exterior, Lacuri, Grunduri…
- **Gips‑carton și profile** ← Gips carton, Profile, Profile pentru îmbinare…
- **Termoizolare** ← Vată minerală, Adezivi pentru termoizolare…
- **Pardoseli** ← Laminat, Pardoseli din vinil SPS, Plinte…
- **Tencuieli și amestecuri** ← Tencuială mozaicată/decorativă, Gleturi, Chituri, Amescuri uscate…
- **Acoperiș** ← Pelicule/membrane, jgheaburi/burlane…
- **Feronerie și fixare** ← Buloane, Cuie, Burghii, Șuruburi…

The map lives as data (see §8 — `aliases` on Category) so future supplier category strings auto‑resolve.

### Brands
**61** distinct brands; **623 (27%) products have no brand**. One case variant: `Euro As` / `Euro AS` → normalize to one. Largest: Novii Stili (361), Marley (139), Supraten (121), Spiritus (110), Kedr (80). Missing brands are an enrichment task — the importer should *not* guess brand from the product name.

### Product variations
Driven entirely by the SKU‑list linkage (§4). Variation axes actually used (value columns, non‑null):

| Variation attribute (RO) | Rows | Maps to type |
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

---

## 3. Attributes (product‑level specifications)

**50** product attribute columns carry data. They cluster into: a large **door** group (`Grosime foaie ușă`, `Setul de ușă include`, `Construcție ușă interior`, `Înălțime foaie usa`, `Ornamentare cu sticlă`, `Tip deschidere`, `Umplutura ușă`, `Tip lacăt`, cutie dimensions…), and a general group led by `Culoare` (1,148), `Tip Material` (858), `Domeniu de aplicare` (740), `Destinatie` (713), `Consum` (554), plus dimensions, drying/application times, thermal conductivity, density, etc. There is a long tail of near‑empty attributes (`Capacitate` 3, `Clasa de abraziune` 1).

**Design consequence:** model these as a **flexible `specs` array** (label/value, optional group), with a **curated, per‑category subset promoted to typed, filterable attributes** for faceted search (e.g. thickness, material, colour, door dimensions). Fixed columns for all 50 would be wrong (sparse, category‑specific, and they grow with new suppliers).

### Units
**13** distinct unit values, but inconsistent and **782 (34%) missing**:

| Raw | Count | Normalize to |
|---|---|---|
| buc | 1,094 | `buc` |
| (missing) | 782 | infer/leave null |
| sac / saci | 169 / 3 | `sac` |
| 1 m2 / m2 | 95 / 75 | `m²` |
| foi | 33 | `foaie` |
| val | 25 | `val` |
| **Marime** | 23 | ⚠ bogus — not a unit |
| ml | 16 | `ml` |
| kg / Kg | 7 / 3 | `kg` |
| Cutie | 4 | `cutie` |
| Rulou | 2 | `rulou` |

A controlled vocabulary + alias map fixes this on import.

---

## 4. Identifiers & linkage (the core of the importer)

- **SKU format:** `LC-<digits>` for simple products; `LC-<digits>/<n>` for variation members (the `/n` suffix indexes the variation within a product). All `Produse["Variații"]` values match `^LC-\d+`.
- **Authoritative mapping:** split `Produse["Variații"]` on commas → variation SKUs → match `Variații.SKU`. Coverage: **5,687/5,688** distinct refs resolve; **1** dangling ref is an empty string (trailing comma) — ignorable.
- **SKU is the global sync key.** Re‑imports match variations by SKU and products by their SKU set (with a stable `legacyKey` derived from the product's base SKU — see §8).

**Integrity exceptions to flag (not import blindly):**

| Issue | Count | Example | Handling |
|---|---|---|---|
| Same SKU on two products | 1 | `LC-15463` → "Glet Supraten Eurofin SV+" @209 and "Glet Ceresit CT 127" @215 | Quarantine both → human review |
| SKU referenced by >1 product | 13 | `LC-10378/1..3` referenced by 2 products | Quarantine → review |
| Orphan variation SKU | 13 | in `Variații`, no product references it | Import as unattached / report |
| Duplicate product **name** | 135 rows | "Antiinghet… Friol" twice (LC‑18343 / LC‑18334) | Keep separate (distinct SKUs); flag as merge candidates |

---

## 5. Data quality — missing information & inconsistencies

**Missing information**
- Brand: **623 (27%)** null.
- Unit: **782 (34%)** null (plus the bogus `Marime`).
- RU translations: effectively **absent** (38/2,331, one field) → multilingual is build/enrichment work.
- Country of origin (`Tara de origine`): sparse.

**Inconsistencies**
- Unit casing/spelling (`kg`/`Kg`, `sac`/`saci`, `1 m2`/`m2`) and bogus `Marime`.
- Brand variant `Euro As`/`Euro AS`.
- **Decimal/locale:** this ODS uses `.` decimals, but RO supplier files commonly use `,` decimals → must normalize numeric parsing per file.
- **Comma‑in‑data CSV hazard:** product names contain commas (`Gips Carton 9,5mm`) *and* the variation column is itself comma‑separated. A naïvely delimited CSV will corrupt both → require proper quoting (or prefer ODS/XLSX).
- Suspiciously low prices (min **0.20** lei) → soft validation warning, not a hard fail.
- Test rows present (`Test product` / `Test produs`).
- All variations in this export have a positive price (no `0,00`), but the importer must still support **price‑on‑request** for future files (and the historic live‑site `0,00 lei` bug).

---

## 6. SEO opportunities

- **Human‑readable bilingual URLs** + per‑locale slugs (already in the model): `/produs/<slug>`, `/categorii/<slug>`, `/branduri/<slug>`.
- **127 thin categories → curated sections + subcategories** with real landing copy (fixes duplicate/thin content; strong RO keyword pages).
- **Brand landing pages** for 61 brands (Knauf, Rockwool, Ceresit… are high‑intent queries in MD).
- **RU translation pipeline** — the single biggest organic opportunity (catalog is ~1.6% translated). Model supports `ro`/`ru` per field + `hreflang` already.
- **Structured data:** `Product` + `Offer` (price, priceCurrency MDL, availability), `Brand`, `BreadcrumbList`, `ItemList` on category pages.
- **Meta generation:** auto‑derive `metaTitle`/`metaDescription` from name + brand + category + key specs where empty (the SEO field group is in place).
- **Canonical/dedup:** the 135 duplicate‑name products need canonical handling to avoid duplicate‑content penalties.

---

## 7. Proposed normalized database structure (refinements to the existing model)

The collections built in increment 1 already separate **Products** and **Variations** and carry RO/RU localization + SEO. Proposed additions for import idempotency, mapping, and search:

**Categories** (existing `parent` enables the 2‑level taxonomy) — add:
- `aliases: string[]` — supplier category strings that map here (powers auto category mapping).

**Brands** — add:
- `aliases: string[]` — e.g. `["Euro As","Euro AS"]` (powers auto brand mapping + normalization).

**Products** — add:
- `legacyKey: string` (unique, indexed) — stable import identity = base SKU of the product (e.g. `LC-43122`), so re‑imports update instead of duplicating even if the name changes.
- `searchText: string` (generated/maintained) — concatenated RO+RU name, brand, category, key specs for PostgreSQL full‑text (see §10).
- `filterableAttributes: {key,label,value}[]` — the curated, faceted subset promoted from `specs` (brand/category are already relationships).

**Variations** — extend the `attributes.type` enum with `packaging_kg`, `packaging_litres`, `sheet`, `per_m2` (to cover the real variation axes in §2). SKU stays `unique` + indexed (the sync key). The "never `0,00 lei`" rule already auto‑flips to `priceOnRequest`.

**New collections**
- `ImportRuns` — one row per import: source filename, format, mode (full/price/stock/dry‑run), counts (created/updated/skipped/failed), status, timestamps, and a stored **before‑snapshot reference** for rollback.
- `ImportLogs` — per‑row outcome (matched/created/updated/skipped/error) + message, linked to an `ImportRun`, exportable as the error report/CSV.

```
Section (Category, parent=null)
  └─ Category (parent=Section)  ── aliases[]
        └─ Product ── legacyKey, brand→Brand, category→Category, specs[], filterableAttributes[], searchText, SEO, ro/ru
              └─ Variation ── sku (unique), price|priceOnRequest, stockStatus, attributes[]
Brand ── aliases[]
ImportRun 1───* ImportLog
```

---

## 8. Field mapping

### Variații → Variation
| Column | Field | Transform |
|---|---|---|
| `SKU` | `sku` | trim; **sync key**; reject dup/conflict (§4) |
| `Pret` | `price` / `priceOnRequest` | locale‑aware number parse; `≤0`/blank → `priceOnRequest` |
| `Denumire` | (used for product fallback only) | — |
| `Este` | — | constant `1`; ignored |
| `Grosime`,`Mărime`,`Lungime`,`1 m2`,`Culoare`,`Cantitate`,`Foaia`,`Ambalare kg`,`Ambalare Litri`,`Deschidere usi metalice`,`Dimensiuni usa interior`,`Ochiul` | `attributes[]` `{type,label,value}` | map RO column → `type`; value trimmed; the paired `… fără preț` columns are display strings and are dropped |
| (derived) | `product` | resolve via the product whose `Variații` list contains this SKU |
| (derived) | `label` | join attribute values (`12,5 mm / Alb`) — already auto‑generated |

### Produse → Product
| Column | Field | Transform |
|---|---|---|
| `Denumire` | `title` (ro) | trim |
| `Variații` | → variation linkage + `legacyKey` | split on comma; `legacyKey` = base SKU (strip `/n`) of first ref |
| `Categorie` | `category` | resolve via `aliases`/exact; create under proposed section if new (dry‑run reports unmapped) |
| `Brand` | `brand` | resolve via `aliases`/exact; null stays null (flagged) |
| `Unitate masura` | `unit` | normalize via unit map (§3); drop `Marime` |
| `Tara de origine` | `countryOfOrigin` | trim |
| `Domeniu de aplicare` | `applicationArea` (ro) | trim |
| `Область применения` | `applicationArea` (ru) | trim (38 rows) |
| `Tip Material`,`Culoare`,`Destinatie`,`Consum`, dimensions, door‑group, etc. (the 50 used cols) | `specs[]` `{label,value,group}` keyed by RO label | promote a curated per‑category subset into `filterableAttributes[]` |
| (derived) | `searchText` | build from name+brand+category+specs |

---

## 9. Import pipeline design (reusable services, not scripts)

A layered service pipeline under `src/services/import/`, callable from a Payload **admin upload + Job/Task** (so it runs server‑side, queued, on the existing stack — no extra infra). Each stage is a pure, testable unit:

1. **Source adapters** — `OdsAdapter`, `XlsxAdapter`, `CsvAdapter` implement one `SourceAdapter` interface → emit raw rows + sheet metadata. New suppliers = a new adapter or a column‑profile, nothing else changes. (SheetJS handles ODS/XLSX/CSV uniformly.)
2. **Profile/column resolver** — maps a supplier's column headers to the canonical schema via a stored **import profile** (so "this supplier calls price `Preț`, brand `Producător`" is config, not code). Our own export is the first profile.
3. **Normalizer** — locale‑aware number parsing (`,`/`.`), unit map, brand/category alias resolution, slug generation, trimming, RU passthrough.
4. **Validator** — schema validation + integrity rules: duplicate SKU, multi‑product SKU, orphan, missing required, price sanity, test‑row exclusion. Produces structured issues (error/warn).
5. **Matcher** — variation by `sku`; product by `legacyKey` (then SKU‑set, then never name). Decides create vs update per record.
6. **Planner** — builds a **change set** (creates/updates/skips) without touching the DB. This *is* **dry‑run**: the plan + issues are returned for review.
7. **Executor** — applies the change set in **transactional batches** (idempotent upserts). Supports **modes**: `full`, `price-only` (touch only `price`/`priceOnRequest`), `stock-only` (touch only `stockStatus`) — so a price list **never overwrites enriched product data**.
8. **Run recorder** — writes `ImportRun` + per‑row `ImportLogs`; captures a **before‑snapshot** of affected records for **rollback**; emits a downloadable **error report (CSV)**.

**Update / no‑duplicate guarantee:** every write is an upsert keyed on `sku` / `legacyKey`; products and variations are updated in place across re‑imports. **Price‑only** and **stock‑only** modes update single fields and skip everything else. **Rollback** restores the snapshot for a given `ImportRun`.

**Performance (thousands of rows):** stream rows, normalize in memory, batch DB writes (≈500/tx), bulk‑resolve brand/category maps once per run, indexes on `variations.sku`, `products.legacyKey`, `products.category`, `products.brand`. The full 2,331/5,701 set processes in‑process; larger suppliers paginate the same way. Heavy runs go through the Job queue so they don't block a request.

**Automatic image matching (future):** a later `ImageMatcher` stage will pair files to variations by SKU‑named assets (`LC-43122-1.jpg`) or a manifest, upload to Media, and attach — designed for now, implemented later.

---

## 10. Search preparation (PG FTS now, Meilisearch later)

- **PostgreSQL full‑text:** maintain `products.searchText`; add (via migration) a generated `tsvector` column with a GIN index, using `simple`/`unaccent` config so RO diacritics (`ușă`/`usa`) match. Multilingual handled by concatenating RO+RU into the same document (and/or per‑locale vectors).
- **Faceted filtering:** brand and category are relationships (fast `IN` filters); `filterableAttributes[]` provides spec facets (thickness, material, colour, door dimensions); price range from variations; stock status. Facet **counts** computed by aggregate queries.
- **Multilingual search:** query both locales; results respect the active locale for display via Payload localization.
- **Meilisearch‑ready:** the importer (and a write hook) will emit **one denormalized document per product** (RO+RU name, category path, brand, SKUs, filterable facets, variation attributes). That same document shape feeds PG FTS now and drops into a Meilisearch index later with no model change — plus RO↔RU synonyms (`gips carton ↔ гипсокартон`).

---

## 11. Risks

- **Integrity errors imported as truth** — mitigated by quarantine + dry‑run review (the dup/conflict/orphan SKUs in §4).
- **Wrong product identity on re‑import** (name drift, duplicate names) — mitigated by `legacyKey`/SKU‑set matching, never name.
- **Price list clobbering enriched data** — mitigated by `price-only`/`stock-only` modes + field‑scoped upserts.
- **CSV corruption from commas/locale decimals** — mitigated by quoting requirements, per‑file profiles, and preferring ODS/XLSX.
- **Taxonomy/brand drift** as new suppliers arrive — mitigated by `aliases` maps + dry‑run "unmapped" reports.
- **RU/brand/unit gaps** are *data* gaps, not import bugs — surfaced in reports for staged enrichment.
- **Partial‑failure consistency** — mitigated by transactional batches + rollback snapshot.

---

## 12. Recommendations & decisions needed before I implement

**Recommendations**
1. Match strictly on **SKU / `legacyKey`**; treat names as display only.
2. Adopt the **2‑level taxonomy** (§2) and maintain `aliases` on Category/Brand so imports self‑map.
3. Make **dry‑run the default**; require explicit confirm to execute; keep every run logged + rollback‑able.
4. Ship **price‑only** and **stock‑only** modes from day one (this is ~95% of ongoing work per the ingestion strategy doc).
5. Quarantine the **1 duplicate SKU + 13 conflicts + 13 orphans** for review rather than importing them.
6. Build the **Meili‑ready denormalized document** during import so search is a later switch, not a rebuild.

**Decisions I need from you**
- **A. Taxonomy:** approve the proposed top‑level sections (§2), or give me your preferred grouping? (This shapes category mapping + the homepage.)
- **B. Unmapped brand (623) & unit (782):** import with brand/unit **null** (flagged for enrichment) — agreed? Or hold those rows?
- **C. Duplicate‑name products (135):** keep as separate products (recommended) or do you want a review list to merge some into variations?
- **D. Integrity quarantine:** confirm I should **skip + report** the dup/conflict/orphan SKUs rather than import them.
- **E. Scope of first run:** full catalog import, or a **dry‑run first** (recommended) so you can review the change set + error report before anything is written.

On approval, I'll implement the services in §9 (with the schema additions in §7), run a **dry‑run** on this file, and show you the plan + error report before any write.
