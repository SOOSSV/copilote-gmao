'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { AlertTriangle, CheckCircle, Clock, Wrench, TrendingUp, Activity, Ticket, Factory, Users, BarChart3, MessageCircle, PlusCircle, LogOut, Bell, Package, ShoppingCart, Repeat2, Sparkles, HardHat } from 'lucide-react';
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
    <div className="bg-[#1c2128] border border-[#30363d] rounded-[14px] px-[22px] py-5 cursor-pointer">
      <div className="flex justify-between items-start">
        <div>
          <div className="text-[12px] text-[#7d8590] font-semibold uppercase tracking-[0.5px] mb-2">{label}</div>
          <div className="text-[32px] font-extrabold" style={{ color }}>{value}</div>
          {sub && <div className="text-[12px] text-[#7d8590] mt-1">{sub}</div>}
        </div>
        <div className="w-[42px] h-[42px] rounded-[10px] flex items-center justify-center" style={{ background: `${color}18` }}>
          <Icon size={20} color={color} />
        </div>
      </div>
    </div>
  );
  return href ? <Link href={href} className="no-underline">{inner}</Link> : inner;
}

export default function ManagerDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats>({ total: 0, ouverts: 0, en_cours: 0, fermes: 0, urgents: 0, machines: 0, techniciens: 0, stockAlertes: 0, machinesActives: 0, machinesInactives: 0, machinesHorsService: 0 });
  const [recents, setRecents] = useState<TicketRecent[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);
  const [applyingSuggestion, setApplyingSuggestion] = useState(false);
  const [nbPannesRecurrentes, setNbPannesRecurrentes] = useState(0);
  const [nbAmelioratifs, setNbAmelioratifs] = useState(0);

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

    // Pannes récurrentes + Amélioratifs
    const [{ data: pr }, { data: amelio }] = await Promise.all([
      supabase.rpc('get_pannes_recurrentes', { seuil: 3, jours: 30 }),
      supabase.from('tickets').select('id').eq('type_intervention', 'ameliorative').in('statut', ['ouvert', 'en_cours']),
    ]);
    setNbPannesRecurrentes((pr as unknown[])?.length || 0);
    setNbAmelioratifs((amelio as unknown[])?.length || 0);

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

  return (
    <>
      {/* ===== VUE MOBILE : Menu cartes ===== */}
      <div className="mgr-mobile-home">
        <div className="px-4 pt-6 pb-24">
          {/* Header */}
          <div className="mb-6">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-[22px] font-extrabold text-[#e6edf3] tracking-[-0.5px] mb-0.5">COPILOTE</div>
                <div className="text-[13px] text-[#7d8590]">Espace Manager · {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
              </div>
            </div>
          </div>

          {/* Alertes urgentes */}
          {stats.urgents > 0 && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-2.5 flex items-center gap-2.5">
              <AlertTriangle size={18} color="#ef4444" />
              <span className="text-red-500 font-semibold text-[14px]">{stats.urgents} ticket{stats.urgents > 1 ? 's' : ''} urgent{stats.urgents > 1 ? 's' : ''} en attente</span>
            </div>
          )}
          {/* Alertes stocks */}
          {stats.stockAlertes > 0 && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 mb-5 flex items-center gap-2.5">
              <ShoppingCart size={18} color="#f59e0b" />
              <span className="text-amber-500 font-semibold text-[14px]">{stats.stockAlertes} pièce{stats.stockAlertes > 1 ? 's' : ''} en rupture de stock</span>
            </div>
          )}

          {/* KPI rapides */}
          <div className="grid grid-cols-3 gap-2.5 mb-6">
            {[
              { label: 'Ouverts', value: stats.ouverts, color: '#2563eb', filtre: 'ouvert' },
              { label: 'En cours', value: stats.en_cours, color: '#f59e0b', filtre: 'en_cours' },
              { label: 'Résolus', value: stats.fermes, color: '#22c55e', filtre: 'resolu' },
            ].map(k => (
              <Link
                key={k.label}
                href={`/manager/tickets?filtre=${k.filtre}`}
                className="bg-[#1c2128] border border-[#30363d] rounded-xl py-3.5 px-3 text-center no-underline block"
              >
                <div className="text-[26px] font-extrabold" style={{ color: k.color }}>{k.value}</div>
                <div className="text-[11px] text-[#7d8590] mt-0.5">{k.label}</div>
              </Link>
            ))}
          </div>

          {/* Tableau de bord + Tickets */}
          <div className="grid grid-cols-2 gap-2.5 mb-2.5">
            <Link
              href="/manager/dashboard"
              className="bg-[#1c2128] rounded-[14px] p-3.5 no-underline text-inherit"
              style={{ border: `1px solid ${stats.urgents > 0 ? '#ef444433' : '#30363d'}` }}
            >
              <div className="flex items-center gap-1.5 mb-2.5">
                <BarChart3 size={14} color="#2563eb" />
                <span className="text-[12px] font-bold text-blue-500">Tableau de bord</span>
              </div>
              {stats.urgents > 0
                ? <><div className="text-[24px] font-extrabold text-red-500 mb-0.5">{stats.urgents}</div><div className="text-[11px] text-red-500">urgent{stats.urgents > 1 ? 's' : ''}</div></>
                : <div className="text-[11px] text-[#7d8590] mt-1">Aucune urgence</div>
              }
            </Link>
            <Link href="/manager/tickets" className="bg-[#1c2128] border border-[#30363d] rounded-[14px] p-3.5 no-underline text-inherit">
              <div className="flex items-center gap-1.5 mb-2.5">
                <Ticket size={14} color="#f59e0b" />
                <span className="text-[12px] font-bold text-amber-500">Tickets</span>
              </div>
              <div className="text-[24px] font-extrabold text-amber-500 mb-0.5">{stats.ouverts}</div>
              <div className="text-[11px] text-[#7d8590]">ouverts · {stats.en_cours} en cours</div>
            </Link>
          </div>

          {/* Machines + Techniciens */}
          <div className="grid grid-cols-2 gap-2.5 mb-2.5">
            <Link href="/manager/machines" className="bg-[#1c2128] border border-[#30363d] rounded-[14px] p-3.5 no-underline text-inherit">
              <div className="flex items-center gap-1.5 mb-2.5">
                <Factory size={14} color="#7c3aed" />
                <span className="text-[12px] font-bold text-violet-600">Machines</span>
              </div>
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between text-[11px]">
                  <span className="text-[#7d8590]">● Actives</span>
                  <span className="font-bold text-green-500">{stats.machinesActives}</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-[#7d8590]">● Inactives</span>
                  <span className="font-bold text-amber-500">{stats.machinesInactives}</span>
                </div>
                {stats.machinesHorsService > 0 && (
                  <div className="flex justify-between text-[11px]">
                    <span className="text-[#7d8590]">● Hors service</span>
                    <span className="font-bold text-red-500">{stats.machinesHorsService}</span>
                  </div>
                )}
              </div>
            </Link>
            <Link href="/manager/technicians" className="bg-[#1c2128] border border-[#30363d] rounded-[14px] p-3.5 no-underline text-inherit">
              <div className="flex items-center gap-1.5 mb-2.5">
                <Users size={14} color="#06b6d4" />
                <span className="text-[12px] font-bold text-cyan-500">Techniciens</span>
              </div>
              <div className="text-[28px] font-extrabold text-cyan-500 mb-1">{stats.techniciens}</div>
              <div className="text-[11px] text-[#7d8590]">
                {stats.en_cours} intervention{stats.en_cours > 1 ? 's' : ''} en cours
              </div>
            </Link>
          </div>

          {/* Barre IA suggestion */}
          {suggestion && !loading && (
            <div className="bg-blue-500/8 border border-blue-500/25 rounded-[14px] p-3.5 mb-3">
              <div className="flex gap-2.5 items-start mb-3">
                <span className="text-[20px] shrink-0">🤖</span>
                <div className="text-[13px] leading-relaxed text-[#7d8590]">
                  Je suggère d&apos;assigner{' '}
                  <strong className="text-[#e6edf3]">{suggestion.tech?.prenom} {suggestion.tech?.nom}</strong>
                  {' '}au ticket urgent :{' '}
                  <span>&quot;{suggestion.ticket?.titre}&quot;</span>
                  {suggestion.ticket?.machines && (
                    <span> — {(suggestion.ticket.machines as { nom: string }).nom}</span>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={applySuggestion}
                  disabled={applyingSuggestion}
                  className="flex-1 bg-blue-600 border-none rounded-lg py-2 text-white text-[13px] font-bold cursor-pointer"
                  style={{ opacity: applyingSuggestion ? 0.7 : 1 }}
                >
                  {applyingSuggestion ? 'Assignation...' : '✓ Assigner'}
                </button>
                <button
                  onClick={() => setSuggestion(null)}
                  className="px-3.5 py-2 bg-[#1c2128] border border-[#30363d] rounded-lg text-[#7d8590] text-[13px] cursor-pointer"
                >
                  Ignorer
                </button>
              </div>
            </div>
          )}

          {/* Stocks + Rapports IA */}
          <div className="grid grid-cols-2 gap-2.5 mb-2.5">
            <Link
              href="/manager/stocks"
              className="bg-[#1c2128] rounded-[14px] p-3.5 no-underline text-inherit"
              style={{ border: `1px solid ${stats.stockAlertes > 0 ? '#f59e0b44' : '#30363d'}` }}
            >
              <div className="flex items-center gap-1.5 mb-2.5">
                <Package size={14} color="#f59e0b" />
                <span className="text-[12px] font-bold text-amber-500">Stocks</span>
              </div>
              {stats.stockAlertes > 0
                ? <><div className="text-[24px] font-extrabold text-amber-500 mb-0.5">{stats.stockAlertes}</div><div className="text-[11px] text-amber-500">rupture{stats.stockAlertes > 1 ? 's' : ''} détectée{stats.stockAlertes > 1 ? 's' : ''}</div></>
                : <div className="text-[11px] text-[#7d8590] mt-1">Niveaux OK</div>
              }
            </Link>
            <Link href="/manager/rapports" className="bg-[#1c2128] border border-[#30363d] rounded-[14px] p-3.5 no-underline text-inherit">
              <div className="flex items-center gap-1.5 mb-2.5">
                <BarChart3 size={14} color="#22c55e" />
                <span className="text-[12px] font-bold text-green-500">Rapports IA</span>
              </div>
              <div className="text-[11px] text-[#7d8590]">Analyses & recommandations</div>
            </Link>
          </div>

          {/* Préventif + Chat IA */}
          <div className="grid grid-cols-2 gap-2.5 mb-2.5">
            <Link href="/manager/preventif" className="bg-[#1c2128] border border-[#30363d] rounded-[14px] p-3.5 no-underline text-inherit">
              <div className="flex items-center gap-1.5 mb-2.5">
                <CheckCircle size={14} color="#06b6d4" />
                <span className="text-[12px] font-bold text-cyan-500">Préventif</span>
              </div>
              <div className="text-[11px] text-[#7d8590]">Plans maintenance</div>
            </Link>
            <Link href="/manager/chat" className="bg-[#1c2128] border border-[#30363d] rounded-[14px] p-3.5 no-underline text-inherit">
              <div className="flex items-center gap-1.5 mb-2.5">
                <MessageCircle size={14} color="#0ea5e9" />
                <span className="text-[12px] font-bold text-sky-500">Chat IA</span>
              </div>
              <div className="text-[11px] text-[#7d8590]">Copilote assistant</div>
            </Link>
          </div>

          {/* Pannes récurrentes + Amélioratif */}
          <div className="grid grid-cols-2 gap-2.5 mb-2.5">
            <Link
              href="/manager/recurrentes"
              className="rounded-[14px] p-3.5 no-underline text-inherit"
              style={{ background: nbPannesRecurrentes > 0 ? '#ef444412' : '#1c2128', border: `1px solid ${nbPannesRecurrentes > 0 ? '#ef444433' : '#30363d'}` }}
            >
              <div className="flex items-center gap-1.5 mb-2.5">
                <Repeat2 size={14} color="#ef4444" />
                <span className="text-[12px] font-bold text-red-500">Récurrentes</span>
              </div>
              <div className="text-[20px] font-extrabold" style={{ color: nbPannesRecurrentes > 0 ? '#ef4444' : '#7d8590' }}>{nbPannesRecurrentes}</div>
              <div className="text-[11px] text-[#7d8590] mt-0.5">machine{nbPannesRecurrentes > 1 ? 's' : ''} à risque</div>
            </Link>
            <Link
              href="/manager/amelioratif"
              className="rounded-[14px] p-3.5 no-underline text-inherit"
              style={{ background: nbAmelioratifs > 0 ? '#7c3aed12' : '#1c2128', border: `1px solid ${nbAmelioratifs > 0 ? '#7c3aed33' : '#30363d'}` }}
            >
              <div className="flex items-center gap-1.5 mb-2.5">
                <Sparkles size={14} color="#7c3aed" />
                <span className="text-[12px] font-bold text-violet-600">Amélioratif</span>
              </div>
              <div className="text-[20px] font-extrabold" style={{ color: nbAmelioratifs > 0 ? '#7c3aed' : '#7d8590' }}>{nbAmelioratifs}</div>
              <div className="text-[11px] text-[#7d8590] mt-0.5">en cours</div>
            </Link>
          </div>

          {/* Techniciens */}
          <div className="mb-2.5">
            <Link href="/manager/technicians" className="bg-[#1c2128] border border-[#30363d] rounded-[14px] p-3.5 no-underline text-inherit block">
              <div className="flex items-center gap-1.5">
                <HardHat size={14} color="#2563eb" />
                <span className="text-[12px] font-bold text-blue-500">Gérer les techniciens</span>
              </div>
            </Link>
          </div>

          {/* Nouveau ticket */}
          <div className="mb-2.5">
            <Link href="/manager/nouveau" className="bg-emerald-500/8 border border-emerald-500/20 rounded-[14px] p-3.5 no-underline text-inherit block">
              <div className="flex items-center gap-1.5">
                <PlusCircle size={14} color="#10b981" />
                <span className="text-[12px] font-bold text-emerald-500">Nouveau ticket</span>
                <span className="ml-auto text-[13px] text-emerald-500 font-bold">+ Créer</span>
              </div>
            </Link>
          </div>

          {/* Notifications */}
          <div className="bg-[#1c2128] border border-[#30363d] rounded-[14px] p-3.5 mb-2.5">
            <div className="flex items-center gap-1.5 mb-2">
              <Bell size={14} color="#2563eb" />
              <span className="text-[12px] font-bold text-blue-500">Notifications push</span>
            </div>
            <PushNotifSetup role="manager" fullCard={false} />
          </div>

          {/* Déconnexion */}
          <button
            onClick={handleLogout}
            className="w-full mt-5 py-3.5 bg-transparent border border-[#30363d] rounded-xl text-[#7d8590] text-[14px] cursor-pointer flex items-center justify-center gap-2"
          >
            <LogOut size={16} /> Déconnexion
          </button>
        </div>
      </div>

      {/* ===== VUE DESKTOP : Dashboard classique ===== */}
      <div className="mgr-desktop-home px-8 py-7">
        <div className="mb-7 flex justify-between items-start">
          <div>
            <h1 className="text-[22px] font-extrabold mb-1">Tableau de bord</h1>
            <div className="text-[13px] text-[#7d8590]">
              {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="mgr-refresh-info text-[12px] text-[#7d8590]">
              Mis à jour à {lastRefresh.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
            <button
              onClick={load}
              className="bg-[#1c2128] border border-[#30363d] rounded-lg px-3 py-1.5 cursor-pointer text-[#7d8590] text-[12px] flex items-center gap-1.5"
            >
              <Activity size={13} /> Rafraîchir
            </button>
          </div>
        </div>

        {!loading && stats.stockAlertes > 0 && (
          <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/30 rounded-xl px-[18px] py-3.5 mb-5">
            <ShoppingCart size={20} color="#f59e0b" />
            <div>
              <span className="font-bold text-amber-500">{stats.stockAlertes} pièce{stats.stockAlertes > 1 ? 's' : ''} en rupture</span>
              <span className="text-[#7d8590] text-[13px]"> — stock sous le seuil minimum</span>
            </div>
          </div>
        )}
        {loading ? <div className="text-[#7d8590]">Chargement...</div> : (
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
            <div className="bg-[#1c2128] border border-[#30363d] rounded-[14px] overflow-hidden">
              <div className="px-5 py-4 border-b border-[#30363d] font-bold text-[14px]">Tickets récents</div>
              <div className="mgr-table-wrap">
                <table className="w-full border-collapse" style={{ minWidth: 500 }}>
                  <thead>
                    <tr className="border-b border-[#30363d]">
                      {['Titre', 'Machine', 'Priorité', 'Statut', 'Date'].map(h => (
                        <th key={h} className="px-5 py-2.5 text-left text-[11px] text-[#7d8590] font-semibold uppercase tracking-[0.5px]">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {recents.map((t, i) => (
                      <tr key={t.id} style={{ borderBottom: i < recents.length - 1 ? '1px solid #30363d' : 'none' }}>
                        <td className="px-5 py-3 text-[13px] font-medium max-w-[220px] overflow-hidden text-ellipsis whitespace-nowrap">{t.titre}</td>
                        <td className="px-5 py-3 text-[13px] text-[#7d8590]">{t.machines?.nom || '—'}</td>
                        <td className="px-5 py-3">
                          <span className="rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase" style={{ background: `${prioriteColor[t.priorite]}22`, color: prioriteColor[t.priorite], border: `1px solid ${prioriteColor[t.priorite]}44` }}>{t.priorite}</span>
                        </td>
                        <td className="px-5 py-3">
                          <span className="rounded-md px-2 py-0.5 text-[11px] font-semibold capitalize" style={{ background: t.statut === 'resolu' ? '#22c55e22' : t.statut === 'en_cours' ? '#f59e0b22' : '#2563eb22', color: t.statut === 'resolu' ? '#22c55e' : t.statut === 'en_cours' ? '#f59e0b' : '#2563eb' }}>{t.statut.replace('_', ' ')}</span>
                        </td>
                        <td className="px-5 py-3 text-[12px] text-[#7d8590]">{formatDate(t.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Cartes navigation rapide — desktop */}
            <div className="mt-5">
              <div className="text-[11px] font-bold text-[#7d8590] uppercase tracking-[0.8px] mb-3">Accès rapide</div>
              <div className="grid grid-cols-3 gap-3 mb-3">
                <Link href="/manager/recurrentes" className="bg-[#1c2128] rounded-[14px] p-4 no-underline text-inherit" style={{ border: `1px solid ${nbPannesRecurrentes > 0 ? '#ef444433' : '#30363d'}`, background: nbPannesRecurrentes > 0 ? '#ef444412' : '#1c2128' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <Repeat2 size={15} color="#ef4444" />
                    <span className="text-[13px] font-bold text-red-500">Récurrentes</span>
                  </div>
                  <div className="text-[22px] font-extrabold" style={{ color: nbPannesRecurrentes > 0 ? '#ef4444' : '#7d8590' }}>{nbPannesRecurrentes}</div>
                  <div className="text-[11px] text-[#7d8590] mt-0.5">machine{nbPannesRecurrentes !== 1 ? 's' : ''} à risque</div>
                </Link>
                <Link href="/manager/amelioratif" className="rounded-[14px] p-4 no-underline text-inherit" style={{ background: nbAmelioratifs > 0 ? '#7c3aed12' : '#1c2128', border: `1px solid ${nbAmelioratifs > 0 ? '#7c3aed33' : '#30363d'}` }}>
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles size={15} color="#7c3aed" />
                    <span className="text-[13px] font-bold text-violet-600">Amélioratif</span>
                  </div>
                  <div className="text-[22px] font-extrabold" style={{ color: nbAmelioratifs > 0 ? '#7c3aed' : '#7d8590' }}>{nbAmelioratifs}</div>
                  <div className="text-[11px] text-[#7d8590] mt-0.5">en cours</div>
                </Link>
                <Link href="/manager/technicians" className="bg-[#1c2128] border border-[#30363d] rounded-[14px] p-4 no-underline text-inherit">
                  <div className="flex items-center gap-2 mb-2">
                    <HardHat size={15} color="#2563eb" />
                    <span className="text-[13px] font-bold text-blue-500">Gérer techniciens</span>
                  </div>
                  <div className="text-[22px] font-extrabold text-cyan-500">{stats.techniciens}</div>
                  <div className="text-[11px] text-[#7d8590] mt-0.5">technicien{stats.techniciens !== 1 ? 's' : ''} actif{stats.techniciens !== 1 ? 's' : ''}</div>
                </Link>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <Link href="/manager/preventif" className="bg-[#1c2128] border border-[#30363d] rounded-[14px] p-4 no-underline text-inherit">
                  <div className="flex items-center gap-2 mb-1.5">
                    <CheckCircle size={15} color="#06b6d4" />
                    <span className="text-[13px] font-bold text-cyan-500">Préventif</span>
                  </div>
                  <div className="text-[12px] text-[#7d8590]">Plans de maintenance</div>
                </Link>
                <Link href="/manager/chat" className="bg-[#1c2128] border border-[#30363d] rounded-[14px] p-4 no-underline text-inherit">
                  <div className="flex items-center gap-2 mb-1.5">
                    <MessageCircle size={15} color="#0ea5e9" />
                    <span className="text-[13px] font-bold text-sky-500">Chat IA</span>
                  </div>
                  <div className="text-[12px] text-[#7d8590]">Copilote assistant</div>
                </Link>
                <Link href="/manager/nouveau" className="rounded-[14px] p-4 no-underline text-inherit" style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)' }}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <PlusCircle size={15} color="#10b981" />
                    <span className="text-[13px] font-bold text-emerald-500">Nouveau ticket</span>
                  </div>
                  <div className="text-[12px] text-[#7d8590]">Créer une intervention</div>
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
