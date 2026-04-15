import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/private/', '/*/elite', '/*/elite/'], // Protect admin and model recruitment areas
    },
    sitemap: 'https://kinky.live/sitemap.xml',
  };
}
