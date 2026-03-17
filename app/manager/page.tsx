'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { AlertTriangle, CheckCircle, Clock, Wrench, TrendingUp, Activity, Ticket, Factory, Users, BarChart3, MessageCircle, PlusCircle, LogOut, Bell, Package, ShoppingCart } from 'lucide-react';
import { useRouter } from 'next/navigation';
import PushNotifSetup from '@/components/PushNotifSetup';

type Stats = {
  total: number; ouverts: number; en_cours: number; fermes: number;
  urgents: number; machines: number; techniciens: number; stockAlertes: number;
  machinesActives: number; machinesInactives: number; machinesHorsService: number;
};

type TicketRecent = {
  id: string; titre: string; priorite: string; statut: string;
  created_at: string; machines: { nom: string } | null;
};

type Suggestion = {
  ticket: { id: string; titre: string; machines: { nom: string } | null } | null;
  tech: { id: string; prenom: string; nom: string } | null;
};

const prioriteColor: Record<string, string> = {
  urgente: '#ef4444', haute: '#f59e0b', normale: '#2563eb', basse: '#22c55e',
};

function StatCard({ label, value, icon: Icon, color, sub, href }: {
  label: string; value: number | string; icon: React.ElementType; color: string; sub?: string; href?: string;
}) {
  const inner = (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: '20px 22px', cursor: href ? 'pointer' : 'default' }}>
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
  return href ? <Link href={href} style={{ textDecoration: 'none' }}>{inner}</Link> : inner;
}

