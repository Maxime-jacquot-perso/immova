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

function ensureApiPrefix(url: string | undefined) {
  if (!url || url.startsWith('/api')) {
    return url;
  }

  return `/api${url.startsWith('/') ? url : `/${url}`}`;
}

export default async function handler(req: any, res: any) {
  req.url = ensureApiPrefix(req.url);

  const app = await getApp();
  const httpAdapter = app.getHttpAdapter().getInstance();

  return httpAdapter(req, res);
}
