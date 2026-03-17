import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { machine_id, titre, description, frequence_jours, prochaine_exec, technicien_id } = body;

    if (!machine_id || !titre || !prochaine_exec) {
      return NextResponse.json({ error: 'Champs obligatoires manquants' }, { status: 400 });
    }

    const { data, error } = await supabase.rpc('create_preventive_plan', {
      p_machine_id: machine_id,
      p_titre: titre.trim(),
      p_description: description?.trim() || null,
      p_frequence_jours: parseInt(frequence_jours) || 30,
      p_prochaine_exec: prochaine_exec,
      p_technicien_id: technicien_id || null,
    });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true, id: data });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Erreur serveur' }, { status: 500 });
  }
}
