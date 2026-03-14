'use client';

import { useEffect, useState } from 'react';
import { supabase, Ticket } from '@/lib/supabase';
import BottomNav from '@/components/BottomNav';
import PrioriteBadge from '@/components/PrioriteBadge';
import { ArrowLeft, Clock, Wrench, Cpu, Tag, User } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';

const statutColor: Record<string, string> = {
  ouvert:   '#6366f1',
  en_cours: '#f59e0b',
  ferme:    '#22c55e',
};

const statutLabel: Record<string, string> = {
  ouvert:   'Ouvert',
  en_cours: 'En cours',
  ferme:    'Fermé',
};

const classificationLabel: Record<string, string> = {
  mecanique:  'Mécanique',
  electrique: 'Électrique',
  hydraulique:'Hydraulique',
  usure:      'Usure',
  autre:      'Autre',
};

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 0', borderBottom: '1px solid var(--border)' }}>
      <div style={{ color: 'var(--text-secondary)', marginTop: 1, flexShrink: 0 }}>{icon}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 3 }}>{label}</div>
        <div style={{ fontSize: 14, color: 'var(--text-primary)', fontWeight: 500 }}>{value}</div>
      </div>
    </div>
  );
}

export default function TicketDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    supabase
      .from('tickets')
      .select('*, machines(nom), technicians(prenom, nom)')
      .eq('id', id)
      .single()
      .then(({ data, error }) => {
        if (error) console.error('Ticket query error:', error);
        setTicket(data as Ticket | null);
        setLoading(false);
      });
  }, [id]);

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('fr-FR', {
      weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--text-secondary)' }}>
        Chargement...
      </div>
    );
  }

  if (!ticket) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: 16 }}>
        <div style={{ fontSize: 16, color: 'var(--text-secondary)' }}>Ticket introuvable</div>
        <button onClick={() => router.push('/tickets')} style={{ background: 'var(--accent)', border: 'none', borderRadius: 8, padding: '10px 20px', color: 'white', cursor: 'pointer', fontWeight: 600 }}>
          Retour aux tickets
        </button>
      </div>
    );
  }

  const machine = ticket.machines as unknown as { nom: string } | undefined;
  const tech = ticket.technicians as unknown as { prenom: string; nom: string } | undefined;

  return (
    <div style={{ background: 'var(--bg-primary)', minHeight: '100vh', paddingBottom: 100 }}>
      {/* Header */}
      <div style={{
        background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border)',
        padding: '16px 20px',
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <button onClick={() => router.push('/tickets')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', padding: 0 }}>
          <ArrowLeft size={20} />
        </button>
        <span style={{ fontWeight: 700, fontSize: 16, flex: 1 }}>Détail du ticket</span>
        <span style={{
          padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
          background: statutColor[ticket.statut] + '22',
          color: statutColor[ticket.statut],
          border: `1px solid ${statutColor[ticket.statut]}44`,
        }}>
          {statutLabel[ticket.statut] || ticket.statut}
        </span>
      </div>

      <div style={{ padding: '20px 16px' }}>
        {/* Titre + priorité */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderLeft: `4px solid ${statutColor[ticket.statut] || 'var(--border)'}`,
          borderRadius: 12,
          padding: '16px',
          marginBottom: 16,
        }}>
          <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 10 }}>{ticket.titre}</div>
          <PrioriteBadge priorite={ticket.priorite} />
        </div>

        {/* Description */}
        {ticket.description && (
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            padding: '16px',
            marginBottom: 16,
          }}>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Description</div>
            <div style={{ fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{ticket.description}</div>
          </div>
        )}

        {/* Infos */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '0 16px', marginBottom: 16 }}>
          <InfoRow
            icon={<Cpu size={16} />}
            label="Machine"
            value={machine?.nom || 'Non renseignée'}
          />
          <InfoRow
            icon={<User size={16} />}
            label="Technicien assigné"
            value={tech ? `${tech.prenom} ${tech.nom}` : 'Non assigné'}
          />
          <InfoRow
            icon={<Wrench size={16} />}
            label="Type d'intervention"
            value={ticket.type_intervention === 'preventive' ? 'Préventive' : 'Corrective'}
          />
          <InfoRow
            icon={<Tag size={16} />}
            label="Classification"
            value={classificationLabel[ticket.classification] || ticket.classification}
          />
          <InfoRow
            icon={<Clock size={16} />}
            label="Créé le"
            value={formatDate(ticket.created_at)}
          />
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
