import { defineConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';
import { resolve } from 'path';

export default defineConfig({
  plugins: [sveltekit()],
  resolve: {
    alias: {
      $lib: resolve('./src/lib')
    }
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.{test,spec}.{js,ts}'],
    globals: true,
    setupFiles: ['./test/setupTests.ts'],
    deps: {
      inline: ['@testing-library/svelte']
    },
    environmentMatchGlobs: [
      ['**/*.svelte.{test,spec}.{js,ts}', 'jsdom']
    ]
  },
});
