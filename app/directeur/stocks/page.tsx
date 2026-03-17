'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Package, AlertTriangle, CheckCircle, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

type Stock = {
  id: string; reference: string; nom: string; categorie: string | null;
  unite: string; quantite_actuelle: number; seuil_minimum: number; emplacement: string | null;
};

export default function DirecteurStocksPage() {
  const router = useRouter();
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
    <div style={{ padding: 'clamp(16px, 4vw, 32px)', maxWidth: 1100, boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: 4, display: 'flex', alignItems: 'center' }}><ArrowLeft size={20} /></button>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Stocks & Pièces</h1>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{stocks.length} article{stocks.length > 1 ? 's' : ''} · {alertes} en alerte</div>
        </div>
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

      {/* Filtres */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 18 }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher par nom ou référence..."
          style={{ flex: 1, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 14px', color: 'var(--text-primary)', fontSize: 13 }} />
        <button onClick={() => setFilterAlerte(f => !f)} style={{
          padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
          background: filterAlerte ? '#ef444422' : 'var(--bg-card)',
          border: `1px solid ${filterAlerte ? '#ef444466' : 'var(--border)'}`,
          color: filterAlerte ? '#ef4444' : 'var(--text-secondary)',
        }}>Alertes seulement</button>
      </div>

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
                  <div style={{ marginBottom: 6 }}>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>{s.nom}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>{s.reference}{s.categorie ? ` · ${s.categorie}` : ''}</div>
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
          </div>
        </>
      )}
    </div>
  );
}
