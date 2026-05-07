import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/constants';

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date('2026-05-07T00:00:00.000Z');
  const publicRoutes = [
    {
      path: '/',
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      path: '/reservation',
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      path: '/conditions-generales',
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      path: '/mentions-legales',
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      path: '/politique-confidentialite',
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      path: '/reglement-interieur',
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ] satisfies Array<{
    path: string;
    changeFrequency: NonNullable<MetadataRoute.Sitemap[number]['changeFrequency']>;
    priority: number;
  }>;

  return publicRoutes.map(({ path, changeFrequency, priority }) => ({
    url: path === '/' ? SITE_URL : `${SITE_URL}${path}`,
    lastModified,
    changeFrequency,
    priority,
  }));
}
