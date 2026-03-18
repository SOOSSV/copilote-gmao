'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Wrench, MapPin, AlertTriangle, CheckCircle, Clock, Calendar, Package, Plus } from 'lucide-react';
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

  if (loading) return <div style={{ padding: 20, color: 'var(--text-secondary)' }}>Chargement...</div>;
  if (!machine) return <div style={{ padding: 20, color: 'var(--text-secondary)' }}>Machine introuvable</div>;

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
    <div style={{ padding: '14px', maxWidth: '100%', boxSizing: 'border-box' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: 4 }}>
          <ArrowLeft size={22} />
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ fontSize: 16, fontWeight: 800, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{machine.nom}</h1>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{machine.external_id} · {machine.type_equipement}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end', flexShrink: 0 }}>
          <span style={{ background: `${critColor}22`, color: critColor, border: `1px solid ${critColor}44`, borderRadius: 6, padding: '3px 10px', fontSize: 11, fontWeight: 700, textTransform: 'capitalize' }}>
            {machine.criticite}
          </span>
          {isPanneRecurrente && (
            <span style={{ background: '#ef444422', color: '#ef4444', border: '1px solid #ef444444', borderRadius: 6, padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>
              ⚠️ {pannes30j}× en 30j
            </span>
          )}
        </div>
      </div>

      {/* Infos */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '12px 14px', marginBottom: 14 }}>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <MapPin size={13} color="var(--text-secondary)" />
            <span style={{ fontSize: 13 }}>{machine.localisation || '—'}</span>
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <Wrench size={13} color="var(--text-secondary)" />
            <span style={{ fontSize: 13, textTransform: 'capitalize' }}>{machine.statut}</span>
          </div>
        </div>
      </div>

      {/* Métriques MTBF / MTTR */}
      {metrics && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '12px 14px', marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>Fiabilité machine</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: metrics.mtbf_jours ? '#22c55e' : 'var(--text-secondary)' }}>
                {metrics.mtbf_jours != null ? `${metrics.mtbf_jours}j` : '—'}
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 2 }}>MTBF</div>
              <div style={{ fontSize: 9, color: 'var(--text-secondary)' }}>moy. entre pannes</div>
            </div>
            <div style={{ textAlign: 'center', borderLeft: '1px solid var(--border)', borderRight: '1px solid var(--border)' }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: metrics.mttr_heures != null && metrics.mttr_heures > 24 ? '#ef4444' : '#f59e0b' }}>
                {metrics.mttr_heures != null ? `${metrics.mttr_heures}h` : '—'}
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 2 }}>MTTR</div>
              <div style={{ fontSize: 9, color: 'var(--text-secondary)' }}>moy. résolution</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#2563eb' }}>
                {metrics.taux_resolution != null ? `${metrics.taux_resolution}%` : '—'}
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 2 }}>Résolution</div>
              <div style={{ fontSize: 9, color: 'var(--text-secondary)' }}>taux global</div>
            </div>
          </div>
        </div>
      )}

      {/* Coût arrêt */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '12px 14px', marginBottom: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>Impact financier</div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <input
              type="number"
              value={coutEdit}
              onChange={e => setCoutEdit(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && saveCout()}
              placeholder="Ex: 800"
              style={{ width: '100%', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 36px 8px 12px', color: 'var(--text-primary)', fontSize: 13, boxSizing: 'border-box', outline: 'none' }}
            />
            <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: 'var(--text-secondary)' }}>€/h</span>
          </div>
          <button onClick={saveCout} disabled={savingCout} style={{ background: '#2563eb', border: 'none', borderRadius: 8, padding: '8px 14px', color: 'white', fontSize: 12, fontWeight: 700, cursor: 'pointer', flexShrink: 0, opacity: savingCout ? 0.6 : 1 }}>
            {savingCout ? '...' : 'Enregistrer'}
          </button>
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 6 }}>
          Coût par heure d'arrêt — utilisé pour calculer l'impact financier dans la synthèse directeur
        </div>
      </div>

      {/* KPI */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 14 }}>
        {[
          { label: 'Total', value: totalTickets, color: '#2563eb' },
          { label: 'Ouverts', value: ouverts, color: ouverts > 0 ? '#f59e0b' : 'var(--text-secondary)' },
          { label: 'Urgents', value: urgents, color: urgents > 0 ? '#ef4444' : 'var(--text-secondary)' },
          { label: mttr !== null ? `MTTR ${mttr}j` : 'MTTR —', value: resolus, color: '#22c55e' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 12px', textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 800, color }}>{value}</div>
            <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 2 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Onglets */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 14, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: 4, width: 'fit-content', flexWrap: 'wrap' }}>
        {([
          ['pannes', `Tickets (${totalTickets})`],
          ['historique', `Historique (${history.length})`],
          ['preventif', `Préventif (${plans.length})`],
        ] as const).map(([v, l]) => (
          <button key={v} onClick={() => setTab(v)} style={{ padding: '7px 14px', borderRadius: 7, fontSize: 13, fontWeight: tab === v ? 700 : 400, cursor: 'pointer', background: tab === v ? '#2563eb' : 'transparent', color: tab === v ? '#fff' : 'var(--text-secondary)', border: 'none' }}>
            {l}
          </button>
        ))}
      </div>

      {/* Tickets */}
      {tab === 'pannes' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {tickets.length === 0 ? (
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>Aucun ticket</div>
          ) : tickets.map(t => {
            const pc = prioriteColor[t.priorite] || '#2563eb';
            const duree = daysBetween(t.created_at, t.resolu_le);
            return (
              <div key={t.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, flex: 1, paddingRight: 8 }}>{t.titre}</div>
                  <span style={{ background: `${pc}22`, color: pc, borderRadius: 5, padding: '2px 7px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', flexShrink: 0 }}>{t.priorite}</span>
                </div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 11, color: t.statut === 'resolu' ? '#22c55e' : t.statut === 'en_cours' ? '#f59e0b' : '#2563eb', fontWeight: 600 }}>
                    {t.statut === 'resolu' ? '✓ Résolu' : t.statut === 'en_cours' ? '⏳ En cours' : '● Ouvert'}
                  </span>
                  {t.technicians && <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{(t.technicians as { prenom: string; nom: string }).prenom}</span>}
                  {duree !== null && <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>résolu en {duree}j</span>}
                  <span style={{ fontSize: 11, color: 'var(--text-secondary)', marginLeft: 'auto' }}>{new Date(t.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Plans préventifs */}
      {tab === 'preventif' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{plans.length} plan{plans.length !== 1 ? 's' : ''} actif{plans.length !== 1 ? 's' : ''}</span>
            <Link href="/manager/preventif" style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>
              <Plus size={12} /> Gérer les plans
            </Link>
          </div>
          {plans.length === 0 ? (
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: 32, textAlign: 'center', color: 'var(--text-secondary)', fontSize: 13 }}>
              Aucun plan préventif pour cette machine
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {plans.map(p => {
                const days = Math.ceil((new Date(p.prochaine_exec).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                const color = days < 0 ? '#ef4444' : days <= 7 ? '#f59e0b' : '#22c55e';
                const Icon = days < 0 ? AlertTriangle : days <= 7 ? Clock : CheckCircle;
                return (
                  <div key={p.id} style={{ background: 'var(--bg-card)', border: `1px solid ${days < 0 ? '#ef444433' : days <= 7 ? '#f59e0b33' : 'var(--border)'}`, borderRadius: 10, padding: '12px 14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                      <div style={{ fontSize: 13, fontWeight: 700 }}>{p.nom}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0, marginLeft: 8 }}>
                        <Icon size={11} color={color} />
                        <span style={{ fontSize: 11, color, fontWeight: 700 }}>{days < 0 ? `${Math.abs(days)}j retard` : `J-${days}`}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Tous les {p.frequence_jours}j</span>
                      <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>· {new Date(p.prochaine_exec).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                      {p.technicians && (
                        <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>· {(p.technicians as { prenom: string; nom: string }).prenom} {(p.technicians as { prenom: string; nom: string }).nom}</span>
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {history.length === 0 ? (
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>Aucune intervention enregistrée</div>
          ) : history.map(h => (
            <div key={h.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 700, background: '#2563eb22', color: '#2563eb', borderRadius: 5, padding: '2px 8px' }}>
                  {h.type_action === 'preventive' || h.type_action === 'inspection' ? 'Préventif' : 'Correctif'}
                </span>
                <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{new Date(h.realise_le).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
              </div>
              {h.description && <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6, lineHeight: 1.5 }}>{h.description.substring(0, 100)}{h.description.length > 100 ? '...' : ''}</div>}
              {h.pieces_changees && h.pieces_changees.length > 0 && (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {h.pieces_changees.map((p, i) => (
                    <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 5, padding: '2px 7px', fontSize: 11 }}>
                      <Package size={10} /> {p.quantite} {p.unite} · {p.nom}
                    </span>
                  ))}
                </div>
              )}
              {h.technicians && <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 6 }}>par {(h.technicians as { prenom: string; nom: string }).prenom}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
