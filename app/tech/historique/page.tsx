'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { CheckCircle, Calendar, Wrench, TrendingUp, ArrowLeft, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import TypeBadge from '@/components/TypeBadge';

type Ticket = {
  id: string; titre: string; type_intervention: string; priorite: string;
  resolu_le: string | null; created_at: string; duree_intervention_min: number | null;
  machines: { nom: string } | null;
};

export default function TechHistorique() {
  const router = useRouter();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const id = localStorage.getItem('tech_id');
    if (!id) return;
    load(id);
  }, []);

  async function load(id: string) {
    const { data } = await supabase.from('tickets')
      .select('id, titre, type_intervention, priorite, resolu_le, created_at, duree_intervention_min, machines(nom)')
      .eq('technicien_id', id).eq('statut', 'resolu')
      .order('resolu_le', { ascending: false });
    setTickets((data as unknown as Ticket[]) || []);
    setLoading(false);
  }

  const now = new Date();
  const debutSemaine = new Date(now); debutSemaine.setDate(now.getDate() - now.getDay());
  const debutMois = new Date(now.getFullYear(), now.getMonth(), 1);

  const cetteSemaine = tickets.filter(t => t.resolu_le && new Date(t.resolu_le) >= debutSemaine).length;
  const ceMois = tickets.filter(t => t.resolu_le && new Date(t.resolu_le) >= debutMois).length;
  const totalResolus = tickets.length;

  return (
    <div className="p-4">
      <div className="flex items-center gap-2 mb-1">
        <button onClick={() => router.back()} className="bg-transparent border-none cursor-pointer text-[#7d8590] p-1 flex items-center">
          <ArrowLeft size={20} />
        </button>
        <TrendingUp size={18} color="#22c55e" />
        <h1 className="text-[20px] font-extrabold m-0">Mes stats</h1>
      </div>
      <div className="text-[13px] text-[#7d8590] mb-5">
        {totalResolus} intervention{totalResolus > 1 ? 's' : ''} résolue{totalResolus > 1 ? 's' : ''}
      </div>

      <div className="grid grid-cols-3 gap-2.5 mb-6">
        {[
          { label: 'Cette semaine', value: cetteSemaine, color: '#0ea5e9' },
          { label: 'Ce mois', value: ceMois, color: '#2563eb' },
          { label: 'Total résolus', value: totalResolus, color: '#22c55e' },
        ].map(k => (
          <div
            key={k.label}
            className="bg-[#1c2128] rounded-xl py-3.5 px-3 text-center"
            style={{ border: `1px solid ${k.color}33` }}
          >
            <div className="text-[26px] font-extrabold" style={{ color: k.color }}>{k.value}</div>
            <div className="text-[10px] text-[#7d8590] mt-0.5">{k.label}</div>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="text-[#7d8590] text-center py-10">Chargement...</div>
      ) : tickets.length === 0 ? (
        <div className="bg-[#1c2128] border border-[#30363d] rounded-[14px] py-10 text-center text-[#7d8590]">
          <CheckCircle size={28} className="opacity-30 mx-auto mb-2.5" />
          <div>Aucune intervention résolue pour l&apos;instant</div>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {tickets.map(t => (
            <div key={t.id} className="bg-[#1c2128] border border-[#30363d] rounded-[14px] p-4">
              <div className="flex justify-between items-start mb-2 gap-2">
                <div className="text-[14px] font-bold flex-1">{t.titre}</div>
                <TypeBadge type={t.type_intervention} />
              </div>
              {t.machines && (
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Wrench size={12} color="#7d8590" />
                  <span className="text-[12px] text-[#7d8590]">{t.machines.nom}</span>
                </div>
              )}
              <div className="flex items-center gap-4">
                {t.resolu_le && (
                  <div className="flex items-center gap-1.5">
                    <Calendar size={12} color="#7d8590" />
                    <span className="text-[12px] text-[#7d8590]">
                      {new Date(t.resolu_le).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                  </div>
                )}
                {t.duree_intervention_min && (
                  <div className="flex items-center gap-1.5">
                    <Clock size={12} color="#7d8590" />
                    <span className="text-[12px] text-[#7d8590]">{t.duree_intervention_min} min</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