export default function ManagerDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats>({ total: 0, ouverts: 0, en_cours: 0, fermes: 0, urgents: 0, machines: 0, techniciens: 0, stockAlertes: 0, machinesActives: 0, machinesInactives: 0, machinesHorsService: 0 });
  const [recents, setRecents] = useState<TicketRecent[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);
  const [applyingSuggestion, setApplyingSuggestion] = useState(false);

  async function load() {
    const [tickets, machines, techniciens, stocks] = await Promise.all([
      supabase.from('tickets').select('statut, priorite'),
      supabase.from('machines').select('id, statut'),
      supabase.from('technicians').select('id'),
      supabase.from('stocks').select('quantite_actuelle, seuil_minimum').eq('actif', true),
    ]);
    const t = tickets.data || [];
    const m = machines.data || [];
    const stockAlertes = (stocks.data || []).filter(s => s.quantite_actuelle <= s.seuil_minimum).length;
    setStats({
      total: t.length, ouverts: t.filter(x => x.statut === 'ouvert').length,
      en_cours: t.filter(x => x.statut === 'en_cours').length,
      fermes: t.filter(x => x.statut === 'resolu').length,
      urgents: t.filter(x => x.priorite === 'urgente').length,
      machines: m.length,
      techniciens: techniciens.data?.length || 0,
      stockAlertes,
      machinesActives: m.filter(x => x.statut === 'actif').length,
      machinesInactives: m.filter(x => x.statut === 'inactif').length,
      machinesHorsService: m.filter(x => x.statut === 'hors_service').length,
    });
    const { data: r } = await supabase.from('tickets')
      .select('id, titre, priorite, statut, created_at, machines(nom)')
      .order('created_at', { ascending: false }).limit(8);
    setRecents((r as unknown as TicketRecent[]) || []);

    // Suggestion IA : ticket urgent non assigné + tech le moins chargé
    const [{ data: ticketNA }, { data: techData }] = await Promise.all([
      supabase.from('tickets').select('id, titre, machines(nom)').is('technicien_id', null).in('statut', ['ouvert', 'en_cours']).eq('priorite', 'urgente').limit(1).maybeSingle(),
      supabase.from('technicians').select('id, prenom, nom, charge_actuelle').eq('disponible', true).order('charge_actuelle', { ascending: true }).limit(1).maybeSingle(),
    ]);
    if (ticketNA && techData) {
      setSuggestion({
        ticket: ticketNA as unknown as { id: string; titre: string; machines: { nom: string } | null },
        tech: techData as { id: string; prenom: string; nom: string },
      });
    } else {
      setSuggestion(null);
    }

    setLoading(false);
    setLastRefresh(new Date());
  }

  async function applySuggestion() {
    if (!suggestion?.ticket || !suggestion?.tech) return;
    setApplyingSuggestion(true);
    await supabase.from('tickets').update({ technicien_id: suggestion.tech.id, statut: 'en_cours' }).eq('id', suggestion.ticket.id);
    setSuggestion(null);
    setApplyingSuggestion(false);
    load();
  }

  useEffect(() => { load(); const i = setInterval(load, 30000); return () => clearInterval(i); }, []);

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  }

  function handleLogout() {
    localStorage.removeItem('manager_auth');
    router.replace('/manager/login');
  }

  const tauxResolution = stats.total > 0 ? Math.round((stats.fermes / stats.total) * 100) : 0;

  const menuCards = [
    { href: '/manager/dashboard', icon: BarChart3,    label: 'Tableau de bord', color: '#2563eb', badge: stats.urgents > 0 ? `${stats.urgents} urgents` : null, badgeColor: '#ef4444' },
    { href: '/manager/tickets',   icon: Ticket,        label: 'Tickets',         color: '#f59e0b', badge: stats.ouverts > 0 ? `${stats.ouverts} ouverts` : null, badgeColor: '#f59e0b' },
    { href: '/manager/machines',  icon: Factory,       label: 'Machines',        color: '#7c3aed', badge: null, badgeColor: '' },
    { href: '/manager/techniciens', icon: Users,       label: 'Techniciens',     color: '#06b6d4', badge: `${stats.techniciens}`, badgeColor: '#06b6d4' },
    { href: '/manager/stocks',    icon: Package,       label: 'Stocks',          color: '#f59e0b', badge: stats.stockAlertes > 0 ? `${stats.stockAlertes} rupture${stats.stockAlertes > 1 ? 's' : ''}` : null, badgeColor: '#f59e0b' },
    { href: '/manager/rapports',  icon: BarChart3,     label: 'Rapports IA',     color: '#22c55e', badge: null, badgeColor: '' },
    { href: '/manager/chat',      icon: MessageCircle, label: 'Chat IA',         color: '#0ea5e9', badge: null, badgeColor: '' },
    { href: '/manager/nouveau',   icon: PlusCircle,    label: 'Nouveau ticket',  color: '#10b981', badge: null, badgeColor: '' },
  ];

  return (
    <>
      {/* ===== VUE MOBILE : Menu cartes ===== */}
      <div className="mgr-mobile-home">
        <div style={{ padding: '24px 16px 100px' }}>
          {/* Header */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px', marginBottom: 2 }}>COPILOTE</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Espace Manager · {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
              </div>
            </div>
          </div>

          {/* Alertes urgentes */}
          {stats.urgents > 0 && (
            <div style={{ background: '#ef444418', border: '1px solid #ef444433', borderRadius: 12, padding: '12px 16px', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
              <AlertTriangle size={18} color="#ef4444" />
              <span style={{ color: '#ef4444', fontWeight: 600, fontSize: 14 }}>{stats.urgents} ticket{stats.urgents > 1 ? 's' : ''} urgent{stats.urgents > 1 ? 's' : ''} en attente</span>
            </div>
          )}
          {/* Alertes stocks */}
          {stats.stockAlertes > 0 && (
            <div style={{ background: '#f59e0b18', border: '1px solid #f59e0b33', borderRadius: 12, padding: '12px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
              <ShoppingCart size={18} color="#f59e0b" />
              <span style={{ color: '#f59e0b', fontWeight: 600, fontSize: 14 }}>{stats.stockAlertes} pièce{stats.stockAlertes > 1 ? 's' : ''} en rupture de stock</span>
            </div>
          )}

          {/* KPI rapides */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 24 }}>
            {[
              { label: 'Ouverts', value: stats.ouverts, color: '#2563eb', filtre: 'ouvert' },
              { label: 'En cours', value: stats.en_cours, color: '#f59e0b', filtre: 'en_cours' },
              { label: 'Résolus', value: stats.fermes, color: '#22c55e', filtre: 'resolu' },
            ].map(k => (
              <Link key={k.label} href={`/manager/tickets?filtre=${k.filtre}`} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 12px', textAlign: 'center', textDecoration: 'none', display: 'block' }}>
                <div style={{ fontSize: 26, fontWeight: 800, color: k.color }}>{k.value}</div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>{k.label}</div>
              </Link>
            ))}
          </div>

          {/* Cards denses — Machines + Techniciens */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
            <Link href="/manager/machines" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: '14px', textDecoration: 'none', color: 'inherit' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                <Factory size={14} color="#7c3aed" />
                <span style={{ fontSize: 12, fontWeight: 700, color: '#7c3aed' }}>Machines</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                  <span style={{ color: 'var(--text-secondary)' }}>● Actives</span>
                  <span style={{ fontWeight: 700, color: '#22c55e' }}>{stats.machinesActives}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                  <span style={{ color: 'var(--text-secondary)' }}>● Inactives</span>
                  <span style={{ fontWeight: 700, color: '#f59e0b' }}>{stats.machinesInactives}</span>
                </div>
                {stats.machinesHorsService > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                    <span style={{ color: 'var(--text-secondary)' }}>● Hors service</span>
                    <span style={{ fontWeight: 700, color: '#ef4444' }}>{stats.machinesHorsService}</span>
                  </div>
                )}
              </div>
            </Link>
            <Link href="/manager/techniciens" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: '14px', textDecoration: 'none', color: 'inherit' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                <Users size={14} color="#06b6d4" />
                <span style={{ fontSize: 12, fontWeight: 700, color: '#06b6d4' }}>Techniciens</span>
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#06b6d4', marginBottom: 4 }}>{stats.techniciens}</div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                {stats.en_cours} intervention{stats.en_cours > 1 ? 's' : ''} en cours
              </div>
            </Link>
          </div>

          {/* Barre IA suggestion */}
          {suggestion && !loading && (
            <div style={{ background: 'rgba(37,99,235,0.08)', border: '1px solid rgba(37,99,235,0.25)', borderRadius: 14, padding: '14px', marginBottom: 12 }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 12 }}>
                <span style={{ fontSize: 20, flexShrink: 0 }}>🤖</span>
                <div style={{ fontSize: 13, lineHeight: 1.5 }}>
                  Je suggère d&apos;assigner{' '}
                  <strong style={{ color: 'var(--text-primary)' }}>{suggestion.tech?.prenom} {suggestion.tech?.nom}</strong>
                  {' '}au ticket urgent :{' '}
                  <span style={{ color: 'var(--text-secondary)' }}>&quot;{suggestion.ticket?.titre}&quot;</span>
                  {suggestion.ticket?.machines && (
                    <span style={{ color: 'var(--text-secondary)' }}> — {(suggestion.ticket.machines as { nom: string }).nom}</span>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={applySuggestion} disabled={applyingSuggestion} style={{ flex: 1, background: '#2563eb', border: 'none', borderRadius: 8, padding: '9px', color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: applyingSuggestion ? 0.7 : 1 }}>
                  {applyingSuggestion ? 'Assignation...' : '✓ Assigner'}
                </button>
                <button onClick={() => setSuggestion(null)} style={{ padding: '9px 14px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer' }}>
                  Ignorer
                </button>
              </div>
            </div>
          )}

          {/* Stocks + Rapports IA */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
            <Link href="/manager/stocks" style={{ background: 'var(--bg-card)', border: `1px solid ${stats.stockAlertes > 0 ? '#f59e0b44' : 'var(--border)'}`, borderRadius: 14, padding: '14px', textDecoration: 'none', color: 'inherit' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                <Package size={14} color="#f59e0b" />
                <span style={{ fontSize: 12, fontWeight: 700, color: '#f59e0b' }}>Stocks</span>
              </div>
              {stats.stockAlertes > 0
                ? <><div style={{ fontSize: 24, fontWeight: 800, color: '#f59e0b', marginBottom: 2 }}>{stats.stockAlertes}</div><div style={{ fontSize: 11, color: '#f59e0b' }}>rupture{stats.stockAlertes > 1 ? 's' : ''} détectée{stats.stockAlertes > 1 ? 's' : ''}</div></>
                : <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>Niveaux OK</div>
              }
            </Link>
            <Link href="/manager/rapports" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: '14px', textDecoration: 'none', color: 'inherit' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                <BarChart3 size={14} color="#22c55e" />
                <span style={{ fontSize: 12, fontWeight: 700, color: '#22c55e' }}>Rapports IA</span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Analyses & recommandations</div>
            </Link>
          </div>

          {/* Chat IA + Nouveau ticket */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
            <Link href="/manager/chat" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: '14px', textDecoration: 'none', color: 'inherit' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                <MessageCircle size={14} color="#0ea5e9" />
                <span style={{ fontSize: 12, fontWeight: 700, color: '#0ea5e9' }}>Chat IA</span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Copilote assistant</div>
            </Link>
            <Link href="/manager/nouveau" style={{ background: '#10b98112', border: '1px solid #10b98133', borderRadius: 14, padding: '14px', textDecoration: 'none', color: 'inherit' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                <PlusCircle size={14} color="#10b981" />
                <span style={{ fontSize: 12, fontWeight: 700, color: '#10b981' }}>Nouveau ticket</span>
              </div>
              <div style={{ fontSize: 11, color: '#10b981', fontWeight: 600 }}>+ Créer</div>
            </Link>
          </div>

          {/* Notifications */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: '14px', marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <Bell size={14} color="#2563eb" />
              <span style={{ fontSize: 12, fontWeight: 700, color: '#2563eb' }}>Notifications push</span>
            </div>
            <PushNotifSetup role="manager" fullCard={false} />
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

        {!loading && stats.stockAlertes > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 12, padding: '14px 18px', marginBottom: 20 }}>
            <ShoppingCart size={20} color="#f59e0b" />
            <div>
              <span style={{ fontWeight: 700, color: '#f59e0b' }}>{stats.stockAlertes} pièce{stats.stockAlertes > 1 ? 's' : ''} en rupture</span>
              <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}> — stock sous le seuil minimum</span>
            </div>
          </div>
        )}
        {loading ? <div style={{ color: 'var(--text-secondary)' }}>Chargement...</div> : (
          <>
            <div className="mgr-grid-4">
              <StatCard label="Tickets ouverts" value={stats.ouverts}  icon={Clock}         color="#2563eb" href="/manager/tickets?filtre=ouvert" />
              <StatCard label="En cours"        value={stats.en_cours} icon={Activity}      color="#f59e0b" href="/manager/tickets?filtre=en_cours" />
              <StatCard label="Urgents"         value={stats.urgents}  icon={AlertTriangle} color="#ef4444" href="/manager/tickets?filtre=urgente" />
              <StatCard label="Taux résolution" value={`${tauxResolution}%`} icon={TrendingUp} color="#22c55e" sub={`${stats.fermes} / ${stats.total} tickets`} href="/manager/tickets?filtre=resolu" />
            </div>
            <div className="mgr-grid-2">
              <StatCard label="Machines actives" value={stats.machines}    icon={Wrench}      color="#7c3aed" />
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
                          <span style={{ background: t.statut === 'resolu' ? '#22c55e22' : t.statut === 'en_cours' ? '#f59e0b22' : '#2563eb22', color: t.statut === 'resolu' ? '#22c55e' : t.statut === 'en_cours' ? '#f59e0b' : '#2563eb', borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 600, textTransform: 'capitalize' }}>{t.statut.replace('_', ' ')}</span>
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
