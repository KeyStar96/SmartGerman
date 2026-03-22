import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = 'https://smart-german.com';
    const locales = ['de', 'en', 'uk', 'ru', 'tr'];

    // All public pages (excluding /registration which is disallowed in robots.txt)
    const pages = [
        { path: '', changeFrequency: 'weekly' as const, priority: 1.0 },
        { path: '/agb', changeFrequency: 'monthly' as const, priority: 0.4 },
        { path: '/privacy', changeFrequency: 'monthly' as const, priority: 0.4 },
        { path: '/imprint', changeFrequency: 'monthly' as const, priority: 0.4 },
        { path: '/cancellation', changeFrequency: 'monthly' as const, priority: 0.3 },
    ];

    return pages.flatMap(page =>
        locales.map(locale => ({
            url: `${baseUrl}/${locale}${page.path}`,
            lastModified: new Date(),
            changeFrequency: page.changeFrequency,
            priority: page.priority,
            alternates: {
                languages: Object.fromEntries(
                    locales.map(l => [l, `${baseUrl}/${l}${page.path}`])
                ),
            },
        }))
    );
}
