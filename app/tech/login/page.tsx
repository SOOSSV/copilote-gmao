'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { HardHat, ArrowRight, ArrowLeft, Eye, EyeOff } from 'lucide-react';

type Technician = { id: string; prenom: string; nom: string; email: string; pin: string | null; pin_changed: boolean };

export default function TechLoginPage() {
  const router = useRouter();
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [step, setStep] = useState<'select' | 'pin' | 'create_pin'>('select');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.from('technicians').select('id, prenom, nom, email, pin, pin_changed').order('nom')
      .then(({ data }) => setTechnicians((data as Technician[]) || []));
  }, []);

  const selected = technicians.find(t => t.id === selectedId);

  function handleSelect() {
    if (!selected) return;
    setError('');
    setPin('');
    setConfirmPin('');
    if (!selected.pin) {
      setStep('create_pin');
    } else {
      setStep('pin');
    }
  }

  async function handleLogin() {
    if (pin.length !== 4) return;
    setLoading(true);
    setError('');
    if (pin !== selected!.pin) {
      setError('PIN incorrect.');
      setLoading(false);
      return;
    }
    // PIN temporaire → forcer le changement
    if (!selected!.pin_changed) {
      setStep('create_pin');
      setPin('');
      setConfirmPin('');
      setLoading(false);
      return;
    }
    localStorage.setItem('tech_id', selected!.id);
    localStorage.setItem('tech_prenom', selected!.prenom);
    localStorage.setItem('tech_nom', selected!.nom);
    localStorage.setItem('tech_email', selected!.email || '');
    router.push('/tech');
  }

  async function handleCreatePin() {
    if (pin.length !== 4) { setError('Le PIN doit faire 4 chiffres.'); return; }
    if (pin !== confirmPin) { setError('Les PIN ne correspondent pas.'); return; }
    setLoading(true);
    setError('');
    const { error: err } = await supabase.from('technicians').update({ pin, pin_changed: true }).eq('id', selected!.id);
    if (err) { setError('Erreur lors de la création du PIN.'); setLoading(false); return; }
    localStorage.setItem('tech_id', selected!.id);
    localStorage.setItem('tech_prenom', selected!.prenom);
    localStorage.setItem('tech_nom', selected!.nom);
    localStorage.setItem('tech_email', selected!.email || '');
    router.push('/tech');
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 380, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 20, padding: '36px 32px' }}>
        <button onClick={() => step !== 'select' ? (setStep('select'), setError('')) : router.push('/')}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer', padding: '0 0 20px', marginLeft: -4 }}>
          <ArrowLeft size={15} /> {step !== 'select' ? 'Retour' : 'Accueil'}
        </button>

        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg, #22c55e, #16a34a)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
            <HardHat size={28} color="white" />
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, background: 'linear-gradient(135deg, #22c55e, #16a34a)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>COPILOTE</div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>Espace Technicien</div>
        </div>

        {step === 'select' && (
          <>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 8 }}>Qui êtes-vous ?</label>
            <select value={selectedId} onChange={e => setSelectedId(e.target.value)} autoFocus
              style={{ width: '100%', boxSizing: 'border-box', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 16px', color: selectedId ? 'var(--text-primary)' : 'var(--text-secondary)', fontSize: 15, outline: 'none', fontFamily: 'inherit', marginBottom: 16, cursor: 'pointer' }}>
              <option value="">— Sélectionner votre nom —</option>
              {technicians.map(t => (
                <option key={t.id} value={t.id}>{t.prenom} {t.nom}</option>
              ))}
            </select>
            <button onClick={handleSelect} disabled={!selectedId}
              style={{ width: '100%', padding: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: selectedId ? 'linear-gradient(135deg, #22c55e, #16a34a)' : 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 12, color: selectedId ? 'white' : 'var(--text-secondary)', fontSize: 15, fontWeight: 700, cursor: selectedId ? 'pointer' : 'default' }}>
              Continuer <ArrowRight size={16} />
            </button>
          </>
        )}

        {step === 'pin' && (
          <>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
              Bonjour, {selected?.prenom} 👋
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>Entrez votre PIN à 4 chiffres</div>
            <div style={{ position: 'relative', marginBottom: 16 }}>
              <input type={showPin ? 'text' : 'password'} value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                onKeyDown={e => e.key === 'Enter' && pin.length === 4 && handleLogin()}
                placeholder="••••" maxLength={4} autoFocus inputMode="numeric"
                style={{ width: '100%', boxSizing: 'border-box', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 44px 12px 16px', color: 'var(--text-primary)', fontSize: 22, letterSpacing: 8, outline: 'none', fontFamily: 'inherit' }} />
              <button onClick={() => setShowPin(!showPin)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: 4 }}>
                {showPin ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {error && <div style={{ color: '#ef4444', fontSize: 13, marginBottom: 12, padding: '8px 12px', background: '#ef444410', borderRadius: 8 }}>{error}</div>}
            <button onClick={handleLogin} disabled={pin.length !== 4 || loading}
              style={{ width: '100%', padding: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: pin.length === 4 ? 'linear-gradient(135deg, #22c55e, #16a34a)' : 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 12, color: pin.length === 4 ? 'white' : 'var(--text-secondary)', fontSize: 15, fontWeight: 700, cursor: pin.length === 4 ? 'pointer' : 'default' }}>
              {loading ? 'Connexion...' : 'Accéder'} <ArrowRight size={16} />
            </button>
          </>
        )}

        {step === 'create_pin' && (
          <>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
              Bienvenue, {selected?.prenom} !
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>Première connexion — choisissez votre PIN à 4 chiffres</div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 8 }}>Votre PIN</label>
            <div style={{ position: 'relative', marginBottom: 12 }}>
              <input type={showPin ? 'text' : 'password'} value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="••••" maxLength={4} autoFocus inputMode="numeric"
                style={{ width: '100%', boxSizing: 'border-box', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 44px 12px 16px', color: 'var(--text-primary)', fontSize: 22, letterSpacing: 8, outline: 'none', fontFamily: 'inherit' }} />
              <button onClick={() => setShowPin(!showPin)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: 4 }}>
                {showPin ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 8 }}>Confirmer le PIN</label>
            <input type={showPin ? 'text' : 'password'} value={confirmPin} onChange={e => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
              onKeyDown={e => e.key === 'Enter' && handleCreatePin()}
              placeholder="••••" maxLength={4} inputMode="numeric"
              style={{ width: '100%', boxSizing: 'border-box', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 16px', color: 'var(--text-primary)', fontSize: 22, letterSpacing: 8, outline: 'none', fontFamily: 'inherit', marginBottom: 16 }} />
            {error && <div style={{ color: '#ef4444', fontSize: 13, marginBottom: 12, padding: '8px 12px', background: '#ef444410', borderRadius: 8 }}>{error}</div>}
            <button onClick={handleCreatePin} disabled={pin.length !== 4 || confirmPin.length !== 4 || loading}
              style={{ width: '100%', padding: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: pin.length === 4 && confirmPin.length === 4 ? 'linear-gradient(135deg, #22c55e, #16a34a)' : 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 12, color: pin.length === 4 && confirmPin.length === 4 ? 'white' : 'var(--text-secondary)', fontSize: 15, fontWeight: 700, cursor: pin.length === 4 && confirmPin.length === 4 ? 'pointer' : 'default' }}>
              {loading ? 'Création...' : 'Créer mon PIN'} <ArrowRight size={16} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
