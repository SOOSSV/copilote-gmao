'use client';

import { useEffect, useState } from 'react';
import { supabase, Ticket } from '@/lib/supabase';
import BottomNav from '@/components/BottomNav';
import PrioriteBadge from '@/components/PrioriteBadge';
import { Ticket as TicketIcon, RefreshCw, ChevronRight, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const statutColor: Record<string, string> = {
  ouvert:   '#2563eb',
  en_cours: '#f59e0b',
  resolu:   '#22c55e',
};

export default function TicketsPage() {
  const router = useRouter();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtre, setFiltre] = useState<'tous' | 'ouvert' | 'en_cours' | 'resolu'>('tous');

  async function fetchTickets() {
    setLoading(true);
    const { data } = await supabase
      .from('tickets')
      .select('*, machines(nom), technicians(prenom, nom)')
      .order('created_at', { ascending: false })
      .limit(50);
    setTickets(data || []);
    setLoading(false);
  }

  useEffect(() => { fetchTickets(); }, []);

  const filtered = filtre === 'tous' ? tickets : tickets.filter(t => t.statut === filtre);

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  }

  return (
    <div style={{ background: 'var(--bg-primary)', minHeight: '100vh', paddingBottom: 80 }}>
      {/* Header */}
      <div style={{
        background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border)',
        padding: '16px 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: 4, display: 'flex', alignItems: 'center' }}><ArrowLeft size={20} /></button>
          <TicketIcon size={20} color="var(--accent)" />
          <span style={{ fontWeight: 700, fontSize: 16 }}>Mes Tickets</span>
        </div>
        <button onClick={fetchTickets} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
          <RefreshCw size={18} />
        </button>
      </div>

      {/* Filtres */}
      <div style={{ display: 'flex', gap: 8, padding: '12px 16px', overflowX: 'auto' }}>
        {(['tous', 'ouvert', 'en_cours', 'resolu'] as const).map(f => (
          <button key={f} onClick={() => setFiltre(f)} style={{
            padding: '6px 14px', borderRadius: 20, border: '1px solid',
            borderColor: filtre === f ? 'var(--accent)' : 'var(--border)',
            background: filtre === f ? 'var(--accent)' : 'var(--bg-card)',
            color: filtre === f ? 'white' : 'var(--text-secondary)',
            fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
            textTransform: 'capitalize',
          }}>
            {f === 'en_cours' ? 'En cours' : f === 'resolu' ? 'Résolu' : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Liste */}
      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary)' }}>Chargement...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary)' }}>Aucun ticket</div>
        ) : (
          filtered.map(ticket => (
            <Link key={ticket.id} href={`/tickets/${ticket.id}`} style={{ textDecoration: 'none' }}>
              <div style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderLeft: `3px solid ${statutColor[ticket.statut] || 'var(--border)'}`,
                borderRadius: 12,
                padding: '14px 16px',
                display: 'flex', alignItems: 'center', gap: 12,
                cursor: 'pointer',
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 6 }}>
                    {ticket.titre}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>
                    {ticket.machines?.nom || 'Machine inconnue'}
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    <PrioriteBadge priorite={ticket.priorite} />
                    <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                      {formatDate(ticket.created_at)}
                    </span>
                  </div>
                </div>
                <ChevronRight size={16} color="var(--text-secondary)" />
              </div>
            </Link>
          ))
        )}
      </div>

      <BottomNav />
    </div>
  );
}
