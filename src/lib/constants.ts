/** Order lifecycle — RO labels per the ordering-workflow spec. */
export const ORDER_STATUSES = [
  { label: 'Nouă', value: 'noua' },
  { label: 'Contactată', value: 'contactata' },
  { label: 'Confirmată', value: 'confirmata' },
  { label: 'Livrată', value: 'livrata' },
  { label: 'Închisă', value: 'inchisa' },
  { label: 'Anulată', value: 'anulata' },
] as const

export const STOCK_STATUSES = [
  { label: 'În stoc', value: 'in_stock' },
  { label: 'Stoc redus', value: 'low_stock' },
  { label: 'Stoc epuizat', value: 'out_of_stock' },
] as const

/** Product lifecycle — business/editorial state (independent of stock facts). */
export const PRODUCT_LIFECYCLE = [
  { label: 'Draft', value: 'draft' },
  { label: 'Active', value: 'active' },
  { label: 'Coming Soon', value: 'coming_soon' },
  { label: 'Out of Stock', value: 'out_of_stock' },
  { label: 'Price on Request', value: 'price_on_request' },
  { label: 'Discontinued', value: 'discontinued' },
  { label: 'Hidden', value: 'hidden' },
  { label: 'Archived', value: 'archived' },
] as const

/** Taxonomy node levels: Section → Category → Subcategory → Product Family. */
export const TAXONOMY_LEVELS = [
  { label: 'Section', value: 'section' },
  { label: 'Category', value: 'category' },
  { label: 'Subcategory', value: 'subcategory' },
  { label: 'Product Family', value: 'family' },
] as const

/** Attribute registry groupings. */
export const ATTRIBUTE_GROUPS = [
  { label: 'Technical', value: 'technical' },
  { label: 'Dimensions', value: 'dimensions' },
  { label: 'Packaging', value: 'packaging' },
  { label: 'Performance', value: 'performance' },
  { label: 'Installation', value: 'installation' },
  { label: 'General', value: 'general' },
] as const

export const ATTRIBUTE_DATATYPES = [
  { label: 'Text', value: 'text' },
  { label: 'Number', value: 'number' },
  { label: 'Boolean', value: 'boolean' },
  { label: 'Enum', value: 'enum' },
  { label: 'Range', value: 'range' },
  { label: 'Dimension', value: 'dimension' },
] as const

/** Variation-defining attribute types (extended per the dataset analysis). */
export const VARIATION_ATTRIBUTE_TYPES = [
  { label: 'Grosime', value: 'thickness' },
  { label: 'Mărime', value: 'size' },
  { label: 'Lungime', value: 'length' },
  { label: 'Suprafață (m²)', value: 'area' },
  { label: 'Culoare', value: 'colour' },
  { label: 'Cantitate', value: 'quantity' },
  { label: 'Ambalare (kg)', value: 'packaging_kg' },
  { label: 'Ambalare (litri)', value: 'packaging_litres' },
  { label: 'Foaie', value: 'sheet' },
  { label: 'Per m²', value: 'per_m2' },
  { label: 'Deschidere uși', value: 'door_opening' },
  { label: 'Dimensiuni ușă', value: 'door_dimensions' },
  { label: 'Ochiul', value: 'eyelet' },
  { label: 'Altul', value: 'other' },
] as const

/** Product media/asset kinds (schema-ready for future population). */
export const ASSET_TYPES = [
  { label: 'Gallery', value: 'gallery' },
  { label: 'Installation', value: 'installation' },
  { label: 'Lifestyle', value: 'lifestyle' },
  { label: 'Technical drawing', value: 'technical_drawing' },
  { label: 'Datasheet (PDF)', value: 'datasheet' },
  { label: 'Certificate', value: 'certificate' },
  { label: 'Manual (PDF)', value: 'manual' },
  { label: 'BIM file', value: 'bim' },
  { label: 'Other', value: 'other' },
] as const

/** Import source formats. */
export const IMPORT_FORMATS = [
  { label: 'ODS', value: 'ods' },
  { label: 'XLSX', value: 'xlsx' },
  { label: 'CSV', value: 'csv' },
  { label: 'TSV', value: 'tsv' },
  { label: 'XML', value: 'xml' },
] as const

/** Import execution modes (field-scoped so price lists never clobber data). */
export const IMPORT_MODES = [
  { label: 'Full', value: 'full' },
  { label: 'Incremental', value: 'incremental' },
  { label: 'Price only', value: 'price_only' },
  { label: 'Stock only', value: 'stock_only' },
  { label: 'Product only', value: 'product_only' },
  { label: 'Dry run', value: 'dry_run' },
] as const

export const IMPORT_RUN_STATUSES = [
  { label: 'Pending', value: 'pending' },
  { label: 'Running', value: 'running' },
  { label: 'Completed', value: 'completed' },
  { label: 'Failed', value: 'failed' },
  { label: 'Rolled back', value: 'rolled_back' },
] as const

export const IMPORT_LOG_ACTIONS = [
  { label: 'Create', value: 'create' },
  { label: 'Update', value: 'update' },
  { label: 'Skip', value: 'skip' },
  { label: 'Quarantine', value: 'quarantine' },
  { label: 'Warning', value: 'warning' },
  { label: 'Error', value: 'error' },
] as const

/** Delivery: 300 lei Chișinău / quote outside (ordering-workflow spec). */
export const DELIVERY_CHISINAU_MDL = 300

/** Starting order number; display is base + sequence. */
export const ORDER_NUMBER_BASE = 1000
