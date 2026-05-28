import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                disallow: ['/private/', '/admin/', '/api/', '/registration'], // Disallow sensitive paths
            },
        ],
        sitemap: 'https://www.sitov-academy.com/sitemap.xml',
        host: 'https://www.sitov-academy.com',
    };
}
