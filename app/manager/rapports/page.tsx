'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { BarChart3, Brain, ChevronDown, ChevronUp, Sparkles, RefreshCw } from 'lucide-react';

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

const TYPES = [
  { value: 'rapport_hebdo',            label: 'Rapport hebdomadaire',   desc: 'Bilan 30j + actions prioritaires' },
  { value: 'pannes_recurrentes',       label: 'Analyse des pannes',     desc: 'Pannes récurrentes & causes probables' },
  { value: 'planification_preventive', label: 'Plan préventif',         desc: 'Recommandations maintenance prochain mois' },
];

export default function RapportsPage() {
  const [analyses, setAnalyses] = useState<Analyse[]>([]);
  const [loading, setLoading] = useState(true);
  const [ouvert, setOuvert] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [selectedType, setSelectedType] = useState('rapport_hebdo');

  async function fetchAnalyses() {
    const { data } = await supabase
      .from('ai_analyses')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);
    setAnalyses(data || []);
    if (data && data.length > 0 && !ouvert) setOuvert(data[0].id);
    setLoading(false);
  }

  useEffect(() => { fetchAnalyses(); }, []);

  async function generate() {
    setGenerating(true);
    try {
      const res = await fetch('/api/rapport', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: selectedType }),
      });
      const data = await res.json();
      if (data.analyse) {
        setAnalyses(prev => [data.analyse, ...prev]);
        setOuvert(data.analyse.id);
      }
    } catch { /* silent */ }
    setGenerating(false);
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  return (
    <div style={{ padding: 'clamp(16px, 4vw, 32px)', maxWidth: 820, boxSizing: 'border-box' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <BarChart3 size={22} color="var(--accent)" />
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>Rapports IA</h1>
        </div>
        <button onClick={fetchAnalyses} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '7px 12px', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
          <RefreshCw size={13} /> Actualiser
        </button>
      </div>

      {/* Générateur */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid #6366f133', borderRadius: 14, padding: '20px 24px', marginBottom: 28 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Sparkles size={15} color="#6366f1" /> Générer un nouveau rapport
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 8, marginBottom: 16 }}>
          {TYPES.map(t => (
            <button key={t.value} onClick={() => setSelectedType(t.value)} style={{
              textAlign: 'left', padding: '12px 14px', borderRadius: 10, cursor: 'pointer',
              background: selectedType === t.value ? '#6366f118' : 'var(--bg-primary)',
              border: `1px solid ${selectedType === t.value ? '#6366f166' : 'var(--border)'}`,
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: selectedType === t.value ? '#6366f1' : 'var(--text-primary)', marginBottom: 3 }}>{t.label}</div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{t.desc}</div>
            </button>
          ))}
        </div>
        <button onClick={generate} disabled={generating} style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: generating ? '#6366f177' : '#6366f1',
          color: '#fff', border: 'none', borderRadius: 10,
          padding: '11px 22px', cursor: generating ? 'not-allowed' : 'pointer',
          fontWeight: 700, fontSize: 14,
        }}>
          {generating ? <><RefreshCw size={15} style={{ animation: 'spin 1s linear infinite' }} /> Génération en cours...</> : <><Sparkles size={15} /> Générer le rapport</>}
        </button>
      </div>

      {/* Liste des rapports */}
      {loading ? (
        <div style={{ color: 'var(--text-secondary)' }}>Chargement...</div>
      ) : analyses.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-secondary)' }}>
          <Brain size={48} style={{ marginBottom: 16, opacity: 0.3 }} />
          <div>Aucun rapport généré pour l&apos;instant.</div>
          <div style={{ fontSize: 13, marginTop: 8 }}>Clique sur &quot;Générer le rapport&quot; pour commencer.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {analyses.map(a => {
            const cfg = typeConfig[a.type_analyse] || { label: a.type_analyse, color: '#8b5cf6' };
            const isOpen = ouvert === a.id;
            return (
              <div key={a.id} style={{
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                borderLeft: `3px solid ${cfg.color}`, borderRadius: 12, overflow: 'hidden',
              }}>
                <div onClick={() => setOuvert(isOpen ? null : a.id)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <span style={{ background: `${cfg.color}22`, color: cfg.color, borderRadius: 6, padding: '3px 10px', fontSize: 12, fontWeight: 600 }}>{cfg.label}</span>
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{formatDate(a.created_at)}</span>
                    {a.periode_analysee && <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>· {a.periode_analysee}</span>}
                  </div>
                  {isOpen ? <ChevronUp size={16} color="var(--text-secondary)" /> : <ChevronDown size={16} color="var(--text-secondary)" />}
                </div>

                {isOpen && (
                  <div style={{ borderTop: '1px solid var(--border)', padding: '20px 24px' }}>
                    {a.contenu && (
                      <div style={{ fontSize: 14, lineHeight: 1.8, color: 'var(--text-primary)', whiteSpace: 'pre-wrap', marginBottom: a.recommandations?.length ? 20 : 0 }}>
                        {a.contenu}
                      </div>
                    )}
                    {a.recommandations && a.recommandations.length > 0 && (
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>Recommandations</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {a.recommandations.map((r, i) => (
                            <div key={i} style={{ background: 'var(--bg-secondary)', borderRadius: 8, padding: '10px 14px', fontSize: 13, lineHeight: 1.5, display: 'flex', gap: 10 }}>
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

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
