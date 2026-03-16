'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Users, Wrench, Moon, Sun, Sunset } from 'lucide-react';

type Tech = {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  specialites: string[];
  disponible: boolean;
  charge_actuelle: number;
  tickets_ouverts?: number;
};

const equipes: Record<string, { label: string; horaire: string; color: string; icon: React.ElementType; membres: string[] }> = {
  matin:      { label: 'Matin',      horaire: '06h–14h', color: '#f59e0b', icon: Sun,    membres: ['Marc', 'Julie'] },
  'apres-midi': { label: 'Après-midi', horaire: '14h–22h', color: '#6366f1', icon: Sunset, membres: ['Thomas', 'Sophie'] },
  nuit:       { label: 'Nuit',       horaire: '22h–06h', color: '#8b5cf6', icon: Moon,   membres: ['Karim', 'Nadia'] },
};

function getEquipe(prenom: string) {
  for (const [key, eq] of Object.entries(equipes)) {
    if (eq.membres.includes(prenom)) return { key, ...eq };
  }
  return null;
}

function getShiftActuel() {
  const h = new Date().getHours();
  if (h >= 6 && h < 14) return 'matin';
  if (h >= 14 && h < 22) return 'apres-midi';
  return 'nuit';
}

const specialiteColor: Record<string, string> = {
  mécanique: '#6366f1', électrique: '#f59e0b', hydraulique: '#22c55e',
  automatisme: '#06b6d4', froid: '#0ea5e9', cvc: '#0ea5e9', polyvalent: '#8b5cf6', pneumatique: '#10b981',
};

function getSpecialiteColor(s: string) {
  return specialiteColor[s.toLowerCase()] || '#8b5cf6';
}

export default function TechniciensPage() {
  const [techs, setTechs] = useState<Tech[]>([]);
  const [loading, setLoading] = useState(true);
  const shiftActuel = getShiftActuel();

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('technicians').select('*').order('nom');
      if (!data) { setLoading(false); return; }

      const withTickets = await Promise.all(data.map(async tech => {
        const { count } = await supabase.from('tickets')
          .select('*', { count: 'exact', head: true })
          .eq('technicien_id', tech.id)
          .in('statut', ['ouvert', 'en_cours']);
        return { ...tech, tickets_ouverts: count || 0 };
      }));

      setTechs(withTickets);
      setLoading(false);
    }
    load();
  }, []);

  // Grouper par équipe
  const parEquipe = Object.entries(equipes).map(([key, eq]) => ({
    key, ...eq,
    techs: techs.filter(t => eq.membres.includes(t.prenom)),
  }));

  return (
    <div style={{ padding: '20px 16px', maxWidth: '100vw', boxSizing: 'border-box', overflowX: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <Users size={20} color="var(--accent)" />
        <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>Techniciens</h1>
        <span style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 20, padding: '2px 10px', fontSize: 12, color: 'var(--text-secondary)' }}>
          {techs.length}
        </span>
      </div>
      <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 20 }}>
        Équipe en service actuellement : <strong style={{ color: equipes[shiftActuel]?.color }}>{equipes[shiftActuel]?.label} ({equipes[shiftActuel]?.horaire})</strong>
      </div>

      {loading ? (
        <div style={{ color: 'var(--text-secondary)', padding: 20 }}>Chargement...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {parEquipe.map(({ key, label, horaire, color, icon: Icon, techs: teamTechs }) => {
            const isActuel = key === shiftActuel;
            return (
              <div key={key}>
                {/* Header équipe */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={15} color={color} />
                  </div>
                  <span style={{ fontWeight: 700, fontSize: 14, color }}>{label}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{horaire}</span>
                  {isActuel && (
                    <span style={{ background: `${color}22`, color, border: `1px solid ${color}44`, borderRadius: 20, padding: '1px 8px', fontSize: 10, fontWeight: 700 }}>
                      EN SERVICE
                    </span>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 10 }}>
                  {teamTechs.map(tech => (
                    <div key={tech.id} style={{
                      background: 'var(--bg-card)',
                      border: `1px solid ${isActuel ? `${color}44` : 'var(--border)'}`,
                      borderRadius: 12, padding: '14px 16px',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                        <div style={{
                          width: 42, height: 42, borderRadius: '50%',
                          background: `${color}20`, border: `2px solid ${color}44`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 15, fontWeight: 700, color, flexShrink: 0,
                        }}>
                          {tech.prenom[0]}{tech.nom[0]}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 700, fontSize: 14 }}>{tech.prenom} {tech.nom}</div>
                          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 4 }}>
                            {(tech.specialites || []).map((s, i) => (
                              <span key={i} style={{ background: `${getSpecialiteColor(s)}18`, color: getSpecialiteColor(s), borderRadius: 4, padding: '1px 6px', fontSize: 10, fontWeight: 600 }}>
                                {s}
                              </span>
                            ))}
                          </div>
                        </div>
                        <span style={{
                          background: tech.disponible ? '#22c55e22' : '#ef444422',
                          color: tech.disponible ? '#22c55e' : '#ef4444',
                          borderRadius: 20, padding: '2px 8px', fontSize: 10, fontWeight: 600, flexShrink: 0,
                        }}>
                          {tech.disponible ? 'Dispo' : 'Occupé'}
                        </span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, borderTop: '1px solid var(--border)', paddingTop: 10 }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Tickets en cours</span>
                        <span style={{ fontWeight: 700, color: (tech.tickets_ouverts || 0) > 0 ? '#f59e0b' : 'var(--text-secondary)' }}>
                          {tech.tickets_ouverts || 0}
                        </span>
                      </div>
                      {tech.telephone && (
                        <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 6 }}>{tech.telephone}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
