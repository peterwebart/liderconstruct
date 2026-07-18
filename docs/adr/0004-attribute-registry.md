# ADR-0004: Attribute Registry — nothing hard-coded
Status: Accepted

## Context
50 sparse, category-specific product attributes plus variation attributes.
Filters, facets, comparison tables and spec sheets must not be hard-coded.

## Decision
A DB-driven Attribute Registry defines every attribute: data type, multilingual
labels, unit, group, and flags (searchable/filterable/sortable/comparable),
display priority and icon. Products store attribute values by registry `key`.
All filters/facets/comparison/spec blocks are derived from the registry.

## Consequences
- New attributes are configured in the CMS, not in code.
- Slightly more query work to assemble facets; mitigated by a denormalized
  search document (ADR-0006).
