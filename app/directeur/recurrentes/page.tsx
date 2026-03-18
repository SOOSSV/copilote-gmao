'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, AlertTriangle, RefreshCw } from 'lucide-react';
import Link from 'next/link';

type PanneRecurrente = {
  machine_id: string; machine_nom: string; machine_localisation: string;
  nb_pannes: number; derniere_panne: string;
};

export default function DirecteurRecurrentesPage() {
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
    <div style={{ padding: '16px', paddingBottom: 32 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: 4, display: 'flex', alignItems: 'center' }}>
          <ArrowLeft size={22} />
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: '#ef4444' }}>Pannes récurrentes</h1>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Machines avec ≥ 3 pannes correctives sur 30 jours</div>
        </div>
        <button onClick={load} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
          <RefreshCw size={13} /> Actualiser
        </button>
      </div>

      {loading ? (
        <div style={{ color: 'var(--text-secondary)', padding: 32, textAlign: 'center' }}>Chargement...</div>
      ) : data.length === 0 ? (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: '32px 16px', textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>✅</div>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>Aucune panne récurrente</div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Aucune machine n'a subi 3 pannes ou plus sur les 30 derniers jours.</div>
        </div>
      ) : (
        <>
          <div style={{ background: '#ef444412', border: '1px solid #ef444433', borderRadius: 12, padding: '12px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
            <AlertTriangle size={16} color="#ef4444" />
            <span style={{ color: '#ef4444', fontWeight: 600, fontSize: 13 }}>
              {data.length} machine{data.length > 1 ? 's' : ''} nécessite{data.length === 1 ? '' : 'nt'} une attention immédiate
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {data.map((p, i) => (
              <Link key={p.machine_id} href={`/directeur/machines/${p.machine_id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div style={{ background: 'var(--bg-card)', border: `1px solid ${i === 0 ? '#ef444444' : 'var(--border)'}`, borderRadius: 14, padding: '16px', display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: i === 0 ? '#ef444422' : 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: 18, fontWeight: 900, color: i === 0 ? '#ef4444' : 'var(--text-secondary)' }}>#{i + 1}</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.machine_nom}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>{p.machine_localisation}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Dernière panne : {formatDate(p.derniere_panne)}</div>
                  </div>
                  <div style={{ textAlign: 'center', flexShrink: 0 }}>
                    <div style={{ fontSize: 28, fontWeight: 900, color: '#ef4444', lineHeight: 1 }}>{p.nb_pannes}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 2 }}>pannes/30j</div>
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
