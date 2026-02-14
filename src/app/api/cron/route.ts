import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET() {
    console.log('--- [CRON START] Verificare Expirare via GMAIL ---');

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const smtpEmail = process.env.SMTP_EMAIL || 'cumpara24@gmail.com';
    const smtpPass = process.env.SMTP_PASSWORD || 'cxhvirwqxpawwsvz';

    if (!supabaseUrl || !supabaseKey) {
        return NextResponse.json({ error: 'Supabase credentials missing' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Luăm toate documentele
    const { data: documents, error } = await supabase.from('documents').select('*');

    if (error) {
        console.error('[CRON ERROR] Supabase fetch failed:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Configurare Nodemailer pentru GMAIL
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: smtpEmail,
            pass: smtpPass,
        },
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const alertsSent = [];

    for (const doc of (documents || [])) {
        if (!doc.expiry_date) continue;

        const expiry = new Date(doc.expiry_date);
        expiry.setHours(0, 0, 0, 0);

        const diffTime = expiry.getTime() - today.getTime();
        const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        let shouldAlert = false;
        let alertType = '';

        if (Math.abs(daysLeft - 30) < 1 && doc.alert_30_days) { shouldAlert = true; alertType = '30 Zile'; }
        if (Math.abs(daysLeft - 7) < 1 && doc.alert_7_days) { shouldAlert = true; alertType = '7 Zile'; }
        if (Math.abs(daysLeft - 1) < 1 && doc.alert_1_day) { shouldAlert = true; alertType = '1 Zi'; }
        if (daysLeft <= 0 && daysLeft > -1 && doc.alert_1_day) { shouldAlert = true; alertType = 'EXPIRĂ AZI'; }

        if (shouldAlert && doc.alert_email) {
            console.log(`[CRON ALERT] Trimitere GMAIL pentru ${doc.car_info} la ${doc.alert_email}`);

            try {
                await transporter.sendMail({
                    from: `"Transmarin Platformă" <${smtpEmail}>`,
                    to: doc.alert_email,
                    subject: `⚠️ ALERTĂ: ${doc.car_info} - ${doc.doc_type} (${alertType})`,
                    html: `
                 <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 8px; max-width: 600px;">
                    <h2 style="color: #d32f2f;">⚠️ Documentul VEHICULULUI Expiră!</h2>
                    <p>Salutare,</p>
                    <p>Sistemul a detectat o expirare iminentă pentru:</p>
                    <div style="background: #f9f9f9; padding: 15px; border-left: 5px solid #1976d2; margin: 15px 0;">
                        <p style="margin: 5px 0;"><strong>Vehicul / Șofer:</strong> ${doc.car_info}</p>
                        <p style="margin: 5px 0;"><strong>Tip Document:</strong> ${doc.doc_type}</p>
                        <p style="margin: 5px 0;"><strong>Data Expirării:</strong> ${new Date(doc.expiry_date).toLocaleDateString('ro-RO')}</p>
                        <p style="margin: 5px 0; color: #d32f2f; font-size: 1.1em;"><strong>Timp Rămas: ${daysLeft} zile</strong></p>
                    </div>
                    <p>Vă rugăm să faceți demersurile pentru reînnoire.</p>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                    <p style="font-size: 11px; color: #999;">Acest mesaj este generat automat de Platforma Transmarin Logistic.</p>
                 </div>
               `
                });

                console.log(`[CRON SUCCESS] Email trimis prin Gmail pentru ${doc.car_info}`);
                alertsSent.push({ doc: doc.car_info, type: alertType });
            } catch (err) {
                console.error('[CRON GMAIL ERROR]:', err);
            }
        }
    }

    return NextResponse.json({ success: true, alertsSent, checked: documents?.length });
}
