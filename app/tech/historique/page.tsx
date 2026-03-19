'use client';

import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { CheckCircle, Calendar, Wrench, TrendingUp, ArrowLeft, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import TypeBadge from '@/components/TypeBadge';

type Ticket = {
  id: string; titre: string; type_intervention: string; priorite: string;
  resolu_le: string | null; created_at: string; duree_intervention_min: number | null;
  machines: { nom: string } | null;
};

type Periode = 'tout' | '3mois' | 'annee';

// Bar chart hebdomadaire 8 semaines — CSS flex, couleur verte
function BarChartWeekly({ tickets }: { tickets: Ticket[] }) {
  const weeks: { label: string; count: number }[] = [];
  const now = new Date();
  for (let i = 7; i >= 0; i--) {
    const debut = new Date(now);
    debut.setDate(debut.getDate() - debut.getDay() - i * 7);
    debut.setHours(0, 0, 0, 0);
    const fin = new Date(debut);
    fin.setDate(fin.getDate() + 7);
    const count = tickets.filter(t => {
      const d = t.resolu_le ? new Date(t.resolu_le) : null;
      return d && d >= debut && d < fin;
    }).length;
    const label = i === 0 ? 'S-0' : `S-${i}`;
    weeks.push({ label, count });
  }
  const maxVal = Math.max(...weeks.map(w => w.count), 1);
  const BAR_MAX_H = 60;

  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 5, height: BAR_MAX_H + 24, width: '100%' }}>
      {weeks.map((w, i) => {
        const h = Math.max(3, Math.round((w.count / maxVal) * BAR_MAX_H));
        return (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
            {w.count > 0 && (
              <span style={{ fontSize: 9, color: '#7d8590', lineHeight: 1 }}>{w.count}</span>
            )}
            <div style={{
              width: '100%', height: h,
              background: `linear-gradient(180deg, #22c55e, #16a34a)`,
              borderRadius: '3px 3px 0 0', opacity: 0.9
            }} />
            <span style={{ fontSize: 9, color: '#7d8590', lineHeight: 1, whiteSpace: 'nowrap' }}>{w.label}</span>
          </div>
        );
      })}
    </div>
  );
}

