'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Wrench, MapPin, User, Calendar, AlertTriangle, CheckCircle, Clock, UserCheck, Bot, Loader2, ChevronDown, ChevronUp, History } from 'lucide-react';
import TypeBadge from '@/components/TypeBadge';

type Ticket = {
  id: string;
  titre: string;
  description: string;
  priorite: string;
  statut: string;
  type_intervention: string;
  classification: string;
  created_at: string;
  technicien_id: string | null;
  diagnostic_ia: string | null;
  machines: { nom: string; localisation: string; type_equipement: string } | null;
  technicians: { prenom: string; nom: string; specialites: string[] } | null;
};

type Diagnostic = {
  cause_probable: string;
  actions_recommandees: string[];
  niveau_urgence: string;
  pieces_probables: string[];
  temps_estime: string;
};

type Technician = { id: string; prenom: string; nom: string; specialites: string[] };
type HistoryEntry = { id: string; champ: string; ancienne_valeur: string | null; nouvelle_valeur: string | null; modifie_par: string; modifie_le: string; };

const prioriteColor: Record<string, string> = {
  urgente: '#ef4444', haute: '#f59e0b', normale: '#2563eb', basse: '#22c55e',
};
const statutColor: Record<string, string> = {
  ouvert: '#2563eb', en_cours: '#f59e0b', resolu: '#22c55e',
};

