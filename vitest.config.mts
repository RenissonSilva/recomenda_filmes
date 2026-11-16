import { fileURLToPath } from 'node:url';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

const fromRoot = (path: string) => fileURLToPath(new URL(path, import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fromRoot('./src'),
      '@test': fromRoot('./test'),
      // `server-only` lança erro fora do ambiente de Server Components; nos testes ele é neutro.
      'server-only': fromRoot('./test/stubs/server-only.ts'),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    restoreMocks: true,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.test.{ts,tsx}', 'src/app/**/{page,layout,loading,error,not-found}.tsx'],
    },
  },
});
