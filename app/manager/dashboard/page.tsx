'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { AlertTriangle, CheckCircle, Clock, Wrench, TrendingUp, Activity, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

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

function StatCard({ label, value, icon: Icon, color, sub, href }: {
  label: string; value: number | string; icon: React.ElementType; color: string; sub?: string; href?: string;
}) {
  const inner = (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: '18px 16px', cursor: href ? 'pointer' : 'default' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>{label}</div>
          <div style={{ fontSize: 28, fontWeight: 800, color }}>{value}</div>
          {sub && <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>{sub}</div>}
        </div>
        <div style={{ width: 38, height: 38, borderRadius: 10, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={18} color={color} />
        </div>
      </div>
    </div>
  );
  return href ? <Link href={href} style={{ textDecoration: 'none' }}>{inner}</Link> : inner;
}

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats>({ total: 0, ouverts: 0, en_cours: 0, fermes: 0, urgents: 0, machines: 0, techniciens: 0 });
  const [recents, setRecents] = useState<TicketRecent[]>([]);
  const [loading, setLoading] = useState(true);

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
      .order('created_at', { ascending: false }).limit(10);
    setRecents((r as unknown as TicketRecent[]) || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const tauxResolution = stats.total > 0 ? Math.round((stats.fermes / stats.total) * 100) : 0;

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  }

  return (
    <div style={{ padding: '16px', paddingBottom: 32 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: 4, display: 'flex', alignItems: 'center' }}>
          <ArrowLeft size={22} />
        </button>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>Tableau de bord</h1>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </div>
        </div>
        <button onClick={load} style={{ marginLeft: 'auto', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Activity size={13} /> Rafraîchir
        </button>
      </div>

      {stats.urgents > 0 && (
        <div style={{ background: '#ef444418', border: '1px solid #ef444433', borderRadius: 12, padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
          <AlertTriangle size={16} color="#ef4444" />
          <span style={{ color: '#ef4444', fontWeight: 600, fontSize: 13 }}>{stats.urgents} ticket{stats.urgents > 1 ? 's' : ''} urgent{stats.urgents > 1 ? 's' : ''}</span>
        </div>
      )}

      {loading ? <div style={{ color: 'var(--text-secondary)', padding: 20 }}>Chargement...</div> : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 12 }}>
            <StatCard label="Ouverts"   value={stats.ouverts}  icon={Clock}         color="#6366f1" href="/manager/tickets?filtre=ouvert" />
            <StatCard label="En cours"  value={stats.en_cours} icon={Activity}      color="#f59e0b" href="/manager/tickets?filtre=en_cours" />
            <StatCard label="Urgents"   value={stats.urgents}  icon={AlertTriangle} color="#ef4444" href="/manager/tickets?filtre=urgente" />
            <StatCard label="Résolution" value={`${tauxResolution}%`} icon={TrendingUp} color="#22c55e" sub={`${stats.fermes}/${stats.total}`} href="/manager/tickets?filtre=resolu" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 20 }}>
            <StatCard label="Machines"    value={stats.machines}    icon={Wrench}       color="#8b5cf6" />
            <StatCard label="Techniciens" value={stats.techniciens} icon={CheckCircle}  color="#06b6d4" />
          </div>

          {/* Tickets récents en cartes */}
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>Tickets récents</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {recents.map(t => (
              <Link key={t.id} href={`/manager/tickets/${t.id}`} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 16px', textDecoration: 'none', color: 'inherit', display: 'block' }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>{t.titre}</div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{t.machines?.nom || '—'}</span>
                  <span style={{ background: `${prioriteColor[t.priorite]}22`, color: prioriteColor[t.priorite], border: `1px solid ${prioriteColor[t.priorite]}44`, borderRadius: 6, padding: '1px 7px', fontSize: 10, fontWeight: 600, textTransform: 'uppercase' }}>{t.priorite}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-secondary)', marginLeft: 'auto' }}>{formatDate(t.created_at)}</span>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
