/** Formatting rules for measured values (always mono in the UI). */

const mdl = new Intl.NumberFormat('ro-MD', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

/** 3450 -> "3.450,00 MDL" (ro-MD grouping/decimals). */
export function formatMoney(amount: number): string {
  return `${mdl.format(amount)} MDL`
}

/** Compact count, e.g. facet counts. */
export function formatCount(n: number): string {
  return new Intl.NumberFormat('ro-MD').format(n)
}
