import { postgresAdapter } from '@payloadcms/db-postgres'
import { nodemailerAdapter } from '@payloadcms/email-nodemailer'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import sharp from 'sharp'
import { fileURLToPath } from 'url'

import { Attributes } from './collections/Attributes'
import { Brands } from './collections/Brands'
import { Categories } from './collections/Categories'
import { ImportLogs } from './collections/ImportLogs'
import { ImportProfiles } from './collections/ImportProfiles'
import { ImportRuns } from './collections/ImportRuns'
import { Manufacturers } from './collections/Manufacturers'
import { Media } from './collections/Media'
import { Orders } from './collections/Orders'
import { Products } from './collections/Products'
import { Synonyms } from './collections/Synonyms'
import { Units } from './collections/Units'
import { Users } from './collections/Users'
import { Variations } from './collections/Variations'
import { Homepage } from './globals/Homepage'
import { BusinessRules } from './globals/BusinessRules'
import { SearchSettings } from './globals/SearchSettings'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

// Only configure SMTP when credentials are present; otherwise Payload logs
// emails to the console (fine for local dev). Production uses Postmark/SES.
const email = process.env.SMTP_HOST
  ? nodemailerAdapter({
      defaultFromName: process.env.EMAIL_FROM_NAME || 'LiderConstruct',
      defaultFromAddress: process.env.EMAIL_FROM_ADDRESS || 'comenzi@liderconstruct.md',
      transportOptions: {
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      },
    })
  : undefined

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    meta: {
      titleSuffix: '— LiderConstruct',
    },
    components: {
      beforeDashboard: ['/components/ValidationDashboard'],
    },
  },
  collections: [
    Users,
    Media,
    Categories,
    Brands,
    Manufacturers,
    Units,
    Attributes,
    Products,
    Variations,
    Synonyms,
    Orders,
    ImportProfiles,
    ImportRuns,
    ImportLogs,
  ],
  globals: [Homepage, SearchSettings, BusinessRules],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI || '',
    },
  }),
  localization: {
    locales: [
      { label: 'Română', code: 'ro' },
      { label: 'Русский', code: 'ru' },
    ],
    defaultLocale: 'ro',
    fallback: true,
  },
  i18n: {
    fallbackLanguage: 'ro',
  },
  ...(email ? { email } : {}),
  sharp,
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})
