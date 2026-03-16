'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Wrench, MapPin, User, Calendar, Tag } from 'lucide-react';

type Ticket = {
  id: string; titre: string; description: string; priorite: string; statut: string;
  type_intervention: string; classification: string; created_at: string;
  machines: { nom: string; localisation: string; type_equipement: string } | null;
  technicians: { prenom: string; nom: string; specialites: string[] } | null;
};

const prioriteColor: Record<string, string> = { urgente: '#ef4444', haute: '#f59e0b', normale: '#6366f1', basse: '#22c55e' };
const statutColor: Record<string, string> = { ouvert: '#6366f1', en_cours: '#f59e0b', resolu: '#22c55e' };

export default function DirecteurTicketDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!params.id) return;
    supabase.from('tickets')
      .select('*, machines(nom, localisation, type_equipement), technicians(prenom, nom, specialites)')
      .eq('id', params.id).single()
      .then(({ data }) => { setTicket(data as Ticket); setLoading(false); });
  }, [params.id]);

  if (loading) return <div style={{ padding: 20, color: 'var(--text-secondary)' }}>Chargement...</div>;
  if (!ticket) return <div style={{ padding: 20, color: 'var(--text-secondary)' }}>Ticket introuvable</div>;

  const pc = prioriteColor[ticket.priorite] || '#6366f1';
  const sc = statutColor[ticket.statut] || '#6366f1';
  const statutLabel = ticket.statut === 'resolu' ? 'Résolu' : ticket.statut === 'en_cours' ? 'En cours' : 'Ouvert';

  return (
    <div style={{ padding: 'clamp(14px, 3vw, 22px)', maxWidth: 760, boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: 4, display: 'flex', alignItems: 'center' }}>
          <ArrowLeft size={22} />
        </button>
        <h1 style={{ fontSize: 18, fontWeight: 800, margin: 0, flex: 1 }}>{ticket.titre}</h1>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        <span style={{ background: `${pc}22`, color: pc, border: `1px solid ${pc}44`, borderRadius: 6, padding: '4px 12px', fontSize: 12, fontWeight: 700, textTransform: 'uppercase' }}>{ticket.priorite}</span>
        <span style={{ background: `${sc}22`, color: sc, border: `1px solid ${sc}44`, borderRadius: 6, padding: '4px 12px', fontSize: 12, fontWeight: 600 }}>{statutLabel}</span>
        <span style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 6, padding: '4px 12px', fontSize: 12, color: 'var(--text-secondary)' }}>
          {ticket.type_intervention === 'preventive' ? 'Préventif' : 'Correctif'}
        </span>
        {ticket.classification && (
          <span style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 6, padding: '4px 12px', fontSize: 12, color: 'var(--text-secondary)' }}>{ticket.classification}</span>
        )}
      </div>

      {ticket.description && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 20px', marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Description</div>
          <div style={{ fontSize: 14, lineHeight: 1.7 }}>{ticket.description}</div>
        </div>
      )}

      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 20px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {ticket.machines && (
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <Wrench size={16} color="#0ea5e9" style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 2 }}>Machine</div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{ticket.machines.nom}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{ticket.machines.type_equipement}</div>
              </div>
            </div>
          )}
          {ticket.machines?.localisation && (
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <MapPin size={16} color="var(--text-secondary)" style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 2 }}>Localisation</div>
                <div style={{ fontSize: 14 }}>{ticket.machines.localisation}</div>
              </div>
            </div>
          )}
          {ticket.technicians ? (
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <User size={16} color="var(--text-secondary)" style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 2 }}>Technicien assigné</div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{ticket.technicians.prenom} {ticket.technicians.nom}</div>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 4 }}>
                  {(ticket.technicians.specialites || []).map((s, i) => (
                    <span key={i} style={{ background: 'var(--bg-secondary)', borderRadius: 4, padding: '1px 6px', fontSize: 11, color: 'var(--text-secondary)' }}>{s}</span>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <User size={16} color="var(--text-secondary)" style={{ flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 2 }}>Technicien</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', fontStyle: 'italic' }}>Non assigné</div>
              </div>
            </div>
          )}
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <Calendar size={16} color="var(--text-secondary)" style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 2 }}>Créé le</div>
              <div style={{ fontSize: 14 }}>{new Date(ticket.created_at).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
