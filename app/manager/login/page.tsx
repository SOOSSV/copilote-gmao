'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Eye, EyeOff, Bot, ArrowLeft } from 'lucide-react';

const MANAGER_PASSWORD = process.env.NEXT_PUBLIC_MANAGER_PASSWORD || 'copilote2024';

export default function ManagerLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  function handleLogin() {
    setLoading(true);
    setTimeout(() => {
      if (password === MANAGER_PASSWORD) {
        localStorage.setItem('manager_auth', 'true');
        router.push('/manager');
      } else {
        setError(true);
        setLoading(false);
        setPassword('');
      }
    }, 600);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0d1117] p-5">
      <div className="w-full max-w-[380px] bg-[#1c2128] border border-[#30363d] rounded-[20px] px-8 py-9">
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-1.5 bg-transparent border-none text-[#7d8590] text-[13px] cursor-pointer pb-5 -ml-1"
        >
          <ArrowLeft size={15} /> Accueil
        </button>

        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center mx-auto mb-3.5">
            <Bot size={28} color="white" />
          </div>
          <div className="text-[22px] font-extrabold text-[#e6edf3]">RR GMAO</div>
          <div className="text-[13px] text-[#7d8590] mt-1">Espace Responsable</div>
        </div>

        <div className="mb-4">
          <label className="block text-[12px] font-semibold text-[#7d8590] uppercase tracking-[0.5px] mb-2">
            Mot de passe
          </label>
          <div className="relative">
            <Lock size={15} className="absolute left-[13px] top-1/2 -translate-y-1/2 text-[#7d8590]" />
            <input
              type={showPwd ? 'text' : 'password'}
              value={password}
              onChange={e => { setPassword(e.target.value); setError(false); }}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              placeholder="••••••••"
              autoFocus
              className={`w-full bg-[#161b22] border rounded-[10px] pl-[38px] pr-[42px] py-3 text-[#e6edf3] text-[15px] outline-none font-[inherit] box-border ${error ? 'border-red-500' : 'border-[#30363d]'}`}
            />
            <button
              onClick={() => setShowPwd(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer text-[#7d8590] p-0"
            >
              {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {error && <div className="text-[12px] text-red-500 mt-1.5">Mot de passe incorrect</div>}
        </div>

        <button
          onClick={handleLogin}
          disabled={!password || loading}
          className={`w-full py-3 border border-[#30363d] rounded-xl text-white text-[15px] font-bold transition-all ${password ? 'bg-gradient-to-br from-blue-600 to-violet-600 cursor-pointer' : 'bg-[#161b22] cursor-default'}`}
        >
          {loading ? 'Connexion...' : 'Se connecter'}
        </button>
      </div>
    </div>
  );
}
