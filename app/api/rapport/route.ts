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
    const { type } = await req.json();
    const since = new Date();
    since.setDate(since.getDate() - 30);

    // Collecte des données
    const [{ data: tickets }, { data: history }, { data: stocks }] = await Promise.all([
      supabase.from('tickets')
        .select('titre, priorite, statut, type_intervention, created_at, machines(nom), technicians(prenom, nom)')
        .gte('created_at', since.toISOString())
        .order('created_at', { ascending: false })
        .limit(100),
      supabase.from('maintenance_history')
        .select('type_action, description, pieces_changees, realise_le, machines(nom), tickets(priorite)')
        .gte('realise_le', since.toISOString())
        .order('realise_le', { ascending: false })
        .limit(50),
      supabase.from('stocks')
        .select('nom, quantite_actuelle, seuil_minimum, unite')
        .eq('actif', true)
        .order('nom'),
    ]);

    // Stats tickets
    const total = tickets?.length || 0;
    const resolus = tickets?.filter(t => t.statut === 'resolu').length || 0;
    const urgents = tickets?.filter(t => t.priorite === 'urgente').length || 0;
    const enCours = tickets?.filter(t => t.statut === 'en_cours').length || 0;

    // Pannes par machine
    const parMachine: Record<string, number> = {};
    for (const t of tickets || []) {
      const nom = (t.machines as unknown as { nom: string } | null)?.nom || 'Inconnue';
      parMachine[nom] = (parMachine[nom] || 0) + 1;
    }
    const topMachines = Object.entries(parMachine).sort((a, b) => b[1] - a[1]).slice(0, 5);

    // Pièces consommées
    const parPiece: Record<string, number> = {};
    for (const h of history || []) {
      const pieces = h.pieces_changees as { nom: string; quantite: number }[] | null;
      if (!Array.isArray(pieces)) continue;
      for (const p of pieces) {
        if (p?.nom) parPiece[p.nom] = (parPiece[p.nom] || 0) + (p.quantite || 0);
      }
    }
    const topPieces = Object.entries(parPiece).sort((a, b) => b[1] - a[1]).slice(0, 5);

    // Stocks critiques
    const stocksCritiques = (stocks || []).filter(s => s.quantite_actuelle <= s.seuil_minimum);

    const prompt = `Tu es un expert GMAO (Gestion de Maintenance Assistée par Ordinateur) en boulangerie industrielle.

Voici les données de maintenance des 30 derniers jours :

TICKETS (${total} total) :
- Résolus : ${resolus} / ${total} (${total > 0 ? Math.round(resolus / total * 100) : 0}%)
- En cours : ${enCours}
- Urgents : ${urgents}
- Correctifs : ${tickets?.filter(t => t.type_intervention !== 'preventive').length || 0}
- Préventifs : ${tickets?.filter(t => t.type_intervention === 'preventive').length || 0}

MACHINES LES PLUS EN PANNE :
${topMachines.map(([m, n]) => `- ${m} : ${n} intervention${n > 1 ? 's' : ''}`).join('\n')}

PIÈCES LES PLUS CONSOMMÉES :
${topPieces.length > 0 ? topPieces.map(([p, n]) => `- ${p} : ${n} unités`).join('\n') : '- Aucune donnée'}

STOCKS EN ALERTE (${stocksCritiques.length}) :
${stocksCritiques.slice(0, 5).map(s => `- ${s.nom} : ${s.quantite_actuelle} ${s.unite} (seuil: ${s.seuil_minimum})`).join('\n') || '- Aucun'}

Génère un rapport de maintenance ${type === 'pannes_recurrentes' ? "focalisé sur les pannes récurrentes et leurs causes probables" : type === 'planification_preventive' ? "avec un plan de maintenance préventive pour le prochain mois" : "hebdomadaire synthétique avec bilan et actions prioritaires"}.

Réponds en JSON avec exactement ce format :
{
  "contenu": "Analyse détaillée en français (4-6 paragraphes)",
  "recommandations": ["Action 1 concrète", "Action 2 concrète", "Action 3 concrète", "Action 4 concrète"]
}`;

    // Appel IA via n8n
    const aiRes = await fetch(N8N_CHAT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chatInput: prompt, sessionId: 'rapport-ia' }),
    });
    const aiData = await aiRes.json();
    const rawOutput = aiData?.output || aiData?.text || aiData?.message || aiData?.response || '';

    // Parse JSON depuis la réponse (gère les blocs ```json ... ```)
    let contenu = rawOutput;
    let recommandations: string[] = [];
    try {
      const firstBrace = rawOutput.indexOf('{');
      const lastBrace = rawOutput.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1) {
        const jsonStr = rawOutput.substring(firstBrace, lastBrace + 1);
        const parsed = JSON.parse(jsonStr);
        contenu = parsed.contenu || rawOutput;
        recommandations = parsed.recommandations || [];
      }
    } catch { /* garder rawOutput comme contenu */ }

    // Sauvegarder dans ai_analyses
    const { data: saved, error: insertError } = await supabase.from('ai_analyses').insert({
      type_analyse: type,
      contenu,
      recommandations,
      periode_analysee: `30 derniers jours — ${total} tickets`,
      modele_llm: 'n8n-ai',
    }).select().single();

    if (insertError) {
      console.error('Supabase insert error:', insertError);
      return NextResponse.json({ error: `Erreur sauvegarde : ${insertError.message}` }, { status: 500 });
    }

    return NextResponse.json({ success: true, analyse: saved });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Erreur génération rapport' }, { status: 500 });
  }
}
