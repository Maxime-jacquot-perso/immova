import { userInfo } from 'node:os';
import { join } from 'node:path';

const username = encodeURIComponent(userInfo().username);
const fallbackDatabaseUrl = `postgresql://${username}@localhost:5432/immo_ops_e2e?schema=public`;

const resolvedDatabaseUrl =
  process.env.DATABASE_URL_E2E ||
  (process.env.DATABASE_URL?.includes('e2e')
    ? process.env.DATABASE_URL
    : undefined) ||
  fallbackDatabaseUrl;
const resolvedDirectUrl =
  process.env.DIRECT_URL_E2E ||
  (process.env.DIRECT_URL?.includes('e2e')
    ? process.env.DIRECT_URL
    : undefined) ||
  resolvedDatabaseUrl;

process.env.DATABASE_URL = resolvedDatabaseUrl;
process.env.DIRECT_URL = resolvedDirectUrl;
process.env.JWT_SECRET = process.env.JWT_SECRET || 'e2e-secret';
process.env.APP_WEB_URL = process.env.APP_WEB_URL || 'http://localhost:5173';
process.env.UPLOAD_DIR =
  process.env.UPLOAD_DIR || join(process.cwd(), 'test', '.tmp', 'uploads');
