# ADR-0013: Business Rules Engine
Status: Accepted

## Context
The importer must not just move data — it must normalize and validate it
consistently. Transformation logic scattered in the importer would be untestable
and duplicated across future supplier adapters.

## Decision
Introduce a dedicated Business Rules layer (`src/services/rules/`) owning ALL
transformation, status and SEO logic: text/whitespace/capitalization, decimal
and dimension/packaging/quantity parsing, unit & brand alias resolution, slug &
URL normalization, configurable product-status rules, and generate-when-empty
SEO. The importer delegates to it (its `normalizer` is a thin re-export). Rules
are configurable via code defaults + a CMS `business-rules` global.

## Consequences
- One tested home for business logic; importer stays a thin pipeline.
- Status rules (price≤0 → price-on-request; no active variation → hidden;
  supplier discontinued → discontinued; missing required → needs review) are
  tunable without code changes. SEO is generated only when empty — manual wins.
