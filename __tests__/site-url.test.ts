import {
  buildSiteUrl,
  CANONICAL_SITE_URL,
  DEV_FALLBACK_SITE_URL,
  isLocalhostOrigin,
  normalizeOrigin,
  originFromHeaders,
  resolveAuthRedirectOrigin,
  resolveOutboundSiteUrl,
  resolveSiteUrl,
  type SiteUrlEnv,
} from '@/lib/site-url'

describe('normalizeOrigin', () => {
  it('entfernt den Schrägstrich am Ende', () => {
    expect(normalizeOrigin('https://www.sitov-academy.com/')).toBe('https://www.sitov-academy.com')
  })

  it('ergänzt ein fehlendes Protokoll mit https', () => {
    expect(normalizeOrigin('www.sitov-academy.com')).toBe('https://www.sitov-academy.com')
  })

  it('behält http für lokale Adressen', () => {
    expect(normalizeOrigin('http://localhost:3000')).toBe('http://localhost:3000')
  })

  it('verwirft leere und unbrauchbare Werte', () => {
    expect(normalizeOrigin('')).toBeNull()
    expect(normalizeOrigin('   ')).toBeNull()
    expect(normalizeOrigin(undefined)).toBeNull()
    expect(normalizeOrigin(null)).toBeNull()
  })

  it('verwirft fremde Protokolle', () => {
    expect(normalizeOrigin('javascript:alert(1)')).toBeNull()
    expect(normalizeOrigin('ftp://example.com')).toBeNull()
  })

  it('verwirft den Pfad und behält nur die Origin', () => {
    expect(normalizeOrigin('https://www.sitov-academy.com/de/login?x=1')).toBe(
      'https://www.sitov-academy.com'
    )
  })
})

describe('originFromHeaders', () => {
  it('bevorzugt x-forwarded-host vor host', () => {
    expect(originFromHeaders('www.sitov-academy.com', 'https', 'internal.netlify')).toBe(
      'https://www.sitov-academy.com'
    )
  })

  it('nimmt bei einer Proxy-Kette den ersten Eintrag', () => {
    expect(originFromHeaders('www.sitov-academy.com, proxy.intern', 'https, http', null)).toBe(
      'https://www.sitov-academy.com'
    )
  })

  it('nimmt https an, wenn das Protokoll fehlt', () => {
    expect(originFromHeaders(null, null, 'www.sitov-academy.com')).toBe(
      'https://www.sitov-academy.com'
    )
  })

  it('nimmt für localhost http an', () => {
    expect(originFromHeaders(null, null, 'localhost:3000')).toBe('http://localhost:3000')
  })

  it('gibt ohne Host null zurück', () => {
    expect(originFromHeaders(null, null, null)).toBeNull()
  })
})

describe('isLocalhostOrigin', () => {
  it('erkennt Loopback-Adressen', () => {
    expect(isLocalhostOrigin('http://localhost:3000')).toBe(true)
    expect(isLocalhostOrigin('http://127.0.0.1:3000')).toBe(true)
    expect(isLocalhostOrigin('https://www.sitov-academy.com')).toBe(false)
    expect(isLocalhostOrigin(null)).toBe(false)
  })
})

describe('resolveSiteUrl', () => {
  it('nutzt NEXT_PUBLIC_SITE_URL mit höchster Priorität', () => {
    const env: SiteUrlEnv = {
      NEXT_PUBLIC_SITE_URL: 'https://www.sitov-academy.com',
      CONTEXT: 'production',
      URL: 'https://zufall.netlify.app',
      NODE_ENV: 'production',
    }

    expect(resolveSiteUrl(env, 'https://angreifer.example')).toBe('https://www.sitov-academy.com')
  })

  it('nutzt im Netlify-Produktionskontext die Site-URL', () => {
    const env: SiteUrlEnv = {
      CONTEXT: 'production',
      URL: 'https://www.sitov-academy.com',
      DEPLOY_PRIME_URL: 'https://deploy-preview-7--sitov.netlify.app',
      NODE_ENV: 'production',
    }

    expect(resolveSiteUrl(env)).toBe('https://www.sitov-academy.com')
  })

  it('nutzt in einem Netlify-Preview die Deploy-URL', () => {
    const env: SiteUrlEnv = {
      CONTEXT: 'deploy-preview',
      URL: 'https://www.sitov-academy.com',
      DEPLOY_PRIME_URL: 'https://deploy-preview-7--sitov.netlify.app',
      NODE_ENV: 'production',
    }

    expect(resolveSiteUrl(env)).toBe('https://deploy-preview-7--sitov.netlify.app')
  })

  it('zieht Plattform-Variablen dem Host-Header vor', () => {
    const env: SiteUrlEnv = {
      CONTEXT: 'production',
      URL: 'https://www.sitov-academy.com',
      NODE_ENV: 'production',
    }

    expect(resolveSiteUrl(env, 'https://angreifer.example')).toBe('https://www.sitov-academy.com')
  })

  it('nutzt den Host-Header, wenn keine Plattform-Variable gesetzt ist', () => {
    const env: SiteUrlEnv = { NODE_ENV: 'production' }

    expect(resolveSiteUrl(env, 'https://www.sitov-academy.com')).toBe(
      'https://www.sitov-academy.com'
    )
  })

  it('nutzt Vercel-Variablen, wenn sie vorhanden sind', () => {
    const env: SiteUrlEnv = {
      VERCEL_ENV: 'production',
      VERCEL_PROJECT_PRODUCTION_URL: 'sitov.vercel.app',
      NODE_ENV: 'production',
    }

    expect(resolveSiteUrl(env)).toBe('https://sitov.vercel.app')
  })

  it('fällt außerhalb von Produktion auf localhost zurück', () => {
    expect(resolveSiteUrl({ NODE_ENV: 'development' })).toBe(DEV_FALLBACK_SITE_URL)
  })

  it('nimmt in Produktion die kanonische Domain statt localhost oder Abbruch', () => {
    expect(resolveSiteUrl({ NODE_ENV: 'production' })).toBe(CANONICAL_SITE_URL)
  })
})

