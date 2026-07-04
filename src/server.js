// src/server.js
// Entry point — loads env, then starts the HTTP listener.
// Kept minimal so app.js can be imported independently in tests.

// Load and validate env first — will exit(1) if DATABASE_URL is missing
import './config/env.js';

import app from './app.js';
import { env } from './config/env.js';

app.listen(env.PORT, () => {
  console.log(`[server] Listening on http://localhost:${env.PORT}`);
  console.log(`[server] Environment: ${env.NODE_ENV}`);
});
