'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Package, AlertTriangle, CheckCircle, Plus, Pencil, Trash2, X, Save, BarChart2, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

type ConsoPiece = { nom: string; total: number; unite: string };
type ConsoJour = { date: string; total: number };

type Stock = {
  id: string;
  reference: string;
  nom: string;
  description: string | null;
  categorie: string | null;
  unite: string;
  quantite_actuelle: number;
  seuil_minimum: number;
  emplacement: string | null;
  actif: boolean;
  created_at: string;
};

const emptyForm = {
  reference: '', nom: '', description: '', categorie: '',
  unite: 'pcs', quantite_actuelle: '', seuil_minimum: '', emplacement: '',
};

export default function StocksPage() {
  const router = useRouter();
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Stock | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [filterAlerte, setFilterAlerte] = useState(false);
  const [view, setView] = useState<'stocks' | 'stats'>('stocks');
  const [consoTop, setConsoTop] = useState<ConsoPiece[]>([]);
  const [consoJours, setConsoJours] = useState<ConsoJour[]>([]);
  const [statsLoading, setStatsLoading] = useState(false);

  async function load() {
    const { data } = await supabase.from('stocks').select('*').eq('actif', true).order('nom');
    setStocks((data as Stock[]) || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function loadStats() {
    setStatsLoading(true);
    const since = new Date();
    since.setDate(since.getDate() - 30);
    const { data } = await supabase
      .from('maintenance_history')
      .select('pieces_changees, realise_le')
      .gte('realise_le', since.toISOString())
      .not('pieces_changees', 'is', null);

    const totals: Record<string, ConsoPiece> = {};
    const parJour: Record<string, number> = {};

    for (const row of (data || [])) {
      const pieces = row.pieces_changees as { nom: string; quantite: number; unite: string }[] | null;
      if (!pieces || !Array.isArray(pieces)) continue;
      const jour = row.realise_le?.substring(0, 10);
      let jourTotal = 0;
      for (const p of pieces) {
        if (!p?.nom) continue;
        if (!totals[p.nom]) totals[p.nom] = { nom: p.nom, total: 0, unite: p.unite || 'pcs' };
        totals[p.nom].total += Number(p.quantite) || 0;
        jourTotal += Number(p.quantite) || 0;
      }
      if (jour) parJour[jour] = (parJour[jour] || 0) + jourTotal;
    }

    const top = Object.values(totals).sort((a, b) => b.total - a.total).slice(0, 10);
    setConsoTop(top);

    // Générer les 30 derniers jours
    const days: ConsoJour[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const key = d.toISOString().substring(0, 10);
      days.push({ date: key, total: parJour[key] || 0 });
    }
    setConsoJours(days);
    setStatsLoading(false);
  }

  useEffect(() => { if (view === 'stats') loadStats(); }, [view]);

  function openAdd() {
    setEditing(null);
    setForm(emptyForm);
    setShowForm(true);
  }

  function openEdit(s: Stock) {
    setEditing(s);
    setForm({
      reference: s.reference,
      nom: s.nom,
      description: s.description || '',
      categorie: s.categorie || '',
      unite: s.unite,
      quantite_actuelle: String(s.quantite_actuelle),
      seuil_minimum: String(s.seuil_minimum),
      emplacement: s.emplacement || '',
    });
    setShowForm(true);
  }

  async function save() {
    if (!form.reference || !form.nom) return;
    setSaving(true);
    const payload = {
      reference: form.reference.trim().toUpperCase(),
      nom: form.nom.trim(),
      description: form.description.trim() || null,
      categorie: form.categorie.trim() || null,
      unite: form.unite.trim() || 'pcs',
      quantite_actuelle: parseFloat(form.quantite_actuelle) || 0,
      seuil_minimum: parseFloat(form.seuil_minimum) || 0,
      emplacement: form.emplacement.trim() || null,
    };
    if (editing) {
      await supabase.from('stocks').update(payload).eq('id', editing.id);
    } else {
      await supabase.from('stocks').insert(payload);
    }
    setSaving(false);
    setShowForm(false);
    load();
  }

  async function remove(s: Stock) {
    if (!confirm(`Supprimer "${s.nom}" ?`)) return;
    await supabase.from('stocks').update({ actif: false }).eq('id', s.id);
    load();
  }

  const filtered = stocks.filter(s => {
    const matchSearch = s.nom.toLowerCase().includes(search.toLowerCase()) ||
      s.reference.toLowerCase().includes(search.toLowerCase());
    const matchAlerte = !filterAlerte || s.quantite_actuelle <= s.seuil_minimum;
    return matchSearch && matchAlerte;
  });

  const alertes = stocks.filter(s => s.quantite_actuelle <= s.seuil_minimum).length;

  const maxBar = Math.max(...consoTop.map(c => c.total), 1);
  const maxLine = Math.max(...consoJours.map(c => c.total), 1);
  const lineW = 600; const lineH = 120;
  const points = consoJours.map((d, i) => {
    const x = (i / (consoJours.length - 1)) * lineW;
    const y = lineH - (d.total / maxLine) * lineH;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div style={{ padding: 'clamp(16px, 4vw, 32px)', maxWidth: 1100, boxSizing: 'border-box' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
          <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '2px 4px', display: 'flex', alignItems: 'center', marginTop: 2 }}><ArrowLeft size={20} /></button>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Stocks & Pièces</h1>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{stocks.length} article{stocks.length > 1 ? 's' : ''} · {alertes} en alerte</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={openAdd} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#2563eb', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 18px', cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>
            <Plus size={16} /> Ajouter
          </button>
        </div>
      </div>

      {/* Onglets */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: 4, width: 'fit-content' }}>
        {(['stocks', 'stats'] as const).map(v => (
          <button key={v} onClick={() => setView(v)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 7, fontSize: 13, fontWeight: view === v ? 700 : 400, cursor: 'pointer', background: view === v ? '#2563eb' : 'transparent', color: view === v ? '#fff' : 'var(--text-secondary)', border: 'none' }}>
            {v === 'stocks' ? <Package size={14} /> : <BarChart2 size={14} />}
            {v === 'stocks' ? 'Articles' : 'Consommation'}
          </button>
        ))}
      </div>

      {/* KPI */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: '18px 20px' }}>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Total articles</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#2563eb' }}>{stocks.length}</div>
        </div>
        <div style={{ background: 'var(--bg-card)', border: `1px solid ${alertes > 0 ? '#ef444433' : 'var(--border)'}`, borderRadius: 14, padding: '18px 20px' }}>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>En alerte</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: alertes > 0 ? '#ef4444' : '#22c55e' }}>{alertes}</div>
        </div>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: '18px 20px' }}>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>OK</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#22c55e' }}>{stocks.length - alertes}</div>
        </div>
      </div>

      {view === 'stats' && (
        <div>
          {statsLoading ? (
            <div style={{ color: 'var(--text-secondary)', padding: 40, textAlign: 'center' }}>Chargement des stats...</div>
          ) : (
            <>
              {/* Évolution 30 jours */}
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: '20px 24px', marginBottom: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 16 }}>Pièces consommées — 30 derniers jours</div>
                {maxLine === 0 ? (
                  <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Aucune consommation enregistrée</div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <svg viewBox={`0 0 ${lineW} ${lineH + 20}`} style={{ width: '100%', minWidth: 300, height: 'auto' }}>
                      {/* Grille */}
                      {[0, 0.25, 0.5, 0.75, 1].map(r => (
                        <line key={r} x1={0} y1={lineH * (1 - r)} x2={lineW} y2={lineH * (1 - r)} stroke="var(--border)" strokeWidth={0.5} />
                      ))}
                      {/* Aire */}
                      <defs>
                        <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#2563eb" stopOpacity="0.3" />
                          <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      <polygon points={`0,${lineH} ${points} ${lineW},${lineH}`} fill="url(#grad)" />
                      <polyline points={points} fill="none" stroke="#2563eb" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                      {/* Labels dates */}
                      {[0, 7, 14, 21, 29].map(i => (
                        <text key={i} x={(i / 29) * lineW} y={lineH + 16} textAnchor="middle" fontSize={9} fill="var(--text-secondary)">
                          {new Date(consoJours[i]?.date || '').toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                        </text>
                      ))}
                    </svg>
                  </div>
                )}
              </div>

              {/* Top 10 pièces */}
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: '20px 24px' }}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 16 }}>Top pièces consommées (30j)</div>
                {consoTop.length === 0 ? (
                  <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Aucune donnée</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {consoTop.map((c, i) => (
                      <div key={c.nom} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 11, color: 'var(--text-secondary)', width: 16, textAlign: 'right', flexShrink: 0 }}>{i + 1}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                            <span style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.nom}</span>
                            <span style={{ fontSize: 13, fontWeight: 700, color: '#2563eb', flexShrink: 0, marginLeft: 8 }}>{c.total} {c.unite}</span>
                          </div>
                          <div style={{ height: 6, background: 'var(--bg-primary)', borderRadius: 3, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${(c.total / maxBar) * 100}%`, background: i === 0 ? '#2563eb' : i === 1 ? '#7c3aed' : '#a78bfa', borderRadius: 3, transition: 'width 0.4s ease' }} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {view === 'stocks' && <>
      {/* Filtres */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 18 }}>
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher par nom ou référence..."
          style={{ flex: 1, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 14px', color: 'var(--text-primary)', fontSize: 13 }}
        />
        <button onClick={() => setFilterAlerte(f => !f)} style={{
          padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
          background: filterAlerte ? '#ef444422' : 'var(--bg-card)',
          border: `1px solid ${filterAlerte ? '#ef444466' : 'var(--border)'}`,
          color: filterAlerte ? '#ef4444' : 'var(--text-secondary)',
        }}>
          Alertes seulement
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ color: 'var(--text-secondary)' }}>Chargement...</div>
      ) : filtered.length === 0 ? (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: '48px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <Package size={32} style={{ opacity: 0.3, marginBottom: 12 }} />
          <div>Aucun article trouvé</div>
        </div>
      ) : (
        <>
          {/* Vue mobile : cartes */}
          <div className="stocks-mobile" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filtered.map(s => {
              const alerte = s.quantite_actuelle <= s.seuil_minimum;
              return (
                <div key={s.id} style={{ background: 'var(--bg-card)', border: `1px solid ${alerte ? '#ef444433' : 'var(--border)'}`, borderRadius: 10, padding: '12px 14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                    <div style={{ flex: 1, paddingRight: 8 }}>
                      <div style={{ fontSize: 13, fontWeight: 700 }}>{s.nom}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>{s.reference}{s.categorie ? ` · ${s.categorie}` : ''}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                      <button onClick={() => openEdit(s)} style={{ background: '#2563eb18', border: 'none', borderRadius: 6, padding: '6px', cursor: 'pointer', color: '#2563eb' }}><Pencil size={13} /></button>
                      <button onClick={() => remove(s)} style={{ background: '#ef444418', border: 'none', borderRadius: 6, padding: '6px', cursor: 'pointer', color: '#ef4444' }}><Trash2 size={13} /></button>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      {alerte ? <AlertTriangle size={13} color="#ef4444" /> : <CheckCircle size={13} color="#22c55e" />}
                      <span style={{ fontSize: 14, fontWeight: 800, color: alerte ? '#ef4444' : '#22c55e' }}>{s.quantite_actuelle} <span style={{ fontSize: 11, fontWeight: 400 }}>{s.unite}</span></span>
                    </div>
                    <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>seuil : {s.seuil_minimum} {s.unite}</span>
                    {s.emplacement && <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>📍 {s.emplacement}</span>}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Vue desktop : tableau */}
          <div className="stocks-desktop" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Statut', 'Référence', 'Nom', 'Catégorie', 'Qté actuelle', 'Seuil mini', 'Emplacement', ''].map(h => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((s, i) => {
                  const alerte = s.quantite_actuelle <= s.seuil_minimum;
                  return (
                    <tr key={s.id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none', background: alerte ? '#ef444408' : 'transparent' }}>
                      <td style={{ padding: '12px 16px' }}>
                        {alerte ? <AlertTriangle size={16} color="#ef4444" /> : <CheckCircle size={16} color="#22c55e" />}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{s.reference}</td>
                      <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600 }}>{s.nom}</td>
                      <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text-secondary)' }}>{s.categorie || '—'}</td>
                      <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 800, color: alerte ? '#ef4444' : '#22c55e', whiteSpace: 'nowrap' }}>
                        {s.quantite_actuelle} <span style={{ fontSize: 11, fontWeight: 400 }}>{s.unite}</span>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{s.seuil_minimum} {s.unite}</td>
                      <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text-secondary)' }}>{s.emplacement || '—'}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button onClick={() => openEdit(s)} style={{ background: '#2563eb18', border: 'none', borderRadius: 6, padding: '6px', cursor: 'pointer', color: '#2563eb' }}><Pencil size={13} /></button>
                          <button onClick={() => remove(s)} style={{ background: '#ef444418', border: 'none', borderRadius: 6, padding: '6px', cursor: 'pointer', color: '#ef4444' }}><Trash2 size={13} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      </>}

      {/* Modal formulaire */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: 28, width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700 }}>{editing ? 'Modifier l\'article' : 'Nouvel article'}</h2>
              <button onClick={() => setShowForm(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={20} /></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { label: 'Référence *', key: 'reference', placeholder: 'ex: FILTER-001' },
                { label: 'Nom *', key: 'nom', placeholder: 'ex: Filtre huile hydraulique' },
                { label: 'Catégorie', key: 'categorie', placeholder: 'ex: Consommables' },
                { label: 'Emplacement', key: 'emplacement', placeholder: 'ex: Armoire A3' },
              ].map(({ label, key, placeholder }) => (
                <div key={key}>
                  <label style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: 6 }}>{label}</label>
                  <input
                    value={form[key as keyof typeof form]}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    placeholder={placeholder}
                    style={{ width: '100%', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px', color: 'var(--text-primary)', fontSize: 13, boxSizing: 'border-box' }}
                  />
                </div>
              ))}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: 6 }}>Qté actuelle</label>
                  <input type="number" value={form.quantite_actuelle} onChange={e => setForm(f => ({ ...f, quantite_actuelle: e.target.value }))}
                    style={{ width: '100%', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px', color: 'var(--text-primary)', fontSize: 13, boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: 6 }}>Seuil mini</label>
                  <input type="number" value={form.seuil_minimum} onChange={e => setForm(f => ({ ...f, seuil_minimum: e.target.value }))}
                    style={{ width: '100%', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px', color: 'var(--text-primary)', fontSize: 13, boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: 6 }}>Unité</label>
                  <input value={form.unite} onChange={e => setForm(f => ({ ...f, unite: e.target.value }))} placeholder="pcs"
                    style={{ width: '100%', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px', color: 'var(--text-primary)', fontSize: 13, boxSizing: 'border-box' }} />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: 6 }}>Description</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2}
                  style={{ width: '100%', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px', color: 'var(--text-primary)', fontSize: 13, resize: 'vertical', boxSizing: 'border-box' }} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 24, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowForm(false)} style={{ padding: '10px 18px', background: 'transparent', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 14 }}>Annuler</button>
              <button onClick={save} disabled={saving || !form.reference || !form.nom} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', background: '#2563eb', border: 'none', borderRadius: 8, color: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 600, opacity: saving || !form.reference || !form.nom ? 0.6 : 1 }}>
                <Save size={15} /> {saving ? 'Sauvegarde...' : 'Sauvegarder'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
