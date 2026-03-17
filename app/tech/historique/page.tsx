'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { CheckCircle, Calendar, Wrench, Package, TrendingUp, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

type HistEntry = {
  id: string;
  type_action: string;
  description: string;
  pieces_utilisees: { nom: string; quantite: number; unite: string }[] | null;
  realise_le: string;
  tickets: { titre: string; priorite: string } | null;
  machines: { nom: string } | null;
};

export default function TechHistorique() {
  const router = useRouter();
  const [history, setHistory] = useState<HistEntry[]>([]);
  const [resolus, setResolus] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const id = localStorage.getItem('tech_id');
    if (!id) return;
    load(id);
  }, []);

  async function load(id: string) {
    const [{ data: hist }, { count }] = await Promise.all([
      supabase.from('maintenance_history')
        .select('id, type_action, description, pieces_utilisees, realise_le, tickets(titre, priorite), machines(nom)')
        .eq('technicien_id', id).order('realise_le', { ascending: false }).limit(50),
      supabase.from('tickets').select('*', { count: 'exact', head: true })
        .eq('technicien_id', id).eq('statut', 'resolu'),
    ]);
    setHistory((hist as unknown as HistEntry[]) || []);
    setResolus(count || 0);
    setLoading(false);
  }

  const now = new Date();
  const debutSemaine = new Date(now); debutSemaine.setDate(now.getDate() - now.getDay());
  const debutMois = new Date(now.getFullYear(), now.getMonth(), 1);

  const cetteSemaine = history.filter(h => new Date(h.realise_le) >= debutSemaine).length;
  const ceMois = history.filter(h => new Date(h.realise_le) >= debutMois).length;

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: 4, display: 'flex', alignItems: 'center' }}><ArrowLeft size={20} /></button>
        <TrendingUp size={18} color="#22c55e" />
        <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>Mes stats</h1>
      </div>
      <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>{history.length} intervention{history.length > 1 ? 's' : ''} enregistrée{history.length > 1 ? 's' : ''}</div>

      {/* KPI stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 24 }}>
        {[
          { label: 'Cette semaine', value: cetteSemaine, color: '#0ea5e9' },
          { label: 'Ce mois', value: ceMois, color: '#2563eb' },
          { label: 'Total résolus', value: resolus, color: '#22c55e' },
        ].map(k => (
          <div key={k.label} style={{ background: 'var(--bg-card)', border: `1px solid ${k.color}33`, borderRadius: 12, padding: '14px 12px', textAlign: 'center' }}>
            <div style={{ fontSize: 26, fontWeight: 800, color: k.color }}>{k.value}</div>
            <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 2 }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Liste interventions */}
      {loading ? (
        <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: 40 }}>Chargement...</div>
      ) : history.length === 0 ? (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>
          <CheckCircle size={28} style={{ opacity: 0.3, marginBottom: 10 }} />
          <div>Aucune intervention pour l'instant</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {history.map(h => (
            <div key={h.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div style={{ fontSize: 14, fontWeight: 700, flex: 1, paddingRight: 8 }}>{h.tickets?.titre || 'Intervention'}</div>
                <span style={{ background: '#22c55e18', color: '#22c55e', border: '1px solid #22c55e33', borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap' }}>
                  {h.type_action === 'preventive' ? 'Préventif' : 'Correctif'}
                </span>
              </div>
              {h.machines && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <Wrench size={12} color="var(--text-secondary)" />
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{h.machines.nom}</span>
                </div>
              )}
              {h.description && (
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8, lineHeight: 1.5 }}>{h.description.substring(0, 120)}{h.description.length > 120 ? '...' : ''}</div>
              )}
              {h.pieces_utilisees && h.pieces_utilisees.length > 0 && (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                  {h.pieces_utilisees.map((p, i) => (
                    <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 6, padding: '2px 8px', fontSize: 11 }}>
                      <Package size={10} /> {p.quantite} {p.unite} · {p.nom}
                    </span>
                  ))}
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Calendar size={12} color="var(--text-secondary)" />
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{new Date(h.realise_le).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
