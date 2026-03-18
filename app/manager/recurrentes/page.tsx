'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, AlertTriangle, RefreshCw } from 'lucide-react';
import Link from 'next/link';

type PanneRecurrente = {
  machine_id: string;
  machine_nom: string;
  machine_localisation: string;
  nb_pannes: number;
  derniere_panne: string;
};

export default function RecurrentesPage() {
  const router = useRouter();
  const [data, setData] = useState<PanneRecurrente[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const { data: pr } = await supabase.rpc('get_pannes_recurrentes', { seuil: 3, jours: 30 });
    setData((pr as PanneRecurrente[]) || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

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
          <h1 className="text-[18px] font-extrabold m-0 text-red-500">Pannes récurrentes</h1>
          <div className="text-[12px] text-[#7d8590]">Machines avec ≥ 3 pannes correctives sur 30 jours</div>
        </div>
        <button
          onClick={load}
          className="bg-[#1c2128] border border-[#30363d] rounded-lg px-3 py-1.5 cursor-pointer text-[#7d8590] text-[12px] flex items-center gap-1.5"
        >
          <RefreshCw size={13} /> Actualiser
        </button>
      </div>

      {loading ? (
        <div className="text-[#7d8590] py-8 text-center">Chargement...</div>
      ) : data.length === 0 ? (
        <div className="bg-[#1c2128] border border-[#30363d] rounded-[14px] px-4 py-8 text-center">
          <div className="text-[32px] mb-3">✅</div>
          <div className="text-[15px] font-bold mb-1.5">Aucune panne récurrente</div>
          <div className="text-[13px] text-[#7d8590]">Aucune machine n&apos;a subi 3 pannes ou plus sur les 30 derniers jours.</div>
        </div>
      ) : (
        <>
          <div className="bg-red-500/8 border border-red-500/20 rounded-xl px-4 py-3 mb-5 flex items-center gap-2.5">
            <AlertTriangle size={16} color="#ef4444" />
            <span className="text-red-500 font-semibold text-[13px]">
              {data.length} machine{data.length > 1 ? 's' : ''} nécessite{data.length === 1 ? '' : 'nt'} une attention immédiate
            </span>
          </div>

          <div className="flex flex-col gap-3">
            {data.map((p, i) => (
              <Link key={p.machine_id} href={`/manager/machines/${p.machine_id}`} className="no-underline text-inherit">
                <div
                  className="bg-[#1c2128] rounded-[14px] p-4 flex items-center gap-4"
                  style={{ border: `1px solid ${i === 0 ? '#ef444444' : '#30363d'}` }}
                >
                  {/* Rang */}
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: i === 0 ? '#ef444422' : '#161b22' }}
                  >
                    <span className="text-[18px] font-black" style={{ color: i === 0 ? '#ef4444' : '#7d8590' }}>#{i + 1}</span>
                  </div>

                  {/* Infos */}
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] font-bold mb-0.5 overflow-hidden text-ellipsis whitespace-nowrap">{p.machine_nom}</div>
                    <div className="text-[12px] text-[#7d8590] mb-1">{p.machine_localisation}</div>
                    <div className="text-[11px] text-[#7d8590]">Dernière panne : {formatDate(p.derniere_panne)}</div>
                  </div>

                  {/* Compteur */}
                  <div className="text-center shrink-0">
                    <div className="text-[28px] font-black text-red-500 leading-none">{p.nb_pannes}</div>
                    <div className="text-[10px] text-[#7d8590] mt-0.5">pannes/30j</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
