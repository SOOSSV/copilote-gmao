'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Users, Wrench } from 'lucide-react';

type Tech = {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  specialite: string;
  disponible: boolean;
  tickets_ouverts?: number;
};

export default function TechniciensPage() {
  const [techs, setTechs] = useState<Tech[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('technicians').select('*').order('nom');
      if (!data) { setLoading(false); return; }

      const withTickets = await Promise.all(data.map(async tech => {
        const { count } = await supabase
          .from('tickets')
          .select('*', { count: 'exact', head: true })
          .eq('technicien_id', tech.id)
          .neq('statut', 'ferme');
        return { ...tech, tickets_ouverts: count || 0 };
      }));

      setTechs(withTickets);
      setLoading(false);
    }
    load();
  }, []);

  const specialiteColor: Record<string, string> = {
    mécanique:    '#6366f1',
    électrique:   '#f59e0b',
    hydraulique:  '#22c55e',
    automatisme:  '#06b6d4',
  };

  return (
    <div style={{ padding: '28px 32px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
        <Users size={22} color="var(--accent)" />
        <h1 style={{ fontSize: 22, fontWeight: 800 }}>Techniciens</h1>
        <span style={{ marginLeft: 4, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 20, padding: '2px 10px', fontSize: 12, color: 'var(--text-secondary)' }}>
          {techs.length}
        </span>
      </div>

      {loading ? (
        <div style={{ color: 'var(--text-secondary)' }}>Chargement...</div>
      ) : techs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-secondary)' }}>
          Aucun technicien enregistré
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {techs.map(tech => {
            const couleur = specialiteColor[tech.specialite?.toLowerCase()] || '#8b5cf6';
            return (
              <div key={tech.id} style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 14, padding: '20px',
              }}>
                {/* Avatar + nom */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                  <div style={{
                    width: 46, height: 46, borderRadius: '50%',
                    background: `${couleur}22`,
                    border: `2px solid ${couleur}44`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 18, fontWeight: 700, color: couleur,
                  }}>
                    {tech.prenom[0]}{tech.nom[0]}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{tech.prenom} {tech.nom}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 3 }}>
                      <Wrench size={11} color={couleur} />
                      <span style={{ fontSize: 12, color: couleur, fontWeight: 600, textTransform: 'capitalize' }}>
                        {tech.specialite || 'Non défini'}
                      </span>
                    </div>
                  </div>
                  <div style={{ marginLeft: 'auto' }}>
                    <span style={{
                      background: tech.disponible ? '#22c55e22' : '#ef444422',
                      color: tech.disponible ? '#22c55e' : '#ef4444',
                      borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 600,
                    }}>
                      {tech.disponible ? 'Disponible' : 'Occupé'}
                    </span>
                  </div>
                </div>

                {/* Infos */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, borderTop: '1px solid var(--border)', paddingTop: 14 }}>
                  {tech.email && (
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {tech.email}
                    </div>
                  )}
                  {tech.telephone && (
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{tech.telephone}</div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Tickets en cours</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: (tech.tickets_ouverts || 0) > 0 ? '#f59e0b' : 'var(--text-secondary)' }}>
                      {tech.tickets_ouverts || 0}
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
