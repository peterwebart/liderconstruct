# Implementation Audit — UX/Catalog/Search/Cart/SEO Change Request

**Date:** 2026-07-18 · **Basis:** direct inspection of the current codebase · **Status:** audit complete, phased implementation started

Legend: **[OK]** already satisfied · **[FIX]** real defect, cause identified · **[BUILD]** new work · **[DECIDE]** needs your decision before I touch it (conflicts with a spec you previously approved, or describes something that doesn't exist).

---

## A. Requirement-by-requirement

### 1. Show all variations in subcategory product cards — **[BUILD]**
- **Files:** `src/components/catalog/ProductCard.tsx`, `src/lib/catalog-types.ts` (`ProductCardData`), `src/services/search/PostgresSearchService.ts` (`search()` aggregates variations), `src/lib/catalog.ts`.
- **Current:** the service aggregates variations down to `priceMin` + `variationCount`, and only carries a usable SKU when `variationCount === 1` (`defaultVariationSku`). The card shows the minimum price and links to the PDP; quick-add only works for single-variation products.
- **Problem:** exactly as reported — the list surfaces the cheapest variation and hides the rest.
- **Recommendation:** extend `SearchHit`/`ProductCardData` with a bounded `variations[]` (sku, label, price, stock, unit), cap at ~6 per card in the query layer (never load all), and render a compact selector in the card: ≤3 variations inline as selectable rows, more than that → a dropdown listing the first N plus "Vezi toate (n)" linking to the PDP. Quantity + add-to-cart then act on the *selected* variation.
- **Performance note:** the variation rows are already fetched in one batched query for the page; carrying a capped subset adds no extra round-trips.

### 2. Manual product ordering (`displayOrder`) — **[BUILD]**
- **Files:** `src/collections/Products.ts` (has `popularity`, no display order), `src/lib/filter-params.ts` (sort options), `PostgresSearchService.search()` (sort branch), `src/services/import/*`.
- **Current:** default sort is `relevance` → `popularity` desc. Categories already have `displayOrder`; Products do not. SKU is not used for sorting (good — the requirement's prohibition is already satisfied).
- **Recommendation:** add `displayOrder: number` (indexed, admin sidebar, clear description), make the default customer sort **"Recomandate"** = `displayOrder` asc with `popularity` desc then title as tie-breakers (so unset products don't collapse into arbitrary order). Keep price/name sorts. Requires a **new Payload migration**. Importer must **not** overwrite it (see §C risks).
- **Drag-and-drop:** Payload's admin list supports custom ordering only via a numeric field without extra plugins; a clearly-labelled numeric field is the clean solution. Recommend numeric now, revisit later.

### 3. Catalog menu below the banner — **[FIX]**
- **Files:** `src/components/nav/MegaMenu.tsx` (pane: `absolute left-0 top-full z-50`), `src/components/layout/Header.tsx` (`sticky z-40` + `backdrop-blur`), `src/components/home/HomeHero.tsx` (`<section className="relative overflow-hidden">`).
- **Cause (not guesswork):** two real stacking/clipping hazards. (a) The header sets `backdrop-blur`, which **creates a stacking context** — the pane's `z-50` is scoped *inside* the header's `z-40` layer, so it can never rise above a later sibling with a higher z-index. (b) The hero uses `overflow-hidden` (needed to clip the banner image); **any menu rendered inside the hero subtree is clipped**, which is precisely the "doesn't work directly below the banner" symptom.
- **Recommendation:** keep the trigger in the header but render the pane in a **portal** to `document.body` with a single app-level overlay z-index scale, or drop `backdrop-blur` on the header. Do not just raise z-index — that treats the symptom.

### 4 & 12. Simplify the header — **[DECIDE]** then **[BUILD]**
- **Files:** `src/components/layout/Header.tsx`, `src/components/layout/TopBar.tsx`.
- **Current:** logo · Produse (mega) · Branduri · Soluții · Servicii · Despre noi · Contact · language · account · wishlist · cart · "Cere ofertă", plus a TopBar strip with five trust signals.
- **Conflict to confirm:** this header is what I built **from your `first-screen.png` design** two sessions ago. The new requirement removes most of it. I'll follow the new instruction (Catalog | Phone | Search | Language | Delivery | Wishlist | Cart) — flagging only so you know the mockup and the site will diverge.
- **Recommendation:** move Soluții/Servicii/Despre/Contact to the footer; convert "Produse" into the single **Catalog** entry; drop "Cere ofertă" from the header (the cart is the quote flow); keep TopBar or fold delivery info into the header per your choice.

### 5. Remove the right-side brand menu — **[DECIDE]** then **[BUILD]**
- **File:** `src/components/home/HomeHero.tsx` (TOP BRANDS aside).
- **Conflict:** this panel also came **from your own design mockup**. Removing it is a one-component deletion; brands stay in the DB, `/brands`, `/brand/[slug]`, facets and SEO — nothing else is touched. Confirmed safe.

### 6. Direct quantity input — **[FIX]**
- **File:** `src/components/ui/QuantityStepper.tsx`.
- **Current:** the value renders in a **`<span>`** — genuinely not typable. `min`/`max` exist; **no `step`**.
- **Recommendation:** replace the span with a controlled `<input inputMode="numeric">`, commit on blur/Enter, clamp to min/max and **snap to step**. Add `step` support and wire it to the existing BusinessRules global (see §D — I must check what rules actually exist before enforcing any, per your "do not invent business rules").

### 7. Global search — **[FIX]**
- **Files:** `src/components/search/SmartSearch.tsx` (the real one: debounced, grouped suggestions, keyboard nav, recents, backed by `/api/search/suggest`), `src/components/home/HomeHero.tsx` (**a second, raw `<form><input>` with no autocomplete**).
- **Cause:** there are **two** search implementations. The header's `SmartSearch` is mounted globally in the layout and works on every page; the homepage hero has a plain form that only navigates to `/search`. That is the "works on one page, not others" inconsistency, from the opposite direction.
- **Recommendation:** delete the hero's raw form and render `SmartSearch` there. One component, one API route, one behavior everywhere. No new search system — the PostgreSQL tiered search (SKU prefix → folded text → brands/categories, diacritic-insensitive via `unaccent`) already satisfies the functional list; synonyms collection exists and is wired.

### 8. Mobile Menu opens Search — **[FIX]**
- **Files:** `src/components/layout/Header.tsx`, `src/components/nav/MobileNav.tsx`.
- **Cause (exact):** the header passes `<SmartSearch autoFocus />` as **children into `MobileNav`**, and the drawer renders that slot at the top. Tapping **Menu** opens the drawer, the search input **immediately steals focus and raises the keyboard** — which presents as "the search appears instead of the menu." Not a z-index or portal issue; a focus/composition issue.
- **Recommendation:** remove `autoFocus` from the drawer's search slot, and give Menu and Search **separate independent triggers/state** (the mobile search already exists pinned under the header). Test matrix from the request applies.

### 9. Specifications tab open by default — **[FIX]**
- **File:** `src/components/product/ProductTabs.tsx` + product page tab array.
- **Current:** order is Descriere, Specificații, Documente, Livrare; the first enabled tab is active → Description opens.
- **Recommendation:** reorder to **Specificații | Descriere**, default to Specificații. SEO is already safe: all panels are **server-rendered** and hidden with the `hidden` attribute, not conditionally rendered — content stays in the HTML and crawlable. No change needed to preserve that.

### 10. Missing specification fields — **[BUILD]**
- **Files:** `src/lib/specs.ts` (`buildSpecGroups` — registry attributes only), `src/components/product/SpecificationTable.tsx`, `src/lib/catalog.ts` (`getProductPageData` already loads brand, unit, `legacyKey`, category trail).
- **Current:** the table renders only registry attributes. Brand, manufacturer, country of origin, unit and SKU are fetched but **never shown** in specs (brand appears in the BuyPanel only).
- **In DB and displayable now:** Brand, Country of origin (`countryOfOrigin`), Unit, SKU (`legacyKey`), Application area, plus all registry attributes (material, dimensions, density, thickness…).
- **Not currently loaded:** Manufacturer (relation exists on the collection but isn't selected in `getProductPageData`) — cheap to add. **Weight/Colour/Packaging** exist only where the supplier provided them as registry attributes; no invention.
- **Recommendation:** prepend an "identity" group (Brand, Manufacturer, Country, Unit, SKU) to the registry-driven groups.

### 11. Remove customer authentication — **[OK, nothing to remove]**
- **Verified:** there is **no customer authentication anywhere**. `Users` is admin-only (`auth: true`, admin access rules); the quote cart is browser-local with no login; `submitOrder` is a guest server action. Checkout is already guest-only by design (ADR-0002).
- **The only artifacts:** two dead header links, `/contul-meu` and `/favorite`, which I added from the mockup's account/wishlist icons and which route nowhere.
- **Recommendation:** delete the account icon. **Wishlist is listed as *keep* in requirement 12** but has no implementation — see §D decision.

### 13. Product names — 3 lines — **[FIX]** `ProductCard.tsx` uses `line-clamp-2` → `line-clamp-3`, with reserved height so it cannot overlap price/selector/CTA.

### 14. Simplify product cards — **[BUILD]** remove brand, SKU and stock text from the card; keep image, name, price(s)/variation selector, quantity, add-to-cart. Overlaps with #1 (same component, do together).

### 15. Remove the Delivery tab — **[BUILD]** delete the Livrare tab from `ProductTabs` on the PDP; delivery content moves to the footer + a `/livrare` page (already linked from the footer, page not yet built — see #17).

### 16. Product SEO content block — **[BUILD]** new server component rendering a contextual paragraph composed from **real** fields (name, category trail, brand, application area, key attributes) with varied sentence templates keyed off available data, placed below the main PDP content, always server-rendered. Guardrails: no template renders unless the underlying data exists (no empty-slot sentences), and content varies by category/attribute set to avoid the duplicate-content and doorway risks called out.

### 17. Legal disclaimer / T&C — **[BUILD]** create `/termeni`, `/livrare`, `/contact`, `/despre` pages (currently linked from the footer but **404**), with the price/stock-confirmation wording centralized there rather than repeated per product. I'll draft neutral, factual wording — **you must have it reviewed**; I won't invent legal claims.

### 18. Do not damage SEO — **[OK, will re-verify]**
Existing and to be preserved: per-page `generateMetadata` with canonicals; Product + AggregateOffer JSON-LD using real prices/availability (and **no Offer at all** for price-on-request, which stays correct); FAQPage JSON-LD; BreadcrumbList JSON-LD in `Breadcrumbs`; dynamic sitemap with per-locale URLs + hreflang; robots; SSR throughout; `/ro`+`/ru` localized URLs. **Not present:** Organization and WebSite schema — I'll add them in the SEO increment.

### 19 & 20. Responsive & performance — **[ongoing constraint]** Current: server-side pagination (24/page), capped facet queries, `unstable_cache` on catalog/nav/homepage reads, debounced+limited autocomplete, indexed `sku`/`legacyKey`/`searchText`. The variation-in-card work must stay within the existing batched query (capped per product) — no N+1, no full-catalog hydration.

### 21. Admin experience — **[BUILD]** `displayOrder` with an explicit admin description stating it drives the storefront's default "Recomandate" sort and is global (not per-category).

### 22. Do not break the importer — **[constraint, see risks]**

---

## B. Architecture impact

| Layer | Change |
|---|---|
| **Database** | One new column: `products.display_order` (indexed). New Payload migration required. No destructive changes. |
| **Payload** | `Products`: add `displayOrder`. No hook/access/global changes. Admin gets one documented field. |
| **Backend** | `SearchHit`/`ProductCardData` gain capped `variations[]`; `search()` gains the `displayOrder` sort branch and the new default; `getProductPageData` also selects `manufacturer`. |
| **Frontend** | ProductCard (variations + simplification + 3-line name), QuantityStepper (input + step), Header/TopBar (simplify), MobileNav (focus fix), HomeHero (SmartSearch + remove brand panel), MegaMenu (portal), ProductTabs (order, remove Livrare), SpecificationTable (identity group), new SEO block, new static pages. |
| **Search** | No new engine. Remove the duplicate hero form; single `SmartSearch` + existing `/api/search/suggest`. |
| **SEO** | Preserve all existing; add Organization + WebSite schema and the per-product content block. |

---

## C. Risk assessment

| Risk | Likelihood | Mitigation |
|---|---|---|
| **Importer overwrites `displayOrder`** on every sync, destroying admin ordering | High if unhandled | The mapper must **never** emit `displayOrder`; it is admin-owned like enrichment fields. Explicitly excluded, and covered by a dry-run regression check. |
| Migration needed for the new column; production DB already migrated | Medium | Generate an incremental migration via `payload migrate:create`; verify `migrate` on an empty DB **and** on a DB already at the initial migration. |
| Changing the **default sort** alters what customers see first | Certain (intended) | Tie-breakers keep output deterministic for the ~all products that will have `displayOrder` unset initially, so the visible order won't scramble. |
| Removing header items breaks internal links / navigation paths | Low | Moved to footer, not deleted; no URL changes, so no SEO/link loss. |
| Card simplification removes brand/SKU text that may aid SEO/scanning | Low | Both remain on the PDP and in structured data; card text isn't a ranking surface. |
| Variation data in cards inflating payload at 10k products | Medium | Hard cap per card, server-rendered, existing pagination; no client-side catalog. |
| Product URLs / cart / checkout / admin | None expected | No routing, order-schema, or auth changes in this plan. |

---

## D. Decisions I need from you (I won't guess)

1. **Wishlist** (#12 keeps it in the header) — **no wishlist feature exists**. Options: (a) build a browser-local wishlist, (b) drop the icon until it's built. I recommend (b) now, (a) as its own increment — a dead heart icon is worse than none.
2. **Header vs. your mockup** (#4/#5/#12) — confirmed I should follow the new instruction and let the site diverge from `first-screen.png`?
3. **Business rules for quantity** (#6) — I'll implement min/max/step, but I must read what the BusinessRules global actually defines before enforcing anything. If it defines nothing, quantity stays free-form (min 1) rather than me inventing packaging rules.
4. **Legal wording** (#17) — I'll draft; you must have it reviewed before publishing.

---

## E. Implementation sequence (matching your Phase order)

**Phase 1 (this increment):** `displayOrder` + migration + default "Recomandate" sort · quantity direct input · mobile menu focus fix · single global search. **Phase 2:** variations in cards + card simplification + 3-line names. **Phase 3:** PDP — specs default/reorder, identity spec group, remove Livrare tab, SEO content block. **Phase 4:** header simplification, catalog menu portal fix, remove brand panel, account icon. **Phase 5:** static pages (T&C/livrare/contact/despre) + Organization/WebSite schema. **Phase 6:** QA sweep — responsive matrix, build, tsc, importer regression.
