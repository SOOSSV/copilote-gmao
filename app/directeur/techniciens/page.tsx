'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Users, Sun, Sunset, Moon } from 'lucide-react';

type Tech = {
  id: string; nom: string; prenom: string; email: string; telephone: string;
  specialites: string[]; disponible: boolean;
  tickets_ouverts?: number; tickets_resolus?: number;
};

const equipes: Record<string, { label: string; horaire: string; color: string; icon: React.ElementType; membres: string[] }> = {
  matin:        { label: 'Matin',      horaire: '06h-14h', color: '#f59e0b', icon: Sun,    membres: ['Marc', 'Julie'] },
  'apres-midi': { label: 'Apres-midi', horaire: '14h-22h', color: '#2563eb', icon: Sunset, membres: ['Thomas', 'Sophie'] },
  nuit:         { label: 'Nuit',       horaire: '22h-06h', color: '#7c3aed', icon: Moon,   membres: ['Karim', 'Nadia'] },
};

function getShiftActuel() {
  const h = new Date().getHours();
  if (h >= 6 && h < 14) return 'matin';
  if (h >= 14 && h < 22) return 'apres-midi';
  return 'nuit';
}

const specialiteColor: Record<string, string> = {
  mecanique: '#2563eb', electrique: '#f59e0b', hydraulique: '#22c55e',
  automatisme: '#06b6d4', froid: '#0ea5e9', cvc: '#0ea5e9', polyvalent: '#7c3aed', pneumatique: '#10b981',
};
function getSpecialiteColor(s: string) {
  const normalized = s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return specialiteColor[normalized] || '#7c3aed';
}

export default function DirecteurTechniciensPage() {
  const [techs, setTechs] = useState<Tech[]>([]);
  const [loading, setLoading] = useState(true);
  const shiftActuel = getShiftActuel();

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('technicians').select('*').order('nom');
      if (!data) { setLoading(false); return; }
      const withStats = await Promise.all(data.map(async tech => {
        const [{ count: ouverts }, { count: resolus }] = await Promise.all([
          supabase.from('tickets').select('*', { count: 'exact', head: true }).eq('technicien_id', tech.id).in('statut', ['ouvert', 'en_cours']),
          supabase.from('tickets').select('*', { count: 'exact', head: true }).eq('technicien_id', tech.id).eq('statut', 'resolu'),
        ]);
        return { ...tech, tickets_ouverts: ouverts || 0, tickets_resolus: resolus || 0 };
      }));
      setTechs(withStats);
      setLoading(false);
    }
    load();
  }, []);

  const parEquipe = Object.entries(equipes).map(([key, eq]) => ({
    key, ...eq, techs: techs.filter(t => eq.membres.includes(t.prenom)),
  }));
  const techniciensGroupes = new Set(Object.values(equipes).flatMap(e => e.membres));
  const autresTechs = techs.filter(t => !techniciensGroupes.has(t.prenom));

  return (
    <div style={{ padding: '20px 16px', maxWidth: '100vw', boxSizing: 'border-box', overflowX: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <Users size={20} color="var(--accent)" />
        <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>Techniciens</h1>
        <span style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 20, padding: '2px 10px', fontSize: 12, color: 'var(--text-secondary)' }}>{techs.length}</span>
      </div>
      <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 20 }}>
        Equipe en service : <strong style={{ color: equipes[shiftActuel]?.color }}>{equipes[shiftActuel]?.label} ({equipes[shiftActuel]?.horaire})</strong>
      </div>

      {loading ? <div style={{ color: 'var(--text-secondary)', padding: 20 }}>Chargement...</div> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {parEquipe.map(({ key, label, horaire, color, icon: Icon, techs: teamTechs }) => {
            const isActuel = key === shiftActuel;
            return (
              <div key={key}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={15} color={color} />
                  </div>
                  <span style={{ fontWeight: 700, fontSize: 14, color }}>{label}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{horaire}</span>
                  {isActuel && <span style={{ background: color + '22', color, border: '1px solid ' + color + '44', borderRadius: 20, padding: '1px 8px', fontSize: 10, fontWeight: 700 }}>EN SERVICE</span>}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 10 }}>
                  {teamTechs.map(tech => (
                    <div key={tech.id} style={{ background: 'var(--bg-card)', border: '1px solid ' + (isActuel ? color + '44' : 'var(--border)'), borderRadius: 12, padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                        <div style={{ width: 42, height: 42, borderRadius: '50%', background: color + '20', border: '2px solid ' + color + '44', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 700, color, flexShrink: 0 }}>
                          {tech.prenom[0]}{tech.nom[0]}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 700, fontSize: 14 }}>{tech.prenom} {tech.nom}</div>
                          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 4 }}>
                            {(tech.specialites || []).map((s, i) => (
                              <span key={i} style={{ background: getSpecialiteColor(s) + '18', color: getSpecialiteColor(s), borderRadius: 4, padding: '1px 6px', fontSize: 10, fontWeight: 600 }}>{s}</span>
                            ))}
                          </div>
                        </div>
                        <span style={{ background: tech.disponible ? '#22c55e22' : '#ef444422', color: tech.disponible ? '#22c55e' : '#ef4444', borderRadius: 20, padding: '2px 8px', fontSize: 10, fontWeight: 600, flexShrink: 0 }}>
                          {tech.disponible ? 'Dispo' : 'Occupe'}
                        </span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, borderTop: '1px solid var(--border)', paddingTop: 10 }}>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: 20, fontWeight: 800, color: '#f59e0b' }}>{tech.tickets_ouverts}</div>
                          <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>En cours</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: 20, fontWeight: 800, color: '#22c55e' }}>{tech.tickets_resolus}</div>
                          <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>Resolus</div>
                        </div>
                      </div>
                      {tech.telephone && <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text-secondary)', borderTop: '1px solid var(--border)', paddingTop: 8 }}>{tech.telephone}</div>}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          {autresTechs.length > 0 && (
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-secondary)', marginBottom: 12 }}>Autres techniciens</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 10 }}>
                {autresTechs.map(tech => (
                  <div key={tech.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                      <div style={{ width: 42, height: 42, borderRadius: '50%', background: '#0ea5e920', border: '2px solid #0ea5e944', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 700, color: '#0ea5e9', flexShrink: 0 }}>
                        {tech.prenom[0]}{tech.nom[0]}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 14 }}>{tech.prenom} {tech.nom}</div>
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 4 }}>
                          {(tech.specialites || []).map((s, i) => (
                            <span key={i} style={{ background: getSpecialiteColor(s) + '18', color: getSpecialiteColor(s), borderRadius: 4, padding: '1px 6px', fontSize: 10, fontWeight: 600 }}>{s}</span>
                          ))}
                        </div>
                      </div>
                      <span style={{ background: tech.disponible ? '#22c55e22' : '#ef444422', color: tech.disponible ? '#22c55e' : '#ef4444', borderRadius: 20, padding: '2px 8px', fontSize: 10, fontWeight: 600, flexShrink: 0 }}>
                        {tech.disponible ? 'Dispo' : 'Occupe'}
                      </span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, borderTop: '1px solid var(--border)', paddingTop: 10 }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 20, fontWeight: 800, color: '#f59e0b' }}>{tech.tickets_ouverts}</div>
                        <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>En cours</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 20, fontWeight: 800, color: '#22c55e' }}>{tech.tickets_resolus}</div>
                        <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>Resolus</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
