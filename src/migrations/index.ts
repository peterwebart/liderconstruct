import * as migration_20260718_171014_initial from './20260718_171014_initial';

export const migrations = [
  {
    up: migration_20260718_171014_initial.up,
    down: migration_20260718_171014_initial.down,
    name: '20260718_171014_initial'
  },
];
