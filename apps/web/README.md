# App web React + Vite

Cette application contient :

- l'application produit pour les utilisateurs authentifies
- le back-office admin interne sous `/admin`

## URL de production

- Web Vercel : [https://immova-web.vercel.app/](https://immova-web.vercel.app/)

## Configuration API

- en local, le proxy Vite redirige `/api` vers `http://localhost:3000`
- en build / production, definir `VITE_API_URL=https://immova-api.vercel.app/api`

## Variables Vercel

Dans le projet Vercel `immova-web`, renseigner :

```env
VITE_API_URL=https://immova-api.vercel.app/api
```

Repere dans le repo :

- `apps/web/.env.prod` : helper local pret a copier-coller
- `apps/web/.env.prod.example` : template versionne

## Commandes utiles

Depuis `apps/web` :

```bash
pnpm dev
pnpm build
pnpm lint
pnpm test:e2e
```

## Reference

Le cadrage produit, le setup local et les scripts monorepo sont documentes dans le [README racine](../../README.md).
