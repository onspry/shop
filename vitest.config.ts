import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['src/**/*.{test,spec}.{js,ts}'],
    exclude: ['src/lib/server/**'],
    setupFiles: ['./vitest-setup-client.ts'],
    environmentMatchGlobs: [
      ['**/*.svelte.{test,spec}.{js,ts}', 'jsdom'],
      ['**/server/**/*.{test,spec}.{js,ts}', 'node']
    ],
    clearMocks: true,
    deps: {
      inline: ['@testing-library/svelte']
    }
  }
});
