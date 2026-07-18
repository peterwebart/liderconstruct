# ADR-0010: Brand & unit normalization via aliases
Status: Accepted

## Context
Source brands have casing variants (Euro As/Euro AS); 27% missing. Units are
inconsistent (kg/Kg, sac/saci, 1 m2/m2) with a bogus "Marime"; 34% missing.

## Decision
Auto-create canonical Brand and Unit records with an `aliases` list; match by a
normalized alias key so capitalization/format never creates duplicates. Brands
start minimal (name, slug, status, source, aliases); enrich later. Missing
brand/unit does not block import — the product imports flagged `needsReview`.
Bogus units (Marime) are dropped; truly unknown values remain flagged.

## Consequences
- No duplicate brands/units. Missing metadata is a data task, not an import bug.
