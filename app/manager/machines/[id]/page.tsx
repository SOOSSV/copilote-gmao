'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Wrench, MapPin, AlertTriangle, CheckCircle, Clock, Package, Plus } from 'lucide-react';
import Link from 'next/link';

type Machine = {
  id: string; external_id: string; nom: string; type_equipement: string;
  localisation: string; criticite: string; statut: string; cout_heure_arret: number | null;
};

type Ticket = {
  id: string; titre: string; priorite: string; statut: string;
  type_intervention: string; created_at: string; resolu_le: string | null;
  technicians: { prenom: string; nom: string } | null;
};

type HistEntry = {
  id: string; type_action: string; description: string;
  pieces_changees: { nom: string; quantite: number; unite: string }[] | null;
  realise_le: string;
  technicians: { prenom: string; nom: string } | null;
};

type PlanPreventif = {
  id: string; nom: string; description: string | null;
  frequence_jours: number; prochaine_exec: string;
  technicians: { prenom: string; nom: string } | null;
};

const prioriteColor: Record<string, string> = { urgente: '#ef4444', haute: '#f59e0b', normale: '#2563eb', basse: '#22c55e' };
const criticiteColor: Record<string, string> = { critique: '#ef4444', haute: '#f59e0b', normale: '#2563eb', basse: '#22c55e' };

function daysBetween(a: string, b: string | null) {
  if (!b) return null;
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / (1000 * 60 * 60 * 24));
}

