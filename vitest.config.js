// vitest.config.js
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: false,
    // Run unit tests and integration tests separately via --reporter
    include: ['tests/**/*.test.js'],
    // Ensure env is loaded for integration tests
    setupFiles: ['./tests/setup.js'],
  },
});
