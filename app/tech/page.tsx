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
    <div className="p-4 tech-page-wrap">
      {/* Bonjour */}
      <div className="mb-5">
        <div className="text-[20px] font-extrabold mb-0.5">Bonjour {prenom} 👋</div>
        <div className="text-[13px] text-[#7d8590]">{new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
      </div>

      {/* Alerte urgente */}
      {urgents > 0 && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-4 flex items-center gap-2.5">
          <AlertTriangle size={18} color="#ef4444" />
          <span className="text-red-500 font-bold text-[14px]">{urgents} ticket{urgents > 1 ? 's' : ''} urgent{urgents > 1 ? 's' : ''} à traiter</span>
        </div>
      )}

      {/* KPI */}
      <div className="grid grid-cols-3 gap-2.5 mb-5">
        {[
          { label: 'Ouverts', value: actifs.filter(t => t.statut === 'ouvert').length, color: '#2563eb' },
          { label: 'En cours', value: actifs.filter(t => t.statut === 'en_cours').length, color: '#f59e0b' },
          { label: 'Résolus', value: resolus.length, color: '#22c55e' },
        ].map(k => (
          <div key={k.label} className="bg-[#1c2128] border border-[#30363d] rounded-xl py-3.5 px-3 text-center">
            <div className="text-[26px] font-extrabold" style={{ color: k.color }}>{k.value}</div>
            <div className="text-[11px] text-[#7d8590] mt-0.5">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        {(['actifs', 'resolus'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex-1 py-2.5 rounded-[10px] border text-[13px] cursor-pointer transition-all ${filter === f ? 'border-green-500 bg-green-500/10 text-green-500 font-bold' : 'border-[#30363d] bg-[#1c2128] text-[#7d8590] font-normal'}`}
          >
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
        <div className="empty-state bg-[#1c2128] border border-[#30363d] rounded-[14px]">
          <div className="empty-state-icon">🔧</div>
          <div className="empty-state-title">{filter === 'actifs' ? 'Aucun ticket actif' : 'Aucun ticket résolu'}</div>
          <div className="empty-state-sub">{filter === 'actifs' ? 'Profite — aucune intervention en attente.' : 'Les tickets résolus apparaîtront ici.'}</div>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {displayed.map(t => {
            const pc = prioriteColor[t.priorite] || '#2563eb';
            return (
              <Link
                key={t.id}
                href={`/tech/tickets/${t.id}`}
                className="block rounded-[14px] p-4 no-underline"
                style={{ background: 'var(--bg-card)', border: `1px solid ${t.priorite === 'urgente' ? '#ef444433' : 'var(--border)'}` }}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="text-[14px] font-bold text-[#e6edf3] flex-1 pr-2">{t.titre}</div>
                  <div className="flex gap-1 flex-wrap justify-end">
                    <TypeBadge type={t.type_intervention} />
                    <span
                      className="rounded-md px-2 py-0.5 text-[11px] font-bold uppercase whitespace-nowrap"
                      style={{ background: `${pc}22`, color: pc, border: `1px solid ${pc}44` }}
                    >
                      {t.priorite}
                    </span>
                  </div>
                </div>
                {t.machines && (
                  <div className="text-[12px] text-[#7d8590] mb-2">
                    🏭 {t.machines.nom} {t.machines.localisation ? `· ${t.machines.localisation}` : ''}
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-1.5">
                    {t.statut === 'resolu' ? <CheckCircle size={13} color="var(--success)" /> : t.statut === 'en_cours' ? <Clock size={13} color="var(--warning)" /> : <AlertTriangle size={13} color="var(--accent)" />}
                    <span className="text-[12px] text-[#7d8590]">{t.statut === 'en_cours' ? 'En cours' : t.statut === 'resolu' ? 'Résolu' : 'Ouvert'}</span>
                  </div>
                  <span className="text-[11px] text-[#7d8590]">{timeAgo(t.created_at)}</span>
                </div>
                {filter === 'actifs' && (
                  <div className="flex gap-2 mt-2.5 pt-2.5 border-t border-[#30363d]">
                    {t.statut === 'ouvert' && (
                      <>
                        <button
                          onClick={e => setStatut(e, t.id, 'en_cours')}
                          className="flex-1 bg-blue-500/10 border border-blue-500/30 rounded-lg py-1.5 text-blue-500 text-[12px] font-bold cursor-pointer"
                        >
                          J&apos;arrive
                        </button>
                        <button
                          onClick={e => setStatut(e, t.id, 'en_cours')}
                          className="flex-1 bg-amber-500/10 border border-amber-500/30 rounded-lg py-1.5 text-amber-500 text-[12px] font-bold cursor-pointer"
                        >
                          Commencer
                        </button>
                      </>
                    )}
                    {t.statut === 'en_cours' && (
                      <button
                        onClick={e => setStatut(e, t.id, 'resolu')}
                        className="flex-1 bg-green-500/10 border border-green-500/30 rounded-lg py-1.5 text-green-500 text-[12px] font-bold cursor-pointer"
                      >
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
