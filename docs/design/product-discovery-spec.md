# LiderConstruct — Product Discovery Design Specification (for approval)

**Phase 3 — Product Discovery Experience.** Design only; no implementation until approved.
**North star:** the fewest clicks to the *correct* product. Every screen serves: find fast, browse by application/category/brand, compare, and request a quote.

---

## 0. Design thesis & direction

The brand lives in the world of the building site: precision, measurement, load‑bearing structure, hi‑vis safety. The interface is a **precision instrument for the trade**, not a corporate brochure. We follow the brief's pinned direction — near‑black, hi‑vis yellow — but make it specific:

- **Hi‑vis as signal, not paint.** Yellow (`#F5B118`) appears only on primary actions and the data that matters most (price, in‑stock, the active filter). Everything else is disciplined neutral.
- **Spec‑sheet typography.** SKUs, dimensions, prices and quantities render in a **monospaced** face — the catalog reads like a technical datasheet. This is the signature touch and it's *true* (these are measured values).
- **Measurement as structure.** Section dividers are hairline rules with tick marks (a tape‑measure motif) — the structural device encodes precision rather than decorating.
- **The Finder** is the signature element: a persistent, three‑axis discovery module (Type → Brand → Application + Search) that turns the homepage into a tool. Bold lives here; everything around it stays quiet.

Feel: premium · industrial · modern · minimal · fast · interactive. Motion is restrained (150–220 ms), purposeful, and respects `prefers-reduced-motion`.

---

## 1. Information Architecture

```
Home (Discovery Hub)
├── Products  ▸ Mega Menu (CMS-driven from internal taxonomy)
│     Section → Category → Subcategory → (Product Family) → Product
│     /category/{section}/{category}
├── Brands  ▸ /brands  →  /brand/{brand}
├── By Application  ▸ /application/{application}   (cross-cutting "Application" attribute)
├── Search  ▸ /search?q=…   (omnipresent in header)
├── Solutions / Guides (editorial: buying guides, FAQs — from taxonomy page fields)
├── About · Contact
└── Utility: Language (RO/RU) · Quote Cart · Phone/Viber
Product detail: /products/{slug}
```

**Three discovery axes** (all ≤3 clicks to a product): **Category** (taxonomy), **Brand**, **Application**. **Search** is the zero‑click‑navigation shortcut to any of them. Supplier categories never appear in nav or URLs (ADR‑0005/0011).

**Navigation source:** the Mega Menu, footer, and homepage sections are built entirely from the internal taxonomy + the Homepage global + SearchSettings (Popular Searches) — nothing hardcoded.

---

## 2. User flows (each ends at "added to quote")

**A · Search‑first (primary).**
Type in header search → instant suggestions grouped (Products · Brands · Categories · "Search for '…'") → pick a product *(2 interactions to product)* OR press Enter → results grid with facets → product → **Add to quote**.

**B · Browse by category.**
Products (mega menu) → click a Category *(1)* → category page (faceted grid) → product *(2)* → Add to quote.

**C · Browse by brand.**
Brands (menu/page) → Brand page (their categories + top products) → product *(2–3)* → Add to quote.

**D · Browse by application.**
Homepage "By application" chip (e.g. *Roof*, *Bathroom*, *Façade*) → pre‑filtered grid *(1)* → product *(2)*.

**E · Compare.**
On any grid/product, tap **Compare** → items collect in a Compare tray → open Comparison table (spec‑by‑spec from the Attribute Registry, `isComparable`) → Add winner to quote.

**F · Quote / order (no payment, no account).**
Quote cart (persistent) → **Trimite comanda** → form (name, phone, locality required; email/address/notes optional; honeypot) → on‑screen confirmation with order # + email to customer & `comenzi@liderconstruct.md`. Mirrors the inquiry‑cart model (ADR‑0002).

Edge states designed for every flow: empty search, zero results (with suggestions + "request anyway"), price‑on‑request, out‑of‑stock, pending‑category product, slow network (skeletons).

---

## 3. Component inventory (build these first — no pages until approved)

Primitives first, then composites. Every component is responsive, keyboard‑navigable, has visible focus, and respects reduced motion.

