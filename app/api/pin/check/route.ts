import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  const { techId } = await req.json();
  if (!techId) return NextResponse.json({ error: 'Missing techId' }, { status: 400 });

  const { data, error } = await supabase
    .from('technicians')
    .select('pin')
    .eq('id', techId)
    .single();

  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json({ hasPin: !!data.pin });
}
