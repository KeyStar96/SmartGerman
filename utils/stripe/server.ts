import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  appInfo: {
    name: 'Sitov Language Academy',
    version: '0.1.0',
  }
})
