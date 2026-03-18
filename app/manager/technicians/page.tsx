'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Plus, UserX, UserCheck, RefreshCw, Save, X, Sun, Sunset, Moon } from 'lucide-react';

type Tech = {
  id: string; nom: string; prenom: string; email: string | null;
  telephone: string | null; disponible: boolean; pin: string | null;
  pin_changed: boolean; equipe: string | null;
};

const EQUIPES = [
  { value: 'matin', label: 'Matin', sub: '6h–14h', icon: Sun, color: '#f59e0b' },
  { value: 'apres_midi', label: 'Après-midi', sub: '14h–22h', icon: Sunset, color: '#f97316' },
  { value: 'nuit', label: 'Nuit', sub: '22h–6h', icon: Moon, color: '#6366f1' },
];

function equipeBadge(equipe: string | null) {
  const e = EQUIPES.find(x => x.value === equipe);
  if (!e) return null;
  return (
    <span style={{ fontSize: 10, fontWeight: 700, background: e.color + '20', color: e.color, borderRadius: 6, padding: '2px 7px' }}>
      {e.label} · {e.sub}
    </span>
  );
}

export default function TechniciansPage() {
  const router = useRouter();
  const [techs, setTechs] = useState<Tech[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ prenom: '', nom: '', email: '', telephone: '', pin: '', equipe: 'matin' });
  const [formError, setFormError] = useState('');
  const [filterEquipe, setFilterEquipe] = useState('tous');

  async function load() {
    const { data } = await supabase.from('technicians')
      .select('id, nom, prenom, email, telephone, disponible, pin, pin_changed, equipe')
      .order('equipe').order('nom');
    setTechs((data as Tech[]) || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function toggleDisponible(tech: Tech) {
    await supabase.from('technicians').update({ disponible: !tech.disponible }).eq('id', tech.id);
    setTechs(prev => prev.map(t => t.id === tech.id ? { ...t, disponible: !t.disponible } : t));
  }

  async function changeEquipe(tech: Tech, equipe: string) {
    await supabase.from('technicians').update({ equipe }).eq('id', tech.id);
    setTechs(prev => prev.map(t => t.id === tech.id ? { ...t, equipe } : t));
  }

  async function resetPin(tech: Tech) {
    const newPin = prompt(`Nouveau PIN temporaire pour ${tech.prenom} (4 chiffres) :`, '0000');
    if (!newPin || !/^\d{4}$/.test(newPin)) return;
    await supabase.from('technicians').update({ pin: newPin, pin_changed: false }).eq('id', tech.id);
    setTechs(prev => prev.map(t => t.id === tech.id ? { ...t, pin: newPin, pin_changed: false } : t));
  }

  async function handleCreate() {
    setFormError('');
    if (!form.prenom.trim() || !form.nom.trim()) { setFormError('Prénom et nom obligatoires.'); return; }
    if (form.pin.length !== 4 || !/^\d{4}$/.test(form.pin)) { setFormError('PIN : 4 chiffres obligatoires.'); return; }
    setSaving(true);
    const { error } = await supabase.from('technicians').insert({
      prenom: form.prenom.trim(), nom: form.nom.trim(),
      email: form.email.trim() || null, telephone: form.telephone.trim() || null,
      pin: form.pin, pin_changed: false, disponible: true, charge_actuelle: 0,
      equipe: form.equipe, external_id: `T${Date.now()}`,
    });
    if (error) { setFormError('Erreur : ' + error.message); setSaving(false); return; }
    setForm({ prenom: '', nom: '', email: '', telephone: '', pin: '', equipe: 'matin' });
    setShowForm(false);
    setSaving(false);
    load();
  }

  const filtered = filterEquipe === 'tous' ? techs : techs.filter(t => t.equipe === filterEquipe);
  const byEquipe = EQUIPES.map(e => ({ ...e, count: techs.filter(t => t.equipe === e.value).length }));

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', padding: '20px 16px', maxWidth: 700, margin: '0 auto' }}>
      <button onClick={() => router.push('/manager')} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer', padding: '0 0 20px', marginLeft: -4 }}>
        <ArrowLeft size={15} /> Tableau de bord
      </button>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Techniciens</h1>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>{techs.length} technicien{techs.length > 1 ? 's' : ''} · 3×8</div>
        </div>
        <button onClick={() => { setShowForm(!showForm); setFormError(''); }}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', border: 'none', borderRadius: 10, padding: '10px 16px', color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
          {showForm ? <X size={15} /> : <Plus size={15} />} {showForm ? 'Annuler' : 'Nouveau'}
        </button>
      </div>

      {/* Résumé équipes */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 20 }}>
        {byEquipe.map(e => (
          <div key={e.value} style={{ background: 'var(--bg-card)', border: `1px solid ${e.color}33`, borderRadius: 12, padding: '10px 12px', textAlign: 'center', cursor: 'pointer' }}
            onClick={() => setFilterEquipe(filterEquipe === e.value ? 'tous' : e.value)}>
            <div style={{ fontSize: 20, fontWeight: 800, color: e.color }}>{e.count}</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: e.color }}>{e.label}</div>
            <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>{e.sub}</div>
          </div>
        ))}
      </div>

      {showForm && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: 20, marginBottom: 20 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}>Nouveau technicien</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Prénom *</label>
              <input value={form.prenom} onChange={e => setForm(f => ({ ...f, prenom: e.target.value }))} placeholder="Marc"
                style={{ width: '100%', boxSizing: 'border-box', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px', color: 'var(--text-primary)', fontSize: 14, outline: 'none', fontFamily: 'inherit' }} />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Nom *</label>
              <input value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} placeholder="Dupont"
                style={{ width: '100%', boxSizing: 'border-box', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px', color: 'var(--text-primary)', fontSize: 14, outline: 'none', fontFamily: 'inherit' }} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Email</label>
              <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="m.dupont@..." type="email"
                style={{ width: '100%', boxSizing: 'border-box', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px', color: 'var(--text-primary)', fontSize: 14, outline: 'none', fontFamily: 'inherit' }} />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Téléphone</label>
              <input value={form.telephone} onChange={e => setForm(f => ({ ...f, telephone: e.target.value }))} placeholder="06 12 34 56 78"
                style={{ width: '100%', boxSizing: 'border-box', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px', color: 'var(--text-primary)', fontSize: 14, outline: 'none', fontFamily: 'inherit' }} />
            </div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Équipe *</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {EQUIPES.map(e => (
                <button key={e.value} onClick={() => setForm(f => ({ ...f, equipe: e.value }))}
                  style={{ flex: 1, padding: '8px', borderRadius: 8, border: `2px solid ${form.equipe === e.value ? e.color : 'var(--border)'}`, background: form.equipe === e.value ? e.color + '20' : 'var(--bg-secondary)', color: form.equipe === e.value ? e.color : 'var(--text-secondary)', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                  {e.label}<br /><span style={{ fontSize: 10, fontWeight: 400 }}>{e.sub}</span>
                </button>
              ))}
            </div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>PIN par défaut * (4 chiffres)</label>
            <input value={form.pin} onChange={e => setForm(f => ({ ...f, pin: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
              placeholder="Ex: 1234" maxLength={4} inputMode="numeric"
              style={{ width: 120, background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px', color: 'var(--text-primary)', fontSize: 18, letterSpacing: 6, outline: 'none', fontFamily: 'inherit' }} />
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>Le technicien devra le changer à sa 1ère connexion</div>
          </div>
          {formError && <div style={{ color: '#ef4444', fontSize: 13, marginBottom: 12, padding: '8px 12px', background: '#ef444410', borderRadius: 8 }}>{formError}</div>}
          <button onClick={handleCreate} disabled={saving}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'linear-gradient(135deg, #22c55e, #16a34a)', border: 'none', borderRadius: 10, padding: '10px 20px', color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
            <Save size={15} /> {saving ? 'Création...' : 'Créer le technicien'}
          </button>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: 40 }}>Chargement...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map(tech => (
            <div key={tech.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: '14px 16px', opacity: tech.disponible ? 1 : 0.5 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>{tech.prenom} {tech.nom}</span>
                    {equipeBadge(tech.equipe)}
                    {!tech.pin_changed && tech.pin && (
                      <span style={{ fontSize: 10, fontWeight: 700, background: '#f59e0b20', color: '#f59e0b', borderRadius: 6, padding: '2px 6px' }}>PIN TEMP</span>
                    )}
                    {!tech.pin && (
                      <span style={{ fontSize: 10, fontWeight: 700, background: '#ef444420', color: '#ef4444', borderRadius: 6, padding: '2px 6px' }}>SANS PIN</span>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                    {tech.email || 'Pas d\'email'}{tech.telephone ? ` · ${tech.telephone}` : ''}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => resetPin(tech)} title="Réinitialiser PIN"
                    style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8, padding: '7px 10px', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                    <RefreshCw size={14} />
                  </button>
                  <button onClick={() => toggleDisponible(tech)} title={tech.disponible ? 'Désactiver' : 'Réactiver'}
                    style={{ background: tech.disponible ? '#ef444410' : '#22c55e10', border: `1px solid ${tech.disponible ? '#ef4444' : '#22c55e'}`, borderRadius: 8, padding: '7px 10px', color: tech.disponible ? '#ef4444' : '#22c55e', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                    {tech.disponible ? <UserX size={14} /> : <UserCheck size={14} />}
                  </button>
                </div>
              </div>
              {/* Changement d'équipe */}
              <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                {EQUIPES.map(e => (
                  <button key={e.value} onClick={() => changeEquipe(tech, e.value)}
                    style={{ flex: 1, padding: '5px', borderRadius: 6, border: `1px solid ${tech.equipe === e.value ? e.color : 'var(--border)'}`, background: tech.equipe === e.value ? e.color + '20' : 'transparent', color: tech.equipe === e.value ? e.color : 'var(--text-secondary)', fontSize: 11, fontWeight: tech.equipe === e.value ? 700 : 400, cursor: 'pointer' }}>
                    {e.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
