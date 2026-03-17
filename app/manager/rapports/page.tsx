'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { BarChart3, Brain, ChevronDown, ChevronUp, Sparkles, RefreshCw, Trash2, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

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
  planification_preventive: { label: 'Plan Préventif',       color: '#2563eb' },
  rapport_hebdo:            { label: 'Rapport Hebdomadaire', color: '#22c55e' },
};

const TYPES = [
  { value: 'rapport_hebdo',            label: 'Rapport hebdomadaire',   desc: 'Bilan 30j + actions prioritaires' },
  { value: 'pannes_recurrentes',       label: 'Analyse des pannes',     desc: 'Pannes récurrentes & causes probables' },
  { value: 'planification_preventive', label: 'Plan préventif',         desc: 'Recommandations maintenance prochain mois' },
];

export default function RapportsPage() {
  const router = useRouter();
  const [analyses, setAnalyses] = useState<Analyse[]>([]);
  const [loading, setLoading] = useState(true);
  const [ouvert, setOuvert] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [selectedType, setSelectedType] = useState('rapport_hebdo');
  const [error, setError] = useState('');

  async function deleteAnalyse(id: string) {
    if (!confirm('Supprimer ce rapport ?')) return;
    await supabase.from('ai_analyses').delete().eq('id', id);
    setAnalyses(prev => prev.filter(a => a.id !== id));
    if (ouvert === id) setOuvert(null);
  }

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
    setError('');
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
      } else {
        setError(data.error || 'Erreur inconnue');
      }
    } catch (e) {
      setError('Erreur de connexion');
    }
    setGenerating(false);
  }

  function renderContenu(text: string, color: string) {
    if (!text) return null;
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];
    let i = 0;
    for (const line of lines) {
      const t = line.trim();
      if (!t) { elements.push(<div key={i} style={{ height: 6 }} />); i++; continue; }
      if (t.startsWith('**') && t.endsWith('**') && t.length > 4) {
        elements.push(<div key={i} style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)', marginTop: 10 }}>{t.replace(/\*\*/g, '')}</div>);
      } else if (t.startsWith('#')) {
        elements.push(<div key={i} style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)', marginTop: 10 }}>{t.replace(/^#+\s*/, '')}</div>);
      } else if (t.startsWith('- ') || t.startsWith('• ')) {
        elements.push(<div key={i} style={{ display: 'flex', gap: 8, paddingLeft: 4, padding: '2px 0' }}>
          <span style={{ color, flexShrink: 0, fontWeight: 700 }}>•</span>
          <span style={{ fontSize: 13, lineHeight: 1.55 }}>{t.slice(2)}</span>
        </div>);
      } else {
        const numMatch = t.match(/^(\d+)[.)]\s+(.+)/);
        if (numMatch) {
          elements.push(<div key={i} style={{ display: 'flex', gap: 8, paddingLeft: 4, padding: '2px 0' }}>
            <span style={{ color, fontWeight: 700, flexShrink: 0, minWidth: 18, fontSize: 13 }}>{numMatch[1]}.</span>
            <span style={{ fontSize: 13, lineHeight: 1.55 }}>{numMatch[2]}</span>
          </div>);
        } else {
          elements.push(<div key={i} style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--text-secondary)', padding: '1px 0' }}>{t}</div>);
        }
      }
      i++;
    }
    return <div style={{ display: 'flex', flexDirection: 'column' }}>{elements}</div>;
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  return (
    <div style={{ padding: '14px', maxWidth: '100%', boxSizing: 'border-box', overflowX: 'hidden' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: 4, display: 'flex', alignItems: 'center' }}><ArrowLeft size={20} /></button>
          <BarChart3 size={22} color="var(--accent)" />
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>Rapports IA</h1>
        </div>
        <button onClick={fetchAnalyses} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '7px 12px', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
          <RefreshCw size={13} /> Actualiser
        </button>
      </div>

      {/* Générateur */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid #2563eb33', borderRadius: 14, padding: '14px', marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Sparkles size={15} color="#2563eb" /> Générer un nouveau rapport
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 8, marginBottom: 16 }}>
          {TYPES.map(t => (
            <button key={t.value} onClick={() => setSelectedType(t.value)} style={{
              textAlign: 'left', padding: '12px 14px', borderRadius: 10, cursor: 'pointer',
              background: selectedType === t.value ? '#2563eb18' : 'var(--bg-primary)',
              border: `1px solid ${selectedType === t.value ? '#2563eb66' : 'var(--border)'}`,
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: selectedType === t.value ? '#2563eb' : 'var(--text-primary)', marginBottom: 3 }}>{t.label}</div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{t.desc}</div>
            </button>
          ))}
        </div>
        {error && <div style={{ background: '#ef444418', border: '1px solid #ef444433', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#ef4444', marginBottom: 12 }}>⚠️ {error}</div>}
        <button onClick={generate} disabled={generating} style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: generating ? '#2563eb77' : '#2563eb',
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
            const cfg = typeConfig[a.type_analyse] || { label: a.type_analyse, color: '#7c3aed' };
            const isOpen = ouvert === a.id;
            return (
              <div key={a.id} style={{
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                borderLeft: `3px solid ${cfg.color}`, borderRadius: 12, overflow: 'hidden',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px' }}>
                <div onClick={() => setOuvert(isOpen ? null : a.id)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flex: 1, cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <span style={{ background: `${cfg.color}22`, color: cfg.color, borderRadius: 6, padding: '3px 10px', fontSize: 12, fontWeight: 600 }}>{cfg.label}</span>
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{formatDate(a.created_at)}</span>
                    {a.periode_analysee && <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>· {a.periode_analysee}</span>}
                  </div>
                  {isOpen ? <ChevronUp size={16} color="var(--text-secondary)" /> : <ChevronDown size={16} color="var(--text-secondary)" />}
                </div>
                <button onClick={() => deleteAnalyse(a.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '4px', marginLeft: 8, flexShrink: 0 }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}>
                  <Trash2 size={14} />
                </button>
                </div>

                {isOpen && (
                  <div style={{ borderTop: '1px solid var(--border)', padding: '14px' }}>
                    {a.contenu && (
                      <div style={{ marginBottom: a.recommandations?.length ? 16 : 0, wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                        {renderContenu(a.contenu, cfg.color)}
                      </div>
                    )}
                    {a.recommandations && a.recommandations.length > 0 && (
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Recommandations</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
                          {a.recommandations.map((r, i) => (
                            <div key={i} style={{ background: 'var(--bg-secondary)', borderRadius: 8, padding: '10px 12px', fontSize: 13, lineHeight: 1.5, display: 'flex', gap: 8, wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                              <span style={{ color: cfg.color, fontWeight: 700, flexShrink: 0 }}>{i + 1}.</span>
                              {r}
                            </div>
                          ))}
                        </div>
                        <button style={{ display: 'flex', alignItems: 'center', gap: 8, background: `${cfg.color}18`, border: `1px solid ${cfg.color}44`, borderRadius: 8, padding: '10px 16px', color: cfg.color, fontSize: 13, fontWeight: 700, cursor: 'pointer', width: '100%', justifyContent: 'center' }}>
                          ✓ Appliquer les recommandations
                        </button>
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
