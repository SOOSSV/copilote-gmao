'use client';

import { useEffect, useState, useMemo } from 'react';
import { supabase, Ticket } from '@/lib/supabase';
import PrioriteBadge from '@/components/PrioriteBadge';
import TypeBadge from '@/components/TypeBadge';
import { Search, RefreshCw, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const statutColor: Record<string, string> = {
  ouvert:   '#2563eb',
  en_cours: '#f59e0b',
  resolu:   '#22c55e',
};

function statutLabel(s: string) {
  return s === 'resolu' ? 'Résolu' : s === 'en_cours' ? 'En cours' : 'Ouvert';
}

export default function ManagerTicketsPage() {
  const router = useRouter();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filtre, setFiltre] = useState('tous');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const f = params.get('filtre');
    const m = params.get('machine');
    if (f) setFiltre(f);
    if (m) setSearch(m);
  }, []);

  // Détection récurrence : machine ayant >= 2 tickets dans les 24h
  const recurrenceMap = useMemo(() => {
    const now = Date.now();
    const h24 = 24 * 60 * 60 * 1000;
    const map = new Map<string, number>();
    tickets.forEach(t => {
      const machineNom = (t.machines as { nom: string } | null)?.nom;
      if (machineNom && now - new Date(t.created_at).getTime() < h24) {
        map.set(machineNom, (map.get(machineNom) || 0) + 1);
      }
    });
    return map;
  }, [tickets]);

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
    const { error } = await supabase.from('tickets').update({ statut }).eq('id', id);
    if (!error) setTickets(prev => prev.map(t => t.id === id ? { ...t, statut: statut as Ticket['statut'] } : t));
  }

  const filtered = tickets.filter(t => {
    const matchSearch = t.titre.toLowerCase().includes(search.toLowerCase()) ||
      (t.machines as { nom: string } | undefined)?.nom?.toLowerCase().includes(search.toLowerCase());
    const matchFiltre = filtre === 'tous' || t.statut === filtre || t.priorite === filtre || t.type_intervention === filtre;
    return matchSearch && matchFiltre;
  });

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  }

  const filtres = ['tous', 'ouvert', 'en_cours', 'resolu', 'urgente', 'haute', 'normale', 'basse', 'ameliorative'];
  const filtreLabel = (f: string) => ({ tous: 'Tous', ouvert: 'Ouvert', en_cours: 'En cours', resolu: 'Résolu', urgente: 'Urgente', haute: 'Haute', normale: 'Normale', basse: 'Basse', ameliorative: '✦ Amélioratif' } as Record<string,string>)[f] ?? f;

  return (
    <div className="px-2 py-2.5 max-w-[100vw] box-border overflow-x-hidden">

      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <button onClick={() => router.back()} className="bg-transparent border-none cursor-pointer text-[#7d8590] p-1 flex items-center">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-[20px] font-extrabold m-0">Tous les Tickets</h1>
        </div>
        <button
          onClick={fetchTickets}
          className="bg-[#1c2128] border border-[#30363d] rounded-lg px-3 py-1.5 cursor-pointer text-[#7d8590] flex items-center gap-1.5 text-[12px]"
        >
          <RefreshCw size={13} /> Actualiser
        </button>
      </div>

      {/* Recherche */}
      <div className="relative mb-3">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7d8590]" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher un ticket ou une machine..."
          className="w-full bg-[#1c2128] border border-[#30363d] rounded-lg py-2.5 pl-[34px] pr-3 text-[#e6edf3] text-[13px] outline-none box-border"
        />
      </div>

      {/* Filtres statut */}
      <div className="mb-2.5">
        <div className="text-[10px] font-bold text-[#7d8590] uppercase tracking-[0.5px] mb-1.5">Statut</div>
        <div className="flex gap-1.5 overflow-x-auto pb-0.5" style={{ scrollbarWidth: 'none' }}>
          {(['tous', 'ouvert', 'en_cours', 'resolu'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFiltre(f)}
              className="px-3 py-1.5 rounded-lg border whitespace-nowrap shrink-0 text-[12px] font-semibold cursor-pointer transition-all"
              style={{
                borderColor: filtre === f ? 'var(--accent)' : '#30363d',
                background: filtre === f ? 'var(--accent)' : '#1c2128',
                color: filtre === f ? 'white' : '#7d8590',
              }}
            >
              {filtreLabel(f)}
            </button>
          ))}
        </div>
      </div>

      {/* Filtres priorité + type */}
      <div className="mb-4">
        <div className="text-[10px] font-bold text-[#7d8590] uppercase tracking-[0.5px] mb-1.5">Priorité & type</div>
        <div className="flex gap-1.5 overflow-x-auto pb-0.5" style={{ scrollbarWidth: 'none' }}>
          {(['urgente', 'haute', 'normale', 'basse', 'ameliorative'] as const).map(f => {
            const colors: Record<string, string> = { urgente: '#ef4444', haute: '#f59e0b', normale: '#6366f1', basse: '#22c55e', ameliorative: '#7c3aed' };
            const c = colors[f];
            const active = filtre === f;
            return (
              <button
                key={f}
                onClick={() => setFiltre(active ? 'tous' : f)}
                className="px-3 py-1.5 rounded-lg whitespace-nowrap shrink-0 text-[12px] font-semibold cursor-pointer transition-all"
                style={{
                  border: `1px solid ${active ? c : '#30363d'}`,
                  background: active ? `${c}22` : '#1c2128',
                  color: active ? c : '#7d8590',
                }}
              >
                {filtreLabel(f)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Contenu */}
      {loading ? (
        <div className="text-[#7d8590] py-8 text-center">Chargement...</div>
      ) : filtered.length === 0 ? (
        <div className="text-[#7d8590] py-8 text-center">Aucun ticket trouvé</div>
      ) : (
        <>
          {/* Vue mobile : cartes */}
          <div className="tickets-mobile">
            {filtered.map(t => {
              const machineNom = (t.machines as { nom: string } | null)?.nom;
              const count = machineNom ? recurrenceMap.get(machineNom) || 0 : 0;
              return (
                <div key={t.id} className="bg-[#1c2128] border border-[#30363d] rounded-[10px] px-3 py-2.5 mb-2">
                  {count >= 2 && <div className="text-[10px] text-amber-500 font-bold mb-1">⚠️ {count} pannes en 24h</div>}
                  <Link href={`/manager/tickets/${t.id}`} className="block no-underline text-inherit mb-2">
                    <div className="text-[13px] font-semibold mb-1.5 overflow-hidden text-ellipsis whitespace-nowrap">{t.titre}</div>
                    <div className="flex gap-1 flex-wrap items-center">
                      <span className="text-[10px] text-[#7d8590]">{machineNom || '—'} · {(t.technicians as { prenom: string } | null)?.prenom || '—'}</span>
                      <TypeBadge type={t.type_intervention} />
                      <PrioriteBadge priorite={t.priorite} />
                      <span className="text-[10px] text-[#7d8590] ml-auto">{formatDate(t.created_at)}</span>
                    </div>
                  </Link>
                  <div className="flex gap-1.5">
                    {(['ouvert', 'en_cours', 'resolu'] as const).map(s => (
                      <button
                        key={s}
                        onClick={() => updateStatut(t.id, s)}
                        className="flex-1 py-1.5 px-1 rounded-lg text-[10px] cursor-pointer transition-all"
                        style={{
                          border: `1px solid ${t.statut === s ? statutColor[s] : '#30363d'}`,
                          background: t.statut === s ? `${statutColor[s]}22` : 'transparent',
                          color: t.statut === s ? statutColor[s] : '#7d8590',
                          fontWeight: t.statut === s ? 700 : 400,
                        }}
                      >
                        {statutLabel(s)}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Vue desktop : tableau */}
          <div className="tickets-desktop bg-[#1c2128] border border-[#30363d] rounded-[14px] overflow-hidden">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-[#30363d]">
                  {['Titre', 'Machine', 'Technicien', 'Priorité', 'Statut', 'Date', 'Action'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[11px] text-[#7d8590] font-semibold uppercase tracking-[0.5px]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((t, i) => (
                  <tr key={t.id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid #30363d' : 'none' }}>
                    <td className="px-4 py-3 text-[13px] font-medium max-w-[200px]">
                      <Link
                        href={`/manager/tickets/${t.id}`}
                        className="text-inherit no-underline block overflow-hidden text-ellipsis whitespace-nowrap hover:text-blue-500"
                      >
                        {t.titre}
                      </Link>
                      {(() => {
                        const machineNom = (t.machines as { nom: string } | null)?.nom;
                        const count = machineNom ? recurrenceMap.get(machineNom) || 0 : 0;
                        return count >= 2 ? <span className="text-[10px] text-amber-500 font-bold">⚠️ {count} pannes/24h</span> : null;
                      })()}
                    </td>
                    <td className="px-4 py-3 text-[13px] text-[#7d8590]">{(t.machines as { nom: string } | null)?.nom || '—'}</td>
                    <td className="px-4 py-3 text-[13px] text-[#7d8590]">{(t.technicians as { prenom: string; nom: string } | null)?.prenom || '—'}</td>
                    <td className="px-4 py-3"><TypeBadge type={t.type_intervention} /></td>
                    <td className="px-4 py-3"><PrioriteBadge priorite={t.priorite} /></td>
                    <td className="px-4 py-3">
                      <span
                        className="rounded-md px-2 py-0.5 text-[11px] font-semibold"
                        style={{ background: `${statutColor[t.statut]}22`, color: statutColor[t.statut] }}
                      >
                        {statutLabel(t.statut)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[12px] text-[#7d8590]">{formatDate(t.created_at)}</td>
                    <td className="px-4 py-3">
                      <select
                        value={t.statut}
                        onChange={e => updateStatut(t.id, e.target.value)}
                        className="bg-[#161b22] border border-[#30363d] rounded-md px-2 py-1 text-[#e6edf3] text-[12px] cursor-pointer"
                      >
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

      <div className="mt-3 text-[12px] text-[#7d8590]">{filtered.length} ticket(s)</div>
    </div>
  );
}
