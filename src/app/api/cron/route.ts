import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkAndSendAlert } from '../../../utils/alerts';

export const dynamic = 'force-dynamic';

export async function GET() {
    console.log('--- [CRON START] Verificare Expirare via GMAIL ---');

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
        return NextResponse.json({ error: 'Supabase credentials missing' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Luăm toate documentele
    const { data: documents, error } = await supabase.from('documents').select('*');

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const alertsSent = [];
    const reports = [];

    for (const doc of (documents || [])) {
        // Folosim logica partajată
        const result = await checkAndSendAlert(doc);

        if (result && result.sent) {
            alertsSent.push(`${doc.car_info} (${result.type})`);
        }

        // Pentru raport (opțional, recalculăm zilele doar pentru display)
        if (doc.expiry_date) {
            const today = new Date();
            const todayUTC = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
            const expiry = new Date(doc.expiry_date);
            const expiryUTC = Date.UTC(expiry.getFullYear(), expiry.getMonth(), expiry.getDate());
            const diffTime = expiryUTC - todayUTC;
            const daysLeft = Math.round(diffTime / (1000 * 60 * 60 * 24));
            reports.push({ car: doc.car_info, days: daysLeft });
        }
    }

    return NextResponse.json({
        status: "Verificare finalizată (Shared Logic)",
        data_azi: new Date().toLocaleDateString(),
        documente_scanate: documents?.length,
        alerte_trimise: alertsSent,
        detalii_zile: reports
    });
}