export default function TicketDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [techs, setTechs] = useState<Technician[]>([]);
  const [selectedTech, setSelectedTech] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [diagLoading, setDiagLoading] = useState(false);
  const [diagExpanded, setDiagExpanded] = useState(true);
  const [diagnostic, setDiagnostic] = useState<Diagnostic | null>(null);
  const [diagError, setDiagError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    async function load() {
      const [{ data: t }, { data: techList }, { data: hist }] = await Promise.all([
        supabase.from('tickets').select('*, machines(nom, localisation, type_equipement), technicians(prenom, nom, specialites)').eq('id', params.id).single(),
        supabase.from('technicians').select('id, prenom, nom, specialites').order('prenom'),
        supabase.from('ticket_history').select('*').eq('ticket_id', params.id).order('modifie_le', { ascending: false }),
      ]);
      if (!t) { setLoadError(true); setLoading(false); return; }
      const ticketData = t as Ticket;
      setTicket(ticketData);
      setTechs((techList as Technician[]) || []);
      setSelectedTech(ticketData?.technicien_id || '');
      setHistory((hist as HistoryEntry[]) || []);
      if (ticketData?.diagnostic_ia) {
        try { setDiagnostic(JSON.parse(ticketData.diagnostic_ia)); } catch { /* ignore */ }
      }
      setLoading(false);
    }
    if (params.id) load();
  }, [params.id]);

  async function assignTech() {
    const tech = techs.find(t => t.id === selectedTech);
    const label = tech ? `${tech.prenom} ${tech.nom}` : 'retirer le technicien assigné';
    if (!window.confirm(`Confirmer : ${label} ?`)) return;
    setAssigning(true);
    const oldTech = techs.find(t => t.id === ticket?.technicien_id);
    await supabase.from('tickets').update({ technicien_id: selectedTech || null }).eq('id', params.id as string);
    const entry = await supabase.from('ticket_history').insert({
      ticket_id: params.id,
      champ: 'technicien',
      ancienne_valeur: oldTech ? `${oldTech.prenom} ${oldTech.nom}` : null,
      nouvelle_valeur: tech ? `${tech.prenom} ${tech.nom}` : null,
      modifie_par: 'manager',
    }).select('*').single();
    if (entry.data) setHistory(prev => [entry.data as HistoryEntry, ...prev]);
    const found = tech || null;
    setTicket(prev => prev ? { ...prev, technicien_id: selectedTech || null, technicians: found } : prev);
    setAssigning(false);
  }

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
        setDiagExpanded(true);
      } else {
        setDiagError(data.error || 'Réponse IA vide — réessayez dans quelques secondes');
      }
    } catch {
      setDiagError('Erreur réseau — vérifiez la connexion');
    } finally {
      setDiagLoading(false);
    }
  }

  async function updateStatut(statut: string) {
    setSaving(true);
    const oldStatut = ticket?.statut;
    await supabase.from('tickets').update({ statut }).eq('id', params.id as string);
    const entry = await supabase.from('ticket_history').insert({
      ticket_id: params.id,
      champ: 'statut',
      ancienne_valeur: oldStatut || null,
      nouvelle_valeur: statut,
      modifie_par: 'manager',
    }).select('*').single();
    if (entry.data) setHistory(prev => [entry.data as HistoryEntry, ...prev]);
    setTicket(prev => prev ? { ...prev, statut } : prev);
    setSaving(false);
  }

  function urgenceColor(niveau: string) {
    if (niveau === 'critique') return '#ef4444';
    if (niveau === 'élevé') return '#f59e0b';
    if (niveau === 'modéré') return '#2563eb';
    return '#22c55e';
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  if (loading) return <div className="p-5 text-[#7d8590]">Chargement...</div>;
  if (loadError) return <div className="p-5 text-red-500">⚠️ Erreur de chargement — réessayez.</div>;
  if (!ticket) return <div className="p-5 text-[#7d8590]">Ticket introuvable.</div>;

  const pColor = prioriteColor[ticket.priorite] || '#2563eb';
  const sColor = statutColor[ticket.statut] || '#2563eb';

  return (
    <div className="p-4 max-w-[100vw] box-border overflow-x-hidden">

      {/* Header */}
      <div className="flex items-center gap-2.5 mb-5">
        <button onClick={() => router.back()} className="bg-transparent border-none cursor-pointer text-[#7d8590] p-1 flex items-center">
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-[16px] font-extrabold m-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap">{ticket.titre}</h1>
      </div>

      {/* Badges */}
      <div className="flex gap-2 flex-wrap mb-4">
        <span className="rounded-md px-2.5 py-0.5 text-[12px] font-bold uppercase" style={{ background: `${pColor}22`, color: pColor, border: `1px solid ${pColor}44` }}>
          {ticket.priorite}
        </span>
        <span className="rounded-md px-2.5 py-0.5 text-[12px] font-semibold" style={{ background: `${sColor}22`, color: sColor, border: `1px solid ${sColor}44` }}>
          {ticket.statut === 'en_cours' ? 'En cours' : ticket.statut === 'resolu' ? 'Résolu' : 'Ouvert'}
        </span>
        <TypeBadge type={ticket.type_intervention} />
        {ticket.classification && (
          <span className="bg-[#1c2128] border border-[#30363d] rounded-md px-2.5 py-0.5 text-[12px] text-[#7d8590]">
            {ticket.classification}
          </span>
        )}
      </div>

      {/* Description */}
      <div className="bg-[#1c2128] border border-[#30363d] rounded-xl px-4 py-3.5 mb-3">
        <div className="text-[11px] font-bold text-[#7d8590] uppercase tracking-[0.5px] mb-2">Description</div>
        <div className="text-[13px] leading-relaxed text-[#e6edf3]">{ticket.description}</div>
      </div>

      {/* Bloc IA Diagnostic */}
      <div
        className="rounded-xl px-4 py-3.5 mb-3"
        style={{ background: diagnostic ? 'rgba(37,99,235,0.06)' : '#1c2128', border: `1px solid ${diagnostic ? 'rgba(37,99,235,0.25)' : '#30363d'}` }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-500/15 flex items-center justify-center shrink-0">
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
          <div className="flex gap-1.5">
            {diagnostic && (
              <button
                onClick={() => setDiagExpanded(v => !v)}
                className="bg-transparent border-none cursor-pointer text-[#7d8590] p-1 flex items-center"
              >
                {diagExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
            )}
            <button
              onClick={runDiagnostic}
              disabled={diagLoading}
              className="flex items-center gap-1.5 bg-blue-600 border-none rounded-lg px-3 py-1.5 text-white text-[12px] font-bold whitespace-nowrap"
              style={{ cursor: diagLoading ? 'default' : 'pointer', opacity: diagLoading ? 0.7 : 1 }}
            >
              {diagLoading ? <><Loader2 size={13} className="animate-spin" /> Analyse...</> : diagnostic ? '↻ Relancer' : '⚡ Diagnostiquer'}
            </button>
          </div>
        </div>

        {!diagnostic && !diagLoading && !diagError && (
          <div className="mt-2.5 text-[12px] text-[#7d8590] leading-relaxed">
            Lance l&apos;IA pour obtenir une analyse de cause probable, des actions recommandées et une estimation des pièces nécessaires.
          </div>
        )}
        {diagError && (
          <div className="mt-2.5 text-[12px] text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
            ⚠️ {diagError}
          </div>
        )}

        {diagLoading && (
          <div className="mt-3 flex items-center gap-2 text-[#7d8590] text-[13px]">
            <Loader2 size={14} className="animate-spin" />
            Analyse du ticket en cours...
          </div>
        )}

        {diagnostic && diagExpanded && (
          <div className="mt-3.5 flex flex-col gap-3">
            <div>
              <div className="text-[10px] font-bold text-[#7d8590] uppercase tracking-[0.5px] mb-1.5">Cause probable</div>
              <div className="text-[13px] leading-relaxed text-[#e6edf3]">{diagnostic.cause_probable}</div>
            </div>
            <div>
              <div className="text-[10px] font-bold text-[#7d8590] uppercase tracking-[0.5px] mb-1.5">Actions recommandées</div>
              <div className="flex flex-col gap-1">
                {diagnostic.actions_recommandees.map((a, i) => (
                  <div key={i} className="flex gap-2 items-start text-[13px]">
                    <span className="text-blue-500 font-bold shrink-0 min-w-[16px]">{i + 1}.</span>
                    <span className="leading-relaxed">{a}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {diagnostic.pieces_probables.length > 0 && (
                <div>
                  <div className="text-[10px] font-bold text-[#7d8590] uppercase tracking-[0.5px] mb-1.5">Pièces probables</div>
                  {diagnostic.pieces_probables.map((p, i) => (
                    <div key={i} className="text-[12px] text-[#7d8590] leading-relaxed">· {p}</div>
                  ))}
                </div>
              )}
              {diagnostic.temps_estime && (
                <div>
                  <div className="text-[10px] font-bold text-[#7d8590] uppercase tracking-[0.5px] mb-1.5">Temps estimé</div>
                  <div className="text-[13px] text-[#e6edf3] font-semibold">{diagnostic.temps_estime}</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Infos */}
      <div className="bg-[#1c2128] border border-[#30363d] rounded-xl px-4 py-3.5 mb-3">
        <div className="flex flex-col gap-3">
          {ticket.machines && (
            <div className="flex gap-2.5 items-start">
              <Wrench size={16} color="var(--accent)" className="shrink-0 mt-0.5" />
              <div>
                <div className="text-[12px] text-[#7d8590]">Machine</div>
                <div className="text-[14px] font-semibold">{ticket.machines.nom}</div>
                <div className="text-[12px] text-[#7d8590]">{ticket.machines.type_equipement}</div>
              </div>
            </div>
          )}
          {ticket.machines?.localisation && (
            <div className="flex gap-2.5 items-start">
              <MapPin size={16} color="#7d8590" className="shrink-0 mt-0.5" />
              <div>
                <div className="text-[12px] text-[#7d8590]">Localisation</div>
                <div className="text-[14px]">{ticket.machines.localisation}</div>
              </div>
            </div>
          )}
          {ticket.technicians && (
            <div className="flex gap-2.5 items-start">
              <User size={16} color="#7d8590" className="shrink-0 mt-0.5" />
              <div>
                <div className="text-[12px] text-[#7d8590]">Technicien assigné</div>
                <div className="text-[14px] font-semibold">{ticket.technicians.prenom} {ticket.technicians.nom}</div>
                <div className="flex gap-1 flex-wrap mt-1">
                  {(ticket.technicians.specialites || []).map((s, i) => (
                    <span key={i} className="bg-[#161b22] rounded px-1.5 py-0.5 text-[10px] text-[#7d8590]">{s}</span>
                  ))}
                </div>
              </div>
            </div>
          )}
          <div className="flex gap-2.5 items-start">
            <Calendar size={16} color="#7d8590" className="shrink-0 mt-0.5" />
            <div>
              <div className="text-[12px] text-[#7d8590]">Créé le</div>
              <div className="text-[13px]">{formatDate(ticket.created_at)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Assigner technicien */}
      <div className="bg-[#1c2128] border border-[#30363d] rounded-xl px-4 py-3.5 mb-3">
        <div className="text-[11px] font-bold text-[#7d8590] uppercase tracking-[0.5px] mb-3">Assigner un technicien</div>
        <div className="flex gap-2 items-center">
          <select
            value={selectedTech}
            onChange={e => setSelectedTech(e.target.value)}
            className="flex-1 bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-[#e6edf3] text-[13px]"
          >
            <option value="">— Non assigné —</option>
            {techs.map(t => <option key={t.id} value={t.id}>{t.prenom} {t.nom}</option>)}
          </select>
          <button
            onClick={assignTech}
            disabled={assigning}
            className="flex items-center gap-1.5 bg-blue-600 text-white border-none rounded-lg px-4 py-2 cursor-pointer font-semibold text-[13px] whitespace-nowrap"
            style={{ opacity: assigning ? 0.6 : 1 }}
          >
            <UserCheck size={15} /> {assigning ? '...' : 'Assigner'}
          </button>
        </div>
      </div>

      {/* Historique modifications */}
      {history.length > 0 && (
        <div className="bg-[#1c2128] border border-[#30363d] rounded-xl px-4 py-3.5 mb-3">
          <div className="flex items-center gap-2 mb-3">
            <History size={13} color="#7d8590" />
            <span className="text-[11px] font-bold text-[#7d8590] uppercase tracking-[0.5px]">Historique</span>
          </div>
          <div className="flex flex-col gap-2">
            {history.map(h => (
              <div key={h.id} className="flex items-start gap-2 text-[12px]">
                <span className="text-[#7d8590] shrink-0 min-w-[70px]">
                  {new Date(h.modifie_le).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </span>
                <span className="text-[#e6edf3]">
                  <span className="text-[#7d8590]">{h.champ} : </span>
                  {h.ancienne_valeur && <><span className="line-through text-[#7d8590]">{h.ancienne_valeur}</span> → </>}
                  <span className="font-semibold">{h.nouvelle_valeur || '—'}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Padding pour la barre sticky */}
      <div className="h-20" />

      {/* Barre sticky statut */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#1c2128] border-t border-[#30363d] px-4 py-3 z-50 flex gap-2 max-w-[100vw] box-border">
        {ticket.statut !== 'ouvert' && (
          <button
            onClick={() => updateStatut('ouvert')}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-[10px] bg-blue-500/15 border border-blue-500/25 text-blue-500 cursor-pointer font-semibold text-[13px]"
          >
            <AlertTriangle size={15} /> Réouvrir
          </button>
        )}
        {ticket.statut !== 'en_cours' && (
          <button
            onClick={() => updateStatut('en_cours')}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-[10px] bg-amber-500/15 border border-amber-500/25 text-amber-500 cursor-pointer font-semibold text-[13px]"
          >
            <Clock size={15} /> En cours
          </button>
        )}
        {ticket.statut !== 'resolu' && (
          <button
            onClick={() => updateStatut('resolu')}
            disabled={saving}
            className="flex-[2] flex items-center justify-center gap-1.5 py-2.5 rounded-[10px] bg-green-500 border-none text-white cursor-pointer font-bold text-[13px]"
          >
            <CheckCircle size={15} /> Marquer résolu
          </button>
        )}
        {ticket.statut === 'resolu' && (
          <div className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-[10px] bg-green-500/10 text-green-500 text-[13px] font-bold">
            <CheckCircle size={15} /> Résolu
          </div>
        )}
      </div>
    </div>
  );
}
