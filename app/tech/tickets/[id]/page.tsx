'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Wrench, MapPin, Calendar, AlertTriangle, CheckCircle, Clock, Package, Plus, X, Bot, Loader2 } from 'lucide-react';
import TypeBadge from '@/components/TypeBadge';

type Ticket = {
  id: string; titre: string; description: string; priorite: string;
  statut: string; type_intervention: string; classification: string; created_at: string;
  diagnostic_ia: string | null;
  machines: { nom: string; localisation: string; type_equipement: string } | null;
};

type Diagnostic = {
  cause_probable: string;
  actions_recommandees: string[];
  niveau_urgence: string;
  pieces_probables: string[];
  temps_estime: string;
};

type Stock = { id: string; reference: string; nom: string; unite: string; quantite_actuelle: number; };
type PieceUtilisee = { stock_id: string; nom: string; reference: string; unite: string; quantite: number; };

const prioriteColor: Record<string, string> = { urgente: '#ef4444', haute: '#f59e0b', normale: '#2563eb', basse: '#22c55e' };

export default function TechTicketDetail() {
  const router = useRouter();
  const params = useParams();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [diagnostic, setDiagnostic] = useState<Diagnostic | null>(null);
  const [diagLoading, setDiagLoading] = useState(false);
  const [diagError, setDiagError] = useState<string | null>(null);
  const [pieces, setPieces] = useState<PieceUtilisee[]>([]);
  const [showPieces, setShowPieces] = useState(false);
  const [searchStock, setSearchStock] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    async function load() {
      const [{ data: t }, { data: s }] = await Promise.all([
        supabase.from('tickets').select('*, machines(nom, localisation, type_equipement)').eq('id', params.id).single(),
        supabase.from('stocks').select('id, reference, nom, unite, quantite_actuelle').eq('actif', true).order('nom'),
      ]);
      if (!t) { setLoadError(true); setLoading(false); return; }
      const ticketData = t as Ticket;
      setTicket(ticketData);
      setStocks((s as Stock[]) || []);
      if (ticketData?.diagnostic_ia) {
        try { setDiagnostic(JSON.parse(ticketData.diagnostic_ia)); } catch { /* ignore */ }
      }
      setLoading(false);
    }
    if (params.id) load();
  }, [params.id]);

  async function runDiagnostic() {
    setDiagLoading(true);
    setDiagError(null);
    try {
      const res = await fetch('/api/diagnostic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticket_id: params.id }),
      });
      const data = await res.json();
      if (data.diagnostic) {
        setDiagnostic(data.diagnostic);
      } else {
        setDiagError(data.error || 'Réponse IA vide — réessayez');
      }
    } catch {
      setDiagError('Erreur réseau');
    } finally {
      setDiagLoading(false);
    }
  }

  function urgenceColor(niveau: string) {
    if (niveau === 'critique') return '#ef4444';
    if (niveau === 'élevé') return '#f59e0b';
    if (niveau === 'modéré') return '#2563eb';
    return '#22c55e';
  }

  async function updateStatut(statut: string) {
    setSaving(true);
    const techId = typeof window !== 'undefined' ? localStorage.getItem('tech_id') : null;
    await supabase.from('tickets').update({ statut, ...(statut === 'resolu' ? { resolu_le: new Date().toISOString() } : {}) }).eq('id', params.id as string);

    // Log dans maintenance_history
    if (statut === 'resolu' && ticket) {
      await supabase.from('maintenance_history').insert({
        ticket_id: params.id,
        machine_id: await getMachineId(),
        technicien_id: techId,
        type_action: ticket.type_intervention === 'preventive' ? 'inspection' : ticket.type_intervention === 'ameliorative' ? 'amelioration' : 'intervention',
        description: notes || ticket.description,
        pieces_changees: pieces.length > 0 ? pieces : [],
        observations: pieces.length > 0 ? `Pièces utilisées: ${pieces.map(p => `${p.quantite} ${p.unite} ${p.nom}`).join(', ')}` : null,
        realise_le: new Date().toISOString(),
      });
      // Décrémenter les stocks
      for (const p of pieces) {
        const stock = stocks.find(s => s.id === p.stock_id);
        if (stock) {
          await supabase.from('stocks').update({ quantite_actuelle: Math.max(0, stock.quantite_actuelle - p.quantite) }).eq('id', p.stock_id);
        }
      }
    }
    setTicket(prev => prev ? { ...prev, statut } : prev);
    setSaving(false);
    if (statut === 'resolu') router.push('/tech');
  }

  async function getMachineId() {
    const { data } = await supabase.from('tickets').select('machine_id').eq('id', params.id).single();
    return data?.machine_id || null;
  }

  function addPiece(s: Stock) {
    if (pieces.find(p => p.stock_id === s.id)) return;
    setPieces(prev => [...prev, { stock_id: s.id, nom: s.nom, reference: s.reference, unite: s.unite, quantite: 1 }]);
    setSearchStock('');
  }

  function updateQty(stock_id: string, qty: number) {
    setPieces(prev => prev.map(p => p.stock_id === stock_id ? { ...p, quantite: Math.max(1, qty) } : p));
  }

  const filteredStocks = stocks.filter(s =>
    s.nom.toLowerCase().includes(searchStock.toLowerCase()) ||
    s.reference.toLowerCase().includes(searchStock.toLowerCase())
  ).slice(0, 6);

  if (loading) return <div className="p-5 text-[#7d8590]">Chargement...</div>;
  if (loadError) return <div className="p-5 text-red-500">⚠️ Erreur de chargement — réessayez.</div>;
  if (!ticket) return <div className="p-5 text-[#7d8590]">Ticket introuvable.</div>;

  const pc = prioriteColor[ticket.priorite] || '#2563eb';

  return (
    <div className="p-4">
      <div className="flex items-center gap-2.5 mb-5">
        <button onClick={() => router.back()} className="bg-transparent border-none cursor-pointer text-[#7d8590] p-1">
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-[15px] font-extrabold m-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap">{ticket.titre}</h1>
      </div>

      {/* Badges */}
      <div className="flex gap-2 flex-wrap mb-4">
        <span
          className="rounded-md px-2.5 py-0.5 text-[12px] font-bold uppercase"
          style={{ background: `${pc}22`, color: pc, border: `1px solid ${pc}44` }}
        >
          {ticket.priorite}
        </span>
        <TypeBadge type={ticket.type_intervention} />
      </div>

      {/* Description */}
      <div className="bg-[#1c2128] border border-[#30363d] rounded-xl px-4 py-3.5 mb-3">
        <div className="text-[11px] font-bold text-[#7d8590] uppercase tracking-[0.5px] mb-2">Description</div>
        <div className="text-[13px] leading-relaxed">{ticket.description}</div>
      </div>

      {/* Bloc IA Diagnostic */}
      <div
        className="rounded-xl px-4 py-3.5 mb-3"
        style={{ background: diagnostic ? 'rgba(37,99,235,0.06)' : '#1c2128', border: `1px solid ${diagnostic ? 'rgba(37,99,235,0.25)' : '#30363d'}` }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-500/15 flex items-center justify-center">
              <Bot size={14} color="#2563eb" />
            </div>
            <span className="text-[12px] font-bold text-blue-500 uppercase tracking-[0.5px]">Diagnostic IA</span>
            {diagnostic && (
              <span
                className="text-[10px] rounded px-1.5 py-0.5 font-bold uppercase"
                style={{ background: urgenceColor(diagnostic.niveau_urgence) + '22', color: urgenceColor(diagnostic.niveau_urgence), border: `1px solid ${urgenceColor(diagnostic.niveau_urgence)}44` }}
              >
                {diagnostic.niveau_urgence}
              </span>
            )}
          </div>
          <button
            onClick={runDiagnostic}
            disabled={diagLoading}
            className="flex items-center gap-1.5 bg-blue-600 border-none rounded-lg px-3 py-1.5 text-white text-[12px] font-bold whitespace-nowrap"
            style={{ cursor: diagLoading ? 'default' : 'pointer', opacity: diagLoading ? 0.7 : 1 }}
          >
            {diagLoading ? <><Loader2 size={13} className="animate-spin" /> Analyse...</> : diagnostic ? '↻ Relancer' : '⚡ Diagnostiquer'}
          </button>
        </div>
        {diagLoading && (
          <div className="mt-2.5 flex items-center gap-2 text-[#7d8590] text-[13px]">
            <Loader2 size={13} className="animate-spin" /> Analyse en cours...
          </div>
        )}
        {diagError && (
          <div className="mt-2 text-[12px] text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
            ⚠️ {diagError}
          </div>
        )}
        {diagnostic && (
          <div className="mt-3 flex flex-col gap-2.5">
            <div className="text-[13px] leading-relaxed text-[#e6edf3]">{diagnostic.cause_probable}</div>
            <div>
              <div className="text-[10px] font-bold text-[#7d8590] uppercase tracking-[0.5px] mb-1.5">Actions</div>
              {diagnostic.actions_recommandees.map((a, i) => (
                <div key={i} className="flex gap-2 text-[13px] mb-1">
                  <span className="text-blue-500 font-bold shrink-0">{i + 1}.</span>
                  <span className="leading-relaxed">{a}</span>
                </div>
              ))}
            </div>
            {diagnostic.temps_estime && (
              <div className="text-[12px] text-[#7d8590]">⏱ Temps estimé : <strong className="text-[#e6edf3]">{diagnostic.temps_estime}</strong></div>
            )}
          </div>
        )}
      </div>

      {/* Infos */}
      <div className="bg-[#1c2128] border border-[#30363d] rounded-xl px-4 py-3.5 mb-3">
        <div className="flex flex-col gap-3">
          {ticket.machines && (
            <div className="flex gap-2.5">
              <Wrench size={15} color="var(--accent)" className="shrink-0 mt-0.5" />
              <div>
                <div className="text-[11px] text-[#7d8590]">Machine</div>
                <div className="text-[14px] font-semibold">{ticket.machines.nom}</div>
              </div>
            </div>
          )}
          {ticket.machines?.localisation && (
            <div className="flex gap-2.5">
              <MapPin size={15} color="#7d8590" className="shrink-0 mt-0.5" />
              <div>
                <div className="text-[11px] text-[#7d8590]">Localisation</div>
                <div className="text-[14px]">{ticket.machines.localisation}</div>
              </div>
            </div>
          )}
          <div className="flex gap-2.5">
            <Calendar size={15} color="#7d8590" className="shrink-0 mt-0.5" />
            <div>
              <div className="text-[11px] text-[#7d8590]">Créé le</div>
              <div className="text-[13px]">{new Date(ticket.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Pièces utilisées */}
      {ticket.statut !== 'resolu' && (
        <div className="bg-[#1c2128] border border-[#30363d] rounded-xl px-4 py-3.5 mb-3">
          <div className="flex justify-between items-center mb-3">
            <div className="text-[11px] font-bold text-[#7d8590] uppercase tracking-[0.5px]">Pièces utilisées</div>
            <button
              onClick={() => setShowPieces(!showPieces)}
              className="flex items-center gap-1 bg-blue-500/10 border-none rounded-md px-2.5 py-1 text-blue-500 cursor-pointer text-[12px]"
            >
              <Plus size={12} /> Ajouter
            </button>
          </div>

          {showPieces && (
            <div className="mb-3">
              <input
                value={searchStock}
                onChange={e => setSearchStock(e.target.value)}
                placeholder="Rechercher une pièce..."
                className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-[#e6edf3] text-[13px] box-border mb-2 outline-none"
              />
              {searchStock && filteredStocks.map(s => (
                <div
                  key={s.id}
                  onClick={() => addPiece(s)}
                  className="px-3 py-2 rounded-lg cursor-pointer text-[13px] flex justify-between items-center bg-[#0d1117] mb-1"
                >
                  <span>{s.nom}</span>
                  <span className="text-[11px] text-[#7d8590]">{s.quantite_actuelle} {s.unite} dispo</span>
                </div>
              ))}
            </div>
          )}

          {pieces.length === 0 ? (
            <div className="text-[13px] text-[#7d8590]">Aucune pièce ajoutée</div>
          ) : (
            <div className="flex flex-col gap-2">
              {pieces.map(p => (
                <div key={p.stock_id} className="flex items-center gap-2 bg-[#0d1117] rounded-lg px-3 py-2">
                  <Package size={13} color="#7d8590" />
                  <span className="flex-1 text-[13px]">{p.nom}</span>
                  <input
                    type="number"
                    min={1}
                    value={p.quantite}
                    onChange={e => updateQty(p.stock_id, parseInt(e.target.value) || 1)}
                    className="w-[50px] bg-[#1c2128] border border-[#30363d] rounded-md px-2 py-1 text-[#e6edf3] text-[13px] text-center outline-none"
                  />
                  <span className="text-[11px] text-[#7d8590]">{p.unite}</span>
                  <button
                    onClick={() => setPieces(prev => prev.filter(x => x.stock_id !== p.stock_id))}
                    className="bg-transparent border-none cursor-pointer text-red-500 p-0.5"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Notes */}
      {ticket.statut !== 'resolu' && (
        <div className="bg-[#1c2128] border border-[#30363d] rounded-xl px-4 py-3.5 mb-3">
          <div className="text-[11px] font-bold text-[#7d8590] uppercase tracking-[0.5px] mb-2">Notes d&apos;intervention</div>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={3}
            placeholder="Décris ce que tu as fait..."
            className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2.5 text-[#e6edf3] text-[13px] resize-y box-border font-[inherit] outline-none"
          />
        </div>
      )}

      {/* Padding barre sticky */}
      <div className="h-20" />

      {/* Barre sticky statut */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#1c2128] border-t border-[#30363d] px-4 py-3 z-50 flex gap-2 box-border">
        {ticket.statut === 'resolu' ? (
          <div className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-[10px] bg-green-500/10 text-green-500 text-[13px] font-bold">
            <CheckCircle size={15} /> Ticket résolu ✓
          </div>
        ) : (
          <>
            {ticket.statut !== 'en_cours' && (
              <button
                onClick={() => updateStatut('en_cours')}
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-[10px] bg-amber-500/15 border border-amber-500/25 text-amber-500 cursor-pointer font-semibold text-[13px]"
                style={{ opacity: saving ? 0.6 : 1 }}
              >
                <Clock size={15} /> Prendre en charge
              </button>
            )}
            <button
              onClick={() => updateStatut('resolu')}
              disabled={saving}
              className="flex-[2] flex items-center justify-center gap-1.5 py-2.5 rounded-[10px] bg-green-500 border-none text-white cursor-pointer font-bold text-[13px]"
              style={{ opacity: saving ? 0.6 : 1 }}
            >
              <CheckCircle size={15} /> Marquer résolu
            </button>
          </>
        )}
      </div>
    </div>
  );
}
