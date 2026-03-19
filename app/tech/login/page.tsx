'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { HardHat, ArrowRight, ArrowLeft, Eye, EyeOff } from 'lucide-react';

type Technician = { id: string; prenom: string; nom: string; email: string; pin_changed: boolean };

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
    supabase.from('technicians').select('id, prenom, nom, email, pin_changed').order('nom')
      .then(({ data }) => setTechnicians((data as Technician[]) || []));
  }, []);

  const selected = technicians.find(t => t.id === selectedId);

  async function handleSelect() {
    if (!selected) return;
    setError('');
    setPin('');
    setConfirmPin('');

    const res = await fetch('/api/pin/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ techId: selected.id }),
    });
    const data = await res.json();

    setStep(data.hasPin ? 'pin' : 'create_pin');
  }

  async function handleLogin() {
    if (pin.length !== 4) return;
    setLoading(true);
    setError('');

    const res = await fetch('/api/pin/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ techId: selected!.id, pin }),
    });
    const data = await res.json();

    if (!data.ok) {
      setError('PIN incorrect.');
      setLoading(false);
      return;
    }

    // PIN pas encore personnalisé → forcer le changement
    if (!data.pinChanged) {
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

    const res = await fetch('/api/pin/set', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ techId: selected!.id, pin }),
    });
    const data = await res.json();

    if (!data.ok) { setError('Erreur lors de la création du PIN.'); setLoading(false); return; }
    localStorage.setItem('tech_id', selected!.id);
    localStorage.setItem('tech_prenom', selected!.prenom);
    localStorage.setItem('tech_nom', selected!.nom);
    localStorage.setItem('tech_email', selected!.email || '');
    router.push('/tech');
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0d1117] p-5">
      <div className="w-full max-w-[380px] bg-[#1c2128] border border-[#30363d] rounded-[20px] px-8 py-9">
        <button
          onClick={() => step !== 'select' ? (setStep('select'), setError('')) : router.push('/')}
          className="flex items-center gap-1.5 bg-transparent border-none text-[#7d8590] text-[13px] cursor-pointer pb-5 -ml-1"
        >
          <ArrowLeft size={15} /> {step !== 'select' ? 'Retour' : 'Accueil'}
        </button>

        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center mx-auto mb-3.5">
            <HardHat size={28} color="white" />
          </div>
          <div className="text-[22px] font-extrabold bg-gradient-to-br from-green-500 to-green-700 bg-clip-text text-transparent">RR GMAO</div>
          <div className="text-[13px] text-[#7d8590] mt-1">Espace Technicien</div>
        </div>

        {step === 'select' && (
          <>
            <label className="block text-[12px] font-semibold text-[#7d8590] uppercase tracking-[0.5px] mb-2">
              Qui êtes-vous ?
            </label>
            <select
              value={selectedId}
              onChange={e => setSelectedId(e.target.value)}
              autoFocus
              className="w-full bg-[#161b22] border border-[#30363d] rounded-[10px] px-4 py-3 text-[15px] outline-none font-[inherit] mb-4 cursor-pointer text-[#e6edf3]"
            >
              <option value="">— Sélectionner votre nom —</option>
              {technicians.map(t => (
                <option key={t.id} value={t.id}>{t.prenom} {t.nom}</option>
              ))}
            </select>
            <button
              onClick={handleSelect}
              disabled={!selectedId}
              className={`w-full py-3 flex items-center justify-center gap-2 border border-[#30363d] rounded-xl text-[15px] font-bold cursor-pointer transition-all ${selectedId ? 'bg-gradient-to-br from-green-500 to-green-700 text-white' : 'bg-[#161b22] text-[#7d8590]'}`}
            >
              Continuer <ArrowRight size={16} />
            </button>
          </>
        )}

        {step === 'pin' && (
          <>
            <div className="text-[15px] font-bold text-[#e6edf3] mb-1">
              Bonjour, {selected?.prenom} 👋
            </div>
            <div className="text-[13px] text-[#7d8590] mb-5">Entrez votre PIN à 4 chiffres</div>
            <div className="relative mb-4">
              <input
                type={showPin ? 'text' : 'password'}
                value={pin}
                onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                onKeyDown={e => e.key === 'Enter' && pin.length === 4 && handleLogin()}
                placeholder="••••"
                maxLength={4}
                autoFocus
                inputMode="numeric"
                className="w-full bg-[#161b22] border border-[#30363d] rounded-[10px] pl-4 pr-11 py-3 text-[#e6edf3] text-[22px] tracking-[8px] outline-none font-[inherit] box-border"
              />
              <button
                onClick={() => setShowPin(!showPin)}
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-none text-[#7d8590] cursor-pointer p-1"
              >
                {showPin ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {error && (
              <div className="text-red-500 text-[13px] mb-3 px-3 py-2 bg-red-500/10 rounded-lg">{error}</div>
            )}
            <button
              onClick={handleLogin}
              disabled={pin.length !== 4 || loading}
              className={`w-full py-3 flex items-center justify-center gap-2 border border-[#30363d] rounded-xl text-[15px] font-bold cursor-pointer transition-all ${pin.length === 4 ? 'bg-gradient-to-br from-green-500 to-green-700 text-white' : 'bg-[#161b22] text-[#7d8590]'}`}
            >
              {loading ? 'Connexion...' : 'Accéder'} <ArrowRight size={16} />
            </button>
          </>
        )}

        {step === 'create_pin' && (
          <>
            <div className="text-[15px] font-bold text-[#e6edf3] mb-1">
              Bienvenue, {selected?.prenom} !
            </div>
            <div className="text-[13px] text-[#7d8590] mb-5">Première connexion — choisissez votre PIN à 4 chiffres</div>
            <label className="block text-[12px] font-semibold text-[#7d8590] uppercase tracking-[0.5px] mb-2">
              Votre PIN
            </label>
            <div className="relative mb-3">
              <input
                type={showPin ? 'text' : 'password'}
                value={pin}
                onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="••••"
                maxLength={4}
                autoFocus
                inputMode="numeric"
                className="w-full bg-[#161b22] border border-[#30363d] rounded-[10px] pl-4 pr-11 py-3 text-[#e6edf3] text-[22px] tracking-[8px] outline-none font-[inherit] box-border"
              />
              <button
                onClick={() => setShowPin(!showPin)}
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-none text-[#7d8590] cursor-pointer p-1"
              >
                {showPin ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <label className="block text-[12px] font-semibold text-[#7d8590] uppercase tracking-[0.5px] mb-2">
              Confirmer le PIN
            </label>
            <input
              type={showPin ? 'text' : 'password'}
              value={confirmPin}
              onChange={e => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
              onKeyDown={e => e.key === 'Enter' && handleCreatePin()}
              placeholder="••••"
              maxLength={4}
              inputMode="numeric"
              className="w-full bg-[#161b22] border border-[#30363d] rounded-[10px] px-4 py-3 text-[#e6edf3] text-[22px] tracking-[8px] outline-none font-[inherit] mb-4 box-border"
            />
            {error && (
              <div className="text-red-500 text-[13px] mb-3 px-3 py-2 bg-red-500/10 rounded-lg">{error}</div>
            )}
            <button
              onClick={handleCreatePin}
              disabled={pin.length !== 4 || confirmPin.length !== 4 || loading}
              className={`w-full py-3 flex items-center justify-center gap-2 border border-[#30363d] rounded-xl text-[15px] font-bold cursor-pointer transition-all ${pin.length === 4 && confirmPin.length === 4 ? 'bg-gradient-to-br from-green-500 to-green-700 text-white' : 'bg-[#161b22] text-[#7d8590]'}`}
            >
              {loading ? 'Création...' : 'Créer mon PIN'} <ArrowRight size={16} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
