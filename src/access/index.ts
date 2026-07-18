import type { Access } from 'payload'

/** Public read. */
export const anyone: Access = () => true

/** Any logged-in admin/operator. */
export const authenticated: Access = ({ req: { user } }) => Boolean(user)

/**
 * Public can read published docs only; logged-in users can read everything
 * (including drafts). Requires `versions.drafts` on the collection.
 */
export const readPublished: Access = ({ req: { user } }) => {
  if (user) return true
  return { _status: { equals: 'published' } }
}
