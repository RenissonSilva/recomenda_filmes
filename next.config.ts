import path from 'node:path';

import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Cache Components: dados são dinâmicos por padrão e o cache é explícito via `'use cache'`.
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  turbopack: {
    // Fixa a raiz no próprio projeto (evita que lockfiles de pastas acima confundam a detecção).
    root: path.resolve(__dirname),
    rules: {
      '*.css': {
        loaders: ['@tailwindcss/turbopack'],
        as: '*.css',
      },
    },
  },
};

export default nextConfig;
