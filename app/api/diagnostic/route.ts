import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const maxDuration = 60;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const N8N_CHAT_URL = process.env.N8N_CHAT_URL || '';

function extractJson(text: string) {
  // Essai 1 : JSON direct entre accolades
  try {
    const first = text.indexOf('{');
    const last = text.lastIndexOf('}');
    if (first !== -1 && last !== -1) return JSON.parse(text.substring(first, last + 1));
  } catch { /* continue */ }
  // Essai 2 : bloc ```json ... ```
  try {
    const m = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (m) return JSON.parse(m[1].trim());
  } catch { /* continue */ }
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const { ticket_id } = await req.json();
    if (!ticket_id) return NextResponse.json({ error: 'ticket_id requis' }, { status: 400 });

    const { data: ticket, error: ticketErr } = await supabase
      .from('tickets')
      .select('id, titre, description, priorite, statut, type_intervention, classification, machine_id, machines(nom, type_equipement, localisation)')
      .eq('id', ticket_id)
      .single();

    if (ticketErr || !ticket) return NextResponse.json({ error: 'Ticket introuvable' }, { status: 404 });

    const machine = ticket.machines as unknown as { nom: string; type_equipement: string; localisation: string } | null;

    const [{ data: historique }, { data: maintenance }] = await Promise.all([
      supabase.from('tickets').select('titre, statut, classification, created_at')
        .eq('machine_id', ticket.machine_id).neq('id', ticket_id)
        .order('created_at', { ascending: false }).limit(5),
      supabase.from('maintenance_history').select('type_action, description, realise_le')
        .eq('machine_id', ticket.machine_id)
        .order('realise_le', { ascending: false }).limit(5),
    ]);

    const historiqueText = (historique || []).length > 0
      ? (historique || []).map(h => `- [${h.classification}] ${h.titre} (${h.statut}) — ${new Date(h.created_at).toLocaleDateString('fr-FR')}`).join('\n')
      : '- Aucun incident antérieur';

    const maintenanceText = (maintenance || []).length > 0
      ? (maintenance || []).map(m => `- ${m.type_action} : ${m.description || 'sans détail'} (${new Date(m.realise_le).toLocaleDateString('fr-FR')})`).join('\n')
      : '- Aucune maintenance';

    const prompt = `Tu es un expert GMAO en maintenance industrielle boulangère. Analyse ce ticket et réponds UNIQUEMENT en JSON valide, sans texte autour.

TICKET : ${ticket.titre} | ${ticket.classification} | ${ticket.priorite}
DESCRIPTION : ${ticket.description || 'Non renseignée'}
MACHINE : ${machine?.nom || 'Inconnue'} (${machine?.type_equipement || 'type inconnu'})
HISTORIQUE MACHINE : ${historiqueText}
MAINTENANCE : ${maintenanceText}

JSON ATTENDU (respecte exactement ce format) :
{"cause_probable":"texte","actions_recommandees":["action1","action2","action3"],"niveau_urgence":"critique","pieces_probables":["piece1"],"temps_estime":"1h"}

niveau_urgence doit être exactement : critique, élevé, modéré ou faible`;

    if (!N8N_CHAT_URL) return NextResponse.json({ error: 'N8N_CHAT_URL non configurée sur le serveur' }, { status: 500 });

    const aiRes = await fetch(N8N_CHAT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chatInput: prompt, sessionId: `diag-${ticket_id}` }),
    });

    if (!aiRes.ok) return NextResponse.json({ error: `n8n erreur ${aiRes.status}` }, { status: 502 });

    const aiData = await aiRes.json();
    const rawOutput = aiData?.output || aiData?.text || aiData?.message || aiData?.response || '';

    if (!rawOutput) return NextResponse.json({ error: 'n8n a renvoyé une réponse vide — vérifiez que le workflow est actif' }, { status: 500 });

    const parsed = extractJson(rawOutput);

    // Fallback : si le JSON ne parse pas, on structure la réponse brute
    const diagnostic = parsed ?? {
      cause_probable: rawOutput.substring(0, 400),
      actions_recommandees: ['Consulter un technicien spécialisé'],
      niveau_urgence: 'modéré',
      pieces_probables: [],
      temps_estime: 'À évaluer sur place',
    };

    await supabase.from('tickets').update({ diagnostic_ia: JSON.stringify(diagnostic) }).eq('id', ticket_id);
    return NextResponse.json({ success: true, diagnostic });

  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: `Erreur serveur : ${err instanceof Error ? err.message : 'inconnue'}` }, { status: 500 });
  }
}
