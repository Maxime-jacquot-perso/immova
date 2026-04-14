# API NestJS

Cette application contient l'API du SaaS de pilotage immobilier.

## URL de production

- API Vercel : [https://immova-api.vercel.app](https://immova-api.vercel.app)

## Variables Vercel

Dans le projet Vercel `immova-api`, renseigner :

```env
DATABASE_URL=postgres://USER:PASSWORD@db.prisma.io:5432/postgres?sslmode=require&pool=true
DIRECT_URL=postgres://USER:PASSWORD@db.prisma.io:5432/postgres?sslmode=require
JWT_SECRET=replace-with-a-long-random-secret
```

Repere dans le repo :

- `apps/api/.env.prod` : helper local pret a copier-coller
- `apps/api/.env.prod.example` : template versionne sans secret

## Commandes utiles

Depuis `apps/api` :

```bash
pnpm start:dev
pnpm build
pnpm lint
pnpm prisma:migrate
pnpm db:reset
pnpm db:demo-seed
pnpm prisma:seed
pnpm test:e2e
```

## Configuration locale

- copier `.env.example` vers `.env`
- adapter `DATABASE_URL` a votre PostgreSQL local si besoin
- `DIRECT_URL` doit pointer vers la connexion directe utilisee par Prisma CLI
- `UPLOAD_DIR` pointe par defaut vers `./uploads`
- `pnpm db:demo-seed` reset les donnees metier sans drop schema puis recree le seed de demonstration produit

Les fichiers d'upload et les temporaires de test sont locaux et ignores par Git.

## Note production

- en production serverless, `DATABASE_URL` doit utiliser une connexion poolée pour le trafic applicatif
- `DIRECT_URL` doit rester une connexion directe pour `prisma migrate deploy`, Prisma Studio et les outils admin
- avec Prisma Postgres, garder la connexion directe pour la CLI et ajouter `&pool=true` a la connexion runtime si vous restez sur le meme hostname
- les comptes seed et donnees de demonstration du repo restent limites au local et aux tests

## Reference

La documentation generale du monorepo se trouve dans le [README racine](../../README.md).
