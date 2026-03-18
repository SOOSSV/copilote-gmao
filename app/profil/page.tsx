'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import BottomNav from '@/components/BottomNav';
import PushNotifSetup from '@/components/PushNotifSetup';
import { User, Info, LogOut, ArrowLeft } from 'lucide-react';

export default function ProfilPage() {
  const router = useRouter();
  const [prenom, setPrenom] = useState('');
  const [nom, setNom] = useState('');

  useEffect(() => {
    setPrenom(localStorage.getItem('tech_prenom') || 'Technicien');
    setNom(localStorage.getItem('tech_nom') || '');
  }, []);

  function handleLogout() {
    localStorage.removeItem('tech_id');
    localStorage.removeItem('tech_prenom');
    localStorage.removeItem('tech_nom');
    localStorage.removeItem('tech_email');
    router.push('/tech/login');
  }

  const initiale = prenom.charAt(0).toUpperCase();

  return (
    <div style={{ background: 'var(--bg-primary)', minHeight: '100vh', paddingBottom: 80 }}>
      {/* Header */}
      <div style={{
        background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border)',
        padding: '16px 20px',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: 4, display: 'flex', alignItems: 'center', marginRight: 4 }}>
          <ArrowLeft size={20} />
        </button>
        <User size={20} color="var(--accent)" />
        <span style={{ fontWeight: 700, fontSize: 16 }}>Profil</span>
      </div>

      {/* Avatar */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 16px 24px' }}>
        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          background: 'linear-gradient(135deg, #22c55e, #16a34a)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 32, fontWeight: 700, color: 'white', marginBottom: 12,
        }}>
          {initiale}
        </div>
        <div style={{ fontWeight: 700, fontSize: 18 }}>{prenom} {nom}</div>
        <div style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 4 }}>Technicien</div>
      </div>

      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* Push notifications */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Notifications</span>
          <PushNotifSetup role="tech" />
        </div>

        {/* Version */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Info size={18} color="var(--text-secondary)" />
            <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Version</span>
          </div>
          <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>COPILOTE v1.0</span>
        </div>

        {/* Déconnexion */}
        <button
          onClick={handleLogout}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            padding: '14px 16px', marginTop: 8,
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.25)',
            borderRadius: 12, color: 'var(--danger)',
            fontSize: 14, fontWeight: 600, cursor: 'pointer',
            width: '100%',
          }}
        >
          <LogOut size={18} />
          Se déconnecter
        </button>
      </div>

      <BottomNav />
    </div>
  );
}