export default function MachineDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [machine, setMachine] = useState<Machine | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [history, setHistory] = useState<HistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'pannes' | 'historique' | 'preventif'>('pannes');
  const [plans, setPlans] = useState<PlanPreventif[]>([]);
  const [coutEdit, setCoutEdit] = useState('');
  const [savingCout, setSavingCout] = useState(false);
  const [metrics, setMetrics] = useState<{ mtbf_jours: number | null; mttr_heures: number | null; taux_resolution: number | null } | null>(null);

  useEffect(() => {
    async function load() {
      const [{ data: m }, { data: t }, { data: h }, { data: pp }] = await Promise.all([
        supabase.from('machines').select('*').eq('id', params.id).single(),
        supabase.from('tickets').select('id, titre, priorite, statut, type_intervention, created_at, resolu_le, technicians(prenom, nom)')
          .eq('machine_id', params.id).order('created_at', { ascending: false }).limit(30),
        supabase.from('maintenance_history').select('id, type_action, description, pieces_changees, realise_le, technicians(prenom, nom)')
          .eq('machine_id', params.id).order('realise_le', { ascending: false }).limit(30),
        supabase.from('preventive_plans').select('id, nom, description, frequence_jours, prochaine_exec, technicians(prenom, nom)')
          .eq('machine_id', params.id).eq('actif', true).order('prochaine_exec'),
      ]);
      if (!m) { setLoading(false); return; }
      setMachine(m as Machine);
      const { data: mx } = await supabase.rpc('get_machine_metrics', { p_machine_id: params.id });
      if (mx && mx[0]) setMetrics(mx[0]);
      setCoutEdit(m?.cout_heure_arret != null ? String(m.cout_heure_arret) : '');
      setTickets((t as unknown as Ticket[]) || []);
      setHistory((h as unknown as HistEntry[]) || []);
      setPlans((pp as unknown as PlanPreventif[]) || []);
      setLoading(false);
    }
    if (params.id) load();
  }, [params.id]);

  async function saveCout() {
    if (!machine) return;
    setSavingCout(true);
    const val = coutEdit.trim() === '' ? null : parseFloat(coutEdit);
    await supabase.from('machines').update({ cout_heure_arret: val }).eq('id', machine.id);
    setMachine(prev => prev ? { ...prev, cout_heure_arret: val } : prev);
    setSavingCout(false);
  }

  if (loading) return <div className="p-5 text-[#7d8590]">Chargement...</div>;
  if (!machine) return <div className="p-5 text-[#7d8590]">Machine introuvable</div>;

  const critColor = criticiteColor[machine.criticite] || '#2563eb';
  const totalTickets = tickets.length;
  const cutoff30j = new Date(); cutoff30j.setDate(cutoff30j.getDate() - 30);
  const pannes30j = tickets.filter(t => t.type_intervention === 'corrective' && new Date(t.created_at) >= cutoff30j).length;
  const isPanneRecurrente = pannes30j >= 3;
  const resolus = tickets.filter(t => t.statut === 'resolu').length;
  const ouverts = tickets.filter(t => t.statut === 'ouvert' || t.statut === 'en_cours').length;
  const urgents = tickets.filter(t => t.priorite === 'urgente').length;
  const durees = tickets.filter(t => t.resolu_le).map(t => daysBetween(t.created_at, t.resolu_le)).filter(d => d !== null) as number[];
  const mttr = durees.length > 0 ? Math.round(durees.reduce((a, b) => a + b, 0) / durees.length) : null;

  return (
    <div className="p-3.5 max-w-full box-border">

      {/* Header */}
      <div className="flex items-center gap-2.5 mb-4">
        <button onClick={() => router.back()} className="bg-transparent border-none cursor-pointer text-[#7d8590] p-1">
          <ArrowLeft size={22} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-[16px] font-extrabold m-0 overflow-hidden text-ellipsis whitespace-nowrap">{machine.nom}</h1>
          <div className="text-[11px] text-[#7d8590]">{machine.external_id} · {machine.type_equipement}</div>
        </div>
        <div className="flex flex-col gap-1 items-end shrink-0">
          <span
            className="rounded-md px-2.5 py-0.5 text-[11px] font-bold capitalize"
            style={{ background: `${critColor}22`, color: critColor, border: `1px solid ${critColor}44` }}
          >
            {machine.criticite}
          </span>
          {isPanneRecurrente && (
            <span className="bg-red-500/15 text-red-500 border border-red-500/25 rounded-md px-2.5 py-0.5 text-[11px] font-bold">
              ⚠️ {pannes30j}× en 30j
            </span>
          )}
        </div>
      </div>

      {/* Infos */}
      <div className="bg-[#1c2128] border border-[#30363d] rounded-xl px-3.5 py-3 mb-3.5">
        <div className="flex gap-4 flex-wrap">
          <div className="flex gap-1.5 items-center">
            <MapPin size={13} color="#7d8590" />
            <span className="text-[13px]">{machine.localisation || '—'}</span>
          </div>
          <div className="flex gap-1.5 items-center">
            <Wrench size={13} color="#7d8590" />
            <span className="text-[13px] capitalize">{machine.statut}</span>
          </div>
        </div>
      </div>

      {/* Métriques MTBF / MTTR */}
      {metrics && (
        <div className="bg-[#1c2128] border border-[#30363d] rounded-xl px-3.5 py-3 mb-3.5">
          <div className="text-[11px] font-bold text-[#7d8590] uppercase tracking-[0.5px] mb-2.5">Fiabilité machine</div>
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center">
              <div className="text-[20px] font-extrabold" style={{ color: metrics.mtbf_jours ? '#22c55e' : '#7d8590' }}>
                {metrics.mtbf_jours != null ? `${metrics.mtbf_jours}j` : '—'}
              </div>
              <div className="text-[10px] text-[#7d8590] mt-0.5">MTBF</div>
              <div className="text-[9px] text-[#7d8590]">moy. entre pannes</div>
            </div>
            <div className="text-center border-l border-r border-[#30363d]">
              <div className="text-[20px] font-extrabold" style={{ color: metrics.mttr_heures != null && metrics.mttr_heures > 24 ? '#ef4444' : '#f59e0b' }}>
                {metrics.mttr_heures != null ? `${metrics.mttr_heures}h` : '—'}
              </div>
              <div className="text-[10px] text-[#7d8590] mt-0.5">MTTR</div>
              <div className="text-[9px] text-[#7d8590]">moy. résolution</div>
            </div>
            <div className="text-center">
              <div className="text-[20px] font-extrabold text-blue-500">
                {metrics.taux_resolution != null ? `${metrics.taux_resolution}%` : '—'}
              </div>
              <div className="text-[10px] text-[#7d8590] mt-0.5">Résolution</div>
              <div className="text-[9px] text-[#7d8590]">taux global</div>
            </div>
          </div>
        </div>
      )}

      {/* Coût arrêt */}
      <div className="bg-[#1c2128] border border-[#30363d] rounded-xl px-3.5 py-3 mb-3.5">
        <div className="text-[11px] font-bold text-[#7d8590] uppercase tracking-[0.5px] mb-2.5">Impact financier</div>
        <div className="flex gap-2 items-center">
          <div className="flex-1 relative">
            <input
              type="number"
              value={coutEdit}
              onChange={e => setCoutEdit(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && saveCout()}
              placeholder="Ex: 800"
              className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg py-2 pl-3 pr-9 text-[#e6edf3] text-[13px] box-border outline-none"
            />
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[12px] text-[#7d8590]">€/h</span>
          </div>
          <button
            onClick={saveCout}
            disabled={savingCout}
            className="bg-blue-600 border-none rounded-lg px-3.5 py-2 text-white text-[12px] font-bold cursor-pointer shrink-0"
            style={{ opacity: savingCout ? 0.6 : 1 }}
          >
            {savingCout ? '...' : 'Enregistrer'}
          </button>
        </div>
        <div className="text-[11px] text-[#7d8590] mt-1.5">
          Coût par heure d&apos;arrêt — utilisé pour calculer l&apos;impact financier dans la synthèse directeur
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-4 gap-2 mb-3.5">
        {[
          { label: 'Total', value: totalTickets, color: '#2563eb' },
          { label: 'Ouverts', value: ouverts, color: ouverts > 0 ? '#f59e0b' : '#7d8590' },
          { label: 'Urgents', value: urgents, color: urgents > 0 ? '#ef4444' : '#7d8590' },
          { label: mttr !== null ? `MTTR ${mttr}j` : 'MTTR —', value: resolus, color: '#22c55e' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-[#1c2128] border border-[#30363d] rounded-[10px] py-2.5 px-3 text-center">
            <div className="text-[20px] font-extrabold" style={{ color }}>{value}</div>
            <div className="text-[10px] text-[#7d8590] mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Onglets */}
      <div className="flex gap-1 mb-3.5 bg-[#1c2128] border border-[#30363d] rounded-[10px] p-1 w-fit flex-wrap">
        {([
          ['pannes', `Tickets (${totalTickets})`],
          ['historique', `Historique (${history.length})`],
          ['preventif', `Préventif (${plans.length})`],
        ] as const).map(([v, l]) => (
          <button
            key={v}
            onClick={() => setTab(v)}
            className="px-3.5 py-1.5 rounded-lg text-[13px] cursor-pointer border-none transition-all"
            style={{
              fontWeight: tab === v ? 700 : 400,
              background: tab === v ? '#2563eb' : 'transparent',
              color: tab === v ? '#fff' : '#7d8590',
            }}
          >
            {l}
          </button>
        ))}
      </div>

      {/* Tickets */}
      {tab === 'pannes' && (
        <div className="flex flex-col gap-2">
          {tickets.length === 0 ? (
            <div className="bg-[#1c2128] border border-[#30363d] rounded-xl py-10 text-center text-[#7d8590]">Aucun ticket</div>
          ) : tickets.map(t => {
            const pc = prioriteColor[t.priorite] || '#2563eb';
            const duree = daysBetween(t.created_at, t.resolu_le);
            return (
              <div key={t.id} className="bg-[#1c2128] border border-[#30363d] rounded-[10px] px-3.5 py-3">
                <div className="flex justify-between items-start mb-1.5">
                  <div className="text-[13px] font-semibold flex-1 pr-2">{t.titre}</div>
                  <span
                    className="rounded px-1.5 py-0.5 text-[10px] font-bold uppercase shrink-0"
                    style={{ background: `${pc}22`, color: pc }}
                  >
                    {t.priorite}
                  </span>
                </div>
                <div className="flex gap-2.5 items-center flex-wrap">
                  <span
                    className="text-[11px] font-semibold"
                    style={{ color: t.statut === 'resolu' ? '#22c55e' : t.statut === 'en_cours' ? '#f59e0b' : '#2563eb' }}
                  >
                    {t.statut === 'resolu' ? '✓ Résolu' : t.statut === 'en_cours' ? '⏳ En cours' : '● Ouvert'}
                  </span>
                  {t.technicians && <span className="text-[11px] text-[#7d8590]">{(t.technicians as { prenom: string; nom: string }).prenom}</span>}
                  {duree !== null && <span className="text-[11px] text-[#7d8590]">résolu en {duree}j</span>}
                  <span className="text-[11px] text-[#7d8590] ml-auto">{new Date(t.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Plans préventifs */}
      {tab === 'preventif' && (
        <div>
          <div className="flex justify-between items-center mb-2.5">
            <span className="text-[12px] text-[#7d8590]">{plans.length} plan{plans.length !== 1 ? 's' : ''} actif{plans.length !== 1 ? 's' : ''}</span>
            <Link
              href="/manager/preventif"
              className="flex items-center gap-1.5 bg-blue-600 text-white border-none rounded-lg px-3 py-1.5 cursor-pointer text-[12px] font-semibold no-underline"
            >
              <Plus size={12} /> Gérer les plans
            </Link>
          </div>
          {plans.length === 0 ? (
            <div className="bg-[#1c2128] border border-[#30363d] rounded-xl py-8 text-center text-[#7d8590] text-[13px]">
              Aucun plan préventif pour cette machine
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {plans.map(p => {
                const days = Math.ceil((new Date(p.prochaine_exec).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                const color = days < 0 ? '#ef4444' : days <= 7 ? '#f59e0b' : '#22c55e';
                const Icon = days < 0 ? AlertTriangle : days <= 7 ? Clock : CheckCircle;
                return (
                  <div
                    key={p.id}
                    className="bg-[#1c2128] rounded-[10px] px-3.5 py-3"
                    style={{ border: `1px solid ${days < 0 ? '#ef444433' : days <= 7 ? '#f59e0b33' : '#30363d'}` }}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <div className="text-[13px] font-bold">{p.nom}</div>
                      <div className="flex items-center gap-1 shrink-0 ml-2">
                        <Icon size={11} color={color} />
                        <span className="text-[11px] font-bold" style={{ color }}>{days < 0 ? `${Math.abs(days)}j retard` : `J-${days}`}</span>
                      </div>
                    </div>
                    <div className="flex gap-2.5 items-center flex-wrap">
                      <span className="text-[11px] text-[#7d8590]">Tous les {p.frequence_jours}j</span>
                      <span className="text-[11px] text-[#7d8590]">· {new Date(p.prochaine_exec).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                      {p.technicians && (
                        <span className="text-[11px] text-[#7d8590]">· {(p.technicians as { prenom: string; nom: string }).prenom} {(p.technicians as { prenom: string; nom: string }).nom}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Historique interventions */}
      {tab === 'historique' && (
        <div className="flex flex-col gap-2">
          {history.length === 0 ? (
            <div className="bg-[#1c2128] border border-[#30363d] rounded-xl py-10 text-center text-[#7d8590]">Aucune intervention enregistrée</div>
          ) : history.map(h => (
            <div key={h.id} className="bg-[#1c2128] border border-[#30363d] rounded-[10px] px-3.5 py-3">
              <div className="flex justify-between items-start mb-1.5">
                <span className="text-[12px] font-bold bg-blue-500/15 text-blue-500 rounded px-2 py-0.5">
                  {h.type_action === 'preventive' || h.type_action === 'inspection' ? 'Préventif' : 'Correctif'}
                </span>
                <span className="text-[11px] text-[#7d8590]">{new Date(h.realise_le).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
              </div>
              {h.description && <div className="text-[13px] text-[#7d8590] mb-1.5 leading-relaxed">{h.description.substring(0, 100)}{h.description.length > 100 ? '...' : ''}</div>}
              {h.pieces_changees && h.pieces_changees.length > 0 && (
                <div className="flex gap-1.5 flex-wrap">
                  {h.pieces_changees.map((p, i) => (
                    <span key={i} className="flex items-center gap-1 bg-[#0d1117] border border-[#30363d] rounded px-1.5 py-0.5 text-[11px]">
                      <Package size={10} /> {p.quantite} {p.unite} · {p.nom}
                    </span>
                  ))}
                </div>
              )}
              {h.technicians && <div className="text-[11px] text-[#7d8590] mt-1.5">par {(h.technicians as { prenom: string; nom: string }).prenom}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
