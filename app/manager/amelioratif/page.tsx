'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, RefreshCw, Sparkles } from 'lucide-react';
import Link from 'next/link';
import PrioriteBadge from '@/components/PrioriteBadge';

type Ticket = {
  id: string; titre: string; priorite: string; statut: string;
  created_at: string;
  machines: { nom: string; localisation: string } | null;
  technicians: { prenom: string; nom: string } | null;
};

const statutColor: Record<string, string> = { ouvert: '#2563eb', en_cours: '#f59e0b', resolu: '#22c55e' };
const statutLabel: Record<string, string> = { ouvert: 'Ouvert', en_cours: 'En cours', resolu: 'Résolu' };

export default function AmelioratifPage() {
  const router = useRouter();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtre, setFiltre] = useState<'tous' | 'ouvert' | 'en_cours' | 'resolu'>('tous');

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from('tickets')
      .select('id, titre, priorite, statut, created_at, machines(nom, localisation), technicians(prenom, nom)')
      .eq('type_intervention', 'ameliorative')
      .order('created_at', { ascending: false });
    setTickets((data as unknown as Ticket[]) || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const filtered = filtre === 'tous' ? tickets : tickets.filter(t => t.statut === filtre);

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  }

  return (
    <div className="p-4 pb-8">
      <div className="flex items-center gap-3 mb-5">
        <button onClick={() => router.back()} className="bg-transparent border-none cursor-pointer text-[#7d8590] p-1 flex items-center">
          <ArrowLeft size={22} />
        </button>
        <div className="flex-1">
          <h1 className="text-[18px] font-extrabold m-0 text-violet-600">Amélioratif</h1>
          <div className="text-[12px] text-[#7d8590]">{tickets.length} intervention{tickets.length > 1 ? 's' : ''} au total</div>
        </div>
        <button
          onClick={load}
          className="bg-[#1c2128] border border-[#30363d] rounded-lg px-3 py-1.5 cursor-pointer text-[#7d8590] text-[12px] flex items-center gap-1.5"
        >
          <RefreshCw size={13} /> Actualiser
        </button>
      </div>

      {/* Filtres statut */}
      <div className="flex gap-1.5 mb-4">
        {(['tous', 'ouvert', 'en_cours', 'resolu'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFiltre(f)}
            className="px-3 py-1.5 rounded-lg border whitespace-nowrap shrink-0 text-[12px] font-semibold cursor-pointer transition-all"
            style={{
              borderColor: filtre === f ? '#7c3aed' : '#30363d',
              background: filtre === f ? '#7c3aed' : '#1c2128',
              color: filtre === f ? 'white' : '#7d8590',
            }}
          >
            {f === 'tous' ? 'Tous' : f === 'en_cours' ? 'En cours' : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-[#7d8590] py-8 text-center">Chargement...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-[#1c2128] border border-[#30363d] rounded-[14px] px-4 py-8 text-center">
          <Sparkles size={32} color="#7c3aed" className="mx-auto mb-3" />
          <div className="text-[15px] font-bold mb-1.5">Aucune intervention améliorative</div>
          <div className="text-[13px] text-[#7d8590]">Créez un ticket de type &quot;Amélioratif&quot; pour suivre les upgrades machines.</div>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {filtered.map(t => (
            <Link key={t.id} href={`/manager/tickets/${t.id}`} className="no-underline text-inherit">
              <div className="bg-[#1c2128] border border-violet-600/20 rounded-xl px-4 py-3.5">
                <div className="text-[13px] font-bold mb-1.5 leading-snug">{t.titre}</div>
                <div className="flex gap-2 items-center flex-wrap">
                  <span className="text-[11px] text-[#7d8590]">
                    {(t.machines as unknown as { nom: string } | null)?.nom || '—'}
                  </span>
                  {t.technicians && (
                    <span className="text-[11px] text-[#7d8590]">
                      · {(t.technicians as unknown as { prenom: string }).prenom}
                    </span>
                  )}
                  <PrioriteBadge priorite={t.priorite} />
                  <span
                    className="rounded-md px-2 py-0.5 text-[11px] font-semibold"
                    style={{ background: `${statutColor[t.statut]}22`, color: statutColor[t.statut] }}
                  >
                    {statutLabel[t.statut]}
                  </span>
                  <span className="text-[11px] text-[#7d8590] ml-auto">{formatDate(t.created_at)}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
