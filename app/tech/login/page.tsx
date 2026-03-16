'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { HardHat, ArrowRight, ArrowLeft } from 'lucide-react';

export default function TechLoginPage() {
  const router = useRouter();
  const [prenom, setPrenom] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleAccess() {
    const name = prenom.trim();
    if (!name) return;
    setLoading(true);
    setError('');
    const { data } = await supabase
      .from('technicians')
      .select('id, prenom, nom, email, specialites')
      .ilike('prenom', name)
      .maybeSingle();
    if (!data) {
      setError('Prénom non reconnu. Contacte ton responsable.');
      setLoading(false);
      return;
    }
    localStorage.setItem('tech_id', data.id);
    localStorage.setItem('tech_prenom', data.prenom);
    localStorage.setItem('tech_nom', data.nom);
    localStorage.setItem('tech_email', data.email || '');
    router.push('/tech');
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 380, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 20, padding: '36px 32px' }}>
        <button onClick={() => router.push('/')} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer', padding: '0 0 20px', marginLeft: -4 }}>
          <ArrowLeft size={15} /> Accueil
        </button>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg, #22c55e, #16a34a)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
            <HardHat size={28} color="white" />
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, background: 'linear-gradient(135deg, #22c55e, #16a34a)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>COPILOTE</div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>Espace Technicien</div>
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 8 }}>Votre prénom</label>
          <input
            type="text" value={prenom} onChange={e => setPrenom(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAccess()}
            placeholder="Ex : Marc, Julie..." autoFocus autoComplete="off"
            style={{ width: '100%', boxSizing: 'border-box', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 16px', color: 'var(--text-primary)', fontSize: 15, outline: 'none', fontFamily: 'inherit' }}
          />
        </div>
        {error && <div style={{ color: '#ef4444', fontSize: 13, marginBottom: 12, padding: '8px 12px', background: '#ef444410', borderRadius: 8 }}>{error}</div>}
        <button onClick={handleAccess} disabled={!prenom.trim() || loading} style={{ width: '100%', padding: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: prenom.trim() ? 'linear-gradient(135deg, #22c55e, #16a34a)' : 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 12, color: 'white', fontSize: 15, fontWeight: 700, cursor: prenom.trim() ? 'pointer' : 'default' }}>
          {loading ? 'Connexion...' : 'Accéder'} <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
