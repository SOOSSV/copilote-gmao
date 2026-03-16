'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Search, RefreshCw } from 'lucide-react';

type Ticket = {
  id: string; titre: string; priorite: string; statut: string;
  created_at: string; type_intervention: string;
  machines: { nom: string } | null;
  technicians: { prenom: string; nom: string } | null;
};

const prioriteColor: Record<string, string> = { urgente: '#ef4444', haute: '#f59e0b', normale: '#6366f1', basse: '#22c55e' };
const statutColor: Record<string, string> = { ouvert: '#6366f1', en_cours: '#f59e0b', resolu: '#22c55e' };
const statutLabel = (s: string) => s === 'resolu' ? 'Résolu' : s === 'en_cours' ? 'En cours' : 'Ouvert';

export default function DirecteurTicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filtre, setFiltre] = useState('tous');

  async function load() {
    setLoading(true);
    const { data } = await supabase.from('tickets')
      .select('id, titre, priorite, statut, created_at, type_intervention, machines(nom), technicians(prenom, nom)')
      .order('created_at', { ascending: false });
    setTickets((data as unknown as Ticket[]) || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const filtres = ['tous', 'ouvert', 'en_cours', 'resolu', 'urgente', 'haute'];
  const filtreLabel = (f: string) => f === 'en_cours' ? 'En cours' : f === 'resolu' ? 'Résolu' : f.charAt(0).toUpperCase() + f.slice(1);

  const filtered = tickets.filter(t => {
    const matchSearch = t.titre.toLowerCase().includes(search.toLowerCase()) ||
      (t.machines as { nom: string } | null)?.nom?.toLowerCase().includes(search.toLowerCase());
    const matchFiltre = filtre === 'tous' || t.statut === filtre || t.priorite === filtre;
    return matchSearch && matchFiltre;
  });

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  }

  return (
    <div style={{ padding: '20px 24px', maxWidth: 1100 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>Tickets</h1>
        <button onClick={load} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '7px 12px', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
          <RefreshCw size={13} /> Actualiser
        </button>
      </div>

      <div style={{ position: 'relative', marginBottom: 12 }}>
        <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..."
          style={{ width: '100%', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px 10px 34px', color: 'var(--text-primary)', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20, overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none' }}>
        {filtres.map(f => (
          <button key={f} onClick={() => setFiltre(f)} style={{
            padding: '7px 14px', borderRadius: 8, border: '1px solid', whiteSpace: 'nowrap', flexShrink: 0, fontSize: 12, fontWeight: 600, cursor: 'pointer',
            borderColor: filtre === f ? '#0ea5e9' : 'var(--border)',
            background: filtre === f ? '#0ea5e9' : 'var(--bg-card)',
            color: filtre === f ? 'white' : 'var(--text-secondary)',
          }}>{filtreLabel(f)}</button>
        ))}
      </div>

      {loading ? <div style={{ color: 'var(--text-secondary)', padding: 32 }}>Chargement...</div> : (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Titre', 'Machine', 'Technicien', 'Priorité', 'Statut', 'Date'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((t, i) => {
                const pc = prioriteColor[t.priorite] || '#6366f1';
                const sc = statutColor[t.statut] || '#6366f1';
                return (
                  <tr key={t.id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 500, maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      <Link href={`/directeur/tickets/${t.id}`} style={{ color: 'inherit', textDecoration: 'none' }}
                        onMouseEnter={e => (e.currentTarget.style.color = '#0ea5e9')}
                        onMouseLeave={e => (e.currentTarget.style.color = 'inherit')}>
                        {t.titre}
                      </Link>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-secondary)' }}>{(t.machines as { nom: string } | null)?.nom || '—'}</td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-secondary)' }}>{(t.technicians as { prenom: string } | null)?.prenom || '—'}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ background: `${pc}22`, color: pc, border: `1px solid ${pc}44`, borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>{t.priorite}</span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ background: `${sc}22`, color: sc, borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 600 }}>{statutLabel(t.statut)}</span>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text-secondary)' }}>{formatDate(t.created_at)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>Aucun ticket trouvé</div>}
        </div>
      )}
      <div style={{ marginTop: 12, fontSize: 12, color: 'var(--text-secondary)' }}>{filtered.length} ticket(s)</div>
    </div>
  );
}
