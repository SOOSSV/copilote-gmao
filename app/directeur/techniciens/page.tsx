'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Users } from 'lucide-react';

type Tech = {
  id: string; nom: string; prenom: string; email: string; telephone: string;
  specialites: string[]; disponible: boolean; tickets_ouverts?: number; tickets_resolus?: number;
};

const specialiteColor: Record<string, string> = {
  mécanique: '#6366f1', électrique: '#f59e0b', hydraulique: '#22c55e',
  automatisme: '#06b6d4', froid: '#0ea5e9', cvc: '#0ea5e9', polyvalent: '#8b5cf6', pneumatique: '#10b981',
};
function getSpecialiteColor(s: string) { return specialiteColor[s.toLowerCase()] || '#8b5cf6'; }

export default function DirecteurTechniciensPage() {
  const [techs, setTechs] = useState<Tech[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div style={{ padding: 'clamp(14px, 3vw, 24px)', maxWidth: 1100, boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
        <Users size={20} color="#0ea5e9" />
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>Techniciens</h1>
        <span style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 20, padding: '2px 10px', fontSize: 12, color: 'var(--text-secondary)' }}>{techs.length}</span>
      </div>

      {loading ? <div style={{ color: 'var(--text-secondary)', padding: 20 }}>Chargement...</div> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
          {techs.map(tech => (
            <div key={tech.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: '18px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
                <div style={{ width: 46, height: 46, borderRadius: '50%', background: '#0ea5e920', border: '2px solid #0ea5e944', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: '#0ea5e9', flexShrink: 0 }}>
                  {tech.prenom[0]}{tech.nom[0]}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{tech.prenom} {tech.nom}</div>
                  {tech.email && <div style={{ fontSize: 12, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tech.email}</div>}
                </div>
                <span style={{ background: tech.disponible ? '#22c55e22' : '#ef444422', color: tech.disponible ? '#22c55e' : '#ef4444', borderRadius: 20, padding: '2px 8px', fontSize: 10, fontWeight: 600, flexShrink: 0 }}>
                  {tech.disponible ? 'Dispo' : 'Occupé'}
                </span>
              </div>

              {(tech.specialites || []).length > 0 && (
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 12 }}>
                  {tech.specialites.map((s, i) => (
                    <span key={i} style={{ background: `${getSpecialiteColor(s)}18`, color: getSpecialiteColor(s), borderRadius: 4, padding: '1px 7px', fontSize: 10, fontWeight: 600 }}>{s}</span>
                  ))}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: '#f59e0b' }}>{tech.tickets_ouverts}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>En cours</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: '#22c55e' }}>{tech.tickets_resolus}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>Résolus</div>
                </div>
              </div>

              {tech.telephone && (
                <div style={{ marginTop: 10, fontSize: 12, color: 'var(--text-secondary)', borderTop: '1px solid var(--border)', paddingTop: 10 }}>{tech.telephone}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
