'use client';

import BottomNav from '@/components/BottomNav';
import { User, Wrench, Bell, Info } from 'lucide-react';

const rowStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '14px 16px',
  background: 'var(--bg-card)',
  border: '1px solid var(--border)',
  borderRadius: 12,
  cursor: 'pointer',
};

export default function ProfilPage() {
  return (
    <div style={{ background: 'var(--bg-primary)', minHeight: '100vh', paddingBottom: 80 }}>
      {/* Header */}
      <div style={{
        background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border)',
        padding: '16px 20px',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <User size={20} color="var(--accent)" />
        <span style={{ fontWeight: 700, fontSize: 16 }}>Profil</span>
      </div>

      {/* Avatar */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 16px' }}>
        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 32, fontWeight: 700, color: 'white', marginBottom: 12,
        }}>
          T
        </div>
        <div style={{ fontWeight: 700, fontSize: 18 }}>Technicien</div>
        <div style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 4 }}>Terrain</div>
      </div>

      {/* Options */}
      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={rowStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Wrench size={18} color="var(--accent)" />
            <span style={{ fontSize: 14 }}>Ma spécialité</span>
          </div>
          <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Mécanique</span>
        </div>

        <div style={rowStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Bell size={18} color="var(--accent)" />
            <span style={{ fontSize: 14 }}>Notifications</span>
          </div>
          <span style={{ color: 'var(--success)', fontSize: 13 }}>Activées</span>
        </div>

        <div style={{ ...rowStyle, marginTop: 16, borderColor: 'var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Info size={18} color="var(--text-secondary)" />
            <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Version</span>
          </div>
          <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>COPILOTE v1.0</span>
        </div>
      </div>
    </div>
  );
}
