export type PublicPageEntry = {
  path: string;
  updatedAt: string;
  priority: number;
  changeFrequency: 'weekly' | 'monthly';
};

export const publicPageEntries: PublicPageEntry[] = [
  {
    path: '/',
    updatedAt: '2026-05-14',
    priority: 1,
    changeFrequency: 'weekly',
  },
  {
    path: '/pricing',
    updatedAt: '2026-05-14',
    priority: 0.9,
    changeFrequency: 'monthly',
  },
  {
    path: '/client-pilote',
    updatedAt: '2026-04-17',
    priority: 0.95,
    changeFrequency: 'weekly',
  },
  {
    path: '/blog',
    updatedAt: '2026-05-14',
    priority: 0.85,
    changeFrequency: 'weekly',
  },
  {
    path: '/outils',
    updatedAt: '2026-05-14',
    priority: 0.88,
    changeFrequency: 'weekly',
  },
];
