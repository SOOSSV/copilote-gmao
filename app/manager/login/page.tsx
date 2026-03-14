'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Eye, EyeOff, Bot } from 'lucide-react';

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
        sessionStorage.setItem('manager_auth', 'true');
        router.push('/manager');
      } else {
        setError(true);
        setLoading(false);
        setPassword('');
      }
    }, 600);
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-primary)', padding: 20,
    }}>
      <div style={{
        width: '100%', maxWidth: 380,
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 20, padding: '36px 32px',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 14px',
          }}>
            <Bot size={28} color="white" />
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            COPILOTE
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>Espace Responsable</div>
        </div>

        {/* Champ */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 8 }}>
            Mot de passe
          </label>
          <div style={{ position: 'relative' }}>
            <Lock size={15} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input
              type={showPwd ? 'text' : 'password'}
              value={password}
              onChange={e => { setPassword(e.target.value); setError(false); }}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              placeholder="••••••••"
              autoFocus
              style={{
                width: '100%', boxSizing: 'border-box',
                background: 'var(--bg-secondary)',
                border: `1px solid ${error ? 'var(--danger)' : 'var(--border)'}`,
                borderRadius: 10, padding: '12px 42px 12px 38px',
                color: 'var(--text-primary)', fontSize: 15, outline: 'none', fontFamily: 'inherit',
              }}
            />
            <button onClick={() => setShowPwd(v => !v)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: 0 }}>
              {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {error && <div style={{ fontSize: 12, color: 'var(--danger)', marginTop: 6 }}>Mot de passe incorrect</div>}
        </div>

        {/* Bouton */}
        <button
          onClick={handleLogin}
          disabled={!password || loading}
          style={{
            width: '100%', padding: '13px',
            background: password ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            borderRadius: 12, color: 'white', fontSize: 15, fontWeight: 700,
            cursor: password ? 'pointer' : 'default', transition: 'all 0.15s',
          }}
        >
          {loading ? 'Connexion...' : 'Se connecter'}
        </button>
      </div>
    </div>
  );
}