// Top N machines barres horizontales
function TopMachinesTech({ tickets, maxBars = 3 }: { tickets: Ticket[]; maxBars?: number }) {
  const map = new Map<string, number>();
  tickets.forEach(t => {
    if (t.machines?.nom) map.set(t.machines.nom, (map.get(t.machines.nom) || 0) + 1);
  });
  const sorted = Array.from(map.entries()).sort((a, b) => b[1] - a[1]).slice(0, maxBars);
  const maxVal = sorted.length > 0 ? sorted[0][1] : 1;

  if (sorted.length === 0) {
    return <div style={{ color: '#7d8590', fontSize: 12 }}>Aucune donnée</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%' }}>
      {sorted.map(([nom, count], i) => {
        const pct = Math.max(10, Math.round((count / maxVal) * 100));
        const colors = ['#ef4444', '#f97316', '#f59e0b'];
        const c = colors[i] || '#ef4444';
        return (
          <div key={nom}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 11, color: '#e6edf3', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '75%' }}>{nom}</span>
              <span style={{ fontSize: 11, color: c, fontWeight: 700 }}>{count}</span>
            </div>
            <div style={{ height: 6, background: '#30363d', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg, ${c}, ${c}88)`, borderRadius: 3 }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function TechHistorique() {
  const router = useRouter();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [periode, setPeriode] = useState<Periode>('tout');
  const [techId, setTechId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const id = localStorage.getItem('tech_id');
    if (!id) return;
    setTechId(id);
    load(id);
  }, []);

  async function load(id: string) {
    const { data } = await supabase.from('tickets')
      .select('id, titre, type_intervention, priorite, resolu_le, created_at, duree_intervention_min, machines(nom)')
      .eq('technicien_id', id).eq('statut', 'resolu')
      .order('resolu_le', { ascending: false });
    setTickets((data as unknown as Ticket[]) || []);
    setLoading(false);
  }

  // Filtre période
  const ticketsFiltres = useMemo(() => {
    const now = new Date();
    if (periode === '3mois') {
      const limite = new Date(now); limite.setMonth(limite.getMonth() - 3);
      return tickets.filter(t => t.resolu_le && new Date(t.resolu_le) >= limite);
    }
    if (periode === 'annee') {
      const debut = new Date(now.getFullYear(), 0, 1);
      return tickets.filter(t => t.resolu_le && new Date(t.resolu_le) >= debut);
    }
    return tickets;
  }, [tickets, periode]);

  const now = new Date();
  const debutSemaine = new Date(now); debutSemaine.setDate(now.getDate() - now.getDay());
  const debutMois = new Date(now.getFullYear(), now.getMonth(), 1);

  const cetteSemaine = ticketsFiltres.filter(t => t.resolu_le && new Date(t.resolu_le) >= debutSemaine).length;
  const ceMois = ticketsFiltres.filter(t => t.resolu_le && new Date(t.resolu_le) >= debutMois).length;
  const totalResolus = ticketsFiltres.length;

  // Répartition par type
  const correctif = ticketsFiltres.filter(t => t.type_intervention === 'correctif').length;
  const preventif = ticketsFiltres.filter(t => t.type_intervention === 'preventif').length;
  const amelioratif = ticketsFiltres.filter(t => t.type_intervention === 'amelioratif' || t.type_intervention === 'ameliorative').length;

  const periodeOptions: { value: Periode; label: string }[] = [
    { value: 'tout', label: 'Tout' },
    { value: '3mois', label: '3 derniers mois' },
    { value: 'annee', label: 'Cette année' },
  ];

  return (
    <div className="p-4 tech-page-wrap">
      <div className="flex items-center gap-2 mb-1">
        <button onClick={() => router.back()} className="bg-transparent border-none cursor-pointer text-[#7d8590] p-1 flex items-center">
          <ArrowLeft size={20} />
        </button>
        <TrendingUp size={18} color="#22c55e" />
        <h1 className="text-[20px] font-extrabold m-0">Mes stats</h1>
      </div>

      {/* Select filtre période */}
      <div className="flex items-center gap-3 mb-4 mt-2">
        <span className="text-[12px] text-[#7d8590]">Période :</span>
        <div className="flex gap-1.5">
          {periodeOptions.map(opt => (
            <button
              key={opt.value}
              onClick={() => setPeriode(opt.value)}
              className="px-3 py-1.5 rounded-lg text-[11px] font-semibold cursor-pointer transition-all"
              style={{
                border: `1px solid ${periode === opt.value ? '#22c55e' : '#30363d'}`,
                background: periode === opt.value ? '#22c55e22' : '#1c2128',
                color: periode === opt.value ? '#22c55e' : '#7d8590',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="text-[13px] text-[#7d8590] mb-5">
        {totalResolus} intervention{totalResolus > 1 ? 's' : ''} résolue{totalResolus > 1 ? 's' : ''}
      </div>

      {/* 3 KPI cards */}
      <div className="grid grid-cols-3 gap-2.5 mb-6">
        {[
          { label: 'Cette semaine', value: cetteSemaine, color: '#0ea5e9' },
          { label: 'Ce mois', value: ceMois, color: '#2563eb' },
          { label: 'Total résolus', value: totalResolus, color: '#22c55e' },
        ].map(k => (
          <div
            key={k.label}
            className="bg-[#1c2128] rounded-xl py-3.5 px-3 text-center"
            style={{ border: `1px solid ${k.color}33` }}
          >
            <div className="text-[26px] font-extrabold" style={{ color: k.color }}>{k.value}</div>
            <div className="text-[10px] text-[#7d8590] mt-0.5">{k.label}</div>
          </div>
        ))}
      </div>

      {/* === GRAPHIQUES STATS === */}
      {!loading && totalResolus > 0 && (
        <>
          {/* Bar chart + Top machines — grid responsive */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 14,
            marginBottom: 14,
          }}>
            {/* Bar chart hebdomadaire */}
            <div style={{ background: '#1c2128', border: '1px solid #30363d', borderRadius: 14, padding: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#7d8590', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 12 }}>
                Interventions par semaine (8 sem.)
              </div>
              <BarChartWeekly tickets={ticketsFiltres} />
            </div>

            {/* Top 3 machines */}
            <div style={{ background: '#1c2128', border: '1px solid #30363d', borderRadius: 14, padding: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#7d8590', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 12 }}>
                Top machines
              </div>
              <TopMachinesTech tickets={ticketsFiltres} maxBars={3} />
            </div>
          </div>

          {/* Répartition par type — 3 badges */}
          <div style={{ background: '#1c2128', border: '1px solid #30363d', borderRadius: 14, padding: 16, marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#7d8590', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 12 }}>
              Répartition par type
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {[
                { label: 'Correctif', count: correctif, color: '#ef4444', bg: '#ef444422' },
                { label: 'Préventif', count: preventif, color: '#2563eb', bg: '#2563eb22' },
                { label: 'Amélioratif', count: amelioratif, color: '#7c3aed', bg: '#7c3aed22' },
              ].map(item => (
                <div
                  key={item.label}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    background: item.bg, border: `1px solid ${item.color}44`,
                    borderRadius: 10, padding: '8px 14px', flex: '1 1 auto',
                  }}
                >
                  <span style={{ fontSize: 20, fontWeight: 900, color: item.color, lineHeight: 1 }}>{item.count}</span>
                  <span style={{ fontSize: 12, color: item.color, fontWeight: 600 }}>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {loading ? (
        <div className="text-[#7d8590] text-center py-10">Chargement...</div>
      ) : ticketsFiltres.length === 0 ? (
        <div className="bg-[#1c2128] border border-[#30363d] rounded-[14px] py-10 text-center text-[#7d8590]">
          <CheckCircle size={28} className="opacity-30 mx-auto mb-2.5" />
          <div>Aucune intervention résolue pour l&apos;instant</div>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {ticketsFiltres.map(t => (
            <div key={t.id} className="bg-[#1c2128] border border-[#30363d] rounded-[14px] p-4">
              <div className="flex justify-between items-start mb-2 gap-2">
                <div className="text-[14px] font-bold flex-1">{t.titre}</div>
                <TypeBadge type={t.type_intervention} />
              </div>
              {t.machines && (
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Wrench size={12} color="#7d8590" />
                  <span className="text-[12px] text-[#7d8590]">{t.machines.nom}</span>
                </div>
              )}
              <div className="flex items-center gap-4">
                {t.resolu_le && (
                  <div className="flex items-center gap-1.5">
                    <Calendar size={12} color="#7d8590" />
                    <span className="text-[12px] text-[#7d8590]">
                      {new Date(t.resolu_le).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                  </div>
                )}
                {t.duree_intervention_min && (
                  <div className="flex items-center gap-1.5">
                    <Clock size={12} color="#7d8590" />
                    <span className="text-[12px] text-[#7d8590]">{t.duree_intervention_min} min</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
