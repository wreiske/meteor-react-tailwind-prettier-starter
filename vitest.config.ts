import path from 'node:path';

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['imports/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@ui': path.resolve(__dirname, 'imports/ui'),
      '@lib': path.resolve(__dirname, 'imports/lib'),
    },
  },
});
