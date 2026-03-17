'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Wrench, MapPin, Calendar, AlertTriangle, CheckCircle, Clock, Package, Plus, X, Bot, Loader2 } from 'lucide-react';

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
        type_action: ticket.type_intervention === 'preventive' ? 'inspection' : 'intervention',
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

  if (loading) return <div style={{ padding: 20, color: 'var(--text-secondary)' }}>Chargement...</div>;
  if (!ticket) return <div style={{ padding: 20, color: 'var(--text-secondary)' }}>Ticket introuvable</div>;

  const pc = prioriteColor[ticket.priorite] || '#2563eb';

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: 4 }}><ArrowLeft size={22} /></button>
        <h1 style={{ fontSize: 15, fontWeight: 800, margin: 0, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ticket.titre}</h1>
      </div>

      {/* Badges */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        <span style={{ background: `${pc}22`, color: pc, border: `1px solid ${pc}44`, borderRadius: 6, padding: '3px 10px', fontSize: 12, fontWeight: 700, textTransform: 'uppercase' }}>{ticket.priorite}</span>
        <span style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 6, padding: '3px 10px', fontSize: 12, color: 'var(--text-secondary)' }}>{ticket.type_intervention === 'preventive' ? 'Préventif' : 'Correctif'}</span>
      </div>

      {/* Description */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 16px', marginBottom: 12 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Description</div>
        <div style={{ fontSize: 13, lineHeight: 1.6 }}>{ticket.description}</div>
      </div>

      {/* Bloc IA Diagnostic */}
      <div style={{ background: diagnostic ? 'rgba(37,99,235,0.06)' : 'var(--bg-card)', border: `1px solid ${diagnostic ? 'rgba(37,99,235,0.25)' : 'var(--border)'}`, borderRadius: 12, padding: '14px 16px', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(37,99,235,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bot size={14} color="#2563eb" />
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Diagnostic IA</span>
            {diagnostic && (
              <span style={{ fontSize: 10, background: urgenceColor(diagnostic.niveau_urgence) + '22', color: urgenceColor(diagnostic.niveau_urgence), border: `1px solid ${urgenceColor(diagnostic.niveau_urgence)}44`, borderRadius: 4, padding: '1px 6px', fontWeight: 700, textTransform: 'uppercase' }}>
                {diagnostic.niveau_urgence}
              </span>
            )}
          </div>
          <button onClick={runDiagnostic} disabled={diagLoading} style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#2563eb', border: 'none', borderRadius: 7, padding: '6px 12px', color: 'white', fontSize: 12, fontWeight: 700, cursor: diagLoading ? 'default' : 'pointer', opacity: diagLoading ? 0.7 : 1, whiteSpace: 'nowrap' }}>
            {diagLoading ? <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> Analyse...</> : diagnostic ? '↻ Relancer' : '⚡ Diagnostiquer'}
          </button>
        </div>
        {diagLoading && (
          <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)', fontSize: 13 }}>
            <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> Analyse en cours...
          </div>
        )}
        {diagError && (
          <div style={{ marginTop: 8, fontSize: 12, color: '#ef4444', background: '#ef444410', border: '1px solid #ef444433', borderRadius: 8, padding: '8px 12px' }}>
            ⚠️ {diagError}
          </div>
        )}
        {diagnostic && (
          <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--text-primary)' }}>{diagnostic.cause_probable}</div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 5 }}>Actions</div>
              {diagnostic.actions_recommandees.map((a, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, fontSize: 13, marginBottom: 3 }}>
                  <span style={{ color: '#2563eb', fontWeight: 700, flexShrink: 0 }}>{i + 1}.</span>
                  <span style={{ lineHeight: 1.5 }}>{a}</span>
                </div>
              ))}
            </div>
            {diagnostic.temps_estime && (
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>⏱ Temps estimé : <strong style={{ color: 'var(--text-primary)' }}>{diagnostic.temps_estime}</strong></div>
            )}
          </div>
        )}
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

      {/* Infos */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 16px', marginBottom: 12 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {ticket.machines && (
            <div style={{ display: 'flex', gap: 10 }}>
              <Wrench size={15} color="var(--accent)" style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Machine</div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{ticket.machines.nom}</div>
              </div>
            </div>
          )}
          {ticket.machines?.localisation && (
            <div style={{ display: 'flex', gap: 10 }}>
              <MapPin size={15} color="var(--text-secondary)" style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Localisation</div>
                <div style={{ fontSize: 14 }}>{ticket.machines.localisation}</div>
              </div>
            </div>
          )}
          <div style={{ display: 'flex', gap: 10 }}>
            <Calendar size={15} color="var(--text-secondary)" style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Créé le</div>
              <div style={{ fontSize: 13 }}>{new Date(ticket.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Pièces utilisées */}
      {ticket.statut !== 'resolu' && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 16px', marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Pièces utilisées</div>
            <button onClick={() => setShowPieces(!showPieces)} style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#2563eb18', border: 'none', borderRadius: 6, padding: '4px 10px', color: '#2563eb', cursor: 'pointer', fontSize: 12 }}>
              <Plus size={12} /> Ajouter
            </button>
          </div>

          {showPieces && (
            <div style={{ marginBottom: 12 }}>
              <input value={searchStock} onChange={e => setSearchStock(e.target.value)} placeholder="Rechercher une pièce..." style={{ width: '100%', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', color: 'var(--text-primary)', fontSize: 13, boxSizing: 'border-box', marginBottom: 8 }} />
              {searchStock && filteredStocks.map(s => (
                <div key={s.id} onClick={() => addPiece(s)} style={{ padding: '8px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 13, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-primary)', marginBottom: 4 }}>
                  <span>{s.nom}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{s.quantite_actuelle} {s.unite} dispo</span>
                </div>
              ))}
            </div>
          )}

          {pieces.length === 0 ? (
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Aucune pièce ajoutée</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {pieces.map(p => (
                <div key={p.stock_id} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-primary)', borderRadius: 8, padding: '8px 12px' }}>
                  <Package size={13} color="var(--text-secondary)" />
                  <span style={{ flex: 1, fontSize: 13 }}>{p.nom}</span>
                  <input type="number" min={1} value={p.quantite} onChange={e => updateQty(p.stock_id, parseInt(e.target.value) || 1)} style={{ width: 50, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 6, padding: '4px 8px', color: 'var(--text-primary)', fontSize: 13, textAlign: 'center' }} />
                  <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{p.unite}</span>
                  <button onClick={() => setPieces(prev => prev.filter(x => x.stock_id !== p.stock_id))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: 2 }}><X size={14} /></button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Notes */}
      {ticket.statut !== 'resolu' && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 16px', marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Notes d'intervention</div>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Décris ce que tu as fait..." style={{ width: '100%', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px', color: 'var(--text-primary)', fontSize: 13, resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }} />
        </div>
      )}

      {/* Changer statut */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 16px' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 12 }}>Statut</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            { value: 'en_cours', label: 'Prendre en charge', icon: Clock, color: '#f59e0b' },
            { value: 'resolu',   label: 'Marquer résolu',   icon: CheckCircle, color: '#22c55e' },
          ].filter(s => s.value !== ticket.statut).map(({ value, label, icon: Icon, color }) => (
            <button key={value} onClick={() => updateStatut(value)} disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', borderRadius: 10, border: `1px solid ${color}44`, background: `${color}18`, color, cursor: 'pointer', fontWeight: 700, fontSize: 14, opacity: saving ? 0.6 : 1 }}>
              <Icon size={18} /> {label}
            </button>
          ))}
          {ticket.statut === 'resolu' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', borderRadius: 10, border: '1px solid #22c55e44', background: '#22c55e18', color: '#22c55e', fontWeight: 700, fontSize: 14 }}>
              <CheckCircle size={18} /> Ticket résolu ✓
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
