'use client';

import { useEffect, useState } from 'react';
import { supabase, Machine } from '@/lib/supabase';
import { Factory, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

const statutConfig: Record<string, { color: string; icon: React.ElementType; label: string }> = {
  actif:        { color: '#22c55e', icon: CheckCircle,  label: 'Actif' },
  inactif:      { color: '#f59e0b', icon: AlertCircle,  label: 'Inactif' },
  hors_service: { color: '#ef4444', icon: XCircle,      label: 'Hors service' },
};

export default function MachinesPage() {
  const [machines, setMachines] = useState<(Machine & { ticket_count?: number })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: m } = await supabase.from('machines').select('*').order('nom');
      if (!m) { setLoading(false); return; }

      // Compter tickets ouverts par machine
      const withCounts = await Promise.all(m.map(async machine => {
        const { count } = await supabase
          .from('tickets')
          .select('*', { count: 'exact', head: true })
          .eq('machine_id', machine.id)
          .neq('statut', 'ferme');
        return { ...machine, ticket_count: count || 0 };
      }));

      setMachines(withCounts);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div style={{ padding: '28px 32px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
        <Factory size={22} color="var(--accent)" />
        <h1 style={{ fontSize: 22, fontWeight: 800 }}>Parc Machines</h1>
      </div>

      {loading ? (
        <div style={{ color: 'var(--text-secondary)' }}>Chargement...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {machines.map(m => {
            const cfg = statutConfig[m.statut] || statutConfig.inactif;
            const Icon = cfg.icon;
            return (
              <div key={m.id} style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderTop: `3px solid ${cfg.color}`,
                borderRadius: 14, padding: '18px 20px',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{m.nom}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{m.reference}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: cfg.color, fontSize: 12, fontWeight: 600 }}>
                    <Icon size={14} />
                    {cfg.label}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Localisation</span>
                    <span>{m.localisation || '—'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Type</span>
                    <span style={{ textTransform: 'capitalize' }}>{m.type_machine || '—'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Tickets ouverts</span>
                    <span style={{ color: (m.ticket_count || 0) > 0 ? '#f59e0b' : 'var(--success)', fontWeight: 600 }}>
                      {m.ticket_count || 0}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
