'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase, Ticket } from '@/lib/supabase';
import PrioriteBadge from '@/components/PrioriteBadge';
import { Search, RefreshCw, ChevronRight } from 'lucide-react';
import Link from 'next/link';

const statutColor: Record<string, string> = {
  ouvert:   '#6366f1',
  en_cours: '#f59e0b',
  resolu:   '#22c55e',
};

function statutLabel(s: string) {
  return s === 'resolu' ? 'Résolu' : s === 'en_cours' ? 'En cours' : 'Ouvert';
}

export default function ManagerTicketsPage() {
  const searchParams = useSearchParams();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filtre, setFiltre] = useState(searchParams.get('filtre') || 'tous');

  async function fetchTickets() {
    setLoading(true);
    const { data } = await supabase
      .from('tickets')
      .select('*, machines(nom), technicians(prenom, nom)')
      .order('created_at', { ascending: false });
    setTickets((data as Ticket[]) || []);
    setLoading(false);
  }

  useEffect(() => { fetchTickets(); }, []);

  async function updateStatut(id: string, statut: string) {
    await supabase.from('tickets').update({ statut }).eq('id', id);
    setTickets(prev => prev.map(t => t.id === id ? { ...t, statut: statut as Ticket['statut'] } : t));
  }

  const filtered = tickets.filter(t => {
    const matchSearch = t.titre.toLowerCase().includes(search.toLowerCase()) ||
      (t.machines as { nom: string } | undefined)?.nom?.toLowerCase().includes(search.toLowerCase());
    const matchFiltre = filtre === 'tous' || t.statut === filtre || t.priorite === filtre;
    return matchSearch && matchFiltre;
  });

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  }

  const filtres = ['tous', 'ouvert', 'en_cours', 'resolu', 'urgente', 'haute'];
  const filtreLabel = (f: string) => f === 'en_cours' ? 'En Cours' : f === 'resolu' ? 'Résolu' : f.charAt(0).toUpperCase() + f.slice(1);

  return (
    <div style={{ padding: '10px 8px', maxWidth: '100vw', boxSizing: 'border-box', overflowX: 'hidden' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>Tous les Tickets</h1>
        <button onClick={fetchTickets} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '7px 12px', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
          <RefreshCw size={13} /> Actualiser
        </button>
      </div>

      {/* Recherche */}
      <div style={{ position: 'relative', marginBottom: 12 }}>
        <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher un ticket ou une machine..."
          style={{ width: '100%', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px 10px 34px', color: 'var(--text-primary)', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
        />
      </div>

      {/* Filtres — scroll horizontal */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none' }}>
        {filtres.map(f => (
          <button key={f} onClick={() => setFiltre(f)} style={{
            padding: '7px 14px', borderRadius: 8, border: '1px solid', whiteSpace: 'nowrap', flexShrink: 0,
            borderColor: filtre === f ? 'var(--accent)' : 'var(--border)',
            background: filtre === f ? 'var(--accent)' : 'var(--bg-card)',
            color: filtre === f ? 'white' : 'var(--text-secondary)',
            fontSize: 12, fontWeight: 600, cursor: 'pointer',
          }}>
            {filtreLabel(f)}
          </button>
        ))}
      </div>

      {/* Contenu */}
      {loading ? (
        <div style={{ color: 'var(--text-secondary)', padding: 32, textAlign: 'center' }}>Chargement...</div>
      ) : filtered.length === 0 ? (
        <div style={{ color: 'var(--text-secondary)', padding: 32, textAlign: 'center' }}>Aucun ticket trouvé</div>
      ) : (
        <>
          {/* Vue mobile : cartes */}
          <div className="tickets-mobile">
            {filtered.map(t => (
              <Link key={t.id} href={`/manager/tickets/${t.id}`} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 7, padding: '6px 8px', marginBottom: 5, overflow: 'hidden', minWidth: 0, display: 'block', textDecoration: 'none', color: 'inherit' }}>
                <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.titre}</div>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 5, alignItems: 'center' }}>
                  <span style={{ fontSize: 9, color: 'var(--text-secondary)' }}>{(t.machines as { nom: string } | null)?.nom || '—'} · {(t.technicians as { prenom: string } | null)?.prenom || '—'}</span>
                  <PrioriteBadge priorite={t.priorite} />
                  <span style={{ background: `${statutColor[t.statut]}22`, color: statutColor[t.statut], borderRadius: 4, padding: '1px 5px', fontSize: 9, fontWeight: 600 }}>{statutLabel(t.statut)}</span>
                  <span style={{ fontSize: 9, color: 'var(--text-secondary)', marginLeft: 'auto' }}>{formatDate(t.created_at)}</span>
                </div>
                <select
                  value={t.statut}
                  onChange={e => updateStatut(t.id, e.target.value)}
                  style={{ width: '100%', maxWidth: '100%', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 5, padding: '4px 6px', color: 'var(--text-primary)', fontSize: 11, cursor: 'pointer', boxSizing: 'border-box' }}
                  onClick={e => e.stopPropagation()}
                >
                  <option value="ouvert">Ouvert</option>
                  <option value="en_cours">En cours</option>
                  <option value="resolu">Résolu</option>
                </select>
              </Link>
            ))}
          </div>

          {/* Vue desktop : tableau */}
          <div className="tickets-desktop" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Titre', 'Machine', 'Technicien', 'Priorité', 'Statut', 'Date', 'Action'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((t, i) => (
                  <tr key={t.id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 500, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      <Link href={`/manager/tickets/${t.id}`} style={{ color: 'inherit', textDecoration: 'none' }} onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent)')} onMouseLeave={e => (e.currentTarget.style.color = 'inherit')}>{t.titre}</Link>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-secondary)' }}>{(t.machines as { nom: string } | null)?.nom || '—'}</td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-secondary)' }}>{(t.technicians as { prenom: string; nom: string } | null)?.prenom || '—'}</td>
                    <td style={{ padding: '12px 16px' }}><PrioriteBadge priorite={t.priorite} /></td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ background: `${statutColor[t.statut]}22`, color: statutColor[t.statut], borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 600 }}>
                        {statutLabel(t.statut)}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text-secondary)' }}>{formatDate(t.created_at)}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <select value={t.statut} onChange={e => updateStatut(t.id, e.target.value)}
                        style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 6, padding: '4px 8px', color: 'var(--text-primary)', fontSize: 12, cursor: 'pointer' }}>
                        <option value="ouvert">Ouvert</option>
                        <option value="en_cours">En cours</option>
                        <option value="resolu">Résolu</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <div style={{ marginTop: 12, fontSize: 12, color: 'var(--text-secondary)' }}>{filtered.length} ticket(s)</div>
    </div>
  );
}
