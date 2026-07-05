import { execSync } from 'child_process';
import { config } from 'dotenv';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

config({ path: join(rootDir, '.env.test'), override: true });

execSync('npx prisma migrate deploy', {
  cwd: rootDir,
  env: process.env,
  stdio: 'inherit',
});
