'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { AlertTriangle, TrendingUp, CheckCircle2, Clock, Zap, BarChart3, LogOut, Target, Battery, ShieldAlert, Users, Ticket, Factory, Package, Repeat2, Sparkles } from 'lucide-react';

type Stats = {
  total: number; ouverts: number; en_cours: number; fermes: number;
  urgents: number; machines: number; techniciens: number; stockAlertes: number;
};

function KpiCard({ label, value, sub, icon: Icon, color, big, href }: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; color: string; big?: boolean; href?: string;
}) {
  const inner = (
    <div
      className="rounded-2xl relative overflow-hidden"
      style={{ background: '#1c2128', border: `1px solid ${color}33`, padding: big ? 28 : '22px 24px', cursor: href ? 'pointer' : 'default' }}
    >
      <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full" style={{ background: `${color}0d` }} />
      <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3.5" style={{ background: `${color}18` }}>
        <Icon size={20} color={color} />
      </div>
      <div className="text-[11px] font-bold text-[#7d8590] uppercase tracking-[0.8px] mb-1.5">{label}</div>
      <div className="font-black leading-none" style={{ fontSize: big ? 44 : 34, color }}>{value}</div>
      {sub && <div className="text-[12px] text-[#7d8590] mt-1.5">{sub}</div>}
    </div>
  );
  return href ? <Link href={href} className="no-underline">{inner}</Link> : inner;
}

