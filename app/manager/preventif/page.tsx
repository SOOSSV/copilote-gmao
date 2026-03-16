'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Calendar, AlertTriangle, CheckCircle, Clock, Plus, X, Save } from 'lucide-react';

type Plan = {
  id: string;
  machine_id: string;
  titre: string;
  description: string | null;
  frequence_jours: number;
  prochaine_exec: string;
  actif: boolean;
  machines: { nom: string; localisation: string } | null;
};

type Machine = { id: string; nom: string; localisation: string };

const emptyForm = { machine_id: '', titre: '', description: '', frequence_jours: '30', prochaine_exec: '' };

export default function PreventifPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<'tous' | 'urgent' | 'ok'>('tous');

  async function load() {
    const [{ data: p }, { data: m }] = await Promise.all([
      supabase.from('preventive_plans').select('*, machines(nom, localisation)').eq('actif', true).order('prochaine_exec'),
      supabase.from('machines').select('id, nom, localisation').eq('statut', 'actif').order('nom'),
    ]);
    setPlans((p as unknown as Plan[]) || []);
    setMachines((m as Machine[]) || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function getDaysLeft(date: string) {
    return Math.ceil((new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  }

  function getStatus(days: number) {
    if (days < 0) return { color: '#ef4444', label: 'En retard', icon: AlertTriangle };
    if (days <= 7) return { color: '#f59e0b', label: `J-${days}`, icon: Clock };
    return { color: '#22c55e', label: `J-${days}`, icon: CheckCircle };
  }

  async function save() {
    if (!form.machine_id || !form.titre || !form.prochaine_exec) return;
    setSaving(true);
    await supabase.from('preventive_plans').insert({
      machine_id: form.machine_id,
      titre: form.titre.trim(),
      description: form.description.trim() || null,
      frequence_jours: parseInt(form.frequence_jours) || 30,
      prochaine_exec: form.prochaine_exec,
      actif: true,
    });
    setSaving(false);
    setShowForm(false);
    setForm(emptyForm);
    load();
  }

  async function markDone(plan: Plan) {
    const next = new Date();
    next.setDate(next.getDate() + plan.frequence_jours);
    await supabase.from('preventive_plans').update({ prochaine_exec: next.toISOString() }).eq('id', plan.id);
    load();
  }

  async function remove(id: string) {
    if (!confirm('Supprimer ce plan ?')) return;
    await supabase.from('preventive_plans').update({ actif: false }).eq('id', id);
    load();
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
    <div style={{ padding: 'clamp(16px, 4vw, 32px)', maxWidth: 1000, boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Maintenance Préventive</h1>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{plans.length} plan{plans.length > 1 ? 's' : ''} · {retard} en retard · {urgent} cette semaine</div>
        </div>
        <button onClick={() => setShowForm(true)} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#6366f1', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 18px', cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>
          <Plus size={16} /> Nouveau plan
        </button>
      </div>

      {/* KPI */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
        <div style={{ background: 'var(--bg-card)', border: `1px solid ${retard > 0 ? '#ef444433' : 'var(--border)'}`, borderRadius: 14, padding: '18px 20px' }}>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>En retard</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: retard > 0 ? '#ef4444' : 'var(--text-secondary)' }}>{retard}</div>
        </div>
        <div style={{ background: 'var(--bg-card)', border: `1px solid ${urgent > 0 ? '#f59e0b33' : 'var(--border)'}`, borderRadius: 14, padding: '18px 20px' }}>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Cette semaine</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: urgent > 0 ? '#f59e0b' : 'var(--text-secondary)' }}>{urgent}</div>
        </div>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: '18px 20px' }}>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>À venir</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#22c55e' }}>{plans.length - retard - urgent}</div>
        </div>
      </div>

      {/* Filtres */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
        {[['tous', 'Tous'], ['urgent', 'Urgent / Retard'], ['ok', 'OK']] .map(([v, l]) => (
          <button key={v} onClick={() => setFilter(v as 'tous' | 'urgent' | 'ok')} style={{ padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: filter === v ? 700 : 400, cursor: 'pointer', background: filter === v ? '#6366f122' : 'var(--bg-card)', border: `1px solid ${filter === v ? '#6366f166' : 'var(--border)'}`, color: filter === v ? '#6366f1' : 'var(--text-secondary)' }}>
            {l}
          </button>
        ))}
      </div>

      {/* Liste */}
      {loading ? <div style={{ color: 'var(--text-secondary)' }}>Chargement...</div> : filtered.length === 0 ? (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>Aucun plan trouvé</div>
      ) : (
        <>
          {/* Vue mobile : cartes */}
          <div className="preventif-mobile" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filtered.map(p => {
              const days = getDaysLeft(p.prochaine_exec);
              const st = getStatus(days);
              const StatusIcon = st.icon;
              return (
                <div key={p.id} style={{ background: 'var(--bg-card)', border: `1px solid ${days < 0 ? '#ef444433' : days <= 7 ? '#f59e0b33' : 'var(--border)'}`, borderRadius: 10, padding: '12px 14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                    <div style={{ flex: 1, paddingRight: 8 }}>
                      <div style={{ fontSize: 13, fontWeight: 700 }}>{p.titre}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>{p.machines?.nom || '—'}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                      <StatusIcon size={13} color={st.color} />
                      <span style={{ fontSize: 12, color: st.color, fontWeight: 700 }}>{days < 0 ? `${Math.abs(days)}j retard` : st.label}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Tous les {p.frequence_jours}j</span>
                      <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>· {new Date(p.prochaine_exec).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => markDone(p)} style={{ background: '#22c55e18', border: 'none', borderRadius: 6, padding: '5px 10px', cursor: 'pointer', color: '#22c55e', fontSize: 12, fontWeight: 600 }}>✓ Fait</button>
                      <button onClick={() => remove(p.id)} style={{ background: '#ef444418', border: 'none', borderRadius: 6, padding: '5px 8px', cursor: 'pointer', color: '#ef4444' }}><X size={12} /></button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Vue desktop : tableau */}
          <div className="preventif-desktop" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Statut', 'Machine', 'Opération', 'Fréquence', 'Prochaine date', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, i) => {
                  const days = getDaysLeft(p.prochaine_exec);
                  const st = getStatus(days);
                  const StatusIcon = st.icon;
                  return (
                    <tr key={p.id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none', background: days < 0 ? '#ef444406' : days <= 7 ? '#f59e0b06' : 'transparent' }}>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <StatusIcon size={14} color={st.color} />
                          <span style={{ fontSize: 12, color: st.color, fontWeight: 600 }}>{days < 0 ? `${Math.abs(days)}j retard` : st.label}</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600 }}>{p.machines?.nom || '—'}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontSize: 13, fontWeight: 500 }}>{p.titre}</div>
                        {p.description && <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>{p.description.substring(0, 60)}</div>}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-secondary)' }}>Tous les {p.frequence_jours}j</td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Calendar size={12} color="var(--text-secondary)" />
                          <span style={{ fontSize: 12 }}>{new Date(p.prochaine_exec).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button onClick={() => markDone(p)} style={{ background: '#22c55e18', border: 'none', borderRadius: 6, padding: '6px 10px', cursor: 'pointer', color: '#22c55e', fontSize: 12, fontWeight: 600 }}>✓ Fait</button>
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

      {/* Modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: 28, width: '100%', maxWidth: 480 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700 }}>Nouveau plan préventif</h2>
              <button onClick={() => setShowForm(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={20} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: 6 }}>Machine *</label>
                <select value={form.machine_id} onChange={e => setForm(f => ({ ...f, machine_id: e.target.value }))} style={{ width: '100%', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px', color: 'var(--text-primary)', fontSize: 13 }}>
                  <option value="">Sélectionner une machine...</option>
                  {machines.map(m => <option key={m.id} value={m.id}>{m.nom} — {m.localisation}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: 6 }}>Opération *</label>
                <input value={form.titre} onChange={e => setForm(f => ({ ...f, titre: e.target.value }))} placeholder="ex: Vidange huile hydraulique" style={{ width: '100%', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px', color: 'var(--text-primary)', fontSize: 13, boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: 6 }}>Fréquence (jours) *</label>
                  <input type="number" value={form.frequence_jours} onChange={e => setForm(f => ({ ...f, frequence_jours: e.target.value }))} style={{ width: '100%', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px', color: 'var(--text-primary)', fontSize: 13, boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: 6 }}>Prochaine date *</label>
                  <input type="date" value={form.prochaine_exec} onChange={e => setForm(f => ({ ...f, prochaine_exec: e.target.value }))} style={{ width: '100%', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px', color: 'var(--text-primary)', fontSize: 13, boxSizing: 'border-box' }} />
                </div>
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: 6 }}>Description</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} style={{ width: '100%', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px', color: 'var(--text-primary)', fontSize: 13, resize: 'vertical', boxSizing: 'border-box' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 24, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowForm(false)} style={{ padding: '10px 18px', background: 'transparent', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 14 }}>Annuler</button>
              <button onClick={save} disabled={saving || !form.machine_id || !form.titre || !form.prochaine_exec} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', background: '#6366f1', border: 'none', borderRadius: 8, color: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 600, opacity: saving || !form.machine_id || !form.titre || !form.prochaine_exec ? 0.6 : 1 }}>
                <Save size={15} /> {saving ? 'Sauvegarde...' : 'Créer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
