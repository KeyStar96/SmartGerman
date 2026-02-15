import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Resend } from 'https://esm.sh/resend@2.0.0'

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
        console.log("Edge Function invoked. Checking environment variables...")

        const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
        const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
        const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

        if (!RESEND_API_KEY) {
            console.error("Missing RESEND_API_KEY")
            throw new Error("Missing RESEND_API_KEY")
        }
        if (!SUPABASE_URL) {
            console.error("Missing SUPABASE_URL")
            throw new Error("Missing SUPABASE_URL")
        }
        if (!SUPABASE_SERVICE_ROLE_KEY) {
            console.error("Missing SUPABASE_SERVICE_ROLE_KEY")
            throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY")
        }

        console.log("Environment variables present. Initializing clients...")

        let resend;
        let supabase;

        try {
            resend = new Resend(RESEND_API_KEY)
            console.log("Resend client initialized.")
        } catch (e) {
            console.error("Failed to initialize Resend client:", e)
            throw e
        }

        try {
            supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
            console.log("Supabase client initialized.")
        } catch (e) {
            console.error("Failed to initialize Supabase client:", e)
            throw e
        }

        // 1. Fetch confirmed registrations that haven't been emailed yet
        console.log("Fetching confirmed registrations...")

        let registrations;
        try {
            // START Query
            const query = supabase
                .from('registrations')
                .select(`
                    *,
                    users (*),
                    enrollments (
                        price,
                        courses (
                            title,
                            translation_key,
                            price
                        )
                    )
                `)
                .eq('status', 'confirmed')
                .eq('confirmation_mail_sent', false)
                .limit(50);

            const { data, error } = await query;

            if (error) {
                console.error("Supabase Query Error:", JSON.stringify(error));
                throw error;
            }
            registrations = data;
            console.log(`Query successful. Found ${registrations?.length} registrations.`);

        } catch (err) {
            console.error("Crash during Supabase Query execution:", err);
            throw err;
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
            console.log(`Processing registration ${reg.id}...`);

            // Handle 'users' being potentially an array or object depending on Supabase client version/setup
            const user = Array.isArray(reg.users) ? reg.users[0] : reg.users;

            // Debug log to see what we actually got
            console.log(`User data for ${reg.id}:`, JSON.stringify(user));

            const courses = reg.enrollments?.map((e: any) => e.courses) || [];
            console.log(`Found ${courses.length} courses for ${reg.id}`);
            if (!user || !user.email) {
                console.error(`User data missing/incomplete for registration ${reg.id}`);
                continue;
            }

            // Format course list for email with real names from DB and dynamic prices
            const courseListHtml = (reg.enrollments || []).map((e: any) => {
                const c = e.courses;
                const realTitle = c?.title || c?.translation_key || 'Unbekannter Kurs';

                // Use specific enrollment price if available, otherwise fallback to course price
                const finalPrice = (typeof e?.price === 'number') ? e.price : c?.price;
                const priceLabel = (typeof finalPrice === 'number') ? finalPrice.toFixed(2) : '0.00';

                return `
                <tr style="border-bottom: 1px solid #e5e7eb;">
                    <td style="padding: 12px 0; color: #111827; font-size: 16px;">${realTitle}</td>
                    <td style="padding: 12px 0; color: #6b7280; font-size: 16px; text-align: right;">${priceLabel}€</td>
                </tr>`;
            }).join('');

            // Logo URL in Supabase Storage (public 'assets' bucket)
            const logoUrl = `${SUPABASE_URL}/storage/v1/object/public/assets/logo.png`;

            const emailHtml = `
<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Anmeldebestätigung</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f3f4f6; color: #374151;">
    <div style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
        
        <!-- Header with Logo -->
        <div style="background-color: #ffffff; padding: 40px 40px 20px 40px; text-align: center; border-bottom: 1px solid #e5e7eb;">
            <img src="${logoUrl}" alt="SmartGerman Logo" style="height: 60px; width: auto; max-width: 100%;">
        </div>

        <!-- Content -->
        <div style="padding: 40px;">
            <h1 style="color: #111827; font-size: 24px; font-weight: 700; margin-bottom: 24px; text-align: center;">Anmeldebestätigung</h1>
            
            <p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
                Hallo ${user.first_name || 'Student'},
            </p>
            
            <p style="font-size: 16px; line-height: 1.6; margin-bottom: 32px;">
                vielen Dank für deine Anmeldung! Wir freuen uns sehr, dich bei SmartGerman begrüßen zu dürfen. Hier ist eine Übersicht deiner gewählten Kurse:
            </p>

            <!-- Course Table -->
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 32px;">
                <thead>
                    <tr style="border-bottom: 2px solid #e5e7eb;">
                        <th style="padding: 12px 0; text-align: left; color: #374151; font-weight: 600; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em;">Kurs</th>
                        <th style="padding: 12px 0; text-align: right; color: #374151; font-weight: 600; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em;">Preis</th>
                    </tr>
                </thead>
                <tbody>
                    ${courseListHtml}
                    <tr style="border-top: 2px solid #e5e7eb;">
                        <td style="padding: 16px 0; color: #111827; font-weight: 700; font-size: 18px;">Gesamtbetrag</td>
                        <td style="padding: 16px 0; color: #111827; font-weight: 700; font-size: 18px; text-align: right;">${reg.total_price}€</td>
                    </tr>
                </tbody>
            </table>

            <!-- Payment Info Box -->
            <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 24px; margin-bottom: 32px;">
                <h3 style="color: #111827; font-size: 18px; margin-top: 0; margin-bottom: 12px;">Wichtige Information zur Zahlung</h3>
                <p style="font-size: 15px; line-height: 1.5; margin-bottom: 12px; color: #4b5563;">
                    Du erhältst in Kürze eine separate E-Mail mit der offiziellen Rechnung von unserer Buchhaltungssoftware <strong>"Papierkram.de"</strong>.
                </p>
                <p style="font-size: 15px; line-height: 1.5; margin: 0; color: #4b5563;">
                    Bitte begleiche den Rechnungsbetrag bequem per Überweisung vor Kursbeginn.
                </p>
            </div>

            <p style="font-size: 16px; line-height: 1.6; margin-bottom: 40px;">
                Falls du Fragen hast, antworte einfach auf diese E-Mail oder schreib uns per Telegram.<br><br>
                Mit freundlichen Grüßen,<br>
                <strong>Dein SmartGerman Team</strong>
            </p>
        </div>

        <!-- Footer -->
        <div style="background-color: #1f2937; padding: 40px; text-align: center; color: #9ca3af; font-size: 12px; line-height: 1.5;">
            <p style="margin-bottom: 12px;">
                <strong>SmartGerman Sprachschule</strong><br>
                Hüttenstraße 24a<br>
                30165 Hannover, Deutschland
            </p>
            <p style="margin-bottom: 12px;">
                Telefon: +49 171 4758620<br>
                E-Mail: <a href="mailto:info@smart-german.com" style="color: #d1d5db; text-decoration: none;">info@smart-german.com</a>
            </p>
            <p style="margin-bottom: 24px;">
                Vertretungsberechtigt: Anastasia Sitov
            </p>
            <p style="margin: 0; border-top: 1px solid #374151; padding-top: 20px;">
                &copy; 2025 SmartGerman. Alle Rechte vorbehalten.<br>
                <a href="https://www.smart-german.com/imprint" style="color: #9ca3af; text-decoration: underline; margin: 0 8px;">Impressum</a>
                <a href="https://www.smart-german.com/privacy" style="color: #9ca3af; text-decoration: underline; margin: 0 8px;">Datenschutz</a>
                <a href="https://www.smart-german.com/agb" style="color: #9ca3af; text-decoration: underline; margin: 0 8px;">AGB</a>
            </p>
        </div>
    </div>
</body>
</html>
            `;

            console.log(`Attempting to send email to ${user.email}...`);

            // 3. Send Email
            const { data: emailData, error: emailError } = await resend.emails.send({
                from: 'SmartGerman <info@smart-german.com>', // WARNING: This must be a VERIFIED domain in Resend!
                to: [user.email],
                subject: 'Deine Anmeldebestätigung - SmartGerman',
                html: emailHtml,
            });

            if (emailError) {
                console.error(`RESEND ERROR for ${user.email}:`, JSON.stringify(emailError));
                results.push({ id: reg.id, status: 'failed', error: emailError });
            } else {
                console.log(`Email sent successfully to ${user.email}. ID: ${emailData?.id}`);

                // 4. Mark as sent
                const { error: updateError } = await supabase
                    .from('registrations')
                    .update({ confirmation_mail_sent: true })
                    .eq('id', reg.id);

                if (updateError) {
                    console.error(`DB Update Failed for ${reg.id}:`, updateError);
                    results.push({ id: reg.id, status: 'sent_but_update_failed', error: updateError });
                } else {
                    console.log(`DB updated (confirmation_mail_sent=true) for ${reg.id}`);
                    results.push({ id: reg.id, status: 'success', emailId: emailData?.id });
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
