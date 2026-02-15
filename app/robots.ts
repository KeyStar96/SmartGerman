import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                disallow: ['/api/', '/_next/', '/registration/'],
            },
        ],
        sitemap: 'https://smart-german.com/sitemap.xml',
    };
}