function KpiMini({ label, value, color, icon: Icon, href }: { label: string; value: string | number; color: string; icon: React.ElementType; href?: string }) {
  const inner = (
    <div
      className="rounded-xl block"
      style={{ background: '#1c2128', border: `1px solid ${color}33`, padding: '14px 12px', cursor: href ? 'pointer' : 'default' }}
    >
      <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2" style={{ background: `${color}18` }}>
        <Icon size={16} color={color} />
      </div>
      <div className="text-[24px] font-extrabold" style={{ color }}>{value}</div>
      <div className="text-[11px] text-[#7d8590] mt-0.5">{label}</div>
    </div>
  );
  return href ? <Link href={href} className="no-underline">{inner}</Link> : inner;
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
        <div className="px-4 pt-6 pb-10 max-w-[100vw] box-border overflow-x-hidden">
          <div className="mb-5">
            <div className="text-[22px] font-extrabold text-[#e6edf3] tracking-[-0.5px] mb-0.5">RR GMAO</div>
            <div className="text-[13px] text-[#7d8590]">Espace Directeur · {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
          </div>

          {!loading && stats.urgents > 0 && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-4 flex items-center gap-2.5">
              <AlertTriangle size={16} color="#ef4444" />
              <span className="text-red-500 font-semibold text-[13px]">{stats.urgents} ticket{stats.urgents > 1 ? 's' : ''} urgent{stats.urgents > 1 ? 's' : ''}</span>
            </div>
          )}

          {/* KPI rapides */}
          <div className="grid grid-cols-3 gap-2.5 mb-2.5">
            {[
              { label: 'Ouverts',  value: stats.ouverts,   color: '#2563eb', href: '/directeur/tickets?filtre=ouvert' },
              { label: 'En cours', value: stats.en_cours,  color: '#f59e0b', href: '/directeur/tickets?filtre=en_cours' },
              { label: 'Résolus',  value: stats.fermes,    color: '#22c55e', href: '/directeur/tickets?filtre=resolu' },
            ].map(k => (
              <Link key={k.label} href={k.href} className="bg-[#1c2128] border border-[#30363d] rounded-xl py-3.5 px-3 text-center no-underline block">
                <div className="text-[26px] font-extrabold" style={{ color: k.color }}>{k.value}</div>
                <div className="text-[11px] text-[#7d8590] mt-0.5">{k.label}</div>
              </Link>
            ))}
          </div>

          {/* Cards row 1 */}
          <div className="grid grid-cols-2 gap-2.5 mb-2.5">
            <Link href="/directeur/synthese" className="bg-[#1c2128] border border-[#30363d] rounded-[14px] p-3.5 no-underline text-inherit">
              <div className="flex items-center gap-1.5 mb-2.5">
                <TrendingUp size={14} color="#22c55e" />
                <span className="text-[12px] font-bold text-green-500">Vue synthèse</span>
              </div>
              <div className="text-[24px] font-extrabold text-green-500 mb-0.5">{tauxResolution}%</div>
              <div className="text-[11px] text-[#7d8590]">taux de résolution</div>
            </Link>
            <Link
              href="/directeur/tickets"
              className="bg-[#1c2128] rounded-[14px] p-3.5 no-underline text-inherit"
              style={{ border: `1px solid ${stats.urgents > 0 ? '#ef444433' : '#30363d'}` }}
            >
              <div className="flex items-center gap-1.5 mb-2.5">
                <Ticket size={14} color="#f59e0b" />
                <span className="text-[12px] font-bold text-amber-500">Tickets</span>
              </div>
              {stats.urgents > 0
                ? <><div className="text-[24px] font-extrabold text-red-500 mb-0.5">{stats.urgents}</div><div className="text-[11px] text-red-500">urgent{stats.urgents > 1 ? 's' : ''}</div></>
                : <div className="text-[11px] text-[#7d8590] mt-1">{stats.ouverts} ouverts</div>
              }
            </Link>
          </div>

          {/* Cards row 2 */}
          <div className="grid grid-cols-2 gap-2.5 mb-2.5">
            <Link href="/directeur/machines" className="bg-[#1c2128] border border-[#30363d] rounded-[14px] p-3.5 no-underline text-inherit">
              <div className="flex items-center gap-1.5 mb-2.5">
                <Factory size={14} color="#7c3aed" />
                <span className="text-[12px] font-bold text-violet-600">Machines</span>
              </div>
              <div className="text-[24px] font-extrabold text-violet-600 mb-0.5">{stats.machines}</div>
              <div className="text-[11px] text-[#7d8590]">actives</div>
            </Link>
            <Link href="/directeur/techniciens" className="bg-[#1c2128] border border-[#30363d] rounded-[14px] p-3.5 no-underline text-inherit">
              <div className="flex items-center gap-1.5 mb-2.5">
                <Users size={14} color="#0ea5e9" />
                <span className="text-[12px] font-bold text-sky-500">Techniciens</span>
              </div>
              <div className="text-[24px] font-extrabold text-sky-500 mb-0.5">{stats.techniciens}</div>
              <div className="text-[11px] text-[#7d8590]">{stats.en_cours} en intervention</div>
            </Link>
          </div>

          {/* Cards row 3 */}
          <div className="grid grid-cols-2 gap-2.5 mb-5">
            <Link
              href="/directeur/stocks"
              className="bg-[#1c2128] rounded-[14px] p-3.5 no-underline text-inherit"
              style={{ border: `1px solid ${stats.stockAlertes > 0 ? '#f59e0b44' : '#30363d'}` }}
            >
              <div className="flex items-center gap-1.5 mb-2.5">
                <Package size={14} color="#10b981" />
                <span className="text-[12px] font-bold text-emerald-500">Stocks</span>
              </div>
              {stats.stockAlertes > 0
                ? <><div className="text-[24px] font-extrabold text-amber-500 mb-0.5">{stats.stockAlertes}</div><div className="text-[11px] text-amber-500">rupture{stats.stockAlertes > 1 ? 's' : ''}</div></>
                : <div className="text-[11px] text-[#7d8590] mt-1">Niveaux OK</div>
              }
            </Link>
            <Link href="/directeur/rapports" className="bg-[#1c2128] border border-[#30363d] rounded-[14px] p-3.5 no-underline text-inherit">
              <div className="flex items-center gap-1.5 mb-2.5">
                <BarChart3 size={14} color="#2563eb" />
                <span className="text-[12px] font-bold text-blue-500">Rapports IA</span>
              </div>
              <div className="text-[11px] text-[#7d8590]">Analyses & recommandations</div>
            </Link>
          </div>

          <button
            onClick={handleLogout}
            className="w-full py-3.5 bg-transparent border border-[#30363d] rounded-xl text-[#7d8590] text-[14px] cursor-pointer flex items-center justify-center gap-2"
          >
            <LogOut size={16} /> Déconnexion
          </button>
        </div>
      </div>

      {/* ===== VUE DESKTOP ===== */}
      <div className="dir-desktop-home px-9 py-8">
        <div className="mb-8">
          <h1 className="text-[18px] font-extrabold mb-1">Vue synthèse</h1>
          <div className="text-[13px] text-[#7d8590]">
            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        </div>

        {!loading && stats.urgents > 0 && (
          <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 rounded-xl px-[18px] py-3.5 mb-7">
            <AlertTriangle size={20} color="#ef4444" />
            <div>
              <span className="font-bold text-red-500">{stats.urgents} ticket{stats.urgents > 1 ? 's' : ''} urgent{stats.urgents > 1 ? 's' : ''}</span>
              <span className="text-[#7d8590] text-[13px]"> en attente d&apos;intervention</span>
            </div>
          </div>
        )}

        {loading ? <div className="text-[#7d8590]">Chargement...</div> : (
          <>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <KpiCard label="Taux de résolution" value={`${tauxResolution}%`} sub={`${stats.fermes} résolus sur ${stats.total} au total`} icon={TrendingUp} color="#22c55e" big href="/directeur/synthese" />
              <KpiCard label="Charge en cours" value={`${charge}%`} sub={`${stats.ouverts} ouverts · ${stats.en_cours} en traitement`} icon={Zap} color="#2563eb" big href="/directeur/tickets" />
            </div>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <KpiCard label="Tickets urgents"  value={stats.urgents}     icon={AlertTriangle} color="#ef4444" href="/directeur/tickets?filtre=urgente" />
              <KpiCard label="Machines actives" value={stats.machines}    icon={CheckCircle2}  color="#0ea5e9" href="/directeur/machines" />
              <KpiCard label="Techniciens"       value={stats.techniciens} icon={Clock}         color="#7c3aed" href="/directeur/techniciens" />
            </div>
            {/* Nav dense desktop */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { href: '/directeur/synthese',    label: 'Vue synthèse',  sub: `${tauxResolution}% résolution`,              icon: TrendingUp,  color: '#22c55e' },
                { href: '/directeur/tickets',     label: 'Tickets',       sub: `${stats.ouverts} ouverts · ${stats.urgents} urgents`, icon: Ticket,      color: '#f59e0b' },
                { href: '/directeur/machines',    label: 'Machines',      sub: `${stats.machines} actives`,                  icon: Factory,     color: '#7c3aed' },
                { href: '/directeur/techniciens', label: 'Techniciens',   sub: `${stats.techniciens} actifs`,                icon: Users,       color: '#0ea5e9' },
                { href: '/directeur/stocks',        label: 'Stocks',            sub: stats.stockAlertes > 0 ? `${stats.stockAlertes} rupture${stats.stockAlertes > 1 ? 's' : ''}` : 'Niveaux OK', icon: Package,  color: stats.stockAlertes > 0 ? '#f59e0b' : '#10b981' },
                { href: '/directeur/rapports',      label: 'Rapports IA',       sub: 'Analyses & recommandations',           icon: BarChart3,    color: '#2563eb' },
                { href: '/directeur/recurrentes',   label: 'Pannes récurrentes', sub: 'Machines à risque',                   icon: Repeat2,      color: '#ef4444' },
                { href: '/directeur/amelioratif',   label: 'Amélioratif',       sub: 'Upgrades & optimisations',             icon: Sparkles,     color: '#7c3aed' },
              ].map(card => (
                <Link
                  key={card.href}
                  href={card.href}
                  className="no-underline bg-[#1c2128] rounded-xl px-[18px] py-4 block"
                  style={{ border: `1px solid ${card.color}33` }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-[30px] h-[30px] rounded-lg flex items-center justify-center" style={{ background: `${card.color}18` }}>
                      <card.icon size={15} color={card.color} />
                    </div>
                    <span className="text-[13px] font-bold text-[#e6edf3]">{card.label}</span>
                  </div>
                  <div className="text-[12px] text-[#7d8590]">{card.sub}</div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}
