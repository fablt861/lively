import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/private/'], // Protect admin areas
    },
    sitemap: 'https://kinky.live/sitemap.xml',
  };
}
