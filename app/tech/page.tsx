'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { AlertTriangle, Clock, CheckCircle, Wrench } from 'lucide-react';
import TypeBadge from '@/components/TypeBadge';

type Ticket = {
  id: string;
  titre: string;
  description: string;
  priorite: string;
  statut: string;
  type_intervention: string;
  created_at: string;
  machines: { nom: string; localisation: string } | null;
};

const prioriteColor: Record<string, string> = {
  urgente: '#ef4444', haute: '#f59e0b', normale: '#2563eb', basse: '#22c55e',
};

export default function TechDashboard() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [prenom, setPrenom] = useState('');
  const [filter, setFilter] = useState<'actifs' | 'resolus'>('actifs');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const id = localStorage.getItem('tech_id');
    const nom = localStorage.getItem('tech_prenom') || '';
    setPrenom(nom);
    if (!id) return;
    load(id);
  }, []);

  async function load(id: string) {
    const { data } = await supabase
      .from('tickets')
      .select('id, titre, description, priorite, statut, type_intervention, created_at, machines(nom, localisation)')
      .eq('technicien_id', id)
      .order('created_at', { ascending: false });
    setTickets((data as unknown as Ticket[]) || []);
    setLoading(false);
  }

  const actifs = tickets.filter(t => t.statut !== 'resolu' && t.statut !== 'clos');
  const resolus = tickets.filter(t => t.statut === 'resolu' || t.statut === 'clos');
  const urgents = actifs.filter(t => t.priorite === 'urgente').length;

  const prioriteOrder: Record<string, number> = { urgente: 0, haute: 1, normale: 2, basse: 3 };
  const displayed = [...(filter === 'actifs' ? actifs : resolus)].sort((a, b) =>
    (prioriteOrder[a.priorite] ?? 2) - (prioriteOrder[b.priorite] ?? 2)
  );

  function timeAgo(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const min = Math.floor(diff / 60000);
    if (min < 1) return "à l'instant";
    if (min < 60) return `il y a ${min} min`;
    const h = Math.floor(min / 60);
    if (h < 24) return `il y a ${h}h`;
    const d = Math.floor(h / 24);
    if (d < 7) return `il y a ${d}j`;
    return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
  }

  async function setStatut(e: React.MouseEvent, id: string, statut: string) {
    e.preventDefault();
    e.stopPropagation();
    const update: Record<string, string> = { statut };
    if (statut === 'resolu') update.resolu_le = new Date().toISOString();
    await supabase.from('tickets').update(update).eq('id', id);
    setTickets(prev => prev.map(t => t.id === id ? { ...t, statut } : t));
  }

  return (
    <div style={{ padding: '16px' }}>
      {/* Bonjour */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 2 }}>Bonjour {prenom} 👋</div>
        <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
      </div>

      {/* Alerte urgente */}
      {urgents > 0 && (
        <div style={{ background: '#ef444418', border: '1px solid #ef444433', borderRadius: 12, padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
          <AlertTriangle size={18} color="#ef4444" />
          <span style={{ color: '#ef4444', fontWeight: 700, fontSize: 14 }}>{urgents} ticket{urgents > 1 ? 's' : ''} urgent{urgents > 1 ? 's' : ''} à traiter</span>
        </div>
      )}

      {/* KPI */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 20 }}>
        {[
          { label: 'Ouverts', value: actifs.filter(t => t.statut === 'ouvert').length, color: '#2563eb' },
          { label: 'En cours', value: actifs.filter(t => t.statut === 'en_cours').length, color: '#f59e0b' },
          { label: 'Résolus', value: resolus.length, color: '#22c55e' },
        ].map(k => (
          <div key={k.label} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 12px', textAlign: 'center' }}>
            <div style={{ fontSize: 26, fontWeight: 800, color: k.color }}>{k.value}</div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {(['actifs', 'resolus'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{ flex: 1, padding: '10px', borderRadius: 10, border: '1px solid', borderColor: filter === f ? '#22c55e' : 'var(--border)', background: filter === f ? '#22c55e18' : 'var(--bg-card)', color: filter === f ? '#22c55e' : 'var(--text-secondary)', fontWeight: filter === f ? 700 : 400, fontSize: 13, cursor: 'pointer' }}>
            {f === 'actifs' ? `Actifs (${actifs.length})` : `Résolus (${resolus.length})`}
          </button>
        ))}
      </div>

      {/* Liste */}
      {loading ? (
        <div>
          {[1,2,3].map(i => <div key={i} className="skeleton skeleton-card" />)}
        </div>
      ) : displayed.length === 0 ? (
        <div className="empty-state" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14 }}>
          <div className="empty-state-icon">🔧</div>
          <div className="empty-state-title">{filter === 'actifs' ? 'Aucun ticket actif' : 'Aucun ticket résolu'}</div>
          <div className="empty-state-sub">{filter === 'actifs' ? 'Profite — aucune intervention en attente.' : 'Les tickets résolus apparaîtront ici.'}</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {displayed.map(t => {
            const pc = prioriteColor[t.priorite] || '#2563eb';
            return (
              <Link key={t.id} href={`/tech/tickets/${t.id}`} style={{ background: 'var(--bg-card)', border: `1px solid ${t.priorite === 'urgente' ? '#ef444433' : 'var(--border)'}`, borderRadius: 14, padding: '16px', textDecoration: 'none', display: 'block' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', flex: 1, paddingRight: 8 }}>{t.titre}</div>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    <TypeBadge type={t.type_intervention} />
                    <span style={{ background: `${pc}22`, color: pc, border: `1px solid ${pc}44`, borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{t.priorite}</span>
                  </div>
                </div>
                {t.machines && (
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>
                    🏭 {t.machines.nom} {t.machines.localisation ? `· ${t.machines.localisation}` : ''}
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {t.statut === 'resolu' ? <CheckCircle size={13} color="var(--success)" /> : t.statut === 'en_cours' ? <Clock size={13} color="var(--warning)" /> : <AlertTriangle size={13} color="var(--accent)" />}
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{t.statut === 'en_cours' ? 'En cours' : t.statut === 'resolu' ? 'Résolu' : 'Ouvert'}</span>
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{timeAgo(t.created_at)}</span>
                </div>
                {filter === 'actifs' && (
                  <div style={{ display: 'flex', gap: 8, marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
                    {t.statut === 'ouvert' && (
                      <>
                        <button onClick={e => setStatut(e, t.id, 'en_cours')} style={{ flex: 1, background: 'rgba(37,99,235,0.12)', border: '1px solid rgba(37,99,235,0.3)', borderRadius: 8, padding: '7px 0', color: 'var(--accent)', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                          J'arrive
                        </button>
                        <button onClick={e => setStatut(e, t.id, 'en_cours')} style={{ flex: 1, background: 'rgba(217,119,6,0.12)', border: '1px solid rgba(217,119,6,0.3)', borderRadius: 8, padding: '7px 0', color: 'var(--warning)', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                          Commencer
                        </button>
                      </>
                    )}
                    {t.statut === 'en_cours' && (
                      <button onClick={e => setStatut(e, t.id, 'resolu')} style={{ flex: 1, background: 'rgba(22,163,74,0.12)', border: '1px solid rgba(22,163,74,0.3)', borderRadius: 8, padding: '7px 0', color: 'var(--success)', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                        ✓ Terminé
                      </button>
                    )}
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
