import type { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';

let appPromise: Promise<INestApplication> | null = null;

async function getApp() {
  if (!appPromise) {
    appPromise = NestFactory.create(AppModule, {
      rawBody: true,
    }).then(async (app) => {
      configureApp(app);
      await app.init();
      return app;
    });
  }

  return appPromise;
}

function normalizeRequestUrl(url: string | undefined) {
  if (!url) {
    return '/api';
  }

  const parsedUrl =
    url.startsWith('http://') || url.startsWith('https://')
      ? new URL(url).pathname
      : url;
  const normalizedPath = parsedUrl.startsWith('/')
    ? parsedUrl
    : `/${parsedUrl}`;

  if (
    normalizedPath === '/api' ||
    normalizedPath.startsWith('/api/') ||
    normalizedPath.startsWith('/_next/') ||
    normalizedPath === '/favicon.ico'
  ) {
    return normalizedPath;
  }

  return `/api${normalizedPath}`;
}

export default async function handler(req: any, res: any) {
  req.url = normalizeRequestUrl(
    req.headers?.['x-original-url'] ||
      req.headers?.['x-rewrite-url'] ||
      req.url,
  );

  const app = await getApp();
  const httpAdapter = app.getHttpAdapter().getInstance();

  return httpAdapter(req, res);
}
