# Architecture Decision Records

Each significant architectural decision is recorded here as an ADR so the
project stays maintainable as it grows. Format: Context → Decision →
Consequences. Status is one of Proposed / Accepted / Superseded.

| # | Title | Status |
|---|---|---|
| 0001 | Stack: Next.js + Payload CMS + PostgreSQL | Accepted |
| 0002 | Ordering model: inquiry cart (no payment/accounts) | Accepted |
| 0003 | Catalog model: products/variations separate; SKU sync key | Accepted |
| 0004 | Attribute Registry: nothing hard-coded | Accepted |
| 0005 | Taxonomy: business-oriented, supplier-independent | Accepted |
| 0006 | Search: abstracted, staged PG→Meilisearch→AI, configurable ranking | Accepted |
| 0007 | Import pipeline: modular, dry-run, snapshot rollback | Accepted |
| 0008 | Future-proofing seams (suppliers/pricing/inventory/media) | Accepted |
| 0009 | Internationalization: RO default + RU | Accepted |
| 0010 | Brand & unit normalization via aliases | Accepted |
| 0011 | URL structure | Accepted |
| 0012 | ADR process | Accepted |
| 0013 | Business Rules Engine | Accepted |
| 0014 | Validation Dashboard | Accepted |
