// tests/setup.js
// Sets up the test environment for all test suites.
// Loads a test-specific .env so integration tests use a separate DB.

import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env.test if it exists, otherwise fall back to .env
config({ path: join(__dirname, '..', '.env.test'), override: false });
config({ path: join(__dirname, '..', '.env'), override: false });
