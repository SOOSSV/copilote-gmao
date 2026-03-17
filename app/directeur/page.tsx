'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { AlertTriangle, TrendingUp, CheckCircle2, Clock, Zap, BarChart3, LogOut, Target, Battery, ShieldAlert, Users, Ticket, Factory, Package } from 'lucide-react';

type Stats = {
  total: number; ouverts: number; en_cours: number; fermes: number;
  urgents: number; machines: number; techniciens: number; stockAlertes: number;
};

function KpiCard({ label, value, sub, icon: Icon, color, big, href }: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; color: string; big?: boolean; href?: string;
}) {
  const inner = (
    <div style={{ background: 'var(--bg-card)', border: `1px solid ${color}33`, borderRadius: 16, padding: big ? '28px' : '22px 24px', position: 'relative', overflow: 'hidden', cursor: href ? 'pointer' : 'default' }}>
      <div style={{ position: 'absolute', top: -16, right: -16, width: 80, height: 80, borderRadius: '50%', background: `${color}0d` }} />
      <div style={{ width: 40, height: 40, borderRadius: 12, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
        <Icon size={20} color={color} />
      </div>
      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: big ? 44 : 34, fontWeight: 900, color, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 6 }}>{sub}</div>}
    </div>
  );
  return href ? <Link href={href} style={{ textDecoration: 'none' }}>{inner}</Link> : inner;
}