describe('isLocalhostOrigin', () => {
  it('erkennt Loopback-Adressen', () => {
    expect(isLocalhostOrigin('http://localhost:3000')).toBe(true)
    expect(isLocalhostOrigin('http://127.0.0.1:3000')).toBe(true)
    expect(isLocalhostOrigin('https://www.sitov-academy.com')).toBe(false)
    expect(isLocalhostOrigin(null)).toBe(false)
  })
})

describe('resolveOutboundSiteUrl', () => {
  it('überspringt ein explizites localhost zugunsten der kanonischen Domain', () => {
    expect(
      resolveOutboundSiteUrl({
        NEXT_PUBLIC_SITE_URL: 'http://localhost:3000',
        NODE_ENV: 'development',
      })
    ).toBe(CANONICAL_SITE_URL)
  })

  it('überspringt einen localhost-Host-Header', () => {
    expect(resolveOutboundSiteUrl({ NODE_ENV: 'development' }, 'http://localhost:3000')).toBe(
      CANONICAL_SITE_URL
    )
  })

  it('behält eine öffentliche Preview-URL', () => {
    expect(
      resolveOutboundSiteUrl({
        CONTEXT: 'deploy-preview',
        DEPLOY_PRIME_URL: 'https://deploy-preview-7--sitov.netlify.app',
        NODE_ENV: 'production',
      })
    ).toBe('https://deploy-preview-7--sitov.netlify.app')
  })

  it('nutzt in Produktion die explizite Site-URL', () => {
    expect(
      resolveOutboundSiteUrl({
        NEXT_PUBLIC_SITE_URL: 'https://www.sitov-academy.com',
        NODE_ENV: 'production',
      })
    ).toBe('https://www.sitov-academy.com')
  })

  it('nimmt die kanonische Domain, wenn nur localhost zur Verfügung steht', () => {
    expect(resolveOutboundSiteUrl({ NODE_ENV: 'production' }, 'http://localhost:3000')).toBe(
      CANONICAL_SITE_URL
    )
  })

  it('überspringt ein versehentlich gesetztes localhost auch lokal, weil die Live-DB die Mail verschickt', () => {
    expect(
      resolveOutboundSiteUrl(
        {
          NEXT_PUBLIC_SITE_URL: 'http://localhost:3000',
          NODE_ENV: 'development',
        },
        'http://localhost:3000'
      )
    ).toBe(CANONICAL_SITE_URL)
  })

  it('bevorzugt die öffentliche Domain vor einem lokalen Host-Header', () => {
    expect(
      resolveOutboundSiteUrl(
        {
          CONTEXT: 'production',
          URL: 'https://www.sitov-academy.com',
          NODE_ENV: 'production',
        },
        'http://localhost:3000'
      )
    ).toBe('https://www.sitov-academy.com')
  })

  it('fällt ohne jede öffentliche Quelle auf die kanonische Domain', () => {
    expect(resolveOutboundSiteUrl({ NODE_ENV: 'development' })).toBe(CANONICAL_SITE_URL)
  })
})

describe('buildSiteUrl', () => {
  it('setzt Pfad und Parameter an die Basis-URL', () => {
    expect(
      buildSiteUrl('https://www.sitov-academy.com', '/auth/confirm', { lang: 'de', type: 'signup' })
    ).toBe('https://www.sitov-academy.com/auth/confirm?lang=de&type=signup')
  })

  it('ergänzt einen fehlenden Schrägstrich am Pfadanfang', () => {
    expect(buildSiteUrl('https://www.sitov-academy.com', 'auth/confirm')).toBe(
      'https://www.sitov-academy.com/auth/confirm'
    )
  })

  it('kodiert Sonderzeichen in Parametern', () => {
    const url = buildSiteUrl('https://www.sitov-academy.com', '/auth/confirm', {
      next: '/de/dashboard?tab=vokabeln',
    })

    expect(url).toBe(
      'https://www.sitov-academy.com/auth/confirm?next=%2Fde%2Fdashboard%3Ftab%3Dvokabeln'
    )
  })
})

describe('resolveAuthRedirectOrigin', () => {
  it('bleibt auf localhost, damit lokale Tests nicht auf die Live-Domain springen', () => {
    expect(
      resolveAuthRedirectOrigin(
        { NEXT_PUBLIC_SITE_URL: 'https://www.sitov-academy.com', NODE_ENV: 'development' },
        'http://localhost:3000'
      )
    ).toBe('http://localhost:3000')
  })

  it('nutzt in Produktion NEXT_PUBLIC_SITE_URL', () => {
    expect(
      resolveAuthRedirectOrigin(
        { NEXT_PUBLIC_SITE_URL: 'https://www.sitov-academy.com', NODE_ENV: 'production' },
        'https://www.sitov-academy.com'
      )
    ).toBe('https://www.sitov-academy.com')
  })

  it('nutzt die Request-Origin, wenn keine Site-URL gesetzt ist', () => {
    expect(
      resolveAuthRedirectOrigin({ NODE_ENV: 'production' }, 'https://www.sitov-academy.com')
    ).toBe('https://www.sitov-academy.com')
  })

  it('fällt ohne jede Origin in Produktion auf die kanonische Domain', () => {
    expect(resolveAuthRedirectOrigin({ NODE_ENV: 'production' }, null)).toBe(CANONICAL_SITE_URL)
  })
})
