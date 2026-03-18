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
    <div style={{ padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: 4, display: 'flex', alignItems: 'center' }}><ArrowLeft size={20} /></button>
        <TrendingUp size={18} color="#22c55e" />
        <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>Mes stats</h1>
      </div>
      <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>
        {totalResolus} intervention{totalResolus > 1 ? 's' : ''} résolue{totalResolus > 1 ? 's' : ''}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 24 }}>
        {[
          { label: 'Cette semaine', value: cetteSemaine, color: '#0ea5e9' },
          { label: 'Ce mois', value: ceMois, color: '#2563eb' },
          { label: 'Total résolus', value: totalResolus, color: '#22c55e' },
        ].map(k => (
          <div key={k.label} style={{ background: 'var(--bg-card)', border: `1px solid ${k.color}33`, borderRadius: 12, padding: '14px 12px', textAlign: 'center' }}>
            <div style={{ fontSize: 26, fontWeight: 800, color: k.color }}>{k.value}</div>
            <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 2 }}>{k.label}</div>
          </div>
        ))}
      </div>

      {loading ? (
        <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: 40 }}>Chargement...</div>
      ) : tickets.length === 0 ? (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>
          <CheckCircle size={28} style={{ opacity: 0.3, marginBottom: 10 }} />
          <div>Aucune intervention résolue pour l'instant</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {tickets.map(t => (
            <div key={t.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8, gap: 8 }}>
                <div style={{ fontSize: 14, fontWeight: 700, flex: 1 }}>{t.titre}</div>
                <TypeBadge type={t.type_intervention} />
              </div>
              {t.machines && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <Wrench size={12} color="var(--text-secondary)" />
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{t.machines.nom}</span>
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                {t.resolu_le && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Calendar size={12} color="var(--text-secondary)" />
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                      {new Date(t.resolu_le).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                  </div>
                )}
                {t.duree_intervention_min && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Clock size={12} color="var(--text-secondary)" />
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{t.duree_intervention_min} min</span>
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
