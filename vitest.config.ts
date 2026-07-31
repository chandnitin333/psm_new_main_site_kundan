import { defineConfig } from 'vitest/config';

// Unit-test runner config. Pure-logic + hook tests run in jsdom (localStorage etc.).
export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
});
