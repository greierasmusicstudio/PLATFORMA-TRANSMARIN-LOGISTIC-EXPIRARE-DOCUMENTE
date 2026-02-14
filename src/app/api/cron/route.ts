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
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Configurare Nodemailer
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: smtpEmail,
            pass: smtpPass,
        },
    });

    const today = new Date();
    // Resetăm Today la miezul nopții UTC pentru comparație curată
    const todayUTC = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());

    const reports = [];
    const alertsSent = [];

    for (const doc of (documents || [])) {
        if (!doc.expiry_date) continue;

        const expiry = new Date(doc.expiry_date);
        // Resetăm Expiry la miezul nopții UTC
        const expiryUTC = Date.UTC(expiry.getFullYear(), expiry.getMonth(), expiry.getDate());

        // Calculăm diferența exactă în zile
        const diffTime = expiryUTC - todayUTC;
        const daysLeft = Math.round(diffTime / (1000 * 60 * 60 * 24));

        let shouldAlert = false;
        let alertType = '';

        if (daysLeft === 30 && doc.alert_30_days) { shouldAlert = true; alertType = '30 Zile'; }
        if (daysLeft === 7 && doc.alert_7_days) { shouldAlert = true; alertType = '7 Zile'; }
        if (daysLeft === 1 && doc.alert_1_day) { shouldAlert = true; alertType = '1 Zi (Mâine)'; }
        if (daysLeft === 0 && doc.alert_1_day) { shouldAlert = true; alertType = 'AZI'; }

        reports.push({ car: doc.car_info, days: daysLeft, alert: shouldAlert });

        if (shouldAlert && doc.alert_email) {
            try {
                await transporter.sendMail({
                    from: `"Transmarin Platformă" <${smtpEmail}>`,
                    to: doc.alert_email,
                    subject: `⚠️ ALERTĂ EXPIRARE: ${doc.car_info} (${alertType})`,
                    html: `
                 <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
                    <h2 style="color: #d32f2f;">⚠️ Documentul VEHICULULUI Expiră!</h2>
                    <p>Vehicul / Șofer: <strong>${doc.car_info}</strong></p>
                    <p>Tip Document: <strong>${doc.doc_type}</strong></p>
                    <p>Timp Rămas: <strong style="color: #d32f2f; font-size: 1.2em;">${alertType === 'AZI' ? 'EXPIRĂ AZI!' : daysLeft + ' zile'}</strong></p>
                    <p>Data: ${new Date(doc.expiry_date).toLocaleDateString('ro-RO')}</p>
                 </div>
               `
                });
                alertsSent.push(`${doc.car_info} (${alertType})`);
            } catch (err: any) {
                console.error('Err:', err);
            }
        }
    }

    return NextResponse.json({
        status: "Verificare finalizată",
        data_azi: new Date().toLocaleDateString(),
        documente_scanate: documents?.length,
        alerte_trimise: alertsSent,
        detalii_zile: reports
    });
}
