# ADR-0003: Catalog model — products & variations separate; supplier SKU is the sync key
Status: Accepted

## Context
2,330 products / 5,686 variations, doors-heavy. The source links a product to
its variations via a comma-separated SKU list; product names are unreliable
(135 duplicate-name rows). Future supplier imports must update, not recreate.

## Decision
Keep Products and Variations as separate collections. SKU (LC-#####/n) is the
global synchronization key on Variations. Products carry a `legacyKey` (base
SKU) for idempotent identity. Matching is by SKU/legacyKey only — never by name.

## Consequences
- Re-imports update in place; price/stock updates target variations by SKU.
- Integrity errors (duplicate SKU, multi-product SKU, orphans) are quarantined
  and reported, never silently merged.
