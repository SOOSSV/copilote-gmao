'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Package, AlertTriangle, CheckCircle } from 'lucide-react';

type Stock = {
  id: string; reference: string; nom: string; categorie: string | null;
  unite: string; quantite_actuelle: number; seuil_minimum: number; emplacement: string | null;
};

export default function DirecteurStocksPage() {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterAlerte, setFilterAlerte] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    supabase.from('stocks').select('id, reference, nom, categorie, unite, quantite_actuelle, seuil_minimum, emplacement')
      .eq('actif', true).order('nom')
      .then(({ data }) => { setStocks((data as Stock[]) || []); setLoading(false); });
  }, []);

  const alertes = stocks.filter(s => s.quantite_actuelle <= s.seuil_minimum).length;
  const filtered = stocks.filter(s => {
    const matchSearch = s.nom.toLowerCase().includes(search.toLowerCase()) || s.reference.toLowerCase().includes(search.toLowerCase());
    const matchAlerte = !filterAlerte || s.quantite_actuelle <= s.seuil_minimum;
    return matchSearch && matchAlerte;
  });

  return (
    <div style={{ padding: 'clamp(14px, 3vw, 24px)', maxWidth: 1100, boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <Package size={20} color="#0ea5e9" />
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>Stocks & Pièces</h1>
      </div>
      <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>{stocks.length} articles · {alertes} en alerte</div>

      {/* KPI */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: '16px 20px' }}>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Total articles</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#6366f1' }}>{stocks.length}</div>
        </div>
        <div style={{ background: 'var(--bg-card)', border: `1px solid ${alertes > 0 ? '#ef444433' : 'var(--border)'}`, borderRadius: 14, padding: '16px 20px' }}>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>En alerte</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: alertes > 0 ? '#ef4444' : '#22c55e' }}>{alertes}</div>
        </div>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: '16px 20px' }}>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>OK</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#22c55e' }}>{stocks.length - alertes}</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher par nom ou référence..."
          style={{ flex: 1, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 14px', color: 'var(--text-primary)', fontSize: 13, outline: 'none' }} />
        <button onClick={() => setFilterAlerte(f => !f)} style={{
          padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
          background: filterAlerte ? '#ef444422' : 'var(--bg-card)', border: `1px solid ${filterAlerte ? '#ef444466' : 'var(--border)'}`,
          color: filterAlerte ? '#ef4444' : 'var(--text-secondary)',
        }}>Alertes seulement</button>
      </div>

      {loading ? <div style={{ color: 'var(--text-secondary)' }}>Chargement...</div> : (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 580 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Statut', 'Référence', 'Nom', 'Catégorie', 'Qté actuelle', 'Seuil mini', 'Emplacement'].map(h => (
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
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>Aucun article trouvé</div>}
        </div>
      )}
    </div>
  );
}
