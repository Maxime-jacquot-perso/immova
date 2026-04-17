import { INestApplication, ValidationPipe } from '@nestjs/common';

const defaultAllowedOrigins = [
  'https://axelys.app',
  'https://app.axelys.app',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3001',
  'http://127.0.0.1:3001',
];

const defaultAllowedMethods = [
  'GET',
  'HEAD',
  'PUT',
  'PATCH',
  'POST',
  'DELETE',
  'OPTIONS',
];

const defaultAllowedHeaders = [
  'Content-Type',
  'Authorization',
  'Accept',
  'Origin',
  'X-Requested-With',
];

function normalizeOrigin(origin: string) {
  return origin.trim().replace(/\/$/, '');
}

function resolveAllowedOrigins() {
  const configuredOrigins = process.env.ALLOWED_ORIGINS?.split(',')
    .map(normalizeOrigin)
    .filter(Boolean);

  return configuredOrigins?.length ? configuredOrigins : defaultAllowedOrigins;
}

export function configureApp(app: INestApplication) {
  const allowedOrigins = resolveAllowedOrigins();

  app.setGlobalPrefix('api');
  app.enableCors({
    origin(origin, callback) {
      if (!origin) {
        callback(null, true);
        return;
      }

      callback(null, allowedOrigins.includes(normalizeOrigin(origin)));
    },
    credentials: true,
    methods: defaultAllowedMethods,
    allowedHeaders: defaultAllowedHeaders,
    optionsSuccessStatus: 204,
    preflightContinue: false,
    maxAge: 86400,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
}
