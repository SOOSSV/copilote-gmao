import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const maxDuration = 60;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const N8N_CHAT_URL = process.env.N8N_CHAT_URL || '';

export async function POST(req: NextRequest) {
  try {
    const { ticket_id } = await req.json();
    if (!ticket_id) return NextResponse.json({ error: 'ticket_id requis' }, { status: 400 });

    // Récupérer le ticket complet avec la machine
    const { data: ticket, error: ticketErr } = await supabase
      .from('tickets')
      .select('id, titre, description, priorite, statut, type_intervention, classification, machine_id, machines(nom, type_equipement, localisation)')
      .eq('id', ticket_id)
      .single();

    if (ticketErr || !ticket) {
      return NextResponse.json({ error: 'Ticket introuvable' }, { status: 404 });
    }

    const machine = ticket.machines as unknown as { nom: string; type_equipement: string; localisation: string } | null;

    // Historique des 5 derniers tickets sur la même machine
    const { data: historique } = machine
      ? await supabase
          .from('tickets')
          .select('titre, description, statut, classification, created_at')
          .eq('machine_id', ticket.machine_id)
          .neq('id', ticket_id)
          .order('created_at', { ascending: false })
          .limit(5)
      : { data: [] };

    // Historique maintenance sur cette machine
    const { data: maintenance } = machine
      ? await supabase
          .from('maintenance_history')
          .select('type_action, description, observations, realise_le')
          .eq('machine_id', ticket.machine_id)
          .order('realise_le', { ascending: false })
          .limit(5)
      : { data: [] };

    const historiqueText = (historique || []).length > 0
      ? (historique || []).map(h => `- [${h.classification}] ${h.titre} (${h.statut}) — ${new Date(h.created_at).toLocaleDateString('fr-FR')}`).join('\n')
      : '- Aucun incident antérieur enregistré';

    const maintenanceText = (maintenance || []).length > 0
      ? (maintenance || []).map(m => `- ${m.type_action} : ${m.description || m.observations || 'sans détail'} (${new Date(m.realise_le).toLocaleDateString('fr-FR')})`).join('\n')
      : '- Aucune maintenance enregistrée';

    const prompt = `Tu es un expert GMAO spécialisé en maintenance industrielle boulangère.

TICKET EN COURS :
- Titre : ${ticket.titre}
- Description : ${ticket.description || 'Non renseignée'}
- Classification : ${ticket.classification}
- Type : ${ticket.type_intervention}
- Priorité : ${ticket.priorite}

MACHINE CONCERNÉE :
- Nom : ${machine?.nom || 'Inconnue'}
- Type : ${machine?.type_equipement || 'Non renseigné'}
- Localisation : ${machine?.localisation || 'Non renseignée'}

HISTORIQUE DES INCIDENTS SUR CETTE MACHINE (5 derniers) :
${historiqueText}

HISTORIQUE MAINTENANCE (5 dernières) :
${maintenanceText}

Analyse ce ticket et réponds UNIQUEMENT en JSON avec ce format exact :
{
  "cause_probable": "Explication concise de la cause probable (2-3 phrases max)",
  "actions_recommandees": ["Action 1 précise et actionnable", "Action 2", "Action 3"],
  "niveau_urgence": "critique|élevé|modéré|faible",
  "pieces_probables": ["Pièce ou composant 1", "Pièce 2"],
  "temps_estime": "Estimation du temps d'intervention"
}`;

    // Appel IA via n8n
    const aiRes = await fetch(N8N_CHAT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chatInput: prompt, sessionId: `diag-${ticket_id}` }),
    });

    if (!aiRes.ok) {
      return NextResponse.json({ error: 'Erreur appel IA' }, { status: 502 });
    }

    const aiData = await aiRes.json();
    const rawOutput = aiData?.output || aiData?.text || aiData?.message || aiData?.response || '';

    // Extraire le JSON
    let diagnostic: {
      cause_probable: string;
      actions_recommandees: string[];
      niveau_urgence: string;
      pieces_probables: string[];
      temps_estime: string;
    } | null = null;

    try {
      const firstBrace = rawOutput.indexOf('{');
      const lastBrace = rawOutput.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1) {
        diagnostic = JSON.parse(rawOutput.substring(firstBrace, lastBrace + 1));
      }
    } catch { /* parsing failed */ }

    if (!diagnostic) {
      return NextResponse.json({ error: 'Réponse IA invalide', raw: rawOutput }, { status: 500 });
    }

    // Sauvegarder dans la colonne diagnostic_ia du ticket
    const diagnosticJson = JSON.stringify(diagnostic);
    await supabase.from('tickets').update({ diagnostic_ia: diagnosticJson }).eq('id', ticket_id);

    return NextResponse.json({ success: true, diagnostic });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