### Primitives
| Component | Purpose | Key props | States |
|---|---|---|---|
| `Button` | Actions | variant (primary/secondary/ghost/danger), size, iconStart/End, loading, fullWidth | hover, active, focus, disabled, loading |
| `IconButton` | Compact actions | icon, label(a11y), size | + pressed |
| `Input` / `SearchInput` | Text entry | value, placeholder, iconStart, clearable, size | focus, error, disabled |
| `Select` / `Combobox` | Choice | options, multi, searchable | open, focus, disabled |
| `Tag` / `SpecTag` | Mono data chip (SKU, dim) | label, tone | — |
| `Badge` / `StockBadge` | Status | tone (in/low/out), label | — |
| `PriceDisplay` | Price or "Preț la cerere" | amount, currency=MDL, onRequest, perUnit | — |
| `QuantityStepper` | Qty select | value, min, step, unit | focus, disabled |
| `Skeleton` | Loading placeholder | shape, lines | shimmer/none (reduced motion) |
| `Toast` | Feedback | message, tone, action | enter/exit |
| `Breadcrumbs` | Location + JSON‑LD | items[] | collapsed (mobile) |
| `Drawer` / `Sheet` | Side/bottom panel | side, open | open/closed |

### Composites
| Component | Purpose | Key props | States / notes |
|---|---|---|---|
| **Header** | Global nav + search + utilities | sticky, transparentOnHero | scrolled (condenses), menu‑open |
| **MegaMenu** | Two‑level taxonomy nav | sections[], featured, popular | open per section; full keyboard nav; mobile = stacked accordion |
| **LanguageSwitcher** | RO/RU | current, locales | menu open |
| **SmartSearch** | Search field + overlay | recent[], popular[] | idle, typing, suggesting, no‑results |
| **SearchSuggestions** | Grouped instant results | groups (products/brands/categories/term) | keyboard‑highlighted row |
| **CategoryCard** | Enter a category | title, icon, image, count | hover (lift + tick reveal) |
| **BrandCard** | Enter a brand | logo, name, count | hover |
| **ProductCard** | Product in grids | image, title, brand, price/onRequest, stock, sku, addToQuote, compare | hover, focus; skeleton |
| **ProductGrid** | Responsive card grid | items[], columns, loading | empty, loading |
| **ProductList** | Dense row view | items[], loading | toggle with grid |
| **FilterSidebar** | Faceted filters (desktop) | facets[] (from registry), price range, brand, availability | active count, clear‑all |
| **MobileFilters** | Filters as bottom sheet | facets[], applied | open; sticky "Apply (N)" |
| **SortControl** | Result ordering | options (relevance/price/newest) | — |
| **SpecificationTable** | Spec sheet (grouped) | groups[] (registry), values | — |
| **ProductGallery** | Images/zoom | images[], primary | active thumb; zoom; lightbox |
| **RelatedProducts** | Cross‑sell rails | type (accessories/alternatives/…) | scroll‑snap rail |
| **CompareTray** + **ComparisonTable** | Compare 2–4 products | items[], attributes (isComparable) | sticky tray; remove |
| **QuoteCart** (drawer) + **QuoteForm** | Inquiry cart + submit | lines[], totals, honeypot | empty, submitting, success |
| **FloatingContactBar** | Phone/Viber/quote (mobile) | phone, viberHref | hide on scroll‑down |
| **Footer** | Sections/brands/info | taxonomy, languages | — |
| **Pagination / LoadMore** | Paging | page, total | loading |
| **EmptyState** | Zero results / empty cart | title, hint, action | — |

---

## 4. Design system specification

### 4.1 Color tokens
| Token | Hex | Use |
|---|---|---|
| `--bg` | `#0B0E12` | App background (Carbon) |
| `--surface` | `#14181E` | Cards, header |
| `--surface-2` | `#1B212A` | Raised/hover surfaces, inputs |
| `--border` | `#262D38` | Hairlines, dividers |
| `--fg` | `#FFFFFF` | Primary text |
| `--muted` | `#A6ADB8` | Secondary text |
| `--faint` | `#6B7480` | Tertiary, placeholders, ticks |
| `--accent` | `#F5B118` | Primary actions, key data, active filter |
| `--accent-600` | `#E0A00F` | Accent hover |
| `--accent-fg` | `#0B0E12` | Text on accent |
| `--in-stock` | `#3FB950` | In stock |
| `--low-stock` | `#E3A008` | Low stock |
| `--out-stock` | `#E5534B` | Out of stock / error |
| `--blueprint` | `#1E2A3A` | Faint technical grid lines (atmosphere only) |

Discipline: yellow only for primary CTA, price, active state. One bold color; neutrals do the rest.

### 4.2 Typography
- **Display** — `Archivo` (700/800, expanded width for H1/H2): industrial signage character.
- **Body/UI** — `Inter` (400/500/600): legible at data density.
- **Data/Mono** — `JetBrains Mono` (500): SKUs, dimensions, prices, quantities, codes — the spec‑sheet signature.
- **Scale (px / line):** 12/16 · 14/20 · 16/24 · 18/28 · 20/28 · 24/32 · 32/38 · 44/48 · 60/64. Tight tracking on display (−0.02em); normal on body.

