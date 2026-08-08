import { NextResponse } from 'next/server'
import { stripe } from '@/utils/stripe/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
  // Wir brauchen den Service Role Key, da der Webhook ohne User-Session (Authentication) kommt
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'
  const supabaseAdmin = createClient(supabaseUrl, supabaseKey)

  const body = await req.text()
  const signature = req.headers.get('Stripe-Signature') as string

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (error: any) {
    return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 })
  }

  const session = event.data.object as Stripe.Checkout.Session
  const subscription = event.data.object as Stripe.Subscription

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        // Neuer Kauf abgeschlossen
        if (session.metadata?.supabase_user_id) {
          await supabaseAdmin
            .from('profiles')
            .update({
              subscription_status: 'aktiv',
              stripe_customer_id: session.customer as string,
              stripe_subscription_id: session.subscription as string,
              updated_at: new Date().toISOString()
            })
            .eq('id', session.metadata.supabase_user_id)
        }
        break

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        // Abo Status geändert oder gelöscht
        const status = subscription.status
        const isActive = status === 'active' || status === 'trialing'
        
        await supabaseAdmin
          .from('profiles')
          .update({
            subscription_status: isActive ? 'aktiv' : 'kostenlos',
            updated_at: new Date().toISOString()
          })
          .eq('stripe_subscription_id', subscription.id)
        break
        
      default:
        console.log(`Unhandled event type ${event.type}`)
    }
  } catch (error) {
    console.error('Database update failed:', error)
    return new NextResponse('Database Update Failed', { status: 500 })
  }

  return new NextResponse('Webhook handled', { status: 200 })
}
