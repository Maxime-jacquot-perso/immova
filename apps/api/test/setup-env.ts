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
process.env.STRIPE_SECRET_KEY =
  process.env.STRIPE_SECRET_KEY || 'sk_test_axelys_local';
process.env.STRIPE_WEBHOOK_SECRET =
  process.env.STRIPE_WEBHOOK_SECRET || 'whsec_axelys_local';
process.env.STRIPE_PRICE_PILOT_MONTHLY =
  process.env.STRIPE_PRICE_PILOT_MONTHLY || 'price_pilot_monthly';
process.env.STRIPE_PRICE_STANDARD_MONTHLY =
  process.env.STRIPE_PRICE_STANDARD_MONTHLY || 'price_standard_monthly';
process.env.STRIPE_PRICE_PRO_MONTHLY =
  process.env.STRIPE_PRICE_PRO_MONTHLY || 'price_pro_monthly';
process.env.STRIPE_CHECKOUT_SUCCESS_URL =
  process.env.STRIPE_CHECKOUT_SUCCESS_URL ||
  'http://localhost:5173/settings/billing/success';
process.env.STRIPE_CHECKOUT_CANCEL_URL =
  process.env.STRIPE_CHECKOUT_CANCEL_URL ||
  'http://localhost:5173/settings/billing/cancel';
process.env.STRIPE_PORTAL_RETURN_URL =
  process.env.STRIPE_PORTAL_RETURN_URL ||
  'http://localhost:5173/settings/billing';
process.env.UPLOAD_DIR =
  process.env.UPLOAD_DIR || join(process.cwd(), 'test', '.tmp', 'uploads');
