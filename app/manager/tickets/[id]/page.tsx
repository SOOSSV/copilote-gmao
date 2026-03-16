'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Wrench, MapPin, User, Calendar, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

type Ticket = {
  id: string;
  titre: string;
  description: string;
  priorite: string;
  statut: string;
  type_intervention: string;
  classification: string;
  created_at: string;
  machines: { nom: string; localisation: string; type_equipement: string } | null;
  technicians: { prenom: string; nom: string; specialites: string[] } | null;
};

const prioriteColor: Record<string, string> = {
  urgente: '#ef4444', haute: '#f59e0b', normale: '#6366f1', basse: '#22c55e',
};
const statutColor: Record<string, string> = {
  ouvert: '#6366f1', en_cours: '#f59e0b', resolu: '#22c55e',
};

export default function TicketDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('tickets')
        .select('*, machines(nom, localisation, type_equipement), technicians(prenom, nom, specialites)')
        .eq('id', params.id)
        .single();
      setTicket(data as Ticket);
      setLoading(false);
    }
    if (params.id) load();
  }, [params.id]);

  async function updateStatut(statut: string) {
    setSaving(true);
    await supabase.from('tickets').update({ statut }).eq('id', params.id as string);
    setTicket(prev => prev ? { ...prev, statut } : prev);
    setSaving(false);
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  if (loading) return <div style={{ padding: 20, color: 'var(--text-secondary)' }}>Chargement...</div>;
  if (!ticket) return <div style={{ padding: 20, color: 'var(--text-secondary)' }}>Ticket introuvable</div>;

  const pColor = prioriteColor[ticket.priorite] || '#6366f1';
  const sColor = statutColor[ticket.statut] || '#6366f1';

  return (
    <div style={{ padding: '16px', maxWidth: '100vw', boxSizing: 'border-box', overflowX: 'hidden' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: 4, display: 'flex', alignItems: 'center' }}>
          <ArrowLeft size={22} />
        </button>
        <h1 style={{ fontSize: 16, fontWeight: 800, margin: 0, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ticket.titre}</h1>
      </div>

      {/* Badges */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        <span style={{ background: `${pColor}22`, color: pColor, border: `1px solid ${pColor}44`, borderRadius: 6, padding: '3px 10px', fontSize: 12, fontWeight: 700, textTransform: 'uppercase' }}>
          {ticket.priorite}
        </span>
        <span style={{ background: `${sColor}22`, color: sColor, border: `1px solid ${sColor}44`, borderRadius: 6, padding: '3px 10px', fontSize: 12, fontWeight: 600 }}>
          {ticket.statut === 'en_cours' ? 'En cours' : ticket.statut === 'resolu' ? 'Résolu' : 'Ouvert'}
        </span>
        <span style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 6, padding: '3px 10px', fontSize: 12, color: 'var(--text-secondary)' }}>
          {ticket.type_intervention === 'preventive' ? 'Préventif' : 'Correctif'}
        </span>
        {ticket.classification && (
          <span style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 6, padding: '3px 10px', fontSize: 12, color: 'var(--text-secondary)' }}>
            {ticket.classification}
          </span>
        )}
      </div>

      {/* Description */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 16px', marginBottom: 12 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Description</div>
        <div style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--text-primary)' }}>{ticket.description}</div>
      </div>

      {/* Infos */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 16px', marginBottom: 12 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {ticket.machines && (
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <Wrench size={16} color="var(--accent)" style={{ flexShrink: 0, marginTop: 1 }} />
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Machine</div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{ticket.machines.nom}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{ticket.machines.type_equipement}</div>
              </div>
            </div>
          )}
          {ticket.machines?.localisation && (
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <MapPin size={16} color="var(--text-secondary)" style={{ flexShrink: 0, marginTop: 1 }} />
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Localisation</div>
                <div style={{ fontSize: 14 }}>{ticket.machines.localisation}</div>
              </div>
            </div>
          )}
          {ticket.technicians && (
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <User size={16} color="var(--text-secondary)" style={{ flexShrink: 0, marginTop: 1 }} />
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Technicien assigné</div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{ticket.technicians.prenom} {ticket.technicians.nom}</div>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 4 }}>
                  {(ticket.technicians.specialites || []).map((s, i) => (
                    <span key={i} style={{ background: 'var(--bg-secondary)', borderRadius: 4, padding: '1px 6px', fontSize: 10, color: 'var(--text-secondary)' }}>{s}</span>
                  ))}
                </div>
              </div>
            </div>
          )}
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <Calendar size={16} color="var(--text-secondary)" style={{ flexShrink: 0, marginTop: 1 }} />
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Créé le</div>
              <div style={{ fontSize: 13 }}>{formatDate(ticket.created_at)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Changer statut */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 16px' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 12 }}>Changer le statut</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            { value: 'ouvert',   label: 'Ouvert',   icon: AlertTriangle, color: '#6366f1' },
            { value: 'en_cours', label: 'En cours', icon: Clock,         color: '#f59e0b' },
            { value: 'resolu',   label: 'Résolu',   icon: CheckCircle,   color: '#22c55e' },
          ].map(({ value, label, icon: Icon, color }) => (
            <button key={value} onClick={() => updateStatut(value)} disabled={saving || ticket.statut === value} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '12px 16px', borderRadius: 10, border: '1px solid',
              borderColor: ticket.statut === value ? color : 'var(--border)',
              background: ticket.statut === value ? `${color}18` : 'transparent',
              color: ticket.statut === value ? color : 'var(--text-secondary)',
              cursor: ticket.statut === value ? 'default' : 'pointer',
              fontWeight: ticket.statut === value ? 700 : 400, fontSize: 14,
            }}>
              <Icon size={16} />
              {label}
              {ticket.statut === value && <span style={{ marginLeft: 'auto', fontSize: 11 }}>✓ Actuel</span>}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
