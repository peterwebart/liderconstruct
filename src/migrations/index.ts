import * as migration_20260718_171014_initial from './20260718_171014_initial';
import * as migration_20260907_231050_add_product_display_order from './20260907_231050_add_product_display_order';

export const migrations = [
  {
    up: migration_20260718_171014_initial.up,
    down: migration_20260718_171014_initial.down,
    name: '20260718_171014_initial',
  },
  {
    up: migration_20260907_231050_add_product_display_order.up,
    down: migration_20260907_231050_add_product_display_order.down,
    name: '20260907_231050_add_product_display_order'
  },
];
