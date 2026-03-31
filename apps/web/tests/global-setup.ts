import { execSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export default async function globalSetup() {
  const testsDir = dirname(fileURLToPath(import.meta.url));
  const apiDir = resolve(testsDir, '../../api');

  execSync('pnpm prisma db seed', {
    cwd: apiDir,
    stdio: 'ignore',
    env: process.env,
  });
}
