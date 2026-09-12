import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "products" ADD COLUMN "display_order" numeric;
  ALTER TABLE "_products_v" ADD COLUMN "version_display_order" numeric;
  CREATE INDEX "products_display_order_idx" ON "products" USING btree ("display_order");
  CREATE INDEX "_products_v_version_version_display_order_idx" ON "_products_v" USING btree ("version_display_order");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "products_display_order_idx";
  DROP INDEX "_products_v_version_version_display_order_idx";
  ALTER TABLE "products" DROP COLUMN "display_order";
  ALTER TABLE "_products_v" DROP COLUMN "version_display_order";`)
}
