import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const maxDuration = 60;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const N8N_CHAT_URL = process.env.N8N_CHAT_URL || '';

function extractJson(text: string) {
  try {
    const first = text.indexOf('{');
    const last = text.lastIndexOf('}');
    if (first !== -1 && last !== -1) return JSON.parse(text.substring(first, last + 1));
  } catch { /* continue */ }
  try {
    const m = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (m) return JSON.parse(m[1].trim());
  } catch { /* continue */ }
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const { machine_id } = await req.json();
    if (!machine_id) return NextResponse.json({ error: 'machine_id requis' }, { status: 400 });

    const { data: machine } = await supabase
      .from('machines')
      .select('nom, type_equipement, localisation')
      .eq('id', machine_id)
      .single();

    if (!machine) return NextResponse.json({ error: 'Machine introuvable' }, { status: 404 });

    // Plans existants pour éviter les doublons
    const { data: existing } = await supabase
      .from('preventive_plans')
      .select('titre')
      .eq('machine_id', machine_id)
      .eq('actif', true);

    const existingTitles = (existing || []).map(p => p.titre).join(', ');

    const prompt = `Tu es un expert GMAO en maintenance industrielle boulangère.

MACHINE :
- Nom : ${machine.nom}
- Type : ${machine.type_equipement}
- Localisation : ${machine.localisation || 'Non renseignée'}

${existingTitles ? `PLANS DÉJÀ EN PLACE (ne pas répéter) : ${existingTitles}` : ''}

Propose 4 opérations de maintenance préventive adaptées à ce type d'équipement.
Réponds UNIQUEMENT en JSON avec ce format exact :
{
  "plans": [
    { "titre": "Nom court de l'opération", "description": "Ce qu'il faut faire concrètement", "frequence_jours": 30 },
    { "titre": "...", "description": "...", "frequence_jours": 90 },
    { "titre": "...", "description": "...", "frequence_jours": 180 },
    { "titre": "...", "description": "...", "frequence_jours": 365 }
  ]
}

Fréquences typiques : 7 (hebdo), 30 (mensuel), 90 (trimestriel), 180 (semestriel), 365 (annuel).`;

    if (!N8N_CHAT_URL) return NextResponse.json({ error: 'N8N_CHAT_URL non configurée sur le serveur' }, { status: 500 });

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 55000);

    let aiRes: Response;
    try {
      aiRes = await fetch(N8N_CHAT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatInput: prompt, sessionId: `preventif-ia-${machine_id}` }),
        signal: controller.signal,
      });
    } catch (fetchErr) {
      clearTimeout(timeout);
      const msg = fetchErr instanceof Error ? fetchErr.message : 'inconnu';
      if (msg.includes('abort') || msg.includes('AbortError')) {
        return NextResponse.json({ error: 'n8n n\'a pas répondu dans les temps (>55s)' }, { status: 504 });
      }
      return NextResponse.json({ error: `Impossible de joindre n8n : ${msg}` }, { status: 502 });
    }
    clearTimeout(timeout);

    if (!aiRes.ok) return NextResponse.json({ error: `n8n erreur ${aiRes.status}` }, { status: 502 });

    const aiData = await aiRes.json();
    const rawOutput = aiData?.output || aiData?.text || aiData?.message || aiData?.response || '';

    if (!rawOutput) return NextResponse.json({ error: 'n8n a renvoyé une réponse vide — vérifiez que le workflow est actif' }, { status: 500 });

    const parsed = extractJson(rawOutput);
    const plans: { titre: string; description: string; frequence_jours: number }[] = parsed?.plans || [];

    if (plans.length === 0) return NextResponse.json({ error: 'Aucune suggestion générée — réessayez' }, { status: 500 });

    return NextResponse.json({ success: true, plans, machine: machine.nom });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
