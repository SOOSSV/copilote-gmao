'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { AlertTriangle, TrendingUp, CheckCircle2, Clock, Zap, BarChart3, LogOut, Target, Battery, ShieldAlert, Users, Ticket, Factory, Package } from 'lucide-react';

type Stats = {
  total: number; ouverts: number; en_cours: number; fermes: number;
  urgents: number; machines: number; techniciens: number;
};

function KpiCard({ label, value, sub, icon: Icon, color, big }: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; color: string; big?: boolean;
}) {
  return (
    <div style={{ background: 'var(--bg-card)', border: `1px solid ${color}33`, borderRadius: 16, padding: big ? '28px' : '22px 24px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: -16, right: -16, width: 80, height: 80, borderRadius: '50%', background: `${color}0d` }} />
      <div style={{ width: 40, height: 40, borderRadius: 12, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
        <Icon size={20} color={color} />
      </div>
      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: big ? 44 : 34, fontWeight: 900, color, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 6 }}>{sub}</div>}
    </div>
  );
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
  const [stats, setStats] = useState<Stats>({ total: 0, ouverts: 0, en_cours: 0, fermes: 0, urgents: 0, machines: 0, techniciens: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
      setLoading(false);
    }
    load();
  }, []);

  function handleLogout() {
    sessionStorage.removeItem('directeur_auth');
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
            <div style={{ fontSize: 22, fontWeight: 800, background: 'linear-gradient(135deg, #0ea5e9, #6366f1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: 2 }}>COPILOTE</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Espace Directeur · {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
          </div>

          {!loading && stats.urgents > 0 && (
            <div style={{ background: '#ef444418', border: '1px solid #ef444433', borderRadius: 12, padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
              <AlertTriangle size={16} color="#ef4444" />
              <span style={{ color: '#ef4444', fontWeight: 600, fontSize: 13 }}>{stats.urgents} ticket{stats.urgents > 1 ? 's' : ''} urgent{stats.urgents > 1 ? 's' : ''}</span>
            </div>
          )}

          {/* KPI rapides */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 20 }}>
            <KpiMini label="Taux résolution" value={`${tauxResolution}%`} color="#22c55e" icon={Target} href="/directeur/tickets?filtre=resolu" />
            <KpiMini label="Charge" value={`${charge}%`} color="#6366f1" icon={Battery} href="/directeur/tickets?filtre=ouvert" />
            <KpiMini label="Urgents" value={stats.urgents} color="#ef4444" icon={ShieldAlert} href="/directeur/tickets?filtre=urgente" />
            <KpiMini label="Techniciens" value={stats.techniciens} color="#0ea5e9" icon={Users} href="/directeur/techniciens" />
          </div>

          {/* Cartes navigation */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 20 }}>
            {[
              { href: '/directeur/synthese',     icon: TrendingUp, color: '#22c55e', label: 'Vue synthèse',   sub: 'KPIs & indicateurs' },
              { href: '/directeur/tickets',       icon: Ticket,     color: '#f59e0b', label: 'Tickets',        sub: `${stats.urgents > 0 ? stats.urgents + ' urgents' : 'Tous les tickets'}` },
              { href: '/directeur/machines',      icon: Factory,    color: '#8b5cf6', label: 'Machines',       sub: `${stats.machines} actives` },
              { href: '/directeur/techniciens',   icon: Users,      color: '#0ea5e9', label: 'Techniciens',    sub: `${stats.techniciens} au total` },
              { href: '/directeur/stocks',        icon: Package,    color: '#10b981', label: 'Stocks',         sub: 'Niveaux & alertes' },
              { href: '/directeur/rapports',      icon: BarChart3,  color: '#6366f1', label: 'Rapports IA',   sub: 'Analyses & recommandations' },
            ].map(card => (
              <Link key={card.href} href={card.href} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: '16px', textDecoration: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: `${card.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <card.icon size={20} color={card.color} />
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{card.label}</div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{card.sub}</div>
              </Link>
            ))}
          </div>

          <button onClick={handleLogout} style={{ width: '100%', padding: '14px', background: 'transparent', border: '1px solid var(--border)', borderRadius: 12, color: 'var(--text-secondary)', fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <LogOut size={16} /> Déconnexion
          </button>
        </div>
      </div>

      {/* ===== VUE DESKTOP ===== */}
      <div className="dir-desktop-home" style={{ padding: '32px 36px', maxWidth: 960 }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 24, fontWeight: 900, marginBottom: 4 }}>Vue synthèse</h1>
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
              <KpiCard label="Taux de résolution" value={`${tauxResolution}%`} sub={`${stats.fermes} résolus sur ${stats.total} au total`} icon={TrendingUp} color="#22c55e" big />
              <KpiCard label="Charge en cours" value={`${charge}%`} sub={`${stats.ouverts} ouverts · ${stats.en_cours} en traitement`} icon={Zap} color="#6366f1" big />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
              <KpiCard label="Tickets urgents"  value={stats.urgents}     icon={AlertTriangle} color="#ef4444" />
              <KpiCard label="Machines actives" value={stats.machines}    icon={CheckCircle2}  color="#0ea5e9" />
              <KpiCard label="Techniciens"       value={stats.techniciens} icon={Clock}         color="#8b5cf6" />
            </div>
          </>
        )}
      </div>
    </>
  );
}
