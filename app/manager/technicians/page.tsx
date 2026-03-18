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
    <span
      className="text-[10px] font-bold rounded-md px-1.5 py-0.5"
      style={{ background: e.color + '20', color: e.color }}
    >
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
    <div className="min-h-screen bg-[#0d1117] px-4 py-5 md:px-8">
      <button
        onClick={() => router.push('/manager')}
        className="flex items-center gap-1.5 bg-transparent border-none text-[#7d8590] text-[13px] cursor-pointer pb-5 -ml-1"
      >
        <ArrowLeft size={15} /> Tableau de bord
      </button>

      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-[22px] font-extrabold text-[#e6edf3] m-0">Techniciens</h1>
          <div className="text-[13px] text-[#7d8590] mt-0.5">{techs.length} technicien{techs.length > 1 ? 's' : ''} · 3×8</div>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setFormError(''); }}
          className="flex items-center gap-1.5 bg-gradient-to-br from-blue-600 to-blue-700 border-none rounded-[10px] px-4 py-2.5 text-white text-[13px] font-bold cursor-pointer"
        >
          {showForm ? <X size={15} /> : <Plus size={15} />} {showForm ? 'Annuler' : 'Nouveau'}
        </button>
      </div>

      {/* Résumé équipes */}
      <div className="grid grid-cols-3 gap-2 mb-5">
        {byEquipe.map(e => (
          <div
            key={e.value}
            className="bg-[#1c2128] rounded-xl py-2.5 px-3 text-center cursor-pointer"
            style={{ border: `1px solid ${e.color}33` }}
            onClick={() => setFilterEquipe(filterEquipe === e.value ? 'tous' : e.value)}
          >
            <div className="text-[20px] font-extrabold" style={{ color: e.color }}>{e.count}</div>
            <div className="text-[11px] font-bold" style={{ color: e.color }}>{e.label}</div>
            <div className="text-[10px] text-[#7d8590]">{e.sub}</div>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="bg-[#1c2128] border border-[#30363d] rounded-2xl p-5 mb-5">
          <div className="text-[15px] font-bold text-[#e6edf3] mb-4">Nouveau technicien</div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-[11px] font-semibold text-[#7d8590] uppercase mb-1.5">Prénom *</label>
              <input
                value={form.prenom}
                onChange={e => setForm(f => ({ ...f, prenom: e.target.value }))}
                placeholder="Marc"
                className="w-full box-border bg-[#161b22] border border-[#30363d] rounded-lg px-3 py-2.5 text-[#e6edf3] text-[14px] outline-none font-[inherit]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-[#7d8590] uppercase mb-1.5">Nom *</label>
              <input
                value={form.nom}
                onChange={e => setForm(f => ({ ...f, nom: e.target.value }))}
                placeholder="Dupont"
                className="w-full box-border bg-[#161b22] border border-[#30363d] rounded-lg px-3 py-2.5 text-[#e6edf3] text-[14px] outline-none font-[inherit]"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-[11px] font-semibold text-[#7d8590] uppercase mb-1.5">Email</label>
              <input
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="m.dupont@..."
                type="email"
                className="w-full box-border bg-[#161b22] border border-[#30363d] rounded-lg px-3 py-2.5 text-[#e6edf3] text-[14px] outline-none font-[inherit]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-[#7d8590] uppercase mb-1.5">Téléphone</label>
              <input
                value={form.telephone}
                onChange={e => setForm(f => ({ ...f, telephone: e.target.value }))}
                placeholder="06 12 34 56 78"
                className="w-full box-border bg-[#161b22] border border-[#30363d] rounded-lg px-3 py-2.5 text-[#e6edf3] text-[14px] outline-none font-[inherit]"
              />
            </div>
          </div>
          <div className="mb-3">
            <label className="block text-[11px] font-semibold text-[#7d8590] uppercase mb-2">Équipe *</label>
            <div className="flex gap-2">
              {EQUIPES.map(e => (
                <button
                  key={e.value}
                  onClick={() => setForm(f => ({ ...f, equipe: e.value }))}
                  className="flex-1 py-2 rounded-lg text-[12px] font-bold cursor-pointer transition-all"
                  style={{
                    border: `2px solid ${form.equipe === e.value ? e.color : '#30363d'}`,
                    background: form.equipe === e.value ? e.color + '20' : '#161b22',
                    color: form.equipe === e.value ? e.color : '#7d8590',
                  }}
                >
                  {e.label}<br /><span className="text-[10px] font-normal">{e.sub}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-[11px] font-semibold text-[#7d8590] uppercase mb-1.5">PIN par défaut * (4 chiffres)</label>
            <input
              value={form.pin}
              onChange={e => setForm(f => ({ ...f, pin: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
              placeholder="Ex: 1234"
              maxLength={4}
              inputMode="numeric"
              className="w-[120px] bg-[#161b22] border border-[#30363d] rounded-lg px-3 py-2.5 text-[#e6edf3] text-[18px] tracking-[6px] outline-none font-[inherit]"
            />
            <div className="text-[11px] text-[#7d8590] mt-1">Le technicien devra le changer à sa 1ère connexion</div>
          </div>
          {formError && (
            <div className="text-red-500 text-[13px] mb-3 px-3 py-2 bg-red-500/10 rounded-lg">{formError}</div>
          )}
          <button
            onClick={handleCreate}
            disabled={saving}
            className="flex items-center gap-1.5 bg-gradient-to-br from-green-500 to-green-700 border-none rounded-[10px] px-5 py-2.5 text-white text-[14px] font-bold cursor-pointer"
          >
            <Save size={15} /> {saving ? 'Création...' : 'Créer le technicien'}
          </button>
        </div>
      )}

      {loading ? (
        <div className="text-center text-[#7d8590] py-10">Chargement...</div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {filtered.map(tech => (
            <div
              key={tech.id}
              className="bg-[#1c2128] border border-[#30363d] rounded-[14px] px-4 py-3.5 transition-opacity"
              style={{ opacity: tech.disponible ? 1 : 0.5 }}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[15px] font-bold text-[#e6edf3]">{tech.prenom} {tech.nom}</span>
                    {equipeBadge(tech.equipe)}
                    {!tech.pin_changed && tech.pin && (
                      <span className="text-[10px] font-bold bg-amber-500/15 text-amber-500 rounded-md px-1.5 py-0.5">PIN TEMP</span>
                    )}
                    {!tech.pin && (
                      <span className="text-[10px] font-bold bg-red-500/15 text-red-500 rounded-md px-1.5 py-0.5">SANS PIN</span>
                    )}
                  </div>
                  <div className="text-[12px] text-[#7d8590] mt-0.5">
                    {tech.email || 'Pas d\'email'}{tech.telephone ? ` · ${tech.telephone}` : ''}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => resetPin(tech)}
                    title="Réinitialiser PIN"
                    className="bg-[#161b22] border border-[#30363d] rounded-lg p-1.5 text-[#7d8590] cursor-pointer flex items-center"
                  >
                    <RefreshCw size={14} />
                  </button>
                  <button
                    onClick={() => toggleDisponible(tech)}
                    title={tech.disponible ? 'Désactiver' : 'Réactiver'}
                    className="rounded-lg p-1.5 cursor-pointer flex items-center"
                    style={{
                      background: tech.disponible ? '#ef444410' : '#22c55e10',
                      border: `1px solid ${tech.disponible ? '#ef4444' : '#22c55e'}`,
                      color: tech.disponible ? '#ef4444' : '#22c55e',
                    }}
                  >
                    {tech.disponible ? <UserX size={14} /> : <UserCheck size={14} />}
                  </button>
                </div>
              </div>
              {/* Changement d'équipe */}
              <div className="flex gap-1.5 mt-2.5">
                {EQUIPES.map(e => (
                  <button
                    key={e.value}
                    onClick={() => changeEquipe(tech, e.value)}
                    className="flex-1 py-1 rounded-md text-[11px] cursor-pointer transition-all"
                    style={{
                      border: `1px solid ${tech.equipe === e.value ? e.color : '#30363d'}`,
                      background: tech.equipe === e.value ? e.color + '20' : 'transparent',
                      color: tech.equipe === e.value ? e.color : '#7d8590',
                      fontWeight: tech.equipe === e.value ? 700 : 400,
                    }}
                  >
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
