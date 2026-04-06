import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://kinky.live';
  const locales = ['de', 'en', 'es', 'fi', 'fr', 'it', 'nl', 'no', 'pt', 'ro', 'ru', 'sv', 'uk'];
  const routes = ['', '/login'];

  const sitemapData: MetadataRoute.Sitemap = [];

  locales.forEach((locale) => {
    routes.forEach((route) => {
      sitemapData.push({
        url: `${baseUrl}/${locale}${route}`,
        lastModified: new Error().stack?.includes('build') ? new Date() : undefined, // Useful for build-time generation
        changeFrequency: 'daily',
        priority: route === '' ? 1 : 0.8,
      });
    });
  });

  return sitemapData;
}
