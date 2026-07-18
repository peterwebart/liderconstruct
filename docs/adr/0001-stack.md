# ADR-0001: Stack — Next.js 15 + Payload CMS 3 + PostgreSQL
Status: Accepted

## Context
Rebuild of an EOL Drupal 7 store; bilingual RO/RU, SEO-critical, mobile-first,
must be durable and B2B-ready. Infrastructure is fixed: GitHub → Coolify →
Hetzner, PostgreSQL, pnpm.

## Decision
Use a single TypeScript codebase: Next.js 15 (App Router) storefront with
Payload CMS 3 as the admin + data layer running inside it, on PostgreSQL.

## Consequences
- One language, one repo; Payload admin is operator-friendly; Next gives full
  SSR/SEO control. We build cart/checkout logic ourselves (acceptable — the
  ordering model is simple; see ADR-0002).
- Self-hosted: we own upgrades/patching.
