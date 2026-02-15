import { createClient } from 'jsr:@supabase/supabase-js@2'
import { Resend } from 'npm:resend@2.0.0'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

const resend = new Resend(RESEND_API_KEY)
const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
    // Handle CORS preflight request
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // 1. Fetch confirmed registrations that haven't been emailed yet
        // We join with 'enrollments' and 'courses' to get course details, and 'users' for personal info.
        const { data: registrations, error: fetchError } = await supabase
            .from('registrations')
            .select(`
        *,
        users (*),
        enrollments (
          courses (
            title: id, -- Assuming 'id' in courses table is the readable name/title based on schema (id text, translation_key text, etc.)
            translation_key,
            price
          )
        )
      `)
            .eq('status', 'confirmed')
            .eq('confirmation_mail_sent', false)
            .limit(50) // Process in batches to avoid timeouts

        if (fetchError) {
            throw fetchError
        }

        if (!registrations || registrations.length === 0) {
            return new Response(
                JSON.stringify({ message: 'No new confirmed registrations to process.' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        const results = []

        // 2. Process each registration
        for (const reg of registrations) {
            const user = reg.users
            const courses = reg.enrollments?.map((e: any) => e.courses) || []

            if (!user || !user.email) {
                console.error(`User data missing for registration ${reg.id}`)
                continue
            }

            // Format course list for email
            const courseListHtml = courses.map((c: any) =>
                `<li><strong>${c.title}</strong> (${c.price}€)</li>`
            ).join('')

            const emailHtml = `
        <h1>Anmeldebestätigung / Registration Confirmation</h1>
        <p>Hallo ${user.first_name || 'Student'},</p>
        <p>Wir freuen uns, deine Anmeldung bestätigen zu können!</p>
        <p><strong>Deine Kurse:</strong></p>
        <ul>${courseListHtml}</ul>
        <p><strong>Gesamtbetrag:</strong> ${reg.total_price}€</p>
        <hr />
        <p><strong>Wichtige Information zur Zahlung:</strong></p>
        <p>Du erhältst in Kürze eine separate E-Mail mit der Rechnung von unserer Buchhaltungssoftware "Papierkram.de".</p>
        <p>Bitte begleiche den Betrag vor Kursbeginn.</p>
        <br />
        <p>Mit freundlichen Grüßen,</p>
        <p>Dein SmartGerman Team</p>
      `

            // 3. Send Email
            const { data: emailData, error: emailError } = await resend.emails.send({
                from: 'SmartGerman <noreply@smartgerman.com>', // Update this with your verified domain
                to: [user.email],
                subject: 'Deine Anmeldebestätigung - SmartGerman',
                html: emailHtml,
            })

            if (emailError) {
                console.error(`Failed to send email to ${user.email}:`, emailError)
                results.push({ id: reg.id, status: 'failed', error: emailError })
            } else {
                // 4. Mark as sent
                const { error: updateError } = await supabase
                    .from('registrations')
                    .update({ confirmation_mail_sent: true })
                    .eq('id', reg.id)

                if (updateError) {
                    console.error(`Failed to update status for ${reg.id}:`, updateError)
                    results.push({ id: reg.id, status: 'sent_but_update_failed', error: updateError })
                } else {
                    results.push({ id: reg.id, status: 'success', emailId: emailData?.id })
                }
            }
        }

        return new Response(
            JSON.stringify({ message: `Processed ${registrations.length} registrations`, results }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
