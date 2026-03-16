'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Factory, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

type Machine = {
  id: string; external_id: string; nom: string; type_equipement: string;
  localisation: string; criticite: string; statut: string; ticket_count?: number;
};

const statutConfig: Record<string, { color: string; icon: React.ElementType; label: string }> = {
  actif:        { color: '#22c55e', icon: CheckCircle,  label: 'Actif' },
  inactif:      { color: '#f59e0b', icon: AlertCircle,  label: 'Inactif' },
  hors_service: { color: '#ef4444', icon: XCircle,      label: 'Hors service' },
};
const criticiteColor: Record<string, string> = { critique: '#ef4444', haute: '#f59e0b', normale: '#6366f1', basse: '#22c55e' };

export default function DirecteurMachinesPage() {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtre, setFiltre] = useState('tous');

  useEffect(() => {
    async function load() {
      const { data: m } = await supabase.from('machines').select('*').order('nom');
      if (!m) { setLoading(false); return; }
      const withCounts = await Promise.all(m.map(async machine => {
        const { count } = await supabase.from('tickets')
          .select('*', { count: 'exact', head: true })
          .eq('machine_id', machine.id).in('statut', ['ouvert', 'en_cours']);
        return { ...machine, ticket_count: count || 0 };
      }));
      setMachines(withCounts);
      setLoading(false);
    }
    load();
  }, []);

  const filtered = filtre === 'tous' ? machines : machines.filter(m => m.criticite === filtre);

  return (
    <div style={{ padding: '20px 24px', maxWidth: 1100 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <Factory size={20} color="#0ea5e9" />
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>Parc Machines</h1>
        <span style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 20, padding: '2px 10px', fontSize: 12, color: 'var(--text-secondary)' }}>{machines.length}</span>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20, overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none' }}>
        {['tous', 'critique', 'haute', 'normale'].map(f => (
          <button key={f} onClick={() => setFiltre(f)} style={{
            padding: '6px 14px', borderRadius: 8, border: '1px solid', whiteSpace: 'nowrap', flexShrink: 0, fontSize: 12, fontWeight: 600, cursor: 'pointer',
            borderColor: filtre === f ? (criticiteColor[f] || '#0ea5e9') : 'var(--border)',
            background: filtre === f ? (criticiteColor[f] ? `${criticiteColor[f]}22` : '#0ea5e922') : 'var(--bg-card)',
            color: filtre === f ? (criticiteColor[f] || '#0ea5e9') : 'var(--text-secondary)',
          }}>{f.charAt(0).toUpperCase() + f.slice(1)}</button>
        ))}
      </div>

      {loading ? <div style={{ color: 'var(--text-secondary)', padding: 20 }}>Chargement...</div> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
          {filtered.map(m => {
            const cfg = statutConfig[m.statut] || statutConfig.inactif;
            const StatIcon = cfg.icon;
            const critColor = criticiteColor[m.criticite] || '#6366f1';
            return (
              <Link key={m.id} href={`/directeur/machines/${m.id}`} style={{
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                borderTop: `3px solid ${critColor}`, borderRadius: 14, padding: '16px 18px',
                display: 'block', textDecoration: 'none', color: 'inherit',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.nom}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{m.external_id}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: cfg.color, fontSize: 11, fontWeight: 600, flexShrink: 0, marginLeft: 8 }}>
                    <StatIcon size={13} />{cfg.label}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Type</span>
                    <span style={{ textAlign: 'right', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.type_equipement || '—'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Localisation</span>
                    <span>{m.localisation || '—'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Criticité</span>
                    <span style={{ color: critColor, fontWeight: 600, textTransform: 'capitalize' }}>{m.criticite}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, borderTop: '1px solid var(--border)', paddingTop: 8, marginTop: 2 }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Tickets ouverts</span>
                    <span style={{ fontWeight: 700, color: (m.ticket_count || 0) > 0 ? '#f59e0b' : 'var(--text-secondary)' }}>{m.ticket_count || 0}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
      {!loading && <div style={{ marginTop: 12, fontSize: 12, color: 'var(--text-secondary)' }}>{filtered.length} machine(s)</div>}
    </div>
  );
}
