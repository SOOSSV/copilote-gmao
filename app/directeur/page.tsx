'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { AlertTriangle, TrendingUp, CheckCircle2, Clock, Zap, BarChart3, LogOut } from 'lucide-react';

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

function KpiMini({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 12px', textAlign: 'center' }}>
      <div style={{ fontSize: 26, fontWeight: 800, color }}>{value}</div>
      <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>{label}</div>
    </div>
  );
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
            <KpiMini label="Taux résolution" value={`${tauxResolution}%`} color="#22c55e" />
            <KpiMini label="Charge" value={`${charge}%`} color="#6366f1" />
            <KpiMini label="Urgents" value={stats.urgents} color="#ef4444" />
            <KpiMini label="Techniciens" value={stats.techniciens} color="#0ea5e9" />
          </div>

          {/* Cartes navigation */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
            <Link href="/directeur/synthese" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: '20px 16px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: '#22c55e20', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <TrendingUp size={22} color="#22c55e" />
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>Vue synthèse</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>KPIs & indicateurs clés</div>
              </div>
            </Link>
            <Link href="/directeur/rapports" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: '20px 16px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: '#0ea5e920', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <BarChart3 size={22} color="#0ea5e9" />
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>Rapports IA</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>Analyses & recommandations</div>
              </div>
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
