'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Wrench, MapPin, User, Calendar, Bot, Loader2 } from 'lucide-react';

type Ticket = {
  id: string; titre: string; description: string; priorite: string; statut: string;
  type_intervention: string; classification: string; created_at: string;
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

const prioriteColor: Record<string, string> = { urgente: '#ef4444', haute: '#f59e0b', normale: '#2563eb', basse: '#22c55e' };
const statutColor: Record<string, string> = { ouvert: '#2563eb', en_cours: '#f59e0b', resolu: '#22c55e' };

export default function DirecteurTicketDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [diagnostic, setDiagnostic] = useState<Diagnostic | null>(null);
  const [diagLoading, setDiagLoading] = useState(false);
  const [diagError, setDiagError] = useState<string | null>(null);

  useEffect(() => {
    if (!params.id) return;
    supabase.from('tickets')
      .select('*, machines(nom, localisation, type_equipement), technicians(prenom, nom, specialites)')
      .eq('id', params.id).single()
      .then(({ data }) => {
        const t = data as Ticket;
        setTicket(t);
        if (t?.diagnostic_ia) {
          try { setDiagnostic(JSON.parse(t.diagnostic_ia)); } catch { /* ignore */ }
        }
        setLoading(false);
      });
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

  if (loading) return <div style={{ padding: 20, color: 'var(--text-secondary)' }}>Chargement...</div>;
  if (!ticket) return <div style={{ padding: 20, color: 'var(--text-secondary)' }}>Ticket introuvable</div>;

  const pc = prioriteColor[ticket.priorite] || '#2563eb';
  const sc = statutColor[ticket.statut] || '#2563eb';
  const statutLabel = ticket.statut === 'resolu' ? 'Résolu' : ticket.statut === 'en_cours' ? 'En cours' : 'Ouvert';

  return (
    <div style={{ padding: 'clamp(14px, 3vw, 22px)', maxWidth: 760, boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: 4, display: 'flex', alignItems: 'center' }}>
          <ArrowLeft size={22} />
        </button>
        <h1 style={{ fontSize: 18, fontWeight: 800, margin: 0, flex: 1 }}>{ticket.titre}</h1>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        <span style={{ background: `${pc}22`, color: pc, border: `1px solid ${pc}44`, borderRadius: 6, padding: '4px 12px', fontSize: 12, fontWeight: 700, textTransform: 'uppercase' }}>{ticket.priorite}</span>
        <span style={{ background: `${sc}22`, color: sc, border: `1px solid ${sc}44`, borderRadius: 6, padding: '4px 12px', fontSize: 12, fontWeight: 600 }}>{statutLabel}</span>
        <span style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 6, padding: '4px 12px', fontSize: 12, color: 'var(--text-secondary)' }}>
          {ticket.type_intervention === 'preventive' ? 'Préventif' : 'Correctif'}
        </span>
        {ticket.classification && (
          <span style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 6, padding: '4px 12px', fontSize: 12, color: 'var(--text-secondary)' }}>{ticket.classification}</span>
        )}
      </div>

      {ticket.description && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 20px', marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Description</div>
          <div style={{ fontSize: 14, lineHeight: 1.7 }}>{ticket.description}</div>
        </div>
      )}

      {/* Bloc IA Diagnostic */}
      <div style={{ background: diagnostic ? 'rgba(37,99,235,0.06)' : 'var(--bg-card)', border: `1px solid ${diagnostic ? 'rgba(37,99,235,0.25)' : 'var(--border)'}`, borderRadius: 12, padding: '16px 20px', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(37,99,235,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bot size={15} color="#2563eb" />
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Diagnostic IA</span>
            {diagnostic && (
              <span style={{ fontSize: 10, background: urgenceColor(diagnostic.niveau_urgence) + '22', color: urgenceColor(diagnostic.niveau_urgence), border: `1px solid ${urgenceColor(diagnostic.niveau_urgence)}44`, borderRadius: 4, padding: '2px 8px', fontWeight: 700, textTransform: 'uppercase' }}>
                {diagnostic.niveau_urgence}
              </span>
            )}
          </div>
          <button onClick={runDiagnostic} disabled={diagLoading} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#2563eb', border: 'none', borderRadius: 8, padding: '7px 14px', color: 'white', fontSize: 13, fontWeight: 700, cursor: diagLoading ? 'default' : 'pointer', opacity: diagLoading ? 0.7 : 1, whiteSpace: 'nowrap' }}>
            {diagLoading ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Analyse...</> : diagnostic ? '↻ Relancer' : '⚡ Diagnostiquer'}
          </button>
        </div>
        {diagLoading && (
          <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)', fontSize: 13 }}>
            <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Analyse du ticket en cours...
          </div>
        )}
        {diagError && (
          <div style={{ marginTop: 10, fontSize: 12, color: '#ef4444', background: '#ef444410', border: '1px solid #ef444433', borderRadius: 8, padding: '8px 12px' }}>
            ⚠️ {diagError}
          </div>
        )}
        {!diagnostic && !diagLoading && !diagError && (
          <div style={{ marginTop: 10, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Analyse IA pour obtenir la cause probable, les actions recommandées et les pièces nécessaires.
          </div>
        )}
        {diagnostic && (
          <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--text-primary)' }}>{diagnostic.cause_probable}</div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Actions recommandées</div>
              {diagnostic.actions_recommandees.map((a, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, fontSize: 13, marginBottom: 4 }}>
                  <span style={{ color: '#2563eb', fontWeight: 700, flexShrink: 0 }}>{i + 1}.</span>
                  <span style={{ lineHeight: 1.5 }}>{a}</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
              {diagnostic.pieces_probables.length > 0 && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Pièces probables</div>
                  {diagnostic.pieces_probables.map((p, i) => <div key={i} style={{ fontSize: 13, color: 'var(--text-secondary)' }}>· {p}</div>)}
                </div>
              )}
              {diagnostic.temps_estime && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Temps estimé</div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{diagnostic.temps_estime}</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 20px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {ticket.machines && (
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <Wrench size={16} color="#0ea5e9" style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 2 }}>Machine</div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{ticket.machines.nom}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{ticket.machines.type_equipement}</div>
              </div>
            </div>
          )}
          {ticket.machines?.localisation && (
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <MapPin size={16} color="var(--text-secondary)" style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 2 }}>Localisation</div>
                <div style={{ fontSize: 14 }}>{ticket.machines.localisation}</div>
              </div>
            </div>
          )}
          {ticket.technicians ? (
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <User size={16} color="var(--text-secondary)" style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 2 }}>Technicien assigné</div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{ticket.technicians.prenom} {ticket.technicians.nom}</div>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 4 }}>
                  {(ticket.technicians.specialites || []).map((s, i) => (
                    <span key={i} style={{ background: 'var(--bg-secondary)', borderRadius: 4, padding: '1px 6px', fontSize: 11, color: 'var(--text-secondary)' }}>{s}</span>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <User size={16} color="var(--text-secondary)" style={{ flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 2 }}>Technicien</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', fontStyle: 'italic' }}>Non assigné</div>
              </div>
            </div>
          )}
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <Calendar size={16} color="var(--text-secondary)" style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 2 }}>Créé le</div>
              <div style={{ fontSize: 14 }}>{new Date(ticket.created_at).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
