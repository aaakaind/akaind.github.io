import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/client.ts', 'src/mcp-session.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
});
