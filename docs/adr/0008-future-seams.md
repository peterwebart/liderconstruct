# ADR-0008: Future-proofing seams — design now, build later
Status: Accepted

## Context
The platform must scale to 1M products / 5M variations and gain suppliers,
multiple price lists, inventory/warehouses, customer pricing, images, BIM/docs —
without a rewrite. But we must not over-engineer today.

## Decision
Model the seams now, implement only what today needs. Manufacturers exist as a
separate entity from Brands. Products/Variations carry nullable barcode and
future media/relationship structures. Suppliers, SupplierSkus, PriceLists,
Warehouses/StockLevels, ProductImages and TechnicalDocuments are documented as
additive collections; today `Variations.price` is "the default price list,
denormalized" and `stockStatus` is "a projection of future inventory".

## Consequences
- Expansion is additive migrations, not refactors. Current surface stays lean.
