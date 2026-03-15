'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { AlertTriangle, CheckCircle, Clock, Wrench, TrendingUp, Activity } from 'lucide-react';

type Stats = {
  total: number;
  ouverts: number;
  en_cours: number;
  fermes: number;
  urgents: number;
  machines: number;
  techniciens: number;
};

type TicketRecent = {
  id: string;
  titre: string;
  priorite: string;
  statut: string;
  created_at: string;
  machines: { nom: string } | null;
};

const prioriteColor: Record<string, string> = {
  urgente: '#ef4444',
  haute:   '#f59e0b',
  normale: '#6366f1',
  basse:   '#22c55e',
};

function StatCard({ label, value, icon: Icon, color, sub }: {
  label: string; value: number | string; icon: React.ElementType; color: string; sub?: string;
}) {
  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 14, padding: '20px 22px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>
            {label}
          </div>
          <div style={{ fontSize: 32, fontWeight: 800, color }}>{value}</div>
          {sub && <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>{sub}</div>}
        </div>
        <div style={{
          width: 42, height: 42, borderRadius: 10,
          background: `${color}18`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={20} color={color} />
        </div>
      </div>
    </div>
  );
}

export default function ManagerDashboard() {
  const [stats, setStats] = useState<Stats>({ total: 0, ouverts: 0, en_cours: 0, fermes: 0, urgents: 0, machines: 0, techniciens: 0 });
  const [recents, setRecents] = useState<TicketRecent[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  async function load() {
    const [tickets, machines, techniciens] = await Promise.all([
      supabase.from('tickets').select('statut, priorite'),
      supabase.from('machines').select('id').eq('statut', 'actif'),
      supabase.from('technicians').select('id'),
    ]);

    const t = tickets.data || [];
    setStats({
      total:       t.length,
      ouverts:     t.filter(x => x.statut === 'ouvert').length,
      en_cours:    t.filter(x => x.statut === 'en_cours').length,
      fermes:      t.filter(x => x.statut === 'resolu').length,
      urgents:     t.filter(x => x.priorite === 'urgente').length,
      machines:    machines.data?.length || 0,
      techniciens: techniciens.data?.length || 0,
    });

    const { data: r } = await supabase
      .from('tickets')
      .select('id, titre, priorite, statut, created_at, machines(nom)')
      .order('created_at', { ascending: false })
      .limit(8);
    setRecents((r as unknown as TicketRecent[]) || []);
    setLoading(false);
    setLastRefresh(new Date());
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  }

  const tauxResolution = stats.total > 0 ? Math.round((stats.fermes / stats.total) * 100) : 0;

  return (
    <div className="mgr-dashboard">
      <style>{`
        .mgr-dashboard { padding: 28px 32px; }
        .mgr-grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 28px; }
        .mgr-grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 28px; }
        .mgr-table-wrap { overflow-x: auto; }
        .mgr-header { margin-bottom: 28px; display: flex; justify-content: space-between; align-items: flex-start; }
        @media (max-width: 768px) {
          .mgr-dashboard { padding: 16px; }
          .mgr-grid-4 { grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 16px; }
          .mgr-grid-2 { gap: 10px; margin-bottom: 16px; }
          .mgr-header { flex-direction: column; gap: 10px; }
          .mgr-header h1 { font-size: 18px !important; }
          .mgr-refresh-info { display: none; }
        }
      `}</style>
      {/* Header */}
      <div className="mgr-header">
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Tableau de bord</h1>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="mgr-refresh-info" style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            Mis à jour à {lastRefresh.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
          <button onClick={load} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Activity size={13} /> Rafraîchir
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ color: 'var(--text-secondary)' }}>Chargement...</div>
      ) : (
        <>
          {/* Stats grid */}
          <div className="mgr-grid-4">
            <StatCard label="Tickets ouverts"  value={stats.ouverts}  icon={Clock}         color="#6366f1" />
            <StatCard label="En cours"         value={stats.en_cours} icon={Activity}      color="#f59e0b" />
            <StatCard label="Urgents"          value={stats.urgents}  icon={AlertTriangle} color="#ef4444" />
            <StatCard label="Taux résolution"  value={`${tauxResolution}%`} icon={TrendingUp} color="#22c55e" sub={`${stats.fermes} / ${stats.total} tickets`} />
          </div>

          <div className="mgr-grid-2">
            <StatCard label="Machines actives"  value={stats.machines}    icon={Wrench}       color="#8b5cf6" />
            <StatCard label="Techniciens"        value={stats.techniciens} icon={CheckCircle}  color="#06b6d4" />
          </div>

          {/* Tickets récents */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', fontWeight: 700, fontSize: 14 }}>
              Tickets récents
            </div>
          <div className="mgr-table-wrap">
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 500 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Titre', 'Machine', 'Priorité', 'Statut', 'Date'].map(h => (
                    <th key={h} style={{ padding: '10px 20px', textAlign: 'left', fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recents.map((t, i) => (
                  <tr key={t.id} style={{ borderBottom: i < recents.length - 1 ? '1px solid var(--border)' : 'none', transition: 'background 0.1s' }}>
                    <td style={{ padding: '12px 20px', fontSize: 13, fontWeight: 500, maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.titre}</td>
                    <td style={{ padding: '12px 20px', fontSize: 13, color: 'var(--text-secondary)' }}>{t.machines?.nom || '—'}</td>
                    <td style={{ padding: '12px 20px' }}>
                      <span style={{
                        background: `${prioriteColor[t.priorite]}22`,
                        color: prioriteColor[t.priorite],
                        border: `1px solid ${prioriteColor[t.priorite]}44`,
                        borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 600, textTransform: 'uppercase',
                      }}>{t.priorite}</span>
                    </td>
                    <td style={{ padding: '12px 20px' }}>
                      <span style={{
                        background: t.statut === 'resolu' ? '#22c55e22' : t.statut === 'en_cours' ? '#f59e0b22' : '#6366f122',
                        color: t.statut === 'resolu' ? '#22c55e' : t.statut === 'en_cours' ? '#f59e0b' : '#6366f1',
                        borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 600, textTransform: 'capitalize',
                      }}>{t.statut.replace('_', ' ')}</span>
                    </td>
                    <td style={{ padding: '12px 20px', fontSize: 12, color: 'var(--text-secondary)' }}>{formatDate(t.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </div>
        </>
      )}
    </div>
  );
}
