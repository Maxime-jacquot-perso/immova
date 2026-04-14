# App web React + Vite

Cette application contient :

- l'application produit pour les utilisateurs authentifies
- le back-office admin interne sous `/admin`

## URL de production

- Application publique : [https://app.axelys.app](https://app.axelys.app)
- API publique : [https://api.axelys.app](https://api.axelys.app)
- Landing publique : [https://axelys.app](https://axelys.app)

## Configuration API

- en local, le proxy Vite redirige `/api` vers `http://localhost:3000`
- en build / production, definir `VITE_API_URL=https://api.axelys.app/api`

## Variables de deploiement

Variables attendues pour l'app :

```env
VITE_API_URL=https://api.axelys.app/api
```

Repere dans le repo :

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
