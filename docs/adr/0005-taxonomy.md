# ADR-0005: Taxonomy — business-oriented, supplier-independent
Status: Accepted

## Context
Supplier data has 127 flat categories. Customers (contractors) need intuitive
navigation; SEO needs curated hubs. Supplier taxonomy must not leak into UX/URLs.

## Decision
Maintain our own taxonomy: Section → Category → Subcategory → Product Family,
self-nested. Supplier category strings become `aliases` mapped INTO our nodes
(one internal node ← many supplier categories). Mappings are reviewed/approved
before being applied; unknowns are reported, never auto-created.

## Consequences
- Stable URLs/navigation independent of supplier changes.
- A mapping step is required per supplier; supported by an automated proposal
  with confidence scores.
