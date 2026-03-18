'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Factory, CheckCircle, XCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type Machine = {
  id: string;
  external_id: string;
  nom: string;
  type_equipement: string;
  localisation: string;
  criticite: string;
  statut: string;
  ticket_count?: number;
};

const statutConfig: Record<string, { color: string; icon: React.ElementType; label: string }> = {
  actif:        { color: '#22c55e', icon: CheckCircle, label: 'Actif' },
  inactif:      { color: '#f59e0b', icon: AlertCircle, label: 'Inactif' },
  hors_service: { color: '#ef4444', icon: XCircle,     label: 'Hors service' },
};

const criticiteColor: Record<string, string> = {
  critique: '#ef4444',
  haute:    '#f59e0b',
  normale:  '#2563eb',
  basse:    '#22c55e',
};

export default function MachinesPage() {
  const router = useRouter();
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
          .eq('machine_id', machine.id)
          .in('statut', ['ouvert', 'en_cours']);
        return { ...machine, ticket_count: count || 0 };
      }));

      setMachines(withCounts);
      setLoading(false);
    }
    load();
  }, []);

  const filtered = filtre === 'tous' ? machines : machines.filter(m => m.criticite === filtre);

  return (
    <div className="px-4 md:px-8 py-5 max-w-[100vw] box-border overflow-x-hidden">
      <div className="flex items-center gap-2.5 mb-5">
        <button onClick={() => router.back()} className="bg-transparent border-none cursor-pointer text-[#7d8590] p-1 flex items-center">
          <ArrowLeft size={20} />
        </button>
        <Factory size={20} color="var(--accent)" />
        <h1 className="text-[20px] font-extrabold m-0">Parc Machines</h1>
        <span className="bg-[#1c2128] border border-[#30363d] rounded-full px-2.5 py-0.5 text-[12px] text-[#7d8590]">
          {machines.length}
        </span>
      </div>

      {/* Filtres criticité */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        {['tous', 'critique', 'haute', 'normale'].map(f => (
          <button
            key={f}
            onClick={() => setFiltre(f)}
            className="px-3.5 py-1.5 rounded-lg border whitespace-nowrap shrink-0 text-[12px] font-semibold cursor-pointer transition-all"
            style={{
              borderColor: filtre === f ? (criticiteColor[f] || 'var(--accent)') : '#30363d',
              background: filtre === f ? (criticiteColor[f] ? `${criticiteColor[f]}22` : 'var(--accent)') : '#1c2128',
              color: filtre === f ? (criticiteColor[f] || 'white') : '#7d8590',
            }}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-[#7d8590] py-5">Chargement...</div>
      ) : (
        <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
          {filtered.map(m => {
            const cfg = statutConfig[m.statut] || statutConfig.inactif;
            const StatIcon = cfg.icon;
            const critColor = criticiteColor[m.criticite] || '#2563eb';
            return (
              <Link
                key={m.id}
                href={`/manager/machines/${m.id}`}
                className="block no-underline text-inherit cursor-pointer rounded-[14px] px-[18px] py-4"
                style={{ background: '#1c2128', border: '1px solid #30363d', borderTop: `3px solid ${critColor}` }}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-[14px] mb-0.5 overflow-hidden text-ellipsis whitespace-nowrap">{m.nom}</div>
                    <div className="text-[11px] text-[#7d8590]">{m.external_id}</div>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] font-semibold shrink-0 ml-2" style={{ color: cfg.color }}>
                    <StatIcon size={13} />
                    {cfg.label}
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-[12px]">
                    <span className="text-[#7d8590]">Type</span>
                    <span className="text-right max-w-[160px] overflow-hidden text-ellipsis whitespace-nowrap">{m.type_equipement || '—'}</span>
                  </div>
                  <div className="flex justify-between text-[12px]">
                    <span className="text-[#7d8590]">Localisation</span>
                    <span className="text-right">{m.localisation || '—'}</span>
                  </div>
                  <div className="flex justify-between text-[12px]">
                    <span className="text-[#7d8590]">Criticité</span>
                    <span className="font-semibold capitalize" style={{ color: critColor }}>{m.criticite}</span>
                  </div>
                  <div
                    onClick={e => { if ((m.ticket_count || 0) > 0) { e.preventDefault(); e.stopPropagation(); router.push(`/manager/tickets?machine=${encodeURIComponent(m.nom)}`); } }}
                    className="flex justify-between text-[12px] border-t border-[#30363d] pt-2 mt-0.5"
                    style={{ cursor: (m.ticket_count || 0) > 0 ? 'pointer' : 'default' }}
                  >
                    <span className="text-[#7d8590]">Tickets ouverts</span>
                    <span
                      className="font-bold flex items-center gap-1"
                      style={{ color: (m.ticket_count || 0) > 0 ? '#f59e0b' : '#7d8590' }}
                    >
                      {m.ticket_count || 0}
                      {(m.ticket_count || 0) > 0 && <span className="text-[11px]">→</span>}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
      {!loading && <div className="mt-3 text-[12px] text-[#7d8590]">{filtered.length} machine(s)</div>}
    </div>
  );
}
