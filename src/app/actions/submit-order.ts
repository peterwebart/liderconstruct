'use server'

import config from '@payload-config'
import { getPayload } from 'payload'

/**
 * Flow F submit (ADR-0002): creates the inquiry order. Never trusts client
 * prices — every line is re-priced from the catalog by SKU; totals + order
 * number come from the Orders beforeChange hook; emails from afterChange.
 * The honeypot returns a fake success without creating anything.
 */

export interface SubmitOrderInput {
  customer: {
    name: string
    phone: string
    locality: string
    email?: string
    address?: string
    notes?: string
  }
  items: { sku: string; quantity: number }[]
  locale?: 'ro' | 'ru'
  /** Honeypot — must stay empty. */
  website?: string
}

export type SubmitOrderResult =
  | { ok: true; orderNumber?: number }
  | { ok: false; error: string }

export async function submitOrder(input: SubmitOrderInput): Promise<SubmitOrderResult> {
  try {
    if (input.website && input.website.trim() !== '') return { ok: true }

    const name = (input.customer?.name ?? '').trim()
    const phone = (input.customer?.phone ?? '').trim()
    const locality = (input.customer?.locality ?? '').trim()
    const email = input.customer?.email?.trim() || undefined

    if (name.length < 2) return { ok: false, error: 'Introduceți numele.' }
    if (!/^[+0-9()\s.-]{6,20}$/.test(phone))
      return { ok: false, error: 'Introduceți un număr de telefon valid.' }
    if (locality.length < 2) return { ok: false, error: 'Introduceți localitatea.' }
    if (email && !/^\S+@\S+\.\S+$/.test(email))
      return { ok: false, error: 'Adresa de email nu este validă.' }

    const requested = (input.items ?? [])
      .map((i) => ({
        sku: String(i.sku ?? '').trim(),
        quantity: Math.min(9999, Math.max(1, Math.round(Number(i.quantity) || 1))),
      }))
      .filter((i) => i.sku.length > 0)
    if (requested.length === 0) return { ok: false, error: 'Comanda este goală.' }

    const payload = await getPayload({ config })
    const locale = input.locale === 'ru' ? 'ru' : 'ro'
    const found = await payload.find({
      collection: 'variations',
      where: { sku: { in: requested.map((r) => r.sku) } },
      limit: requested.length,
      pagination: false,
      depth: 1,
      locale,
    })
    const bySku = new Map(found.docs.map((v) => [v.sku, v]))

    const items = requested.flatMap((r) => {
      const v = bySku.get(r.sku)
      if (!v) return []
      const product = typeof v.product === 'number' ? null : v.product
      const onRequest = Boolean(v.priceOnRequest) || v.price == null
      return [
        {
          sku: v.sku,
          quantity: r.quantity,
          productTitle: product?.title ?? undefined,
          variationLabel: v.label ?? undefined,
          unitPrice: onRequest ? undefined : (v.price as number),
          priceOnRequest: onRequest,
        },
      ]
    })
    if (items.length === 0)
      return { ok: false, error: 'Produsele din comandă nu au fost găsite în catalog.' }

    const order = await payload.create({
      collection: 'orders',
      data: {
        status: 'noua',
        language: locale,
        customer: {
          name,
          phone,
          locality,
          email,
          address: input.customer?.address?.trim() || undefined,
          notes: input.customer?.notes?.trim() || undefined,
        },
        items,
      },
      depth: 0,
    })
    return { ok: true, orderNumber: order.orderNumber ?? undefined }
  } catch (error) {
    console.error('submitOrder failed', error)
    return {
      ok: false,
      error: 'Comanda nu a putut fi trimisă. Încercați din nou sau sunați-ne.',
    }
  }
}
