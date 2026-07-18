/**
 * Seeds the internal taxonomy + canonical Units + Brands (idempotent) and
 * applies the APPROVED high-confidence supplier-category aliases.
 * Run with:  pnpm seed  (env via the shared CLI bootstrap — src/scripts/cli)
 * Does NOT create categories from supplier names — only our business taxonomy.
 */
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import type { Payload } from 'payload'

import type { Attribute, Brand, Category } from '../payload-types'
import { TAXONOMY, type TaxNode } from '../seed/taxonomy'
import { slugify } from '../services/import/normalizer'
import { runCli } from './cli/bootstrap'

const dirname = path.dirname(fileURLToPath(import.meta.url))
const LEVELS: Category['level'][] = ['section', 'category', 'subcategory', 'family']

interface SeedAttribute {
  key: string
  displayName: string
  dataType: Attribute['dataType']
  group: Attribute['group']
  isFilterable: boolean
  isSearchable: boolean
  isComparable: boolean
  displayPriority: number
}

interface SeedUnit {
  code: string
  label: string
  symbol?: string
  aliases: string[]
}
interface SeedBrand {
  name: string
  slug: string
  status: Brand['status']
  source: string
  aliases: string[]
}

async function seedAttributes(payload: Payload): Promise<number> {
  const attrs = JSON.parse(
    readFileSync(path.resolve(dirname, '../seed/attributes.json'), 'utf8'),
  ) as SeedAttribute[]
  for (const a of attrs) {
    const existing = await payload.find({ collection: 'attributes', where: { key: { equals: a.key } }, limit: 1, depth: 0 })
    const data = { ...a, appliesToVariation: false }
    if (existing.docs[0]) await payload.update({ collection: 'attributes', id: existing.docs[0].id, data, depth: 0 })
    else await payload.create({ collection: 'attributes', data, depth: 0 })
  }
  return attrs.length
}

async function seedUnits(payload: Payload): Promise<number> {
  const units = JSON.parse(readFileSync(path.resolve(dirname, '../seed/units.json'), 'utf8')) as SeedUnit[]
  for (const u of units) {
    const existing = await payload.find({ collection: 'units', where: { code: { equals: u.code } }, limit: 1, depth: 0 })
    const data = { code: u.code, label: u.label, symbol: u.symbol, aliases: u.aliases }
    if (existing.docs[0]) await payload.update({ collection: 'units', id: existing.docs[0].id, data, depth: 0 })
    else await payload.create({ collection: 'units', data, depth: 0 })
  }
  return units.length
}

async function seedBrands(payload: Payload): Promise<number> {
  const brands = JSON.parse(readFileSync(path.resolve(dirname, '../seed/brands.json'), 'utf8')) as SeedBrand[]
  for (const b of brands) {
    const existing = await payload.find({ collection: 'brands', where: { slug: { equals: b.slug } }, limit: 1, depth: 0 })
    const data = { name: b.name, slug: b.slug, status: b.status, source: b.source, aliases: b.aliases }
    if (existing.docs[0]) await payload.update({ collection: 'brands', id: existing.docs[0].id, data, depth: 0 })
    else await payload.create({ collection: 'brands', data, depth: 0 })
  }
  return brands.length
}

async function seedNode(payload: Payload, node: TaxNode, level: number, parent: number | null): Promise<void> {
  const slug = slugify(node.title)
  const existing = await payload.find({
    collection: 'categories',
    where: { and: [{ slug: { equals: slug } }, { level: { equals: LEVELS[level] } }] },
    limit: 1,
    depth: 0,
    locale: 'ro',
  })
  const data = { title: node.title, level: LEVELS[level], parent: parent ?? undefined }
  let id: number
  if (existing.docs[0]) {
    id = existing.docs[0].id
    await payload.update({ collection: 'categories', id, data, depth: 0, locale: 'ro' })
  } else {
    const created = await payload.create({
      collection: 'categories',
      data: { ...data, slug },
      depth: 0,
      locale: 'ro',
    })
    id = created.id
  }
  for (const child of node.children ?? []) await seedNode(payload, child, level + 1, id)
}

interface ApprovedAlias {
  supplier: string
  slug: string
}

/** Attaches approved high-confidence supplier categories as aliases on the
 * matching internal node. Medium/low confidence are left out (manual review). */
async function applyApprovedAliases(payload: Payload): Promise<number> {
  const aliases = JSON.parse(
    readFileSync(path.resolve(dirname, '../seed/category-aliases.json'), 'utf8'),
  ) as ApprovedAlias[]
  const bySlug = new Map<string, string[]>()
  for (const a of aliases) bySlug.set(a.slug, [...(bySlug.get(a.slug) ?? []), a.supplier])
  let applied = 0
  for (const [slug, suppliers] of bySlug) {
    const found = await payload.find({
      collection: 'categories',
      where: { slug: { equals: slug } },
      limit: 1,
      depth: 0,
      locale: 'ro',
    })
    const node = found.docs[0]
    if (!node) continue
    const merged = Array.from(new Set([...(node.aliases ?? []), ...suppliers]))
    await payload.update({ collection: 'categories', id: node.id, data: { aliases: merged }, depth: 0, locale: 'ro' })
    applied += suppliers.length
  }
  return applied
}

void runCli('seed', async (payload) => {
  const units = await seedUnits(payload)
  const brands = await seedBrands(payload)
  const attributes = await seedAttributes(payload)
  for (const section of TAXONOMY) await seedNode(payload, section, 0, null)
  const aliasesApplied = await applyApprovedAliases(payload)
  const cats = await payload.count({ collection: 'categories' })
  payload.logger.info(
    `Seed complete: ${units} units, ${brands} brands, ${attributes} registry attributes, ${cats.totalDocs} taxonomy nodes, ${aliasesApplied} approved category aliases applied.`,
  )
})
