'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { BarChart3, Brain, ChevronDown, ChevronUp } from 'lucide-react';

type Analyse = {
  id: string;
  type_analyse: string;
  contenu: string;
  recommandations: string[];
  periode_analysee: string;
  modele_llm: string;
  created_at: string;
};

const typeConfig: Record<string, { label: string; color: string }> = {
  pannes_recurrentes:       { label: 'Analyse Pannes',       color: '#ef4444' },
  planification_preventive: { label: 'Plan Préventif',       color: '#6366f1' },
  rapport_hebdo:            { label: 'Rapport Hebdomadaire', color: '#22c55e' },
};

export default function RapportsPage() {
  const [analyses, setAnalyses] = useState<Analyse[]>([]);
  const [loading, setLoading] = useState(true);
  const [ouvert, setOuvert] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from('ai_analyses')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20)
      .then(({ data }) => {
        setAnalyses(data || []);
        if (data && data.length > 0) setOuvert(data[0].id);
        setLoading(false);
      });
  }, []);

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
  }

  return (
    <div style={{ padding: '28px 32px', maxWidth: 800 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
        <BarChart3 size={22} color="var(--accent)" />
        <h1 style={{ fontSize: 22, fontWeight: 800 }}>Rapports IA</h1>
      </div>

      {loading ? (
        <div style={{ color: 'var(--text-secondary)' }}>Chargement...</div>
      ) : analyses.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 80, color: 'var(--text-secondary)' }}>
          <Brain size={48} style={{ marginBottom: 16, opacity: 0.3 }} />
          <div>Aucun rapport généré pour l'instant.</div>
          <div style={{ fontSize: 13, marginTop: 8 }}>Les rapports sont créés automatiquement par les workflows n8n.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {analyses.map(a => {
            const cfg = typeConfig[a.type_analyse] || { label: a.type_analyse, color: '#8b5cf6' };
            const isOpen = ouvert === a.id;
            return (
              <div key={a.id} style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderLeft: `3px solid ${cfg.color}`,
                borderRadius: 12,
                overflow: 'hidden',
              }}>
                {/* En-tête cliquable */}
                <div
                  onClick={() => setOuvert(isOpen ? null : a.id)}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{
                      background: `${cfg.color}22`, color: cfg.color,
                      borderRadius: 6, padding: '3px 10px', fontSize: 12, fontWeight: 600,
                    }}>{cfg.label}</span>
                    <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{formatDate(a.created_at)}</span>
                    {a.periode_analysee && (
                      <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>— {a.periode_analysee}</span>
                    )}
                  </div>
                  {isOpen ? <ChevronUp size={16} color="var(--text-secondary)" /> : <ChevronDown size={16} color="var(--text-secondary)" />}
                </div>

                {/* Contenu dépliable */}
                {isOpen && (
                  <div style={{ borderTop: '1px solid var(--border)', padding: '20px' }}>
                    {a.contenu && (
                      <div style={{
                        fontSize: 14, lineHeight: 1.7, color: 'var(--text-primary)',
                        whiteSpace: 'pre-wrap', marginBottom: a.recommandations?.length ? 20 : 0,
                      }}>
                        {a.contenu}
                      </div>
                    )}

                    {a.recommandations && a.recommandations.length > 0 && (
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>
                          Recommandations
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {a.recommandations.map((r, i) => (
                            <div key={i} style={{
                              background: 'var(--bg-secondary)', borderRadius: 8,
                              padding: '10px 14px', fontSize: 13, lineHeight: 1.5,
                              display: 'flex', gap: 10,
                            }}>
                              <span style={{ color: cfg.color, fontWeight: 700, flexShrink: 0 }}>{i + 1}.</span>
                              {r}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