### 4.3 Space, grid, radius, elevation
- **Spacing** (4px base): 4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96.
- **Grid:** desktop 12‑col, max 1320px, 24px gutters; tablet 8‑col; mobile 4‑col, 16px margins.
- **Radius:** 6 (controls), 10 (cards), 14 (sheets/modals). No pills — industrial restraint.
- **Elevation:** prefer 1px borders over shadow on dark; modal/menu use a soft `0 8px 30px rgba(0,0,0,.5)`.
- **Breakpoints:** sm 480 · md 768 · lg 1024 · xl 1280.

### 4.4 Motion & micro‑interactions
- Durations 120–220 ms, ease‑out; never block input.
- ProductCard hover: 2px lift + accent left‑tick reveal + image scale 1.02.
- Search: suggestions fade/slide 8px; result count animates.
- Mega menu: 140 ms cross‑fade between section panels.
- Add‑to‑quote: item flies to cart icon (skipped under reduced motion; cart badge still bumps).
- All disabled when `prefers-reduced-motion: reduce`.

### 4.5 Iconography & imagery
- Line icons (lucide), 1.5px stroke, 20/24px. Category/section icons from taxonomy `icon` field.
- Imagery is product‑forward on dark; placeholders show a blueprint‑grid until media exists (catalog ships image‑less).

### 4.6 Voice (RO primary)
Plain, active, trade‑literal. CTAs: **Adaugă în comandă**, **Trimite comanda**, **Cere ofertă**, **Vezi produsul**. Price‑less → **Preț la cerere**. Zero results → *"Niciun rezultat pentru «…». Încearcă un alt termen sau cere‑l direct."* Errors explain + recover; never apologize vaguely.

### 4.7 Accessibility floor
WCAG AA contrast (verified on dark), full keyboard paths (search, mega menu, filters, gallery, compare), visible focus rings (2px accent), proper roles/labels, RO/RU `lang` + hreflang, 44px touch targets.

---

## 5. Wireframes (annotated layouts — visuals follow inline)

### 5.1 Homepage — Discovery Hub (desktop)
Not a marketing hero. The first screen *is* the tool.
```
┌───────────────────────────────────────────────────────────────┐
│ HEADER  [logo] Products▾ Brands  By Application  Guides   [RO▾] │
│         [───────── Smart Search (wide, focused by default) ──]  │
│                                            [☎ Viber] [Quote ▦3] │
├───────────────────────────────────────────────────────────────┤
│ THE FINDER (signature)                                         │
│  "Găsește materialul potrivit."   small industrial subhead     │
│  ┌ Tabs: [ Pe categorie ][ Pe brand ][ Pe aplicație ]──────┐   │
│  │  [ select Section ▾ ] [ select Category ▾ ] [ →  Caută ] │   │
│  └──────────────────────────────────────────────────────────┘ │
│  Popular searches:  ‹drywall› ‹knauf› ‹rockwool› ‹osb› ‹sika›  │
│  ── tick-rule divider ─┼───────┼───────┼───────┼───────────── │
├───────────────────────────────────────────────────────────────┤
│ QUICK ACCESS · SECTIONS   (grid of CategoryCards w/ icon+count)│
│ [Gips-carton][Termoizolare][Acoperiș][Fațade][Pardoseli][…20]  │
├───────────────────────────────────────────────────────────────┤
│ TOP BRANDS (rail of BrandCards)      [Knauf][Rockwool][Makita] │
├───────────────────────────────────────────────────────────────┤
│ FEATURED CATEGORIES (editorial cards w/ imagery + count)       │
├───────────────────────────────────────────────────────────────┤
│ POPULAR PRODUCTS (ProductGrid, prices in mono, stock badges)   │
├───────────────────────────────────────────────────────────────┤
│ QUOTE CTA strip: "Ai un proiect? Cere o ofertă în 24h" [CTA]   │
│ FOOTER: sections · brands · info · RO/RU · contact             │
└───────────────────────────────────────────────────────────────┘
```
Everything above is CMS‑driven (Homepage global + taxonomy + SearchSettings). Two clicks to product via The Finder or one via Popular/Featured.

### 5.2 Mega Menu (desktop, opens under "Products")
```
┌ Products ▾ ───────────────────────────────────────────────────┐
│ SECTIONS (col)     │ CATEGORIES in hovered section (2–3 cols)  │
│ ▸ Gips-carton  ●   │  Plăci gips-carton   Profile   Accesorii  │
│   Termoizolare     │  Plăci și panouri    …                    │
│   Acoperiș         │                                           │
│   Fațade           │ ── featured ──────────────────────────── │
│   Pardoseli        │ [Featured category img]  [Top brand logo] │
│   … (scroll)       │ Popular: ‹drywall› ‹profil› ‹OSB›         │
└────────────────────┴───────────────────────────────────────────┘
Keyboard: ↑/↓ sections, →/Tab into categories, Enter opens, Esc closes.
Mobile: full-screen stacked accordion (Section ▸ expands Categories).
```

