# API NestJS

Cette application contient l'API du SaaS de pilotage immobilier.

## Commandes utiles

Depuis `apps/api` :

```bash
pnpm start:dev
pnpm build
pnpm lint
pnpm prisma:migrate
pnpm prisma:seed
pnpm test:e2e
```

## Configuration locale

- copier `.env.example` vers `.env`
- adapter `DATABASE_URL` a votre PostgreSQL local si besoin
- `UPLOAD_DIR` pointe par defaut vers `./uploads`

Les fichiers d'upload et les temporaires de test sont locaux et ignores par Git.

## Reference

La documentation generale du monorepo se trouve dans le [README racine](../../README.md).