function KpiMini({ label, value, color, icon: Icon, href }: { label: string; value: string | number; color: string; icon: React.ElementType; href?: string }) {
  const inner = (
    <div style={{ background: 'var(--bg-card)', border: `1px solid ${color}33`, borderRadius: 12, padding: '14px 12px', cursor: href ? 'pointer' : 'default', textDecoration: 'none', display: 'block' }}>
      <div style={{ width: 32, height: 32, borderRadius: 8, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
        <Icon size={16} color={color} />
      </div>
      <div style={{ fontSize: 24, fontWeight: 800, color }}>{value}</div>
      <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>{label}</div>
    </div>
  );
  return href ? <Link href={href} style={{ textDecoration: 'none' }}>{inner}</Link> : inner;
}

export default function DirecteurDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats>({ total: 0, ouverts: 0, en_cours: 0, fermes: 0, urgents: 0, machines: 0, techniciens: 0, stockAlertes: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [tickets, machines, techniciens, stocks] = await Promise.all([
        supabase.from('tickets').select('statut, priorite'),
        supabase.from('machines').select('id').eq('statut', 'actif'),
        supabase.from('technicians').select('id'),
        supabase.from('stocks').select('quantite_actuelle, seuil_minimum').eq('actif', true),
      ]);
      const t = tickets.data || [];
      const stockAlertes = (stocks.data || []).filter(s => s.quantite_actuelle <= s.seuil_minimum).length;
      setStats({
        total: t.length, ouverts: t.filter(x => x.statut === 'ouvert').length,
        en_cours: t.filter(x => x.statut === 'en_cours').length,
        fermes: t.filter(x => x.statut === 'resolu').length,
        urgents: t.filter(x => x.priorite === 'urgente').length,
        machines: machines.data?.length || 0,
        techniciens: techniciens.data?.length || 0,
        stockAlertes,
      });
      setLoading(false);
    }
    load();
  }, []);

  function handleLogout() {
    localStorage.removeItem('directeur_auth');
    router.replace('/directeur/login');
  }

  const tauxResolution = stats.total > 0 ? Math.round((stats.fermes / stats.total) * 100) : 0;
  const charge = stats.total > 0 ? Math.round(((stats.ouverts + stats.en_cours) / stats.total) * 100) : 0;

  return (
    <>
      {/* ===== VUE MOBILE ===== */}
      <div className="dir-mobile-home">
        <div style={{ padding: '24px 16px 40px', maxWidth: '100vw', boxSizing: 'border-box', overflowX: 'hidden' }}>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px', marginBottom: 2 }}>COPILOTE</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Espace Directeur · {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
          </div>

          {!loading && stats.urgents > 0 && (
            <div style={{ background: '#ef444418', border: '1px solid #ef444433', borderRadius: 12, padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
              <AlertTriangle size={16} color="#ef4444" />
              <span style={{ color: '#ef4444', fontWeight: 600, fontSize: 13 }}>{stats.urgents} ticket{stats.urgents > 1 ? 's' : ''} urgent{stats.urgents > 1 ? 's' : ''}</span>
            </div>
          )}

          {/* KPI rapides */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 10 }}>
            {[
              { label: 'Ouverts',  value: stats.ouverts,   color: '#2563eb', href: '/directeur/tickets?filtre=ouvert' },
              { label: 'En cours', value: stats.en_cours,  color: '#f59e0b', href: '/directeur/tickets?filtre=en_cours' },
              { label: 'Résolus',  value: stats.fermes,    color: '#22c55e', href: '/directeur/tickets?filtre=resolu' },
            ].map(k => (
              <Link key={k.label} href={k.href} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 12px', textAlign: 'center', textDecoration: 'none', display: 'block' }}>
                <div style={{ fontSize: 26, fontWeight: 800, color: k.color }}>{k.value}</div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>{k.label}</div>
              </Link>
            ))}
          </div>

          {/* Cards denses row 1 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
            <Link href="/directeur/synthese" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: '14px', textDecoration: 'none', color: 'inherit' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                <TrendingUp size={14} color="#22c55e" />
                <span style={{ fontSize: 12, fontWeight: 700, color: '#22c55e' }}>Vue synthèse</span>
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#22c55e', marginBottom: 2 }}>{tauxResolution}%</div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>taux de résolution</div>
            </Link>
            <Link href="/directeur/tickets" style={{ background: 'var(--bg-card)', border: `1px solid ${stats.urgents > 0 ? '#ef444433' : 'var(--border)'}`, borderRadius: 14, padding: '14px', textDecoration: 'none', color: 'inherit' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                <Ticket size={14} color="#f59e0b" />
                <span style={{ fontSize: 12, fontWeight: 700, color: '#f59e0b' }}>Tickets</span>
              </div>
              {stats.urgents > 0
                ? <><div style={{ fontSize: 24, fontWeight: 800, color: '#ef4444', marginBottom: 2 }}>{stats.urgents}</div><div style={{ fontSize: 11, color: '#ef4444' }}>urgent{stats.urgents > 1 ? 's' : ''}</div></>
                : <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>{stats.ouverts} ouverts</div>
              }
            </Link>
          </div>

          {/* Cards denses row 2 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
            <Link href="/directeur/machines" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: '14px', textDecoration: 'none', color: 'inherit' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                <Factory size={14} color="#7c3aed" />
                <span style={{ fontSize: 12, fontWeight: 700, color: '#7c3aed' }}>Machines</span>
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#7c3aed', marginBottom: 2 }}>{stats.machines}</div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>actives</div>
            </Link>
            <Link href="/directeur/techniciens" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: '14px', textDecoration: 'none', color: 'inherit' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                <Users size={14} color="#0ea5e9" />
                <span style={{ fontSize: 12, fontWeight: 700, color: '#0ea5e9' }}>Techniciens</span>
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#0ea5e9', marginBottom: 2 }}>{stats.techniciens}</div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{stats.en_cours} en intervention</div>
            </Link>
          </div>

          {/* Cards denses row 3 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
            <Link href="/directeur/stocks" style={{ background: 'var(--bg-card)', border: `1px solid ${stats.stockAlertes > 0 ? '#f59e0b44' : 'var(--border)'}`, borderRadius: 14, padding: '14px', textDecoration: 'none', color: 'inherit' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                <Package size={14} color="#10b981" />
                <span style={{ fontSize: 12, fontWeight: 700, color: '#10b981' }}>Stocks</span>
              </div>
              {stats.stockAlertes > 0
                ? <><div style={{ fontSize: 24, fontWeight: 800, color: '#f59e0b', marginBottom: 2 }}>{stats.stockAlertes}</div><div style={{ fontSize: 11, color: '#f59e0b' }}>rupture{stats.stockAlertes > 1 ? 's' : ''}</div></>
                : <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>Niveaux OK</div>
              }
            </Link>
            <Link href="/directeur/rapports" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: '14px', textDecoration: 'none', color: 'inherit' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                <BarChart3 size={14} color="#2563eb" />
                <span style={{ fontSize: 12, fontWeight: 700, color: '#2563eb' }}>Rapports IA</span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Analyses & recommandations</div>
            </Link>
          </div>

          <button onClick={handleLogout} style={{ width: '100%', padding: '14px', background: 'transparent', border: '1px solid var(--border)', borderRadius: 12, color: 'var(--text-secondary)', fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <LogOut size={16} /> Déconnexion
          </button>
        </div>
      </div>

      {/* ===== VUE DESKTOP ===== */}
      <div className="dir-desktop-home" style={{ padding: '32px 36px', maxWidth: 960 }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>Vue synthèse</h1>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        </div>

        {!loading && stats.urgents > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 12, padding: '14px 18px', marginBottom: 28 }}>
            <AlertTriangle size={20} color="#ef4444" />
            <div>
              <span style={{ fontWeight: 700, color: '#ef4444' }}>{stats.urgents} ticket{stats.urgents > 1 ? 's' : ''} urgent{stats.urgents > 1 ? 's' : ''}</span>
              <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}> en attente d'intervention</span>
            </div>
          </div>
        )}

        {loading ? <div style={{ color: 'var(--text-secondary)' }}>Chargement...</div> : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <KpiCard label="Taux de résolution" value={`${tauxResolution}%`} sub={`${stats.fermes} résolus sur ${stats.total} au total`} icon={TrendingUp} color="#22c55e" big href="/directeur/synthese" />
              <KpiCard label="Charge en cours" value={`${charge}%`} sub={`${stats.ouverts} ouverts · ${stats.en_cours} en traitement`} icon={Zap} color="#2563eb" big href="/directeur/tickets" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 16 }}>
              <KpiCard label="Tickets urgents"  value={stats.urgents}     icon={AlertTriangle} color="#ef4444" href="/directeur/tickets?filtre=urgente" />
              <KpiCard label="Machines actives" value={stats.machines}    icon={CheckCircle2}  color="#0ea5e9" href="/directeur/machines" />
              <KpiCard label="Techniciens"       value={stats.techniciens} icon={Clock}         color="#7c3aed" href="/directeur/techniciens" />
            </div>
            {/* Nav dense desktop — toutes les sections */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {[
                { href: '/directeur/synthese',    label: 'Vue synthèse',  sub: `${tauxResolution}% résolution`,              icon: TrendingUp,  color: '#22c55e' },
                { href: '/directeur/tickets',     label: 'Tickets',       sub: `${stats.ouverts} ouverts · ${stats.urgents} urgents`, icon: Ticket,      color: '#f59e0b' },
                { href: '/directeur/machines',    label: 'Machines',      sub: `${stats.machines} actives`,                  icon: Factory,     color: '#7c3aed' },
                { href: '/directeur/techniciens', label: 'Techniciens',   sub: `${stats.techniciens} actifs`,                icon: Users,       color: '#0ea5e9' },
                { href: '/directeur/stocks',      label: 'Stocks',        sub: stats.stockAlertes > 0 ? `${stats.stockAlertes} rupture${stats.stockAlertes > 1 ? 's' : ''}` : 'Niveaux OK', icon: Package, color: stats.stockAlertes > 0 ? '#f59e0b' : '#10b981' },
                { href: '/directeur/rapports',    label: 'Rapports IA',   sub: 'Analyses & recommandations',                 icon: BarChart3,   color: '#2563eb' },
              ].map(card => (
                <Link key={card.href} href={card.href} style={{ textDecoration: 'none', background: 'var(--bg-card)', border: `1px solid ${card.color}33`, borderRadius: 12, padding: '16px 18px', display: 'block' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <div style={{ width: 30, height: 30, borderRadius: 8, background: `${card.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <card.icon size={15} color={card.color} />
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{card.label}</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{card.sub}</div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}
