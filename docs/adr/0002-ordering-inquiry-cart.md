# ADR-0002: Ordering model — inquiry cart (no payment, no accounts)
Status: Accepted

## Context
The business runs an assisted-sale model: an operator confirms availability,
final price and delivery by phone. No online payment or customer accounts are
wanted for the MVP.

## Decision
Implement an "order request": the customer submits name + phone (+ optional
contact/delivery), which emails the business and the customer and appears in an
Orders list with statuses Nouă→Contactată→Confirmată→Livrată→Închisă (+Anulată).
Missing prices show "Preț la cerere", never 0,00 lei. Totals are server-side.

## Consequences
- No PCI scope, no auth surface. Payment/accounts/CRM are explicitly out of
  scope and can be added later behind the same Orders model.
