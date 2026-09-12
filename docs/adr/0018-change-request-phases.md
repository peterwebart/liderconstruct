# ADR-0018: UX/catalog change-request implementation

## Status
Accepted — 2026-07-18 (Phases 1–4 of the master change request)

## Context
A 25-section change request covering listing UX, ordering, navigation, search,
product page and SEO. `docs/design/change-request-audit.md` holds the
requirement-by-requirement audit; this ADR records the decisions that changed
architecture.

## Decisions

**Manual ordering.** `products.displayOrder` (indexed, admin-owned) drives a
new default sort "Recomandate": displayOrder asc → unset last → popularity →
title. SKU is never a sort field. The importer never emits `displayOrder`, so
supplier syncs cannot destroy admin curation.

**Variations in listing cards.** `SearchHit`/`ProductCardData` carry a bounded
`variations[]` (`CARD_VARIATION_LIMIT = 8`), populated from variation rows the
listing query already fetches — no extra round-trips, no full-catalog
hydration. Cards select a variation and add THAT SKU to the cart; products
beyond the cap link to the PDP.

**Quantity.** Editable numeric input with clamp + optional `step` snapping.
BusinessRules defines no packaging/multiple rules today, so none are invented;
`step` defaults to 1 and is ready when real rules exist.

**One search system.** The homepage hero's private `<form>` was deleted; every
search field is `SmartSearch` over `/api/search/suggest`.

**Mobile Menu vs Search.** Root cause of "menu opens search" was the drawer
receiving `<SmartSearch autoFocus />` as children — opening the menu stole
focus and raised the keyboard. The drawer no longer contains search at all;
mobile search is a separate pinned bar. Independent states by construction.

**Catalog menu.** The mega-menu pane is rendered through a **portal to
`document.body`** with fixed positioning measured from the trigger. Two real
hazards required this: the header's `backdrop-blur` created a stacking context
that trapped the pane, and the hero's `overflow-hidden` clipped anything
overlapping it. `backdrop-blur` was also removed from the header. The
outside-click handler treats trigger **and** portalled pane as "inside".

**Header.** Reduced to Catalog · Search · Phone · Livrare · Language · Cart
(+ mobile Menu/Logo/Search/Cart). The TopBar strip was removed — its trust
signals already exist in the hero stats row. Secondary nav lives in the footer.

**No customer accounts.** Confirmed none ever existed; the storefront is
guest-only by design (ADR-0002). The mockup-derived account/wishlist icons were
dead links and are gone, including their `robots.txt` entries.

**Product page.** Specificații leads and opens by default; both panels stay
server-rendered and merely hidden, so Description remains crawlable. A new
"Identificare" spec group surfaces brand, manufacturer, country, category,
application, unit and product code — manufacturer and country existed in the
DB but were never queried. The Livrare tab was removed in favour of a
`/livrare` page (delivery is store-wide information).

**Product SEO content.** Server-rendered block composed only from real fields,
with a deterministic per-product phrasing index so products never emit
identical paragraphs, and no sentence rendering when its data is absent.

## Deviations from earlier approved design
Requirements §4/§5/§12 contradict the supplied `first-screen.png`: the header
nav, "Cere ofertă" button and the right-side TOP BRANDS panel came from that
mockup and are now removed. Brands remain fully available (footer rail,
`/brands`, `/brand/[slug]`, facets, SEO). Wishlist has no implementation, so
the icon was dropped rather than shipping a dead link — both choices are
one-commit reversible.

## Verification
tsc + eslint clean at every step. `displayOrder` migration applied on top of
the existing initial migration on a real Postgres (23 ms, ADD COLUMN + index)
then seed re-run. Variation aggregation verified end-to-end with a real
3-variation product (25 kg=85 | 40 kg=125 | 50 kg=145, price-ascending).
SEO generator rendered against three products: all distinct, no placeholder
artifacts. Importer regression after every phase: 2,325 / 5,686, 5 merges.
