import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  // Optionale Konfigurationen (z.B. API-Version)
  apiVersion: '2025-01-27.acacia', // Aktuelle Stripe API Version (bitte bei Bedarf anpassen)
  appInfo: {
    name: 'SmartGerman Academy',
    version: '0.1.0',
  }
})
