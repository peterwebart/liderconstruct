import type { CollectionAfterChangeHook, CollectionBeforeChangeHook } from 'payload'

import { ORDER_NUMBER_BASE } from '../lib/constants'

interface OrderItem {
  sku?: string | null
  productTitle?: string | null
  variationLabel?: string | null
  quantity?: number | null
  unitPrice?: number | null
  priceOnRequest?: boolean | null
  lineTotal?: number | null
}

interface OrderCustomer {
  name?: string | null
  phone?: string | null
  email?: string | null
  locality?: string | null
}

interface OrderData {
  orderNumber?: number | null
  language?: 'ro' | 'ru' | null
  items?: OrderItem[] | null
  estimatedTotal?: number | null
  customer?: OrderCustomer | null
}

const money = (n: number): string =>
  `${new Intl.NumberFormat('ro-MD', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)} lei`

/**
 * On create: assign a human order number and compute line totals + the
 * estimated total on the server (never trust client-supplied totals).
 * Items with priceOnRequest are excluded from the estimate.
 */
export const prepareOrder: CollectionBeforeChangeHook = async ({ data, operation, req }) => {
  const order = data as OrderData

  if (Array.isArray(order.items)) {
    let estimated = 0
    order.items = order.items.map((item) => {
      const qty = Number(item.quantity) || 0
      const onRequest = Boolean(item.priceOnRequest) || item.unitPrice == null
      const unit = onRequest ? 0 : Number(item.unitPrice) || 0
      const lineTotal = onRequest ? 0 : Math.round(unit * qty * 100) / 100
      if (!onRequest) estimated += lineTotal
      return { ...item, unitPrice: onRequest ? null : unit, lineTotal: onRequest ? null : lineTotal }
    })
    order.estimatedTotal = Math.round(estimated * 100) / 100
  }

  if (operation === 'create' && !order.orderNumber) {
    const { totalDocs } = await req.payload.count({ collection: 'orders' })
    order.orderNumber = ORDER_NUMBER_BASE + totalDocs + 1
  }

  return order
}

const buildLines = (items: OrderItem[]): string =>
  items
    .map((i) => {
      const label = [i.productTitle, i.variationLabel].filter(Boolean).join(' — ')
      const price = i.priceOnRequest || i.unitPrice == null ? 'Preț la cerere' : money(Number(i.unitPrice))
      const line =
        i.priceOnRequest || i.lineTotal == null ? '—' : money(Number(i.lineTotal))
      return `• ${label} | SKU ${i.sku ?? '—'} | ${i.quantity ?? 0} × ${price} = ${line}`
    })
    .join('\n')

/**
 * On create: email the business (always) and the customer (if email given).
 * Bilingual subject/body driven by the order language. Email is sent via the
 * configured transport — failures are logged, never thrown, so the order is
 * still saved even if mail is briefly unavailable.
 */
export const notifyOrder: CollectionAfterChangeHook = async ({ doc, operation, req }) => {
  if (operation !== 'create') return doc

  const order = doc as OrderData
  const num = order.orderNumber ?? '—'
  const lang = order.language === 'ru' ? 'ru' : 'ro'
  const items = Array.isArray(order.items) ? order.items : []
  const estimate = order.estimatedTotal != null ? money(Number(order.estimatedTotal)) : '—'
  const c = order.customer ?? {}

  const adminTo = process.env.ORDER_NOTIFICATION_TO || 'comenzi@liderconstruct.md'
  const adminBody = [
    `Comandă nouă #${num} (${lang.toUpperCase()})`,
    '',
    `Client: ${c.name ?? ''} | Tel: ${c.phone ?? ''}`,
    `Email: ${c.email ?? '—'} | Localitate: ${c.locality ?? '—'}`,
    '',
    buildLines(items),
    '',
    `Total estimat: ${estimate} (preț final confirmat la telefon)`,
  ].join('\n')

  try {
    await req.payload.sendEmail({
      to: adminTo,
      subject: `Comandă nouă #${num}`,
      text: adminBody,
    })
  } catch (err) {
    req.payload.logger.error({ err, msg: 'Failed to send order notification email' })
  }

  if (c.email) {
    const customerBody =
      lang === 'ru'
        ? [
            `Здравствуйте, ${c.name ?? ''}!`,
            '',
            `Ваш запрос №${num} получен. Это запрос на заказ — оплата сейчас не требуется. Мы свяжемся с вами для подтверждения наличия, итоговой цены и доставки.`,
            '',
            buildLines(items),
            '',
            `Предварительная сумма: ${estimate}`,
            '',
            'LiderConstruct',
          ].join('\n')
        : [
            `Bună ziua, ${c.name ?? ''}!`,
            '',
            `Comanda dvs. #${num} a fost trimisă. Aceasta este o solicitare de comandă — nu se cere plată acum. Vă vom contacta pentru a confirma disponibilitatea, prețul final și livrarea.`,
            '',
            buildLines(items),
            '',
            `Total estimat: ${estimate}`,
            '',
            'LiderConstruct',
          ].join('\n')

    try {
      await req.payload.sendEmail({
        to: c.email,
        subject: lang === 'ru' ? `Запрос №${num} получен` : `Comanda #${num} a fost primită`,
        text: customerBody,
      })
    } catch (err) {
      req.payload.logger.error({ err, msg: 'Failed to send customer confirmation email' })
    }
  }

  return doc
}
