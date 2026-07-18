import config from '@payload-config'
import { getPayload } from 'payload'
import React from 'react'

/**
 * Validation Dashboard — the team's daily work queue, rendered above the Payload
 * dashboard. Each tile links to the pre-filtered list view. Server component:
 * counts are computed live via the local API.
 */

interface Tile {
  label: string
  count: number
  href: string
  tone?: 'warn' | 'info'
}

async function safeCount(fn: () => Promise<{ totalDocs: number }>): Promise<number> {
  try {
    return (await fn()).totalDocs
  } catch {
    return 0
  }
}

const ValidationDashboard = async (): Promise<React.JSX.Element> => {
  const payload = await getPayload({ config })

  const products = '/admin/collections/products'
  const w = (q: string): string => `${products}?${q}`

  const [needsReview, missingBrand, missingCategory, missingUnit, noImage, noShortDesc, onRequestVariations] =
    await Promise.all([
      safeCount(() => payload.count({ collection: 'products', where: { needsReview: { equals: true } } })),
      safeCount(() => payload.count({ collection: 'products', where: { brand: { exists: false } } })),
      safeCount(() => payload.count({ collection: 'products', where: { category: { exists: false } } })),
      safeCount(() => payload.count({ collection: 'products', where: { unit: { exists: false } } })),
      safeCount(() => payload.count({ collection: 'products', where: { primaryImage: { exists: false } } })),
      safeCount(() => payload.count({ collection: 'products', where: { shortDescription: { exists: false } } })),
      safeCount(() => payload.count({ collection: 'variations', where: { priceOnRequest: { equals: true } } })),
    ])

  const tiles: Tile[] = [
    { label: 'Produse de revizuit', count: needsReview, href: w('where[needsReview][equals]=true'), tone: 'warn' },
    { label: 'Fără brand', count: missingBrand, href: w('where[brand][exists]=false') },
    { label: 'Fără categorie', count: missingCategory, href: w('where[category][exists]=false') },
    { label: 'Fără unitate', count: missingUnit, href: w('where[unit][exists]=false') },
    { label: 'Fără imagine', count: noImage, href: w('where[primaryImage][exists]=false') },
    { label: 'Fără descriere', count: noShortDesc, href: w('where[shortDescription][exists]=false') },
    { label: 'Variații „preț la cerere”', count: onRequestVariations, href: '/admin/collections/variations?where[priceOnRequest][equals]=true' },
  ]

  let runs: { id: string | number; sourceFile?: string; mode?: string; status?: string; warnings?: number; errors?: number }[] = []
  try {
    const res = await payload.find({ collection: 'import-runs', limit: 5, sort: '-createdAt', depth: 0 })
    runs = res.docs as typeof runs
  } catch {
    runs = []
  }

  return (
    <div style={{ marginBottom: '2rem' }}>
      <h2 style={{ marginBottom: '0.75rem' }}>Coadă de lucru — validare catalog</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.75rem' }}>
        {tiles.map((t) => (
          <a
            key={t.label}
            href={t.href}
            style={{
              display: 'block',
              padding: '1rem',
              borderRadius: 8,
              border: '1px solid var(--theme-elevation-150)',
              background: 'var(--theme-elevation-50)',
              textDecoration: 'none',
              color: 'inherit',
            }}
          >
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: t.tone === 'warn' && t.count > 0 ? 'var(--theme-warning-500)' : 'inherit' }}>
              {t.count}
            </div>
            <div style={{ fontSize: '0.85rem', opacity: 0.8 }}>{t.label}</div>
          </a>
        ))}
      </div>

      <h3 style={{ margin: '1.5rem 0 0.5rem' }}>Istoric importuri</h3>
      {runs.length === 0 ? (
        <p style={{ opacity: 0.7 }}>Niciun import încă. Vezi colecția „Import Runs”.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {runs.map((r) => (
            <li key={String(r.id)} style={{ padding: '0.4rem 0', borderBottom: '1px solid var(--theme-elevation-100)' }}>
              <a href={`/admin/collections/import-runs/${r.id}`} style={{ color: 'inherit' }}>
                {r.sourceFile ?? '—'} · {r.mode ?? '—'} · {r.status ?? '—'} · {r.warnings ?? 0} avertismente / {r.errors ?? 0} erori
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default ValidationDashboard
