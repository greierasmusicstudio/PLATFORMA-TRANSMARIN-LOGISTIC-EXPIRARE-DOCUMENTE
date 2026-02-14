import nodemailer from 'nodemailer';

// Configurare Email Transporter (Gmail SMTP)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.SMTP_EMAIL || 'cumpara24@gmail.com',
        pass: process.env.SMTP_PASSWORD || 'cxhvirwqxpawwsvz',
    },
});

interface Document {
    car_info: string;
    doc_type: string;
    expiry_date: string;
    alert_email: string;
    alert_30_days: boolean;
    alert_7_days: boolean;
    alert_1_day: boolean;
}

export async function checkAndSendAlert(doc: Document, forceCheck: boolean = false) {
    if (!doc.expiry_date || !doc.alert_email) return null;

    const today = new Date();
    const todayUTC = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());

    const expiry = new Date(doc.expiry_date);
    const expiryUTC = Date.UTC(expiry.getFullYear(), expiry.getMonth(), expiry.getDate());

    // Calculăm diferența exactă în zile (ignorând orele)
    const diffTime = expiryUTC - todayUTC;
    const daysLeft = Math.round(diffTime / (1000 * 60 * 60 * 24));

    let shouldAlert = false;
    let alertType = '';

    // Logica de alertare
    // Dacă forceCheck e true (ex: la salvare), trimitem ALERTA dacă se încadrează în interval
    // Altfel, trimitem doar dacă e FIX în ziua de alertă (pentru cron job)

    if (daysLeft === 30 && doc.alert_30_days) { shouldAlert = true; alertType = '30 Zile'; }
    else if (daysLeft === 7 && doc.alert_7_days) { shouldAlert = true; alertType = '7 Zile'; }
    else if (daysLeft === 1 && doc.alert_1_day) { shouldAlert = true; alertType = '1 Zi (Mâine)'; }
    else if (daysLeft === 0 && doc.alert_1_day) { shouldAlert = true; alertType = 'AZI'; }

    // Pentru check-ul manual (la salvare), fiindcă utilizatorul abia a creat documentul,
    // vrem să îi confirmăm că alerta e setată corect.
    // Dar dacă documentul expiră într-o zi (și alerta e bifată), trimitem mail.

    // Dacă forceCheck e activat, verificăm intervale mai largi?
    // Nu, păstrăm logica strictă pentru a evita spam-ul la fiecare editare.
    // Dar utilizatorul vrea să testeze ACUM.
    // Deci dacă daysLeft = 1 și e bifat, trimitem.

    if (shouldAlert) {
        console.log(`[ALERT] Trimitere email pentru ${doc.car_info} (${alertType})`);
        try {
            await transporter.sendMail({
                from: `"Transmarin Platformă" <${process.env.SMTP_EMAIL || 'cumpara24@gmail.com'}>`,
                to: doc.alert_email,
                subject: `⚠️ ALERTĂ IMEDIATĂ: ${doc.car_info} (${alertType})`,
                html: `
                 <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
                    <h2 style="color: #d32f2f;">⚠️ Notificare Automată</h2>
                    <p>Salut,</p>
                    <p>Ați salvat/actualizat un document care necesită atenție:</p>
                    <div style="background: #fff3e0; padding: 15px; border-left: 5px solid #ff9800; margin: 15px 0;">
                        <p><strong>Vehicul / Șofer:</strong> ${doc.car_info}</p>
                        <p><strong>Tip Document:</strong> ${doc.doc_type}</p>
                        <p><strong>Status:</strong> <span style="color: #d32f2f; font-weight: bold;">${alertType === 'AZI' ? 'EXPIRĂ AZI' : 'Expiră în ' + daysLeft + ' zile'}</span></p>
                        <p><strong>Data Expirării:</strong> ${new Date(doc.expiry_date).toLocaleDateString('ro-RO')}</p>
                    </div>
                 </div>
               `
            });
            return { sent: true, type: alertType };
        } catch (error) {
            console.error('Error sending email:', error);
            return { sent: false, error };
        }
    }

    return null;
}
