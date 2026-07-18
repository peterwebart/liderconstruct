# LiderConstruct — Phase 3: Business Rules Layer & Import Readiness

**Status:** Business Rules engine, configurable status/SEO rules, media‑rules architecture, and the Validation Dashboard are **implemented**; approved category mappings are **applied**; a rules‑driven **dry‑run was executed**. The importer is **ready to run** against your DB. No frontend.
**Verified:** `tsc` clean · `eslint` 0/0 · dry‑run executed through the real services with the rules engine active.

---

## 1. Business Rules Engine (`src/services/rules/`)
The importer is now a thin pipeline that **delegates** all transformation/validation to a dedicated rules layer (the importer's `normalizer` is a re‑export — no logic lives in the importer). The engine owns:

- **Normalization:** whitespace, capitalization, **product names**, decimal separators, numbers, **dimensions**, **packaging**, **quantities**, **units** (alias‑based), **brands** (alias‑based), **URLs**, **slugs**.
- **Product status rules** (configurable via the `business-rules` CMS global): all variations priced ≤0/blank → **Price on Request**; no active variation → **Hidden**; supplier‑flagged → **Discontinued**; missing required metadata → **Needs Review**. Precedence: discontinued → hidden → price‑on‑request → active; needs‑review is orthogonal.
- **SEO rules:** generate title / description / keywords / canonical / breadcrumbs / Open Graph / JSON‑LD — **only when fields are empty; manual edits always win** (SEO is written on create, never overwritten on re‑import).
- **Media rules (architecture only):** filename/SKU/manifest matching, supplier folders, primary‑image priority, PDF & technical‑sheet matching, WebP + thumbnails — designed, not implemented.

Everything is configurable: code defaults in `rules/config.ts`, overridable from the **Business Rules** global; the engine loads the global at run time.

## 2. Validation Dashboard (Payload admin)
A `beforeDashboard` server component renders the team's daily work queue with live counts, each linking to the pre‑filtered list view: **products needing review, missing brand / unit / category, without image, without description, variations price‑on‑request**, plus **recent import history**. (Duplicate candidates and per‑run warnings/errors are surfaced via the linked import run.)

## 3. Category mappings — applied
Per your approval, the **124 high‑confidence** supplier categories are attached as **aliases** on the matching internal taxonomy nodes (applied during `pnpm seed`). The **3** non‑high‑confidence categories are left **pending for manual review** — no aliases created:
- `OSB 3` (medium), `Bandă adezivă` (low), `Plasă "rabița"` (low).

## 4. Rules‑driven dry‑run (executed on the real file)
| Result | Value |
|---|---|
| Importable products / variations | **2,330 / 5,686** |
| **Category mapping** (approved aliases) | **2,322 products mapped** to internal taxonomy · **8 pending** (the 3 pending categories) · 124 categories mapped / 3 pending |
| **Status breakdown** (rules engine) | `active`: 2,330 (this file has stock + prices, so none hidden/discontinued/on‑request) |
| Needs review | **1,276** (missing brand/unit or pending category) |
| Integrity | 1 duplicate SKU (`LC‑15463`) · 13 orphan variations (+1 test) · 11 suspicious prices — skipped/quarantined |
| Duplicate candidates | 145 pairs (20 at 0.95) — review only |
| Performance | 8,032 rows in ~1.3 s |

The status engine, alias resolution and category mapping all ran on real data — the importer write path uses the same rules.

## 5. Import run sequence (in your environment)
The write executes against your PostgreSQL (I can't reach it from here and won't provision a DB per your rules). Reversible via the run snapshot.

1. **Extensions:** `CREATE EXTENSION IF NOT EXISTS unaccent; CREATE EXTENSION IF NOT EXISTS pg_trgm;`
2. **Seed (+ apply approved mappings):** `pnpm seed`
   → creates the business taxonomy, 60 brands, 9 units, and attaches the 124 approved category aliases.
3. **Import:** `pnpm import:catalog ./liderconstruct-price_export_15_mai_2024.ods full`
   → writes products + variations; brands/units/categories auto‑resolved via aliases; status + SEO applied by the rules engine; logged to `import-runs`/`import-logs` with a rollback snapshot.
4. **Validate:** open the **Validation Dashboard** + review `import-runs`/`import-logs`.
5. **Final report:** the run's stored report mirrors §4 with the actual written counts.

(Use `pnpm import:catalog <file> dry_run` first if you want to see the plan in your environment before writing; `price_only` / `stock_only` for future supplier updates.)

## 6. Next major phase (after you validate the catalog)
Build the customer experience around the real data — a product‑discovery homepage (Product Type · Brand · Application · Popular Searches · Featured Categories · Featured Brands · Smart Search) getting users to products in 2–3 clicks, then category/product pages, search UI, and the ordering workflow. The catalog stays the foundation.

---

### What I need from you
- Confirm you've run (or want me to walk through) **`pnpm seed`** then **`pnpm import:catalog … full`** in your environment.
- After import, review the **Validation Dashboard** and the next‑phase checklist (data, taxonomy, search, filtering, SEO). On your approval, we start the storefront.
- Optional: tell me how to handle the 3 pending categories (assign each to a node) and I'll add those aliases.
