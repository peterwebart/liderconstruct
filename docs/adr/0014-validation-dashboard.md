# ADR-0014: Validation Dashboard
Status: Accepted

## Context
Imported data will have gaps (missing brand/unit, pending category mappings,
no images/descriptions, duplicate candidates). The team needs a daily work
queue, not ad-hoc queries.

## Decision
Add an admin Validation Dashboard (Payload `beforeDashboard` server component)
showing live counts — products needing review, missing brand/unit/category,
without image/description, variations price-on-request — each linking to the
pre-filtered list view, plus recent import history. Backed by the local API.

## Consequences
- Operators triage from one screen. Counts reflect the live DB.
- It's admin tooling (not the customer storefront), so it's built now; the
  storefront still waits until the catalog is validated.