### 5.3 Smart Search experience (overlay)
```
[ Search ▮ "rockwool 100"                                  ✕ ]
┌───────────────────────────────────────────────────────────┐
│ PRODUSE                                                    │
│  ▣ Vată minerală Rockwool 100mm   LC-12345  142,20 MDL/m²  │  ← mono SKU+price
│  ▣ Rockwool Hardrock 100          LC-12350  189,40 MDL/m²  │
│ BRANDURI                                                   │
│  ◇ Rockwool  (412 produse)                                 │
│ CATEGORII                                                  │
│  ▤ Termoizolare › Vată minerală                            │
│ ──────────────────────────────────────────────────────── │
│ ↵  Caută „rockwool 100" în tot catalogul                   │
└───────────────────────────────────────────────────────────┘
Idle state shows: Recent searches · Popular searches · top Sections.
Typo-tolerant (pg_trgm→Meili), RO↔RU synonyms, debounced; ↑/↓ highlight, ↵ select, Esc close. Ranking from SearchSettings (exact SKU/name → brand → category → popularity → featured → availability).
```

### 5.4 Category page (desktop)
```
Breadcrumbs: Acasă › Termoizolare › Vată minerală
H1 Vată minerală      [short intro / buying-guide teaser]
┌ FILTERS (sidebar) ─┬ RESULTS ───────────────────────────────┐
│ Brand     ▸ counts │ [Sort ▾]  [▦ grid / ▤ list]  412 produse│
│ Grosime   ▸ range  │ ┌Card┐┌Card┐┌Card┐┌Card┐                │
│ Aplicație ▸ chips  │ │img ││img ││img ││img │  price (mono)  │
│ Material  ▸ list   │ │stk ││stk ││stk ││stk │  [+ comandă]   │
│ Preț      ▸ slider │ └────┘└────┘└────┘└────┘                │
│ Disponibil □ stoc  │ … grid …            [Load more]         │
│ [Șterge filtrele]  │                                         │
└────────────────────┴─────────────────────────────────────────┘
Facets generated from the Attribute Registry (isFilterable). Active filters as removable chips above results. SEO: buying guide + FAQs below grid (from taxonomy page fields).
```

### 5.5 Product page (desktop)
```
Breadcrumbs
┌ GALLERY ────────────┬ BUY PANEL ───────────────────────────┐
│ [ primary image ]   │ Brand · H1 Product name               │
│ [t][t][t] thumbs    │ SKU LC-12345 (mono)   ● În stoc       │
│                     │ PriceDisplay  142,20 MDL / m² (mono)  │
│                     │ Variation picker (size/colour chips)  │
│                     │ [ Qty ⊟ 1 ⊞ ] [  Adaugă în comandă  ] │
│                     │ [ Compară ]  [ Cere ofertă ]          │
├─────────────────────┴───────────────────────────────────────┤
│ TABS: Descriere | Specificații | Documente | Livrare         │
│  Specificații → SpecificationTable grouped by registry group │
│  (Technical / Dimensions / Packaging / Performance / Install)│
├──────────────────────────────────────────────────────────────┤
│ RELATED: Accesorii · Alternative · Frecvent cumpărate împreună│
│ JSON-LD Product+Offer injected (generated-when-empty SEO)     │
└──────────────────────────────────────────────────────────────┘
```

### 5.6 Mobile (mobile‑first)
- **Home:** condensed header (logo + search icon + menu); **search bar pinned** under header; The Finder collapses to a single "Caută / Răsfoiește" card with the three tabs; horizontal rails for Sections/Brands; sticky **FloatingContactBar** (Viber/Quote).
- **Mega menu:** full‑screen accordion (Section ▸ Categories).
- **Filters:** bottom **Sheet** with facet groups; sticky **Aplică (N)** + **Șterge**.
- **Product:** swipeable gallery, sticky bottom bar with PriceDisplay + **Adaugă în comandă**.
- **Search:** full‑screen overlay; recent/popular as tappable chips.

---

## 6. Deliverables status & next step
Covered here: (1) IA, (2) user flows, (3) component inventory, (4) homepage, (5) mega menu, (6) search, (7) category, (8) product, (9) mobile, (10) design system — annotated. Visual wireframes for the highest‑leverage screens follow inline (Homepage, Smart Search, Mobile). On your approval of the direction I'll render the remaining visuals (mega menu, category, product) and then **build the component library first**, in this order: design tokens → primitives → SmartSearch → MegaMenu → cards/grid → filters → product/spec/gallery → quote cart → assemble pages.
