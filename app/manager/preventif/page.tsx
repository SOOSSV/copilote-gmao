'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Calendar, AlertTriangle, CheckCircle, Clock, Plus, X, Save, ArrowLeft, Bot, Loader2, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';

type Plan = {
  id: string;
  machine_id: string;
  nom: string;
  description: string | null;
  frequence_jours: number;
  prochaine_exec: string;
  actif: boolean;
  technicien_id: string | null;
  machines: { nom: string; localisation: string } | null;
  technicians: { prenom: string; nom: string } | null;
};

type Machine = { id: string; nom: string; localisation: string };
type Tech = { id: string; prenom: string; nom: string };
type IASuggestion = { titre: string; description: string; frequence_jours: number };

const emptyForm = { machine_id: '', nom: '', description: '', frequence_jours: '30', prochaine_exec: '', technicien_id: '' };

const inp: React.CSSProperties = { width: '100%', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 8, padding: '9px 12px', color: 'var(--text-primary)', fontSize: 13, boxSizing: 'border-box', outline: 'none' };
const lbl: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 5 };

export default function PreventifPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [techs, setTechs] = useState<Tech[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<'tous' | 'urgent' | 'ok'>('tous');
  const [iaSuggestions, setIaSuggestions] = useState<IASuggestion[]>([]);
  const [iaLoading, setIaLoading] = useState(false);
  const [iaError, setIaError] = useState<string | null>(null);
  const [donePlanId, setDonePlanId] = useState<string | null>(null);
  const [doneError, setDoneError] = useState<string | null>(null);
  const [doneSuccess, setDoneSuccess] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  async function load() {
    const [{ data: p }, { data: m }, { data: t }] = await Promise.all([
      supabase.from('preventive_plans').select('id, machine_id, nom, description, frequence_jours, prochaine_exec, actif, technicien_id, machines(nom, localisation), technicians(prenom, nom)').eq('actif', true).order('prochaine_exec'),
      supabase.from('machines').select('id, nom, localisation').eq('statut', 'actif').order('nom'),
      supabase.from('technicians').select('id, prenom, nom').order('prenom'),
    ]);
    setPlans((p as unknown as Plan[]) || []);
    setMachines((m as Machine[]) || []);
    setTechs((t as Tech[]) || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function getDaysLeft(date: string) {
    return Math.ceil((new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  }

  function getStatus(days: number) {
    if (days < 0) return { color: '#ef4444', label: `${Math.abs(days)}j retard`, icon: AlertTriangle };
    if (days <= 7) return { color: '#f59e0b', label: `J-${days}`, icon: Clock };
    return { color: '#22c55e', label: `J-${days}`, icon: CheckCircle };
  }

  async function save() {
    if (!form.machine_id || !form.nom || !form.prochaine_exec) return;
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch('/api/preventif', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setSaveError(data.error || 'Erreur inconnue');
        return;
      }
      setShowForm(false);
      setForm(emptyForm);
      setIaSuggestions([]);
      load();
    } catch {
      setSaveError('Erreur réseau');
    } finally {
      setSaving(false);
    }
  }

  async function markDone(plan: Plan) {
    setDonePlanId(plan.id);
    setDoneError(null);
    setDoneSuccess(null);
    const now = new Date().toISOString();
    const next = new Date();
    next.setDate(next.getDate() + plan.frequence_jours);

    try {
      // 1. Mettre à jour la prochaine échéance
      const { error: e1 } = await supabase.from('preventive_plans').update({ prochaine_exec: next.toISOString() }).eq('id', plan.id);
      if (e1) throw new Error(`Plan: ${e1.message}`);

      // 2. Créer un ticket préventif résolu pour la traçabilité
      const { data: ticket, error: e2 } = await supabase.from('tickets').insert({
        titre: plan.nom,
        description: plan.description || `Maintenance préventive réalisée : ${plan.nom}`,
        machine_id: plan.machine_id,
        technicien_id: plan.technicien_id || null,
        type_intervention: 'preventive',
        priorite: 'normale',
        statut: 'resolu',
        classification: 'autre',
        resolu_le: now,
      }).select('id').single();
      if (e2) throw new Error(`Ticket: ${e2.message}`);

      // 3. Log dans maintenance_history
      const { error: e3 } = await supabase.from('maintenance_history').insert({
        ticket_id: ticket?.id || null,
        machine_id: plan.machine_id,
        technicien_id: plan.technicien_id || null,
        type_action: 'inspection',
        description: plan.nom,
        observations: `Plan préventif — fréquence ${plan.frequence_jours}j. Prochaine : ${next.toLocaleDateString('fr-FR')}`,
        realise_le: now,
      });
      if (e3) throw new Error(`Historique: ${e3.message}`);

      setDoneSuccess(`✓ "${plan.nom}" enregistré — prochain dans ${plan.frequence_jours}j`);
      setTimeout(() => setDoneSuccess(null), 4000);
      load();
    } catch (err) {
      setDoneError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setDonePlanId(null);
    }
  }

  async function remove(id: string) {
    if (!confirm('Supprimer ce plan ?')) return;
    await supabase.from('preventive_plans').update({ actif: false }).eq('id', id);
    load();
  }

  async function loadIASuggestions() {
    if (!form.machine_id) return;
    setIaLoading(true);
    setIaSuggestions([]);
    setIaError(null);
    try {
      const res = await fetch('/api/preventif-ia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ machine_id: form.machine_id }),
      });
      const data = await res.json();
      if (data.plans) {
        setIaSuggestions(data.plans);
      } else {
        setIaError(data.error || 'Réponse vide');
      }
    } catch {
      setIaError('Erreur réseau');
    } finally {
      setIaLoading(false);
    }
  }

  function applySuggestion(s: IASuggestion) {
    setForm(f => ({ ...f, nom: s.titre, description: s.description, frequence_jours: String(s.frequence_jours) }));
    setIaSuggestions([]);
  }

  const now = Date.now();
  const retard = plans.filter(p => new Date(p.prochaine_exec).getTime() < now).length;
  const urgent = plans.filter(p => { const d = getDaysLeft(p.prochaine_exec); return d >= 0 && d <= 7; }).length;

  const filtered = plans.filter(p => {
    const d = getDaysLeft(p.prochaine_exec);
    if (filter === 'urgent') return d <= 7;
    if (filter === 'ok') return d > 7;
    return true;
  });

  return (
    <div style={{ padding: 'clamp(14px, 4vw, 28px)', maxWidth: 1000, boxSizing: 'border-box' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
          <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '2px 4px', display: 'flex', alignItems: 'center', marginTop: 1 }}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 style={{ fontSize: 16, fontWeight: 800, marginBottom: 2 }}>Maintenance Préventive</h1>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{plans.length} plan{plans.length > 1 ? 's' : ''} · {retard} en retard · {urgent} cette semaine</div>
          </div>
        </div>
        <button onClick={() => setShowForm(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#2563eb', color: '#fff', border: 'none', borderRadius: 10, padding: '9px 16px', cursor: 'pointer', fontWeight: 600, fontSize: 13, flexShrink: 0 }}>
          <Plus size={15} /> Nouveau plan
        </button>
      </div>

      {/* KPI */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 20 }}>
        {[
          { label: 'En retard', value: retard, color: retard > 0 ? '#ef4444' : 'var(--text-secondary)', border: retard > 0 ? '#ef444433' : 'var(--border)' },
          { label: 'Cette semaine', value: urgent, color: urgent > 0 ? '#f59e0b' : 'var(--text-secondary)', border: urgent > 0 ? '#f59e0b33' : 'var(--border)' },
          { label: 'À venir', value: plans.length - retard - urgent, color: '#22c55e', border: 'var(--border)' },
        ].map(k => (
          <div key={k.label} style={{ background: 'var(--bg-card)', border: `1px solid ${k.border}`, borderRadius: 12, padding: '14px 16px' }}>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>{k.label}</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: k.color }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Filtres */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        {([['tous', 'Tous'], ['urgent', 'Urgent / Retard'], ['ok', 'OK']] as const).map(([v, l]) => (
          <button key={v} onClick={() => setFilter(v)} style={{ padding: '7px 13px', borderRadius: 8, fontSize: 13, fontWeight: filter === v ? 700 : 400, cursor: 'pointer', background: filter === v ? '#2563eb22' : 'var(--bg-card)', border: `1px solid ${filter === v ? '#2563eb66' : 'var(--border)'}`, color: filter === v ? '#2563eb' : 'var(--text-secondary)' }}>
            {l}
          </button>
        ))}
      </div>

      {/* Toasts feedback */}
      {doneSuccess && (
        <div style={{ background: '#22c55e18', border: '1px solid #22c55e44', borderRadius: 10, padding: '10px 14px', marginBottom: 12, fontSize: 13, color: '#22c55e', fontWeight: 600 }}>
          {doneSuccess}
        </div>
      )}
      {doneError && (
        <div style={{ background: '#ef444418', border: '1px solid #ef444444', borderRadius: 10, padding: '10px 14px', marginBottom: 12, fontSize: 13, color: '#ef4444' }}>
          ⚠️ Erreur : {doneError}
        </div>
      )}

      {/* Liste */}
      {loading ? (
        <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Chargement...</div>
      ) : filtered.length === 0 ? (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: 40, textAlign: 'center', color: 'var(--text-secondary)', fontSize: 13 }}>Aucun plan trouvé</div>
      ) : (
        <>
          {/* Mobile */}
          <div className="preventif-mobile" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filtered.map(p => {
              const days = getDaysLeft(p.prochaine_exec);
              const st = getStatus(days);
              const Icon = st.icon;
              const isProcessing = donePlanId === p.id;
              return (
                <div key={p.id} style={{ background: 'var(--bg-card)', border: `1px solid ${days < 0 ? '#ef444433' : days <= 7 ? '#f59e0b33' : 'var(--border)'}`, borderRadius: 10, padding: '12px 14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                    <div style={{ flex: 1, paddingRight: 8 }}>
                      <div style={{ fontSize: 13, fontWeight: 700 }}>{p.nom}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                        {p.machines?.nom || '—'}
                        {p.technicians && <span> · {(p.technicians as { prenom: string; nom: string }).prenom}</span>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                      <Icon size={12} color={st.color} />
                      <span style={{ fontSize: 12, color: st.color, fontWeight: 700 }}>{st.label}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Tous les {p.frequence_jours}j</span>
                      <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>· {new Date(p.prochaine_exec).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => markDone(p)} disabled={isProcessing} style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#22c55e18', border: 'none', borderRadius: 6, padding: '5px 10px', cursor: 'pointer', color: '#22c55e', fontSize: 12, fontWeight: 600, opacity: isProcessing ? 0.6 : 1 }}>
                        {isProcessing ? <><Loader2 size={11} style={{ animation: 'spin 1s linear infinite' }} /> En cours</> : '✓ Fait'}
                      </button>
                      <button onClick={() => remove(p.id)} style={{ background: '#ef444418', border: 'none', borderRadius: 6, padding: '5px 8px', cursor: 'pointer', color: '#ef4444' }}><X size={12} /></button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop */}
          <div className="preventif-desktop" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Statut', 'Machine', 'Opération', 'Technicien', 'Fréquence', 'Prochaine date', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, i) => {
                  const days = getDaysLeft(p.prochaine_exec);
                  const st = getStatus(days);
                  const Icon = st.icon;
                  const isProcessing = donePlanId === p.id;
                  return (
                    <tr key={p.id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none', background: days < 0 ? '#ef444406' : days <= 7 ? '#f59e0b06' : 'transparent' }}>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Icon size={13} color={st.color} />
                          <span style={{ fontSize: 12, color: st.color, fontWeight: 600 }}>{st.label}</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600 }}>{p.machines?.nom || '—'}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontSize: 13, fontWeight: 500 }}>{p.nom}</div>
                        {p.description && <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>{p.description.substring(0, 60)}{p.description.length > 60 ? '...' : ''}</div>}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-secondary)' }}>
                        {p.technicians ? `${(p.technicians as { prenom: string; nom: string }).prenom} ${(p.technicians as { prenom: string; nom: string }).nom}` : <span style={{ fontStyle: 'italic', fontSize: 12 }}>Non assigné</span>}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-secondary)' }}>Tous les {p.frequence_jours}j</td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <Calendar size={11} color="var(--text-secondary)" />
                          <span style={{ fontSize: 12 }}>{new Date(p.prochaine_exec).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button onClick={() => markDone(p)} disabled={isProcessing} style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#22c55e18', border: 'none', borderRadius: 6, padding: '6px 10px', cursor: 'pointer', color: '#22c55e', fontSize: 12, fontWeight: 600, opacity: isProcessing ? 0.6 : 1 }}>
                            {isProcessing ? <><Loader2 size={11} style={{ animation: 'spin 1s linear infinite' }} /> En cours</> : '✓ Fait'}
                          </button>
                          <button onClick={() => remove(p.id)} style={{ background: '#ef444418', border: 'none', borderRadius: 6, padding: '6px', cursor: 'pointer', color: '#ef4444' }}><X size={13} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

      {/* Modal nouveau plan */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: 24, width: '100%', maxWidth: 500, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 15, fontWeight: 700 }}>Nouveau plan préventif</h2>
              <button onClick={() => { setShowForm(false); setIaSuggestions([]); }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={18} /></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
              {/* Machine */}
              <div>
                <label style={lbl}>Machine *</label>
                <select value={form.machine_id} onChange={e => { setForm(f => ({ ...f, machine_id: e.target.value })); setIaSuggestions([]); }} style={{ ...inp, cursor: 'pointer' }}>
                  <option value="">Sélectionner une machine...</option>
                  {machines.map(m => <option key={m.id} value={m.id}>{m.nom} — {m.localisation}</option>)}
                </select>
              </div>

              {/* Bouton IA suggestions */}
              {form.machine_id && (
                <div>
                  <button onClick={loadIASuggestions} disabled={iaLoading} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(37,99,235,0.1)', border: '1px solid rgba(37,99,235,0.3)', borderRadius: 8, padding: '8px 14px', color: '#2563eb', fontSize: 13, fontWeight: 600, cursor: iaLoading ? 'default' : 'pointer', opacity: iaLoading ? 0.7 : 1 }}>
                    {iaLoading ? <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> Génération...</> : <><Bot size={13} /> Suggestions IA pour cette machine</>}
                  </button>
                  {iaError && (
                    <div style={{ marginTop: 6, fontSize: 12, color: '#ef4444', background: '#ef444410', border: '1px solid #ef444433', borderRadius: 6, padding: '6px 10px' }}>
                      ⚠️ {iaError}
                    </div>
                  )}
                  {iaSuggestions.length > 0 && (
                    <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {iaSuggestions.map((s, i) => (
                        <div key={i} onClick={() => applySuggestion(s)} style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600 }}>{s.titre}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>{s.description.substring(0, 70)}...</div>
                          </div>
                          <span style={{ fontSize: 11, background: '#2563eb22', color: '#2563eb', borderRadius: 4, padding: '2px 6px', flexShrink: 0, fontWeight: 600 }}>
                            {s.frequence_jours}j
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Opération */}
              <div>
                <label style={lbl}>Opération *</label>
                <input value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} placeholder="ex: Vidange huile hydraulique" style={inp} />
              </div>

              {/* Technicien */}
              <div>
                <label style={lbl}><Users size={10} style={{ display: 'inline', marginRight: 4 }} />Technicien responsable</label>
                <select value={form.technicien_id} onChange={e => setForm(f => ({ ...f, technicien_id: e.target.value }))} style={{ ...inp, cursor: 'pointer' }}>
                  <option value="">— Non assigné —</option>
                  {techs.map(t => <option key={t.id} value={t.id}>{t.prenom} {t.nom}</option>)}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={lbl}>Fréquence (jours) *</label>
                  <input type="number" value={form.frequence_jours} onChange={e => setForm(f => ({ ...f, frequence_jours: e.target.value }))} style={inp} />
                </div>
                <div>
                  <label style={lbl}>Prochaine date *</label>
                  <input type="date" value={form.prochaine_exec} onChange={e => setForm(f => ({ ...f, prochaine_exec: e.target.value }))} style={inp} />
                </div>
              </div>

              <div>
                <label style={lbl}>Description</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} style={{ ...inp, resize: 'vertical' }} />
              </div>
            </div>

            {saveError && (
              <div style={{ marginTop: 14, background: '#ef444410', border: '1px solid #ef444433', borderRadius: 8, padding: '9px 12px', fontSize: 12, color: '#ef4444' }}>
                ⚠️ Erreur : {saveError}
              </div>
            )}
            <div style={{ display: 'flex', gap: 8, marginTop: 14, justifyContent: 'flex-end' }}>
              <button onClick={() => { setShowForm(false); setIaSuggestions([]); setSaveError(null); }} style={{ padding: '9px 16px', background: 'transparent', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 13 }}>Annuler</button>
              <button onClick={save} disabled={saving || !form.machine_id || !form.nom || !form.prochaine_exec} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', background: '#2563eb', border: 'none', borderRadius: 8, color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600, opacity: saving || !form.machine_id || !form.nom || !form.prochaine_exec ? 0.6 : 1 }}>
                <Save size={13} /> {saving ? 'Sauvegarde...' : 'Créer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
