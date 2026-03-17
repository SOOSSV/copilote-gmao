'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, MapPin, Cpu, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import Link from 'next/link';

type Machine = {
  id: string; external_id: string; nom: string; type_equipement: string;
  localisation: string; criticite: string; statut: string; description?: string;
};
type Ticket = { id: string; titre: string; priorite: string; statut: string; created_at: string };

const criticiteColor: Record<string, string> = { critique: '#ef4444', haute: '#f59e0b', normale: '#2563eb', basse: '#22c55e' };
const statutColor: Record<string, string> = { ouvert: '#2563eb', en_cours: '#f59e0b', resolu: '#22c55e' };
const prioriteColor: Record<string, string> = { urgente: '#ef4444', haute: '#f59e0b', normale: '#2563eb', basse: '#22c55e' };

export default function DirecteurMachineDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [machine, setMachine] = useState<Machine | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!params.id) return;
    Promise.all([
      supabase.from('machines').select('*').eq('id', params.id).single(),
      supabase.from('tickets').select('id, titre, priorite, statut, created_at').eq('machine_id', params.id).order('created_at', { ascending: false }).limit(20),
    ]).then(([{ data: m }, { data: t }]) => {
      setMachine(m as Machine);
      setTickets((t as Ticket[]) || []);
      setLoading(false);
    });
  }, [params.id]);

  if (loading) return <div style={{ padding: 20, color: 'var(--text-secondary)' }}>Chargement...</div>;
  if (!machine) return <div style={{ padding: 20, color: 'var(--text-secondary)' }}>Machine introuvable</div>;

  const critColor = criticiteColor[machine.criticite] || '#2563eb';
  const ouverts = tickets.filter(t => t.statut !== 'resolu').length;

  return (
    <div style={{ padding: 'clamp(14px, 3vw, 22px)', maxWidth: 800, boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: 4, display: 'flex', alignItems: 'center' }}>
          <ArrowLeft size={22} />
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>{machine.nom}</h1>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{machine.external_id}</div>
        </div>
        <span style={{ background: `${critColor}22`, color: critColor, border: `1px solid ${critColor}44`, borderRadius: 8, padding: '4px 12px', fontSize: 12, fontWeight: 700, textTransform: 'capitalize' }}>{machine.criticite}</span>
      </div>

      {/* KPI */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Tickets total', value: tickets.length, color: '#2563eb' },
          { label: 'En cours', value: ouverts, color: '#f59e0b' },
          { label: 'Résolus', value: tickets.filter(t => t.statut === 'resolu').length, color: '#22c55e' },
        ].map(k => (
          <div key={k.label} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: 26, fontWeight: 800, color: k.color }}>{k.value}</div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Infos */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 20px', marginBottom: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 12 }}>Informations</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[
            { label: 'Type', value: machine.type_equipement || '—' },
            { label: 'Localisation', value: machine.localisation || '—' },
            { label: 'Statut', value: machine.statut === 'actif' ? 'Actif' : machine.statut === 'hors_service' ? 'Hors service' : 'Inactif' },
            { label: 'Criticité', value: machine.criticite },
          ].map(row => (
            <div key={row.label}>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 2 }}>{row.label}</div>
              <div style={{ fontSize: 14, fontWeight: 500 }}>{row.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Historique tickets */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', fontWeight: 700, fontSize: 14 }}>Historique des tickets</div>
        {tickets.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-secondary)' }}>Aucun ticket pour cette machine</div>
        ) : (
          tickets.map((t, i) => {
            const pc = prioriteColor[t.priorite] || '#2563eb';
            const sc = statutColor[t.statut] || '#2563eb';
            return (
              <Link key={t.id} href={`/directeur/tickets/${t.id}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', borderBottom: i < tickets.length - 1 ? '1px solid var(--border)' : 'none', textDecoration: 'none', color: 'inherit' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-secondary)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                <div style={{ flex: 1, minWidth: 0, paddingRight: 12 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.titre}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>{new Date(t.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                </div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <span style={{ background: `${pc}22`, color: pc, borderRadius: 5, padding: '1px 7px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase' }}>{t.priorite}</span>
                  <span style={{ background: `${sc}22`, color: sc, borderRadius: 5, padding: '1px 7px', fontSize: 10, fontWeight: 600 }}>{t.statut === 'resolu' ? 'Résolu' : t.statut === 'en_cours' ? 'En cours' : 'Ouvert'}</span>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
