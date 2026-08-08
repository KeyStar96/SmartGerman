import { NextResponse } from 'next/server'
import { stripe } from '@/utils/stripe/server'
import { createClient } from '@/utils/supabase/server'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id, email')
      .eq('id', user.id)
      .single()

    const { origin } = new URL(req.url)
    const lang = req.headers.get('referer')?.includes('/tr/') ? 'tr' : req.headers.get('referer')?.includes('/ru/') ? 'ru' : 'de'

    // Hier sollte später die echte Price ID aus dem Stripe Dashboard eingesetzt werden
    const priceId = process.env.STRIPE_PRICE_ID || 'price_placeholder' 
    
    let stripeCustomerId = profile?.stripe_customer_id

    // Fallback: Create customer if it doesn't exist
    if (!stripeCustomerId && profile?.email) {
      const customer = await stripe.customers.create({
        email: profile.email,
        metadata: {
          supabase_user_id: user.id
        }
      })
      stripeCustomerId = customer.id
      
      // Update supabase profile
      await supabase
        .from('profiles')
        .update({ stripe_customer_id: stripeCustomerId })
        .eq('id', user.id)
    }

    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId || undefined,
      customer_email: !stripeCustomerId ? profile?.email : undefined,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${origin}/${lang}/dashboard?payment=success`,
      cancel_url: `${origin}/${lang}/dashboard/profile?payment=cancelled`,
      metadata: {
        supabase_user_id: user.id
      },
      locale: 'de', // Fokus auf deutsche Sprache für das Zielpublikum
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Error creating checkout session:', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
