import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    console.log('--- [API] GET /api/documents STARTED ---');

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    console.log('[API] Env Check:', {
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseKey,
        urlPrefix: supabaseUrl ? supabaseUrl.substring(0, 15) : 'N/A'
    });

    if (!supabaseUrl || !supabaseKey) {
        console.error('[API] CRITICAL: Supabase credentials missing');
        return NextResponse.json({ error: 'Supabase credentials missing on server. Check Vercel Environment Variables.' }, { status: 500 });
    }

    try {
        const supabase = createClient(supabaseUrl, supabaseKey);
        console.log('[API] Supabase client created. Fetching data...');

        const { data, error } = await supabase
            .from('documents')
            .select('*')
            .order('expiry_date', { ascending: true });

        if (error) {
            console.error('[API] Supabase Query Error:', error);
            return NextResponse.json({ error: error.message, details: error }, { status: 500 });
        }

        console.log(`[API] Success! Fetched ${data?.length} rows.`);
        return NextResponse.json(data);
    } catch (err: any) {
        console.error('[API] Unexpected Server Error:', err);
        return NextResponse.json({ error: err.message || 'Unknown Server Error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    console.log('--- [API] POST /api/documents STARTED ---');
    try {
        const body = await request.json();

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

        if (!supabaseUrl || !supabaseKey) {
            return NextResponse.json({ error: 'Server Missing Credentials' }, { status: 500 });
        }

        const supabase = createClient(supabaseUrl, supabaseKey);

        const { data, error } = await supabase.from('documents').insert(body).select();

        if (error) {
            console.error('[API] Insert Error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }
        return NextResponse.json(data);
    } catch (err: any) {
        console.error('[API] Insert Exception:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    console.log('--- [API] DELETE /api/documents STARTED ---');
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    if (!supabaseUrl || !supabaseKey) {
        return NextResponse.json({ error: 'Server Missing Credentials' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { error } = await supabase.from('documents').delete().eq('id', id);

    if (error) {
        console.error('[API] Delete Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true });
}

export async function PUT(request: Request) {
    console.log('--- [API] PUT /api/documents STARTED ---');
    try {
        const body = await request.json();
        const { id, ...updates } = body;

        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

        if (!supabaseUrl || !supabaseKey) {
            return NextResponse.json({ error: 'Server Missing Credentials' }, { status: 500 });
        }

        const supabase = createClient(supabaseUrl, supabaseKey);

        const { error } = await supabase.from('documents').update(updates).eq('id', id);

        if (error) {
            console.error('[API] Update Error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }
        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error('[API] Update Exception:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
