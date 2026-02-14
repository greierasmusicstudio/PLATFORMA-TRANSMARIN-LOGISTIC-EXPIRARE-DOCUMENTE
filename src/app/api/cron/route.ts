import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';

// Folosim cheia din Environment sau cea hardcodată temporar (doar în teste)
const resend = new Resend(process.env.RESEND_API_KEY || 're_QZHg8kG3_3He8E3eP9TFyFNMj967w46TJ');

export const dynamic = 'force-dynamic';

export async function GET() {
    console.log('--- [CRON START] Verificare Expirare Documente ---');

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        return NextResponse.json({ error: 'Supabase credentials missing' }, { status: 500 });
    }

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    // 1. Luăm toate documentele
    const { data: documents, error } = await supabase.from('documents').select('*');

    if (error) {
        console.error('[CRON ERROR] Supabase fetch failed:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log(`[CRON] S-au găsit ${documents?.length || 0} documente de verificat.`);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const alertsSent = [];

    // 2. Verificăm fiecare document
    for (const doc of (documents || [])) {
        if (!doc.expiry_date) continue;

        const expiry = new Date(doc.expiry_date);
        expiry.setHours(0, 0, 0, 0);

        // Diferența în zile (aproximativă, ignorăm orele)
        const diffTime = expiry.getTime() - today.getTime();
        const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // Zile întregi

        // Logica de Alertare
        let shouldAlert = false;
        let alertType = '';

        // Verificăm pragurile: 30 zile, 7 zile, 1 zi
        if (Math.abs(daysLeft - 30) < 1 && doc.alert_30_days) { shouldAlert = true; alertType = '30 Zile'; }
        if (Math.abs(daysLeft - 7) < 1 && doc.alert_7_days) { shouldAlert = true; alertType = '7 Zile'; }
        if (Math.abs(daysLeft - 1) < 1 && doc.alert_1_day) { shouldAlert = true; alertType = '1 Zi'; }

        // Verificăm și dacă a expirat AZI sau IERI (pentru siguranță)
        if (daysLeft <= 0 && daysLeft > -2 && doc.alert_1_day) { shouldAlert = true; alertType = 'EXPIRAT AZI'; }

        if (shouldAlert && doc.alert_email) {
            console.log(`[CRON ALERT] Trimitere email pentru ${doc.car_info} (${alertType}) la ${doc.alert_email}`);

            try {
                const { data, error: mailError } = await resend.emails.send({
                    from: 'Transmarin Alerts <onboarding@resend.dev>', // Adresa default Resend
                    to: [doc.alert_email], // Trebuie să fie adresa ta verificată în Resend (până adaugi domeniu)
                    subject: `⚠️ ALERTĂ: ${doc.car_info} - ${doc.doc_type} (${alertType})`,
                    html: `
                 <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
                    <h2 style="color: #d32f2f;">⚠️ Documentul Expiră în Curând!</h2>
                    <p>Salut,</p>
                    <p>Te informăm că documentul pentru vehiculul/șoferul:</p>
                    <h3 style="background: #f5f5f5; padding: 10px; border-left: 4px solid #1976d2;">
                        ${doc.car_info} (${doc.doc_type})
                    </h3>
                    <p>Data expirării: <strong>${new Date(doc.expiry_date).toLocaleDateString('ro-RO')}</strong></p>
                    <p>Zile rămase: <strong style="color: #d32f2f; font-size: 1.2em;">${daysLeft} zile</strong></p>
                    <hr>
                    <p><small>Acest mesaj a fost generat automat de Platforma Transmarin Logistic.</small></p>
                 </div>
               `
                });

                if (mailError) {
                    console.error('[CRON EMAIL ERROR]:', mailError);
                } else {
                    console.log(`[CRON SUCCESS] Email trimis! ID: ${data?.id}`);
                    alertsSent.push({ doc: doc.car_info, type: alertType, id: data?.id });
                }
            } catch (err) {
                console.error('[CRON EXCEPTION]:', err);
            }
        }
    }

    return NextResponse.json({ success: true, alertsSent, checkedCount: documents?.length });
}
