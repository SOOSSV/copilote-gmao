import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  const { techId, pin } = await req.json();
  if (!techId || !pin || pin.length !== 4) {
    return NextResponse.json({ ok: false, error: 'Données invalides' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('technicians')
    .select('pin, pin_changed')
    .eq('id', techId)
    .single();

  if (error || !data) {
    return NextResponse.json({ ok: false, error: 'Technicien introuvable' }, { status: 404 });
  }

  if (!data.pin) {
    return NextResponse.json({ ok: false, needsPin: true });
  }

  // Support PIN en clair (anciens) et hashé (nouveaux)
  let match = false;
  if (data.pin.startsWith('$2')) {
    match = await bcrypt.compare(pin, data.pin);
  } else {
    match = pin === data.pin;
    // Migration: si correspondance en clair, on hache maintenant
    if (match) {
      const hashed = await bcrypt.hash(pin, 10);
      await supabase.from('technicians').update({ pin: hashed }).eq('id', techId);
    }
  }

  if (!match) {
    return NextResponse.json({ ok: false, error: 'PIN incorrect' });
  }

  return NextResponse.json({ ok: true, pinChanged: data.pin_changed });
}
