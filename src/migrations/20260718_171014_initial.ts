import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."_locales" AS ENUM('ro', 'ru');
  CREATE TYPE "public"."enum_categories_level" AS ENUM('section', 'category', 'subcategory', 'family');
  CREATE TYPE "public"."enum_brands_status" AS ENUM('active', 'draft', 'merged', 'archived');
  CREATE TYPE "public"."enum_attributes_data_type" AS ENUM('text', 'number', 'boolean', 'enum', 'range', 'dimension');
  CREATE TYPE "public"."enum_attributes_group" AS ENUM('technical', 'dimensions', 'packaging', 'performance', 'installation', 'general');
  CREATE TYPE "public"."enum_products_assets_type" AS ENUM('gallery', 'installation', 'lifestyle', 'technical_drawing', 'datasheet', 'certificate', 'manual', 'bim', 'other');
  CREATE TYPE "public"."enum_products_enrichment_status" AS ENUM('none', 'ai_suggested', 'human_reviewed');
  CREATE TYPE "public"."enum_products_lifecycle" AS ENUM('draft', 'active', 'coming_soon', 'out_of_stock', 'price_on_request', 'discontinued', 'hidden', 'archived');
  CREATE TYPE "public"."enum_products_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__products_v_version_assets_type" AS ENUM('gallery', 'installation', 'lifestyle', 'technical_drawing', 'datasheet', 'certificate', 'manual', 'bim', 'other');
  CREATE TYPE "public"."enum__products_v_version_enrichment_status" AS ENUM('none', 'ai_suggested', 'human_reviewed');
  CREATE TYPE "public"."enum__products_v_version_lifecycle" AS ENUM('draft', 'active', 'coming_soon', 'out_of_stock', 'price_on_request', 'discontinued', 'hidden', 'archived');
  CREATE TYPE "public"."enum__products_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__products_v_published_locale" AS ENUM('ro', 'ru');
  CREATE TYPE "public"."enum_variations_attributes_type" AS ENUM('thickness', 'size', 'length', 'area', 'colour', 'quantity', 'packaging_kg', 'packaging_litres', 'sheet', 'per_m2', 'door_opening', 'door_dimensions', 'eyelet', 'other');
  CREATE TYPE "public"."enum_variations_stock_status" AS ENUM('in_stock', 'low_stock', 'out_of_stock');
  CREATE TYPE "public"."enum_synonyms_kind" AS ENUM('synonym', 'translation');
  CREATE TYPE "public"."enum_synonyms_locale" AS ENUM('ro', 'ru', 'both');
  CREATE TYPE "public"."enum_orders_status" AS ENUM('noua', 'contactata', 'confirmata', 'livrata', 'inchisa', 'anulata');
  CREATE TYPE "public"."enum_orders_language" AS ENUM('ro', 'ru');
  CREATE TYPE "public"."enum_import_profiles_column_map_kind" AS ENUM('field', 'attribute', 'variation_attribute');
  CREATE TYPE "public"."enum_import_profiles_source_format" AS ENUM('ods', 'xlsx', 'csv', 'tsv', 'xml');
  CREATE TYPE "public"."enum_import_profiles_decimal_separator" AS ENUM('.', ',');
  CREATE TYPE "public"."enum_import_runs_mode" AS ENUM('full', 'incremental', 'price_only', 'stock_only', 'product_only', 'dry_run');
  CREATE TYPE "public"."enum_import_runs_status" AS ENUM('pending', 'running', 'completed', 'failed', 'rolled_back');
  CREATE TYPE "public"."enum_import_logs_action" AS ENUM('create', 'update', 'skip', 'quarantine', 'warning', 'error');
  CREATE TYPE "public"."enum_import_logs_level" AS ENUM('info', 'warning', 'error');
  CREATE TYPE "public"."enum_homepage_blocks_product_query_source" AS ENUM('popular', 'new', 'recent', 'promotions');
  CREATE TYPE "public"."enum_search_settings_engine" AS ENUM('postgres', 'meilisearch', 'ai');
  CREATE TYPE "public"."enum_business_rules_status_needs_review_when_missing" AS ENUM('brand', 'unit', 'category');
  CREATE TABLE "users_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "users" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "media" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric,
  	"sizes_thumbnail_url" varchar,
  	"sizes_thumbnail_width" numeric,
  	"sizes_thumbnail_height" numeric,
  	"sizes_thumbnail_mime_type" varchar,
  	"sizes_thumbnail_filesize" numeric,
  	"sizes_thumbnail_filename" varchar,
  	"sizes_card_url" varchar,
  	"sizes_card_width" numeric,
  	"sizes_card_height" numeric,
  	"sizes_card_mime_type" varchar,
  	"sizes_card_filesize" numeric,
  	"sizes_card_filename" varchar,
  	"sizes_feature_url" varchar,
  	"sizes_feature_width" numeric,
  	"sizes_feature_height" numeric,
  	"sizes_feature_mime_type" varchar,
  	"sizes_feature_filesize" numeric,
  	"sizes_feature_filename" varchar
  );
  
  CREATE TABLE "media_locales" (
  	"alt" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "categories_faqs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "categories_faqs_locales" (
  	"question" varchar NOT NULL,
  	"answer" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "categories" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"level" "enum_categories_level" NOT NULL,
  	"parent_id" integer,
  	"hero_image_id" integer,
  	"icon" varchar,
  	"featured" boolean DEFAULT false,
  	"display_order" numeric DEFAULT 0,
  	"seo_og_image_id" integer,
  	"seo_no_index" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "categories_locales" (
  	"title" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"description" jsonb,
  	"buying_guide" jsonb,
  	"seo_meta_title" varchar,
  	"seo_meta_description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "categories_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "categories_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"products_id" integer
  );
  
  CREATE TABLE "brands_catalogues" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"file_id" integer
  );
  
  CREATE TABLE "brands_catalogues_locales" (
  	"label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "brands" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"status" "enum_brands_status" DEFAULT 'active',
  	"source" varchar,
  	"logo_id" integer,
  	"banner_id" integer,
  	"country" varchar,
  	"website" varchar,
  	"featured" boolean DEFAULT false,
  	"display_order" numeric DEFAULT 0,
  	"seo_og_image_id" integer,
  	"seo_no_index" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "brands_locales" (
  	"slug" varchar NOT NULL,
  	"description" jsonb,
  	"seo_meta_title" varchar,
  	"seo_meta_description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "brands_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "manufacturers" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"country" varchar,
  	"website" varchar,
  	"logo_id" integer,
  	"seo_og_image_id" integer,
  	"seo_no_index" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "manufacturers_locales" (
  	"slug" varchar NOT NULL,
  	"description" varchar,
  	"seo_meta_title" varchar,
  	"seo_meta_description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "manufacturers_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "units" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"code" varchar NOT NULL,
  	"symbol" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "units_locales" (
  	"label" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "units_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "attributes_options" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"value" varchar
  );
  
  CREATE TABLE "attributes_options_locales" (
  	"label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "attributes" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"data_type" "enum_attributes_data_type" DEFAULT 'text' NOT NULL,
  	"group" "enum_attributes_group" DEFAULT 'general' NOT NULL,
  	"unit_id" integer,
  	"is_searchable" boolean DEFAULT false,
  	"is_filterable" boolean DEFAULT false,
  	"is_sortable" boolean DEFAULT false,
  	"is_comparable" boolean DEFAULT false,
  	"display_priority" numeric DEFAULT 100,
  	"applies_to_variation" boolean DEFAULT false,
  	"icon" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "attributes_locales" (
  	"display_name" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "attributes_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "products_attributes" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"numeric_value" numeric
  );
  
  CREATE TABLE "products_attributes_locales" (
  	"value" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "products_assets" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"type" "enum_products_assets_type",
  	"file_id" integer
  );
  
  CREATE TABLE "products_assets_locales" (
  	"label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "products_faqs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "products_faqs_locales" (
  	"question" varchar,
  	"answer" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "products" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"unit_id" integer,
  	"country_of_origin" varchar,
  	"barcode" varchar,
  	"net_weight" numeric,
  	"net_volume" numeric,
  	"primary_image_id" integer,
  	"popularity" numeric DEFAULT 0,
  	"enrichment_status" "enum_products_enrichment_status" DEFAULT 'none',
  	"enriched_at" timestamp(3) with time zone,
  	"legacy_key" varchar,
  	"lifecycle" "enum_products_lifecycle" DEFAULT 'active',
  	"category_id" integer,
  	"brand_id" integer,
  	"manufacturer_id" integer,
  	"featured" boolean DEFAULT false,
  	"needs_review" boolean DEFAULT false,
  	"review_notes" varchar,
  	"search_text" varchar,
  	"seo_og_image_id" integer,
  	"seo_no_index" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_products_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "products_locales" (
  	"title" varchar,
  	"slug" varchar,
  	"short_description" varchar,
  	"description" jsonb,
  	"application_area" varchar,
  	"seo_meta_title" varchar,
  	"seo_meta_description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "products_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "products_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"media_id" integer,
  	"products_id" integer
  );
  
  CREATE TABLE "_products_v_version_attributes" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"numeric_value" numeric,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_products_v_version_attributes_locales" (
  	"value" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_products_v_version_assets" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"type" "enum__products_v_version_assets_type",
  	"file_id" integer,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_products_v_version_assets_locales" (
  	"label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_products_v_version_faqs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_products_v_version_faqs_locales" (
  	"question" varchar,
  	"answer" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_products_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_unit_id" integer,
  	"version_country_of_origin" varchar,
  	"version_barcode" varchar,
  	"version_net_weight" numeric,
  	"version_net_volume" numeric,
  	"version_primary_image_id" integer,
  	"version_popularity" numeric DEFAULT 0,
  	"version_enrichment_status" "enum__products_v_version_enrichment_status" DEFAULT 'none',
  	"version_enriched_at" timestamp(3) with time zone,
  	"version_legacy_key" varchar,
  	"version_lifecycle" "enum__products_v_version_lifecycle" DEFAULT 'active',
  	"version_category_id" integer,
  	"version_brand_id" integer,
  	"version_manufacturer_id" integer,
  	"version_featured" boolean DEFAULT false,
  	"version_needs_review" boolean DEFAULT false,
  	"version_review_notes" varchar,
  	"version_search_text" varchar,
  	"version_seo_og_image_id" integer,
  	"version_seo_no_index" boolean DEFAULT false,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__products_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__products_v_published_locale",
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE "_products_v_locales" (
  	"version_title" varchar,
  	"version_slug" varchar,
  	"version_short_description" varchar,
  	"version_description" jsonb,
  	"version_application_area" varchar,
  	"version_seo_meta_title" varchar,
  	"version_seo_meta_description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_products_v_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "_products_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"media_id" integer,
  	"products_id" integer
  );
  
  CREATE TABLE "variations_attributes" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"type" "enum_variations_attributes_type" NOT NULL
  );
  
  CREATE TABLE "variations_attributes_locales" (
  	"label" varchar,
  	"value" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "variations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"product_id" integer NOT NULL,
  	"sku" varchar NOT NULL,
  	"barcode" varchar,
  	"price" numeric,
  	"price_on_request" boolean DEFAULT false,
  	"stock_status" "enum_variations_stock_status" DEFAULT 'in_stock',
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "variations_locales" (
  	"label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "synonyms" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"term" varchar NOT NULL,
  	"kind" "enum_synonyms_kind" DEFAULT 'synonym',
  	"locale" "enum_synonyms_locale" DEFAULT 'both',
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "synonyms_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "orders_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"sku" varchar,
  	"quantity" numeric DEFAULT 1 NOT NULL,
  	"product_title" varchar,
  	"variation_label" varchar,
  	"unit_price" numeric,
  	"price_on_request" boolean DEFAULT false,
  	"line_total" numeric
  );
  
  CREATE TABLE "orders" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order_number" numeric,
  	"status" "enum_orders_status" DEFAULT 'noua' NOT NULL,
  	"language" "enum_orders_language" DEFAULT 'ro',
  	"customer_name" varchar NOT NULL,
  	"customer_phone" varchar NOT NULL,
  	"customer_email" varchar,
  	"customer_locality" varchar NOT NULL,
  	"customer_address" varchar,
  	"customer_notes" varchar,
  	"estimated_total" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "import_profiles_column_map" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"source_header" varchar NOT NULL,
  	"target_field" varchar NOT NULL,
  	"kind" "enum_import_profiles_column_map_kind" DEFAULT 'field'
  );
  
  CREATE TABLE "import_profiles" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"source_format" "enum_import_profiles_source_format" NOT NULL,
  	"products_sheet" varchar,
  	"variations_sheet" varchar,
  	"delimiter" varchar DEFAULT ',',
  	"decimal_separator" "enum_import_profiles_decimal_separator" DEFAULT '.',
  	"active" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "import_runs" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"source_file" varchar NOT NULL,
  	"checksum" varchar,
  	"mode" "enum_import_runs_mode" NOT NULL,
  	"profile_id" integer,
  	"status" "enum_import_runs_status" DEFAULT 'pending' NOT NULL,
  	"imported_rows" numeric DEFAULT 0,
  	"created_rows" numeric DEFAULT 0,
  	"updated_rows" numeric DEFAULT 0,
  	"skipped_rows" numeric DEFAULT 0,
  	"deleted_rows" numeric DEFAULT 0,
  	"warnings" numeric DEFAULT 0,
  	"errors" numeric DEFAULT 0,
  	"execution_time_ms" numeric DEFAULT 0,
  	"user_id" integer,
  	"rollback_snapshot" jsonb,
  	"report" jsonb,
  	"started_at" timestamp(3) with time zone,
  	"finished_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "import_logs" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"run_id" integer,
  	"row_number" numeric,
  	"sku" varchar,
  	"action" "enum_import_logs_action",
  	"level" "enum_import_logs_level" DEFAULT 'info',
  	"field" varchar,
  	"message" varchar,
  	"suggested_fix" varchar,
  	"source_file" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_kv" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer,
  	"media_id" integer,
  	"categories_id" integer,
  	"brands_id" integer,
  	"manufacturers_id" integer,
  	"units_id" integer,
  	"attributes_id" integer,
  	"products_id" integer,
  	"variations_id" integer,
  	"synonyms_id" integer,
  	"orders_id" integer,
  	"import_profiles_id" integer,
  	"import_runs_id" integer,
  	"import_logs_id" integer
  );
  
  CREATE TABLE "payload_preferences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  
  CREATE TABLE "payload_migrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "homepage_blocks_featured_sections" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "homepage_blocks_featured_sections_locales" (
  	"title" varchar,
  	"subtitle" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "homepage_blocks_featured_categories" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "homepage_blocks_featured_categories_locales" (
  	"title" varchar,
  	"subtitle" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "homepage_blocks_featured_brands" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "homepage_blocks_featured_brands_locales" (
  	"title" varchar,
  	"subtitle" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "homepage_blocks_featured_products" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "homepage_blocks_featured_products_locales" (
  	"title" varchar,
  	"subtitle" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "homepage_blocks_popular_searches_terms" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"query" varchar NOT NULL
  );
  
  CREATE TABLE "homepage_blocks_popular_searches_terms_locales" (
  	"label" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "homepage_blocks_popular_searches" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "homepage_blocks_popular_searches_locales" (
  	"title" varchar,
  	"subtitle" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "homepage_blocks_product_query" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"source" "enum_homepage_blocks_product_query_source" DEFAULT 'new',
  	"limit" numeric DEFAULT 8,
  	"block_name" varchar
  );
  
  CREATE TABLE "homepage_blocks_product_query_locales" (
  	"title" varchar,
  	"subtitle" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "homepage_blocks_editorial" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" integer,
  	"block_name" varchar
  );
  
  CREATE TABLE "homepage_blocks_editorial_locales" (
  	"title" varchar,
  	"subtitle" varchar,
  	"content" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "homepage" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "homepage_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"categories_id" integer,
  	"brands_id" integer,
  	"products_id" integer
  );
  
  CREATE TABLE "search_settings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"weight_exact_sku" numeric DEFAULT 100,
  	"weight_exact_name" numeric DEFAULT 80,
  	"weight_brand" numeric DEFAULT 20,
  	"weight_category" numeric DEFAULT 15,
  	"weight_popularity" numeric DEFAULT 25,
  	"weight_featured" numeric DEFAULT 30,
  	"weight_availability" numeric DEFAULT 10,
  	"weight_keywords" numeric DEFAULT 15,
  	"weight_synonyms" numeric DEFAULT 10,
  	"typo_tolerance" boolean DEFAULT true,
  	"engine" "enum_search_settings_engine" DEFAULT 'postgres',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "business_rules_status_needs_review_when_missing" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_business_rules_status_needs_review_when_missing",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "business_rules" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"status_price_on_request_when_no_price" boolean DEFAULT true,
  	"status_hidden_when_no_active_variation" boolean DEFAULT true,
  	"status_discontinued_from_supplier_flag" boolean DEFAULT true,
  	"seo_generate_when_empty" boolean DEFAULT true,
  	"seo_title_template" varchar DEFAULT '{name} {brand} — {section}',
  	"seo_max_title" numeric DEFAULT 60,
  	"seo_max_description" numeric DEFAULT 155,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "media_locales" ADD CONSTRAINT "media_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "categories_faqs" ADD CONSTRAINT "categories_faqs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "categories_faqs_locales" ADD CONSTRAINT "categories_faqs_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."categories_faqs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "categories" ADD CONSTRAINT "categories_parent_id_categories_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "categories" ADD CONSTRAINT "categories_hero_image_id_media_id_fk" FOREIGN KEY ("hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "categories" ADD CONSTRAINT "categories_seo_og_image_id_media_id_fk" FOREIGN KEY ("seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "categories_locales" ADD CONSTRAINT "categories_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "categories_texts" ADD CONSTRAINT "categories_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "categories_rels" ADD CONSTRAINT "categories_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "categories_rels" ADD CONSTRAINT "categories_rels_products_fk" FOREIGN KEY ("products_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "brands_catalogues" ADD CONSTRAINT "brands_catalogues_file_id_media_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "brands_catalogues" ADD CONSTRAINT "brands_catalogues_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "brands_catalogues_locales" ADD CONSTRAINT "brands_catalogues_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."brands_catalogues"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "brands" ADD CONSTRAINT "brands_logo_id_media_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "brands" ADD CONSTRAINT "brands_banner_id_media_id_fk" FOREIGN KEY ("banner_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "brands" ADD CONSTRAINT "brands_seo_og_image_id_media_id_fk" FOREIGN KEY ("seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "brands_locales" ADD CONSTRAINT "brands_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "brands_texts" ADD CONSTRAINT "brands_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "manufacturers" ADD CONSTRAINT "manufacturers_logo_id_media_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "manufacturers" ADD CONSTRAINT "manufacturers_seo_og_image_id_media_id_fk" FOREIGN KEY ("seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "manufacturers_locales" ADD CONSTRAINT "manufacturers_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."manufacturers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "manufacturers_texts" ADD CONSTRAINT "manufacturers_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."manufacturers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "units_locales" ADD CONSTRAINT "units_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."units"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "units_texts" ADD CONSTRAINT "units_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."units"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "attributes_options" ADD CONSTRAINT "attributes_options_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."attributes"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "attributes_options_locales" ADD CONSTRAINT "attributes_options_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."attributes_options"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "attributes" ADD CONSTRAINT "attributes_unit_id_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."units"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "attributes_locales" ADD CONSTRAINT "attributes_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."attributes"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "attributes_texts" ADD CONSTRAINT "attributes_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."attributes"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "products_attributes" ADD CONSTRAINT "products_attributes_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "products_attributes_locales" ADD CONSTRAINT "products_attributes_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."products_attributes"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "products_assets" ADD CONSTRAINT "products_assets_file_id_media_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "products_assets" ADD CONSTRAINT "products_assets_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "products_assets_locales" ADD CONSTRAINT "products_assets_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."products_assets"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "products_faqs" ADD CONSTRAINT "products_faqs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "products_faqs_locales" ADD CONSTRAINT "products_faqs_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."products_faqs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "products" ADD CONSTRAINT "products_unit_id_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."units"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "products" ADD CONSTRAINT "products_primary_image_id_media_id_fk" FOREIGN KEY ("primary_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "products" ADD CONSTRAINT "products_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "products" ADD CONSTRAINT "products_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "products" ADD CONSTRAINT "products_manufacturer_id_manufacturers_id_fk" FOREIGN KEY ("manufacturer_id") REFERENCES "public"."manufacturers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "products" ADD CONSTRAINT "products_seo_og_image_id_media_id_fk" FOREIGN KEY ("seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "products_locales" ADD CONSTRAINT "products_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "products_texts" ADD CONSTRAINT "products_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "products_rels" ADD CONSTRAINT "products_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "products_rels" ADD CONSTRAINT "products_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "products_rels" ADD CONSTRAINT "products_rels_products_fk" FOREIGN KEY ("products_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_products_v_version_attributes" ADD CONSTRAINT "_products_v_version_attributes_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_products_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_products_v_version_attributes_locales" ADD CONSTRAINT "_products_v_version_attributes_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_products_v_version_attributes"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_products_v_version_assets" ADD CONSTRAINT "_products_v_version_assets_file_id_media_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_products_v_version_assets" ADD CONSTRAINT "_products_v_version_assets_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_products_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_products_v_version_assets_locales" ADD CONSTRAINT "_products_v_version_assets_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_products_v_version_assets"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_products_v_version_faqs" ADD CONSTRAINT "_products_v_version_faqs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_products_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_products_v_version_faqs_locales" ADD CONSTRAINT "_products_v_version_faqs_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_products_v_version_faqs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_products_v" ADD CONSTRAINT "_products_v_parent_id_products_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_products_v" ADD CONSTRAINT "_products_v_version_unit_id_units_id_fk" FOREIGN KEY ("version_unit_id") REFERENCES "public"."units"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_products_v" ADD CONSTRAINT "_products_v_version_primary_image_id_media_id_fk" FOREIGN KEY ("version_primary_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_products_v" ADD CONSTRAINT "_products_v_version_category_id_categories_id_fk" FOREIGN KEY ("version_category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_products_v" ADD CONSTRAINT "_products_v_version_brand_id_brands_id_fk" FOREIGN KEY ("version_brand_id") REFERENCES "public"."brands"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_products_v" ADD CONSTRAINT "_products_v_version_manufacturer_id_manufacturers_id_fk" FOREIGN KEY ("version_manufacturer_id") REFERENCES "public"."manufacturers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_products_v" ADD CONSTRAINT "_products_v_version_seo_og_image_id_media_id_fk" FOREIGN KEY ("version_seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_products_v_locales" ADD CONSTRAINT "_products_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_products_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_products_v_texts" ADD CONSTRAINT "_products_v_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_products_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_products_v_rels" ADD CONSTRAINT "_products_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_products_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_products_v_rels" ADD CONSTRAINT "_products_v_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_products_v_rels" ADD CONSTRAINT "_products_v_rels_products_fk" FOREIGN KEY ("products_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "variations_attributes" ADD CONSTRAINT "variations_attributes_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."variations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "variations_attributes_locales" ADD CONSTRAINT "variations_attributes_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."variations_attributes"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "variations" ADD CONSTRAINT "variations_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "variations_locales" ADD CONSTRAINT "variations_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."variations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "synonyms_texts" ADD CONSTRAINT "synonyms_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."synonyms"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "orders_items" ADD CONSTRAINT "orders_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "import_profiles_column_map" ADD CONSTRAINT "import_profiles_column_map_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."import_profiles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "import_runs" ADD CONSTRAINT "import_runs_profile_id_import_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."import_profiles"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "import_runs" ADD CONSTRAINT "import_runs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "import_logs" ADD CONSTRAINT "import_logs_run_id_import_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."import_runs"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_categories_fk" FOREIGN KEY ("categories_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_brands_fk" FOREIGN KEY ("brands_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_manufacturers_fk" FOREIGN KEY ("manufacturers_id") REFERENCES "public"."manufacturers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_units_fk" FOREIGN KEY ("units_id") REFERENCES "public"."units"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_attributes_fk" FOREIGN KEY ("attributes_id") REFERENCES "public"."attributes"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_products_fk" FOREIGN KEY ("products_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_variations_fk" FOREIGN KEY ("variations_id") REFERENCES "public"."variations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_synonyms_fk" FOREIGN KEY ("synonyms_id") REFERENCES "public"."synonyms"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_orders_fk" FOREIGN KEY ("orders_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_import_profiles_fk" FOREIGN KEY ("import_profiles_id") REFERENCES "public"."import_profiles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_import_runs_fk" FOREIGN KEY ("import_runs_id") REFERENCES "public"."import_runs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_import_logs_fk" FOREIGN KEY ("import_logs_id") REFERENCES "public"."import_logs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_featured_sections" ADD CONSTRAINT "homepage_blocks_featured_sections_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_featured_sections_locales" ADD CONSTRAINT "homepage_blocks_featured_sections_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage_blocks_featured_sections"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_featured_categories" ADD CONSTRAINT "homepage_blocks_featured_categories_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_featured_categories_locales" ADD CONSTRAINT "homepage_blocks_featured_categories_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage_blocks_featured_categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_featured_brands" ADD CONSTRAINT "homepage_blocks_featured_brands_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_featured_brands_locales" ADD CONSTRAINT "homepage_blocks_featured_brands_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage_blocks_featured_brands"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_featured_products" ADD CONSTRAINT "homepage_blocks_featured_products_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_featured_products_locales" ADD CONSTRAINT "homepage_blocks_featured_products_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage_blocks_featured_products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_popular_searches_terms" ADD CONSTRAINT "homepage_blocks_popular_searches_terms_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage_blocks_popular_searches"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_popular_searches_terms_locales" ADD CONSTRAINT "homepage_blocks_popular_searches_terms_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage_blocks_popular_searches_terms"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_popular_searches" ADD CONSTRAINT "homepage_blocks_popular_searches_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_popular_searches_locales" ADD CONSTRAINT "homepage_blocks_popular_searches_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage_blocks_popular_searches"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_product_query" ADD CONSTRAINT "homepage_blocks_product_query_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_product_query_locales" ADD CONSTRAINT "homepage_blocks_product_query_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage_blocks_product_query"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_editorial" ADD CONSTRAINT "homepage_blocks_editorial_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "homepage_blocks_editorial" ADD CONSTRAINT "homepage_blocks_editorial_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_editorial_locales" ADD CONSTRAINT "homepage_blocks_editorial_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage_blocks_editorial"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_rels" ADD CONSTRAINT "homepage_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_rels" ADD CONSTRAINT "homepage_rels_categories_fk" FOREIGN KEY ("categories_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_rels" ADD CONSTRAINT "homepage_rels_brands_fk" FOREIGN KEY ("brands_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_rels" ADD CONSTRAINT "homepage_rels_products_fk" FOREIGN KEY ("products_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "business_rules_status_needs_review_when_missing" ADD CONSTRAINT "business_rules_status_needs_review_when_missing_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."business_rules"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "users_sessions_order_idx" ON "users_sessions" USING btree ("_order");
  CREATE INDEX "users_sessions_parent_id_idx" ON "users_sessions" USING btree ("_parent_id");
  CREATE INDEX "users_updated_at_idx" ON "users" USING btree ("updated_at");
  CREATE INDEX "users_created_at_idx" ON "users" USING btree ("created_at");
  CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");
  CREATE INDEX "media_updated_at_idx" ON "media" USING btree ("updated_at");
  CREATE INDEX "media_created_at_idx" ON "media" USING btree ("created_at");
  CREATE UNIQUE INDEX "media_filename_idx" ON "media" USING btree ("filename");
  CREATE INDEX "media_sizes_thumbnail_sizes_thumbnail_filename_idx" ON "media" USING btree ("sizes_thumbnail_filename");
  CREATE INDEX "media_sizes_card_sizes_card_filename_idx" ON "media" USING btree ("sizes_card_filename");
  CREATE INDEX "media_sizes_feature_sizes_feature_filename_idx" ON "media" USING btree ("sizes_feature_filename");
  CREATE UNIQUE INDEX "media_locales_locale_parent_id_unique" ON "media_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "categories_faqs_order_idx" ON "categories_faqs" USING btree ("_order");
  CREATE INDEX "categories_faqs_parent_id_idx" ON "categories_faqs" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "categories_faqs_locales_locale_parent_id_unique" ON "categories_faqs_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "categories_parent_idx" ON "categories" USING btree ("parent_id");
  CREATE INDEX "categories_hero_image_idx" ON "categories" USING btree ("hero_image_id");
  CREATE INDEX "categories_seo_seo_og_image_idx" ON "categories" USING btree ("seo_og_image_id");
  CREATE INDEX "categories_updated_at_idx" ON "categories" USING btree ("updated_at");
  CREATE INDEX "categories_created_at_idx" ON "categories" USING btree ("created_at");
  CREATE INDEX "categories_title_idx" ON "categories_locales" USING btree ("title","_locale");
  CREATE INDEX "categories_slug_idx" ON "categories_locales" USING btree ("slug","_locale");
  CREATE UNIQUE INDEX "categories_locales_locale_parent_id_unique" ON "categories_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "categories_texts_order_parent" ON "categories_texts" USING btree ("order","parent_id");
  CREATE INDEX "categories_rels_order_idx" ON "categories_rels" USING btree ("order");
  CREATE INDEX "categories_rels_parent_idx" ON "categories_rels" USING btree ("parent_id");
  CREATE INDEX "categories_rels_path_idx" ON "categories_rels" USING btree ("path");
  CREATE INDEX "categories_rels_products_id_idx" ON "categories_rels" USING btree ("products_id");
  CREATE INDEX "brands_catalogues_order_idx" ON "brands_catalogues" USING btree ("_order");
  CREATE INDEX "brands_catalogues_parent_id_idx" ON "brands_catalogues" USING btree ("_parent_id");
  CREATE INDEX "brands_catalogues_file_idx" ON "brands_catalogues" USING btree ("file_id");
  CREATE UNIQUE INDEX "brands_catalogues_locales_locale_parent_id_unique" ON "brands_catalogues_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "brands_name_idx" ON "brands" USING btree ("name");
  CREATE INDEX "brands_logo_idx" ON "brands" USING btree ("logo_id");
  CREATE INDEX "brands_banner_idx" ON "brands" USING btree ("banner_id");
  CREATE INDEX "brands_seo_seo_og_image_idx" ON "brands" USING btree ("seo_og_image_id");
  CREATE INDEX "brands_updated_at_idx" ON "brands" USING btree ("updated_at");
  CREATE INDEX "brands_created_at_idx" ON "brands" USING btree ("created_at");
  CREATE INDEX "brands_slug_idx" ON "brands_locales" USING btree ("slug","_locale");
  CREATE UNIQUE INDEX "brands_locales_locale_parent_id_unique" ON "brands_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "brands_texts_order_parent" ON "brands_texts" USING btree ("order","parent_id");
  CREATE INDEX "manufacturers_name_idx" ON "manufacturers" USING btree ("name");
  CREATE INDEX "manufacturers_logo_idx" ON "manufacturers" USING btree ("logo_id");
  CREATE INDEX "manufacturers_seo_seo_og_image_idx" ON "manufacturers" USING btree ("seo_og_image_id");
  CREATE INDEX "manufacturers_updated_at_idx" ON "manufacturers" USING btree ("updated_at");
  CREATE INDEX "manufacturers_created_at_idx" ON "manufacturers" USING btree ("created_at");
  CREATE INDEX "manufacturers_slug_idx" ON "manufacturers_locales" USING btree ("slug","_locale");
  CREATE UNIQUE INDEX "manufacturers_locales_locale_parent_id_unique" ON "manufacturers_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "manufacturers_texts_order_parent" ON "manufacturers_texts" USING btree ("order","parent_id");
  CREATE UNIQUE INDEX "units_code_idx" ON "units" USING btree ("code");
  CREATE INDEX "units_updated_at_idx" ON "units" USING btree ("updated_at");
  CREATE INDEX "units_created_at_idx" ON "units" USING btree ("created_at");
  CREATE UNIQUE INDEX "units_locales_locale_parent_id_unique" ON "units_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "units_texts_order_parent" ON "units_texts" USING btree ("order","parent_id");
  CREATE INDEX "attributes_options_order_idx" ON "attributes_options" USING btree ("_order");
  CREATE INDEX "attributes_options_parent_id_idx" ON "attributes_options" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "attributes_options_locales_locale_parent_id_unique" ON "attributes_options_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "attributes_key_idx" ON "attributes" USING btree ("key");
  CREATE INDEX "attributes_unit_idx" ON "attributes" USING btree ("unit_id");
  CREATE INDEX "attributes_updated_at_idx" ON "attributes" USING btree ("updated_at");
  CREATE INDEX "attributes_created_at_idx" ON "attributes" USING btree ("created_at");
  CREATE UNIQUE INDEX "attributes_locales_locale_parent_id_unique" ON "attributes_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "attributes_texts_order_parent" ON "attributes_texts" USING btree ("order","parent_id");
  CREATE INDEX "products_attributes_order_idx" ON "products_attributes" USING btree ("_order");
  CREATE INDEX "products_attributes_parent_id_idx" ON "products_attributes" USING btree ("_parent_id");
  CREATE INDEX "products_attributes_key_idx" ON "products_attributes" USING btree ("key");
  CREATE UNIQUE INDEX "products_attributes_locales_locale_parent_id_unique" ON "products_attributes_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "products_assets_order_idx" ON "products_assets" USING btree ("_order");
  CREATE INDEX "products_assets_parent_id_idx" ON "products_assets" USING btree ("_parent_id");
  CREATE INDEX "products_assets_file_idx" ON "products_assets" USING btree ("file_id");
  CREATE UNIQUE INDEX "products_assets_locales_locale_parent_id_unique" ON "products_assets_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "products_faqs_order_idx" ON "products_faqs" USING btree ("_order");
  CREATE INDEX "products_faqs_parent_id_idx" ON "products_faqs" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "products_faqs_locales_locale_parent_id_unique" ON "products_faqs_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "products_unit_idx" ON "products" USING btree ("unit_id");
  CREATE INDEX "products_barcode_idx" ON "products" USING btree ("barcode");
  CREATE INDEX "products_primary_image_idx" ON "products" USING btree ("primary_image_id");
  CREATE INDEX "products_popularity_idx" ON "products" USING btree ("popularity");
  CREATE UNIQUE INDEX "products_legacy_key_idx" ON "products" USING btree ("legacy_key");
  CREATE INDEX "products_category_idx" ON "products" USING btree ("category_id");
  CREATE INDEX "products_brand_idx" ON "products" USING btree ("brand_id");
  CREATE INDEX "products_manufacturer_idx" ON "products" USING btree ("manufacturer_id");
  CREATE INDEX "products_seo_seo_og_image_idx" ON "products" USING btree ("seo_og_image_id");
  CREATE INDEX "products_updated_at_idx" ON "products" USING btree ("updated_at");
  CREATE INDEX "products_created_at_idx" ON "products" USING btree ("created_at");
  CREATE INDEX "products__status_idx" ON "products" USING btree ("_status");
  CREATE INDEX "products_title_idx" ON "products_locales" USING btree ("title","_locale");
  CREATE INDEX "products_slug_idx" ON "products_locales" USING btree ("slug","_locale");
  CREATE UNIQUE INDEX "products_locales_locale_parent_id_unique" ON "products_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "products_texts_order_parent" ON "products_texts" USING btree ("order","parent_id");
  CREATE INDEX "products_rels_order_idx" ON "products_rels" USING btree ("order");
  CREATE INDEX "products_rels_parent_idx" ON "products_rels" USING btree ("parent_id");
  CREATE INDEX "products_rels_path_idx" ON "products_rels" USING btree ("path");
  CREATE INDEX "products_rels_media_id_idx" ON "products_rels" USING btree ("media_id");
  CREATE INDEX "products_rels_products_id_idx" ON "products_rels" USING btree ("products_id");
  CREATE INDEX "_products_v_version_attributes_order_idx" ON "_products_v_version_attributes" USING btree ("_order");
  CREATE INDEX "_products_v_version_attributes_parent_id_idx" ON "_products_v_version_attributes" USING btree ("_parent_id");
  CREATE INDEX "_products_v_version_attributes_key_idx" ON "_products_v_version_attributes" USING btree ("key");
  CREATE UNIQUE INDEX "_products_v_version_attributes_locales_locale_parent_id_uniq" ON "_products_v_version_attributes_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_products_v_version_assets_order_idx" ON "_products_v_version_assets" USING btree ("_order");
  CREATE INDEX "_products_v_version_assets_parent_id_idx" ON "_products_v_version_assets" USING btree ("_parent_id");
  CREATE INDEX "_products_v_version_assets_file_idx" ON "_products_v_version_assets" USING btree ("file_id");
  CREATE UNIQUE INDEX "_products_v_version_assets_locales_locale_parent_id_unique" ON "_products_v_version_assets_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_products_v_version_faqs_order_idx" ON "_products_v_version_faqs" USING btree ("_order");
  CREATE INDEX "_products_v_version_faqs_parent_id_idx" ON "_products_v_version_faqs" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_products_v_version_faqs_locales_locale_parent_id_unique" ON "_products_v_version_faqs_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_products_v_parent_idx" ON "_products_v" USING btree ("parent_id");
  CREATE INDEX "_products_v_version_version_unit_idx" ON "_products_v" USING btree ("version_unit_id");
  CREATE INDEX "_products_v_version_version_barcode_idx" ON "_products_v" USING btree ("version_barcode");
  CREATE INDEX "_products_v_version_version_primary_image_idx" ON "_products_v" USING btree ("version_primary_image_id");
  CREATE INDEX "_products_v_version_version_popularity_idx" ON "_products_v" USING btree ("version_popularity");
  CREATE INDEX "_products_v_version_version_legacy_key_idx" ON "_products_v" USING btree ("version_legacy_key");
  CREATE INDEX "_products_v_version_version_category_idx" ON "_products_v" USING btree ("version_category_id");
  CREATE INDEX "_products_v_version_version_brand_idx" ON "_products_v" USING btree ("version_brand_id");
  CREATE INDEX "_products_v_version_version_manufacturer_idx" ON "_products_v" USING btree ("version_manufacturer_id");
  CREATE INDEX "_products_v_version_seo_version_seo_og_image_idx" ON "_products_v" USING btree ("version_seo_og_image_id");
  CREATE INDEX "_products_v_version_version_updated_at_idx" ON "_products_v" USING btree ("version_updated_at");
  CREATE INDEX "_products_v_version_version_created_at_idx" ON "_products_v" USING btree ("version_created_at");
  CREATE INDEX "_products_v_version_version__status_idx" ON "_products_v" USING btree ("version__status");
  CREATE INDEX "_products_v_created_at_idx" ON "_products_v" USING btree ("created_at");
  CREATE INDEX "_products_v_updated_at_idx" ON "_products_v" USING btree ("updated_at");
  CREATE INDEX "_products_v_snapshot_idx" ON "_products_v" USING btree ("snapshot");
  CREATE INDEX "_products_v_published_locale_idx" ON "_products_v" USING btree ("published_locale");
  CREATE INDEX "_products_v_latest_idx" ON "_products_v" USING btree ("latest");
  CREATE INDEX "_products_v_autosave_idx" ON "_products_v" USING btree ("autosave");
  CREATE INDEX "_products_v_version_version_title_idx" ON "_products_v_locales" USING btree ("version_title","_locale");
  CREATE INDEX "_products_v_version_version_slug_idx" ON "_products_v_locales" USING btree ("version_slug","_locale");
  CREATE UNIQUE INDEX "_products_v_locales_locale_parent_id_unique" ON "_products_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_products_v_texts_order_parent" ON "_products_v_texts" USING btree ("order","parent_id");
  CREATE INDEX "_products_v_rels_order_idx" ON "_products_v_rels" USING btree ("order");
  CREATE INDEX "_products_v_rels_parent_idx" ON "_products_v_rels" USING btree ("parent_id");
  CREATE INDEX "_products_v_rels_path_idx" ON "_products_v_rels" USING btree ("path");
  CREATE INDEX "_products_v_rels_media_id_idx" ON "_products_v_rels" USING btree ("media_id");
  CREATE INDEX "_products_v_rels_products_id_idx" ON "_products_v_rels" USING btree ("products_id");
  CREATE INDEX "variations_attributes_order_idx" ON "variations_attributes" USING btree ("_order");
  CREATE INDEX "variations_attributes_parent_id_idx" ON "variations_attributes" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "variations_attributes_locales_locale_parent_id_unique" ON "variations_attributes_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "variations_product_idx" ON "variations" USING btree ("product_id");
  CREATE UNIQUE INDEX "variations_sku_idx" ON "variations" USING btree ("sku");
  CREATE INDEX "variations_barcode_idx" ON "variations" USING btree ("barcode");
  CREATE INDEX "variations_updated_at_idx" ON "variations" USING btree ("updated_at");
  CREATE INDEX "variations_created_at_idx" ON "variations" USING btree ("created_at");
  CREATE UNIQUE INDEX "variations_locales_locale_parent_id_unique" ON "variations_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "synonyms_term_idx" ON "synonyms" USING btree ("term");
  CREATE INDEX "synonyms_updated_at_idx" ON "synonyms" USING btree ("updated_at");
  CREATE INDEX "synonyms_created_at_idx" ON "synonyms" USING btree ("created_at");
  CREATE INDEX "synonyms_texts_order_parent" ON "synonyms_texts" USING btree ("order","parent_id");
  CREATE INDEX "orders_items_order_idx" ON "orders_items" USING btree ("_order");
  CREATE INDEX "orders_items_parent_id_idx" ON "orders_items" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "orders_order_number_idx" ON "orders" USING btree ("order_number");
  CREATE INDEX "orders_updated_at_idx" ON "orders" USING btree ("updated_at");
  CREATE INDEX "orders_created_at_idx" ON "orders" USING btree ("created_at");
  CREATE INDEX "import_profiles_column_map_order_idx" ON "import_profiles_column_map" USING btree ("_order");
  CREATE INDEX "import_profiles_column_map_parent_id_idx" ON "import_profiles_column_map" USING btree ("_parent_id");
  CREATE INDEX "import_profiles_updated_at_idx" ON "import_profiles" USING btree ("updated_at");
  CREATE INDEX "import_profiles_created_at_idx" ON "import_profiles" USING btree ("created_at");
  CREATE INDEX "import_runs_checksum_idx" ON "import_runs" USING btree ("checksum");
  CREATE INDEX "import_runs_profile_idx" ON "import_runs" USING btree ("profile_id");
  CREATE INDEX "import_runs_user_idx" ON "import_runs" USING btree ("user_id");
  CREATE INDEX "import_runs_updated_at_idx" ON "import_runs" USING btree ("updated_at");
  CREATE INDEX "import_runs_created_at_idx" ON "import_runs" USING btree ("created_at");
  CREATE INDEX "import_logs_run_idx" ON "import_logs" USING btree ("run_id");
  CREATE INDEX "import_logs_sku_idx" ON "import_logs" USING btree ("sku");
  CREATE INDEX "import_logs_updated_at_idx" ON "import_logs" USING btree ("updated_at");
  CREATE INDEX "import_logs_created_at_idx" ON "import_logs" USING btree ("created_at");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload_kv" USING btree ("key");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_users_id_idx" ON "payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX "payload_locked_documents_rels_media_id_idx" ON "payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX "payload_locked_documents_rels_categories_id_idx" ON "payload_locked_documents_rels" USING btree ("categories_id");
  CREATE INDEX "payload_locked_documents_rels_brands_id_idx" ON "payload_locked_documents_rels" USING btree ("brands_id");
  CREATE INDEX "payload_locked_documents_rels_manufacturers_id_idx" ON "payload_locked_documents_rels" USING btree ("manufacturers_id");
  CREATE INDEX "payload_locked_documents_rels_units_id_idx" ON "payload_locked_documents_rels" USING btree ("units_id");
  CREATE INDEX "payload_locked_documents_rels_attributes_id_idx" ON "payload_locked_documents_rels" USING btree ("attributes_id");
  CREATE INDEX "payload_locked_documents_rels_products_id_idx" ON "payload_locked_documents_rels" USING btree ("products_id");
  CREATE INDEX "payload_locked_documents_rels_variations_id_idx" ON "payload_locked_documents_rels" USING btree ("variations_id");
  CREATE INDEX "payload_locked_documents_rels_synonyms_id_idx" ON "payload_locked_documents_rels" USING btree ("synonyms_id");
  CREATE INDEX "payload_locked_documents_rels_orders_id_idx" ON "payload_locked_documents_rels" USING btree ("orders_id");
  CREATE INDEX "payload_locked_documents_rels_import_profiles_id_idx" ON "payload_locked_documents_rels" USING btree ("import_profiles_id");
  CREATE INDEX "payload_locked_documents_rels_import_runs_id_idx" ON "payload_locked_documents_rels" USING btree ("import_runs_id");
  CREATE INDEX "payload_locked_documents_rels_import_logs_id_idx" ON "payload_locked_documents_rels" USING btree ("import_logs_id");
  CREATE INDEX "payload_preferences_key_idx" ON "payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_users_id_idx" ON "payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "payload_migrations" USING btree ("created_at");
  CREATE INDEX "homepage_blocks_featured_sections_order_idx" ON "homepage_blocks_featured_sections" USING btree ("_order");
  CREATE INDEX "homepage_blocks_featured_sections_parent_id_idx" ON "homepage_blocks_featured_sections" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_featured_sections_path_idx" ON "homepage_blocks_featured_sections" USING btree ("_path");
  CREATE UNIQUE INDEX "homepage_blocks_featured_sections_locales_locale_parent_id_u" ON "homepage_blocks_featured_sections_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "homepage_blocks_featured_categories_order_idx" ON "homepage_blocks_featured_categories" USING btree ("_order");
  CREATE INDEX "homepage_blocks_featured_categories_parent_id_idx" ON "homepage_blocks_featured_categories" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_featured_categories_path_idx" ON "homepage_blocks_featured_categories" USING btree ("_path");
  CREATE UNIQUE INDEX "homepage_blocks_featured_categories_locales_locale_parent_id" ON "homepage_blocks_featured_categories_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "homepage_blocks_featured_brands_order_idx" ON "homepage_blocks_featured_brands" USING btree ("_order");
  CREATE INDEX "homepage_blocks_featured_brands_parent_id_idx" ON "homepage_blocks_featured_brands" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_featured_brands_path_idx" ON "homepage_blocks_featured_brands" USING btree ("_path");
  CREATE UNIQUE INDEX "homepage_blocks_featured_brands_locales_locale_parent_id_uni" ON "homepage_blocks_featured_brands_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "homepage_blocks_featured_products_order_idx" ON "homepage_blocks_featured_products" USING btree ("_order");
  CREATE INDEX "homepage_blocks_featured_products_parent_id_idx" ON "homepage_blocks_featured_products" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_featured_products_path_idx" ON "homepage_blocks_featured_products" USING btree ("_path");
  CREATE UNIQUE INDEX "homepage_blocks_featured_products_locales_locale_parent_id_u" ON "homepage_blocks_featured_products_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "homepage_blocks_popular_searches_terms_order_idx" ON "homepage_blocks_popular_searches_terms" USING btree ("_order");
  CREATE INDEX "homepage_blocks_popular_searches_terms_parent_id_idx" ON "homepage_blocks_popular_searches_terms" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "homepage_blocks_popular_searches_terms_locales_locale_parent" ON "homepage_blocks_popular_searches_terms_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "homepage_blocks_popular_searches_order_idx" ON "homepage_blocks_popular_searches" USING btree ("_order");
  CREATE INDEX "homepage_blocks_popular_searches_parent_id_idx" ON "homepage_blocks_popular_searches" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_popular_searches_path_idx" ON "homepage_blocks_popular_searches" USING btree ("_path");
  CREATE UNIQUE INDEX "homepage_blocks_popular_searches_locales_locale_parent_id_un" ON "homepage_blocks_popular_searches_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "homepage_blocks_product_query_order_idx" ON "homepage_blocks_product_query" USING btree ("_order");
  CREATE INDEX "homepage_blocks_product_query_parent_id_idx" ON "homepage_blocks_product_query" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_product_query_path_idx" ON "homepage_blocks_product_query" USING btree ("_path");
  CREATE UNIQUE INDEX "homepage_blocks_product_query_locales_locale_parent_id_uniqu" ON "homepage_blocks_product_query_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "homepage_blocks_editorial_order_idx" ON "homepage_blocks_editorial" USING btree ("_order");
  CREATE INDEX "homepage_blocks_editorial_parent_id_idx" ON "homepage_blocks_editorial" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_editorial_path_idx" ON "homepage_blocks_editorial" USING btree ("_path");
  CREATE INDEX "homepage_blocks_editorial_image_idx" ON "homepage_blocks_editorial" USING btree ("image_id");
  CREATE UNIQUE INDEX "homepage_blocks_editorial_locales_locale_parent_id_unique" ON "homepage_blocks_editorial_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "homepage_rels_order_idx" ON "homepage_rels" USING btree ("order");
  CREATE INDEX "homepage_rels_parent_idx" ON "homepage_rels" USING btree ("parent_id");
  CREATE INDEX "homepage_rels_path_idx" ON "homepage_rels" USING btree ("path");
  CREATE INDEX "homepage_rels_categories_id_idx" ON "homepage_rels" USING btree ("categories_id");
  CREATE INDEX "homepage_rels_brands_id_idx" ON "homepage_rels" USING btree ("brands_id");
  CREATE INDEX "homepage_rels_products_id_idx" ON "homepage_rels" USING btree ("products_id");
  CREATE INDEX "business_rules_status_needs_review_when_missing_order_idx" ON "business_rules_status_needs_review_when_missing" USING btree ("order");
  CREATE INDEX "business_rules_status_needs_review_when_missing_parent_idx" ON "business_rules_status_needs_review_when_missing" USING btree ("parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "users_sessions" CASCADE;
  DROP TABLE "users" CASCADE;
  DROP TABLE "media" CASCADE;
  DROP TABLE "media_locales" CASCADE;
  DROP TABLE "categories_faqs" CASCADE;
  DROP TABLE "categories_faqs_locales" CASCADE;
  DROP TABLE "categories" CASCADE;
  DROP TABLE "categories_locales" CASCADE;
  DROP TABLE "categories_texts" CASCADE;
  DROP TABLE "categories_rels" CASCADE;
  DROP TABLE "brands_catalogues" CASCADE;
  DROP TABLE "brands_catalogues_locales" CASCADE;
  DROP TABLE "brands" CASCADE;
  DROP TABLE "brands_locales" CASCADE;
  DROP TABLE "brands_texts" CASCADE;
  DROP TABLE "manufacturers" CASCADE;
  DROP TABLE "manufacturers_locales" CASCADE;
  DROP TABLE "manufacturers_texts" CASCADE;
  DROP TABLE "units" CASCADE;
  DROP TABLE "units_locales" CASCADE;
  DROP TABLE "units_texts" CASCADE;
  DROP TABLE "attributes_options" CASCADE;
  DROP TABLE "attributes_options_locales" CASCADE;
  DROP TABLE "attributes" CASCADE;
  DROP TABLE "attributes_locales" CASCADE;
  DROP TABLE "attributes_texts" CASCADE;
  DROP TABLE "products_attributes" CASCADE;
  DROP TABLE "products_attributes_locales" CASCADE;
  DROP TABLE "products_assets" CASCADE;
  DROP TABLE "products_assets_locales" CASCADE;
  DROP TABLE "products_faqs" CASCADE;
  DROP TABLE "products_faqs_locales" CASCADE;
  DROP TABLE "products" CASCADE;
  DROP TABLE "products_locales" CASCADE;
  DROP TABLE "products_texts" CASCADE;
  DROP TABLE "products_rels" CASCADE;
  DROP TABLE "_products_v_version_attributes" CASCADE;
  DROP TABLE "_products_v_version_attributes_locales" CASCADE;
  DROP TABLE "_products_v_version_assets" CASCADE;
  DROP TABLE "_products_v_version_assets_locales" CASCADE;
  DROP TABLE "_products_v_version_faqs" CASCADE;
  DROP TABLE "_products_v_version_faqs_locales" CASCADE;
  DROP TABLE "_products_v" CASCADE;
  DROP TABLE "_products_v_locales" CASCADE;
  DROP TABLE "_products_v_texts" CASCADE;
  DROP TABLE "_products_v_rels" CASCADE;
  DROP TABLE "variations_attributes" CASCADE;
  DROP TABLE "variations_attributes_locales" CASCADE;
  DROP TABLE "variations" CASCADE;
  DROP TABLE "variations_locales" CASCADE;
  DROP TABLE "synonyms" CASCADE;
  DROP TABLE "synonyms_texts" CASCADE;
  DROP TABLE "orders_items" CASCADE;
  DROP TABLE "orders" CASCADE;
  DROP TABLE "import_profiles_column_map" CASCADE;
  DROP TABLE "import_profiles" CASCADE;
  DROP TABLE "import_runs" CASCADE;
  DROP TABLE "import_logs" CASCADE;
  DROP TABLE "payload_kv" CASCADE;
  DROP TABLE "payload_locked_documents" CASCADE;
  DROP TABLE "payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload_preferences" CASCADE;
  DROP TABLE "payload_preferences_rels" CASCADE;
  DROP TABLE "payload_migrations" CASCADE;
  DROP TABLE "homepage_blocks_featured_sections" CASCADE;
  DROP TABLE "homepage_blocks_featured_sections_locales" CASCADE;
  DROP TABLE "homepage_blocks_featured_categories" CASCADE;
  DROP TABLE "homepage_blocks_featured_categories_locales" CASCADE;
  DROP TABLE "homepage_blocks_featured_brands" CASCADE;
  DROP TABLE "homepage_blocks_featured_brands_locales" CASCADE;
  DROP TABLE "homepage_blocks_featured_products" CASCADE;
  DROP TABLE "homepage_blocks_featured_products_locales" CASCADE;
  DROP TABLE "homepage_blocks_popular_searches_terms" CASCADE;
  DROP TABLE "homepage_blocks_popular_searches_terms_locales" CASCADE;
  DROP TABLE "homepage_blocks_popular_searches" CASCADE;
  DROP TABLE "homepage_blocks_popular_searches_locales" CASCADE;
  DROP TABLE "homepage_blocks_product_query" CASCADE;
  DROP TABLE "homepage_blocks_product_query_locales" CASCADE;
  DROP TABLE "homepage_blocks_editorial" CASCADE;
  DROP TABLE "homepage_blocks_editorial_locales" CASCADE;
  DROP TABLE "homepage" CASCADE;
  DROP TABLE "homepage_rels" CASCADE;
  DROP TABLE "search_settings" CASCADE;
  DROP TABLE "business_rules_status_needs_review_when_missing" CASCADE;
  DROP TABLE "business_rules" CASCADE;
  DROP TYPE "public"."_locales";
  DROP TYPE "public"."enum_categories_level";
  DROP TYPE "public"."enum_brands_status";
  DROP TYPE "public"."enum_attributes_data_type";
  DROP TYPE "public"."enum_attributes_group";
  DROP TYPE "public"."enum_products_assets_type";
  DROP TYPE "public"."enum_products_enrichment_status";
  DROP TYPE "public"."enum_products_lifecycle";
  DROP TYPE "public"."enum_products_status";
  DROP TYPE "public"."enum__products_v_version_assets_type";
  DROP TYPE "public"."enum__products_v_version_enrichment_status";
  DROP TYPE "public"."enum__products_v_version_lifecycle";
  DROP TYPE "public"."enum__products_v_version_status";
  DROP TYPE "public"."enum__products_v_published_locale";
  DROP TYPE "public"."enum_variations_attributes_type";
  DROP TYPE "public"."enum_variations_stock_status";
  DROP TYPE "public"."enum_synonyms_kind";
  DROP TYPE "public"."enum_synonyms_locale";
  DROP TYPE "public"."enum_orders_status";
  DROP TYPE "public"."enum_orders_language";
  DROP TYPE "public"."enum_import_profiles_column_map_kind";
  DROP TYPE "public"."enum_import_profiles_source_format";
  DROP TYPE "public"."enum_import_profiles_decimal_separator";
  DROP TYPE "public"."enum_import_runs_mode";
  DROP TYPE "public"."enum_import_runs_status";
  DROP TYPE "public"."enum_import_logs_action";
  DROP TYPE "public"."enum_import_logs_level";
  DROP TYPE "public"."enum_homepage_blocks_product_query_source";
  DROP TYPE "public"."enum_search_settings_engine";
  DROP TYPE "public"."enum_business_rules_status_needs_review_when_missing";`)
}
