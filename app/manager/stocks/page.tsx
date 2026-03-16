'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Package, AlertTriangle, CheckCircle, Plus, Pencil, Trash2, X, Save } from 'lucide-react';

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
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Stock | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [filterAlerte, setFilterAlerte] = useState(false);

  async function load() {
    const { data } = await supabase.from('stocks').select('*').eq('actif', true).order('nom');
    setStocks((data as Stock[]) || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

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

  return (
    <div style={{ padding: 'clamp(16px, 4vw, 32px)', maxWidth: 1100, boxSizing: 'border-box' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Stocks & Pièces</h1>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{stocks.length} article{stocks.length > 1 ? 's' : ''} · {alertes} en alerte</div>
        </div>
        <button onClick={openAdd} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#6366f1', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 18px', cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>
          <Plus size={16} /> Ajouter
        </button>
      </div>

      {/* KPI */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: '18px 20px' }}>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Total articles</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#6366f1' }}>{stocks.length}</div>
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
                      <button onClick={() => openEdit(s)} style={{ background: '#6366f118', border: 'none', borderRadius: 6, padding: '6px', cursor: 'pointer', color: '#6366f1' }}><Pencil size={13} /></button>
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
                          <button onClick={() => openEdit(s)} style={{ background: '#6366f118', border: 'none', borderRadius: 6, padding: '6px', cursor: 'pointer', color: '#6366f1' }}><Pencil size={13} /></button>
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
              <button onClick={save} disabled={saving || !form.reference || !form.nom} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', background: '#6366f1', border: 'none', borderRadius: 8, color: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 600, opacity: saving || !form.reference || !form.nom ? 0.6 : 1 }}>
                <Save size={15} /> {saving ? 'Sauvegarde...' : 'Sauvegarder'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
