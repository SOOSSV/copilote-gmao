'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { AlertTriangle, CheckCircle, Clock, Wrench, TrendingUp, Activity, Ticket, Factory, Users, BarChart3, MessageCircle, PlusCircle, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';

type Stats = {
  total: number; ouverts: number; en_cours: number; fermes: number;
  urgents: number; machines: number; techniciens: number;
};

type TicketRecent = {
  id: string; titre: string; priorite: string; statut: string;
  created_at: string; machines: { nom: string } | null;
};

const prioriteColor: Record<string, string> = {
  urgente: '#ef4444', haute: '#f59e0b', normale: '#6366f1', basse: '#22c55e',
};

function StatCard({ label, value, icon: Icon, color, sub }: {
  label: string; value: number | string; icon: React.ElementType; color: string; sub?: string;
}) {
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: '20px 22px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>{label}</div>
          <div style={{ fontSize: 32, fontWeight: 800, color }}>{value}</div>
          {sub && <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>{sub}</div>}
        </div>
        <div style={{ width: 42, height: 42, borderRadius: 10, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={20} color={color} />
        </div>
      </div>
    </div>
  );
}

export default function ManagerDashboard() {
  const router = useRouter();
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
      total: t.length, ouverts: t.filter(x => x.statut === 'ouvert').length,
      en_cours: t.filter(x => x.statut === 'en_cours').length,
      fermes: t.filter(x => x.statut === 'resolu').length,
      urgents: t.filter(x => x.priorite === 'urgente').length,
      machines: machines.data?.length || 0,
      techniciens: techniciens.data?.length || 0,
    });
    const { data: r } = await supabase.from('tickets')
      .select('id, titre, priorite, statut, created_at, machines(nom)')
      .order('created_at', { ascending: false }).limit(8);
    setRecents((r as unknown as TicketRecent[]) || []);
    setLoading(false);
    setLastRefresh(new Date());
  }

  useEffect(() => { load(); const i = setInterval(load, 30000); return () => clearInterval(i); }, []);

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  }

  function handleLogout() {
    sessionStorage.removeItem('manager_auth');
    router.replace('/manager/login');
  }

  const tauxResolution = stats.total > 0 ? Math.round((stats.fermes / stats.total) * 100) : 0;

  const menuCards = [
    { href: '/manager/dashboard', icon: BarChart3,    label: 'Tableau de bord', color: '#6366f1', badge: stats.urgents > 0 ? `${stats.urgents} urgents` : null, badgeColor: '#ef4444' },
    { href: '/manager/tickets',   icon: Ticket,        label: 'Tickets',         color: '#f59e0b', badge: stats.ouverts > 0 ? `${stats.ouverts} ouverts` : null, badgeColor: '#f59e0b' },
    { href: '/manager/machines',  icon: Factory,       label: 'Machines',        color: '#8b5cf6', badge: null, badgeColor: '' },
    { href: '/manager/techniciens', icon: Users,       label: 'Techniciens',     color: '#06b6d4', badge: `${stats.techniciens}`, badgeColor: '#06b6d4' },
    { href: '/manager/rapports',  icon: BarChart3,     label: 'Rapports IA',     color: '#22c55e', badge: null, badgeColor: '' },
    { href: '/manager/chat',      icon: MessageCircle, label: 'Chat IA',         color: '#a855f7', badge: null, badgeColor: '' },
    { href: '/manager/nouveau',   icon: PlusCircle,    label: 'Nouveau ticket',  color: '#10b981', badge: null, badgeColor: '' },
  ];

  return (
    <>
      {/* ===== VUE MOBILE : Menu cartes ===== */}
      <div className="mgr-mobile-home">
        <div style={{ padding: '24px 16px 100px' }}>
          {/* Header */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 22, fontWeight: 800, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: 2 }}>COPILOTE</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Espace Manager · {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
          </div>

          {/* Alertes urgentes */}
          {stats.urgents > 0 && (
            <div style={{ background: '#ef444418', border: '1px solid #ef444433', borderRadius: 12, padding: '12px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
              <AlertTriangle size={18} color="#ef4444" />
              <span style={{ color: '#ef4444', fontWeight: 600, fontSize: 14 }}>{stats.urgents} ticket{stats.urgents > 1 ? 's' : ''} urgent{stats.urgents > 1 ? 's' : ''} en attente</span>
            </div>
          )}

          {/* KPI rapides */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 24 }}>
            {[
              { label: 'Ouverts', value: stats.ouverts, color: '#6366f1' },
              { label: 'En cours', value: stats.en_cours, color: '#f59e0b' },
              { label: 'Résolus', value: stats.fermes, color: '#22c55e' },
            ].map(k => (
              <div key={k.label} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 12px', textAlign: 'center' }}>
                <div style={{ fontSize: 26, fontWeight: 800, color: k.color }}>{k.value}</div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>{k.label}</div>
              </div>
            ))}
          </div>

          {/* Cartes de navigation */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
            {menuCards.map(card => (
              <Link key={card.href} href={card.href} style={{
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                borderRadius: 16, padding: '20px 16px', textDecoration: 'none',
                display: 'flex', flexDirection: 'column', gap: 10,
                position: 'relative', overflow: 'hidden',
              }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: `${card.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <card.icon size={22} color={card.color} />
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{card.label}</div>
                {card.badge && (
                  <span style={{ background: `${card.badgeColor}22`, color: card.badgeColor, border: `1px solid ${card.badgeColor}44`, borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 600, alignSelf: 'flex-start' }}>
                    {card.badge}
                  </span>
                )}
              </Link>
            ))}
          </div>

          {/* Déconnexion */}
          <button onClick={handleLogout} style={{ width: '100%', marginTop: 20, padding: '14px', background: 'transparent', border: '1px solid var(--border)', borderRadius: 12, color: 'var(--text-secondary)', fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <LogOut size={16} /> Déconnexion
          </button>
        </div>
      </div>

      {/* ===== VUE DESKTOP : Dashboard classique ===== */}
      <div className="mgr-desktop-home" style={{ padding: '28px 32px' }}>
        <div style={{ marginBottom: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
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

        {loading ? <div style={{ color: 'var(--text-secondary)' }}>Chargement...</div> : (
          <>
            <div className="mgr-grid-4">
              <StatCard label="Tickets ouverts" value={stats.ouverts}  icon={Clock}         color="#6366f1" />
              <StatCard label="En cours"        value={stats.en_cours} icon={Activity}      color="#f59e0b" />
              <StatCard label="Urgents"         value={stats.urgents}  icon={AlertTriangle} color="#ef4444" />
              <StatCard label="Taux résolution" value={`${tauxResolution}%`} icon={TrendingUp} color="#22c55e" sub={`${stats.fermes} / ${stats.total} tickets`} />
            </div>
            <div className="mgr-grid-2">
              <StatCard label="Machines actives" value={stats.machines}    icon={Wrench}      color="#8b5cf6" />
              <StatCard label="Techniciens"       value={stats.techniciens} icon={CheckCircle} color="#06b6d4" />
            </div>
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', fontWeight: 700, fontSize: 14 }}>Tickets récents</div>
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
                      <tr key={t.id} style={{ borderBottom: i < recents.length - 1 ? '1px solid var(--border)' : 'none' }}>
                        <td style={{ padding: '12px 20px', fontSize: 13, fontWeight: 500, maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.titre}</td>
                        <td style={{ padding: '12px 20px', fontSize: 13, color: 'var(--text-secondary)' }}>{t.machines?.nom || '—'}</td>
                        <td style={{ padding: '12px 20px' }}>
                          <span style={{ background: `${prioriteColor[t.priorite]}22`, color: prioriteColor[t.priorite], border: `1px solid ${prioriteColor[t.priorite]}44`, borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>{t.priorite}</span>
                        </td>
                        <td style={{ padding: '12px 20px' }}>
                          <span style={{ background: t.statut === 'resolu' ? '#22c55e22' : t.statut === 'en_cours' ? '#f59e0b22' : '#6366f122', color: t.statut === 'resolu' ? '#22c55e' : t.statut === 'en_cours' ? '#f59e0b' : '#6366f1', borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 600, textTransform: 'capitalize' }}>{t.statut.replace('_', ' ')}</span>
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
    </>
  );
}
