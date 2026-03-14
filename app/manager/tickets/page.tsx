'use client';

import { useEffect, useState } from 'react';
import { supabase, Ticket } from '@/lib/supabase';
import PrioriteBadge from '@/components/PrioriteBadge';
import { Search, RefreshCw } from 'lucide-react';

const statutColor: Record<string, string> = {
  ouvert:   '#6366f1',
  en_cours: '#f59e0b',
  ferme:    '#22c55e',
};

export default function ManagerTicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filtre, setFiltre] = useState('tous');

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

  return (
    <div style={{ padding: '28px 32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800 }}>Tous les Tickets</h1>
        <button onClick={fetchTickets} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
          <RefreshCw size={14} /> Actualiser
        </button>
      </div>

      {/* Filtres + Recherche */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un ticket ou une machine..."
            style={{ width: '100%', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '9px 12px 9px 34px', color: 'var(--text-primary)', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
          />
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {['tous', 'ouvert', 'en_cours', 'ferme', 'urgente', 'haute'].map(f => (
            <button key={f} onClick={() => setFiltre(f)} style={{
              padding: '8px 14px', borderRadius: 8, border: '1px solid',
              borderColor: filtre === f ? 'var(--accent)' : 'var(--border)',
              background: filtre === f ? 'var(--accent)' : 'var(--bg-card)',
              color: filtre === f ? 'white' : 'var(--text-secondary)',
              fontSize: 12, fontWeight: 600, cursor: 'pointer', textTransform: 'capitalize',
            }}>
              {f === 'en_cours' ? 'En cours' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['Titre', 'Machine', 'Technicien', 'Priorité', 'Statut', 'Date', 'Action'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ padding: 32, textAlign: 'center', color: 'var(--text-secondary)' }}>Chargement...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} style={{ padding: 32, textAlign: 'center', color: 'var(--text-secondary)' }}>Aucun ticket trouvé</td></tr>
            ) : filtered.map((t, i) => (
              <tr key={t.id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 500, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.titre}</td>
                <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-secondary)' }}>{(t.machines as { nom: string } | null)?.nom || '—'}</td>
                <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-secondary)' }}>
                  {(t.technicians as { prenom: string; nom: string } | null)?.prenom || '—'}
                </td>
                <td style={{ padding: '12px 16px' }}><PrioriteBadge priorite={t.priorite} /></td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{
                    background: `${statutColor[t.statut]}22`,
                    color: statutColor[t.statut],
                    borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 600,
                  }}>{t.statut.replace('_', ' ')}</span>
                </td>
                <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text-secondary)' }}>{formatDate(t.created_at)}</td>
                <td style={{ padding: '12px 16px' }}>
                  <select
                    value={t.statut}
                    onChange={e => updateStatut(t.id, e.target.value)}
                    style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 6, padding: '4px 8px', color: 'var(--text-primary)', fontSize: 12, cursor: 'pointer' }}
                  >
                    <option value="ouvert">Ouvert</option>
                    <option value="en_cours">En cours</option>
                    <option value="ferme">Fermé</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ marginTop: 12, fontSize: 12, color: 'var(--text-secondary)' }}>{filtered.length} ticket(s) affiché(s)</div>
    </div>
  );
}
