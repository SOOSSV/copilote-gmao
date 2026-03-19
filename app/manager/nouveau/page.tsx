'use client';

import { useState, useEffect } from 'react';
import { supabase, Machine } from '@/lib/supabase';
import { PlusCircle, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

const inputStyle = {
  width: '100%',
  background: 'var(--bg-card)',
  border: '1px solid var(--border)',
  borderRadius: 10,
  padding: '12px 14px',
  color: 'var(--text-primary)',
  fontSize: 14,
  fontFamily: 'inherit',
  outline: 'none',
};

const labelStyle = {
  fontSize: 12,
  fontWeight: 600,
  color: 'var(--text-secondary)',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
  marginBottom: 6,
  display: 'block',
};

export default function NouveauTicketPage() {
  const router = useRouter();
  const [machines, setMachines] = useState<Machine[]>([]);
  const [form, setForm] = useState({
    titre: '',
    description: '',
    machine_id: '',
    type_intervention: 'corrective',
    priorite: 'normale',
    classification: 'mecanique',
  });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  useEffect(() => {
    supabase.from('machines').select('*').eq('statut', 'actif').then(({ data }) => {
      setMachines(data || []);
    });
  }, []);

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function submit() {
    if (!form.titre || !form.machine_id) return;
    setStatus('loading');
    const { error } = await supabase.from('tickets').insert({
      ...form,
      statut: 'ouvert',
      source: 'manuel',
    });
    if (error) { setStatus('error'); return; }

    if (form.priorite === 'urgente') {
      const machine = machines.find(m => m.id === form.machine_id);
      fetch('/api/tickets/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: '🚨 Ticket URGENT',
          body: `${form.titre}${machine ? ` — ${machine.nom}` : ''}`,
          url: '/manager/tickets',
          role: 'manager',
          tag: 'ticket-urgent',
        }),
      }).catch(() => {});
    }

    setStatus('success');
    setTimeout(() => router.push('/manager/tickets'), 1500);
  }

  if (status === 'success') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: 16 }}>
        <CheckCircle size={64} color="var(--success)" />
        <div style={{ fontWeight: 700, fontSize: 18 }}>Ticket créé !</div>
        <div style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Redirection...</div>
      </div>
    );
  }

  return (
    <div style={{ background: 'var(--bg-primary)', minHeight: '100vh', paddingBottom: 100 }}>
      {/* Header */}
      <div style={{
        background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border)',
        padding: '16px 20px',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: 4, display: 'flex', alignItems: 'center' }}>
          <ArrowLeft size={20} />
        </button>
        <PlusCircle size={20} color="var(--accent)" />
        <span style={{ fontWeight: 700, fontSize: 16 }}>Nouveau Ticket</span>
      </div>

      <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 18 }}>

        {/* Machine */}
        <div>
          <label style={labelStyle}>Machine *</label>
          <select value={form.machine_id} onChange={e => set('machine_id', e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
            <option value="">Sélectionner une machine...</option>
            {machines.map(m => (
              <option key={m.id} value={m.id}>{m.nom} — {m.localisation}</option>
            ))}
          </select>
        </div>

        {/* Titre */}
        <div>
          <label style={labelStyle}>Titre *</label>
          <input
            value={form.titre}
            onChange={e => set('titre', e.target.value)}
            placeholder="Ex: Bruit anormal, fuite hydraulique..."
            style={inputStyle}
          />
        </div>

        {/* Description */}
        <div>
          <label style={labelStyle}>Description</label>
          <textarea
            value={form.description}
            onChange={e => set('description', e.target.value)}
            placeholder="Décrivez le problème en détail..."
            rows={4}
            style={{ ...inputStyle, resize: 'none' }}
          />
        </div>

        {/* Type + Priorité */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={labelStyle}>Type</label>
            <select value={form.type_intervention} onChange={e => set('type_intervention', e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
              <option value="corrective">Corrective</option>
              <option value="preventive">Préventive</option>
              <option value="ameliorative">Améliorative</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Priorité</label>
            <select value={form.priorite} onChange={e => set('priorite', e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
              <option value="basse">Basse</option>
              <option value="normale">Normale</option>
              <option value="haute">Haute</option>
              <option value="urgente">Urgente</option>
            </select>
          </div>
        </div>

        {/* Classification */}
        <div>
          <label style={labelStyle}>Classification</label>
          <select value={form.classification} onChange={e => set('classification', e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
            <option value="mecanique">Mécanique</option>
            <option value="electrique">Électrique</option>
            <option value="hydraulique">Hydraulique</option>
            <option value="usure">Usure</option>
            <option value="autre">Autre</option>
          </select>
        </div>

        {status === 'error' && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', color: 'var(--danger)', fontSize: 14 }}>
            <AlertCircle size={16} />
            Erreur lors de la création. Réessayez.
          </div>
        )}

        {/* Bouton */}
        <button
          onClick={submit}
          disabled={!form.titre || !form.machine_id || status === 'loading'}
          style={{
            width: '100%', padding: '14px',
            background: form.titre && form.machine_id ? 'var(--accent)' : 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 12, color: 'white', fontSize: 15, fontWeight: 700,
            cursor: form.titre && form.machine_id ? 'pointer' : 'default',
            transition: 'background 0.15s',
          }}
        >
          {status === 'loading' ? 'Création...' : 'Créer le ticket'}
        </button>
      </div>

      <style>{`select option { background: var(--bg-card); } select { appearance: auto; }`}</style>
    </div>
  );
}
