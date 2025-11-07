import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/personalization.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
});
