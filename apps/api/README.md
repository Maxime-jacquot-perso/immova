# API NestJS

Cette application contient l'API du SaaS de pilotage immobilier.

## URL de production

- API publique : [https://api.axelys.app](https://api.axelys.app)
- Application produit : [https://app.axelys.app](https://app.axelys.app)
- Landing publique : [https://axelys.app](https://axelys.app)

## Variables de deploiement

Variables attendues pour l'API :

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/immo_ops?schema=public
DIRECT_URL=postgresql://postgres:postgres@localhost:5432/immo_ops?schema=public
JWT_SECRET=replace-with-a-long-random-secret
APP_WEB_URL=https://app.axelys.app
ALLOWED_ORIGINS=https://app.axelys.app,https://axelys.app
MAIL_FROM="Axelys <no-reply@axelys.app>"
PILOT_NOTIFICATION_EMAIL=contact@axelys.app
```

Repere dans le repo :

- `apps/api/.env.example` : template versionne sans secret

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
- `APP_WEB_URL` doit rester aligne sur `https://app.axelys.app` en production pour les liens d invitation
- `ALLOWED_ORIGINS` doit inclure au minimum `https://app.axelys.app` et, si la landing appelle l API depuis le navigateur, `https://axelys.app`
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
