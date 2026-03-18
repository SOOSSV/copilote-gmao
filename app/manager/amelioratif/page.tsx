'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, RefreshCw, Sparkles } from 'lucide-react';
import Link from 'next/link';
import PrioriteBadge from '@/components/PrioriteBadge';

type Ticket = {
  id: string; titre: string; priorite: string; statut: string;
  created_at: string;
  machines: { nom: string; localisation: string } | null;
  technicians: { prenom: string; nom: string } | null;
};

const statutColor: Record<string, string> = { ouvert: '#2563eb', en_cours: '#f59e0b', resolu: '#22c55e' };
const statutLabel: Record<string, string> = { ouvert: 'Ouvert', en_cours: 'En cours', resolu: 'Résolu' };

export default function AmelioratifPage() {
  const router = useRouter();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtre, setFiltre] = useState<'tous' | 'ouvert' | 'en_cours' | 'resolu'>('tous');

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from('tickets')
      .select('id, titre, priorite, statut, created_at, machines(nom, localisation), technicians(prenom, nom)')
      .eq('type_intervention', 'ameliorative')
      .order('created_at', { ascending: false });
    setTickets((data as unknown as Ticket[]) || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const filtered = filtre === 'tous' ? tickets : tickets.filter(t => t.statut === filtre);

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  }

  return (
    <div style={{ padding: '16px', paddingBottom: 32 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: 4, display: 'flex', alignItems: 'center' }}>
          <ArrowLeft size={22} />
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: '#7c3aed' }}>Amélioratif</h1>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{tickets.length} intervention{tickets.length > 1 ? 's' : ''} au total</div>
        </div>
        <button onClick={load} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
          <RefreshCw size={13} /> Actualiser
        </button>
      </div>

      {/* Filtres statut */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        {(['tous', 'ouvert', 'en_cours', 'resolu'] as const).map(f => (
          <button key={f} onClick={() => setFiltre(f)} style={{
            padding: '6px 12px', borderRadius: 8, border: '1px solid', whiteSpace: 'nowrap', flexShrink: 0,
            borderColor: filtre === f ? '#7c3aed' : 'var(--border)',
            background: filtre === f ? '#7c3aed' : 'var(--bg-card)',
            color: filtre === f ? 'white' : 'var(--text-secondary)',
            fontSize: 12, fontWeight: 600, cursor: 'pointer',
          }}>
            {f === 'tous' ? 'Tous' : f === 'en_cours' ? 'En cours' : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ color: 'var(--text-secondary)', padding: 32, textAlign: 'center' }}>Chargement...</div>
      ) : filtered.length === 0 ? (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: '32px 16px', textAlign: 'center' }}>
          <Sparkles size={32} color="#7c3aed" style={{ marginBottom: 12 }} />
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>Aucune intervention améliorative</div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Créez un ticket de type "Amélioratif" pour suivre les upgrades machines.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map(t => (
            <Link key={t.id} href={`/manager/tickets/${t.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div style={{ background: 'var(--bg-card)', border: '1px solid #7c3aed33', borderRadius: 12, padding: '14px 16px' }}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6, lineHeight: 1.4 }}>{t.titre}</div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                    {(t.machines as unknown as { nom: string } | null)?.nom || '—'}
                  </span>
                  {t.technicians && (
                    <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                      · {(t.technicians as unknown as { prenom: string }).prenom}
                    </span>
                  )}
                  <PrioriteBadge priorite={t.priorite} />
                  <span style={{ background: `${statutColor[t.statut]}22`, color: statutColor[t.statut], borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 600 }}>
                    {statutLabel[t.statut]}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--text-secondary)', marginLeft: 'auto' }}>{formatDate(t.created_at)}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
