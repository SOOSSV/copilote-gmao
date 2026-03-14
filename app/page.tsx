'use client';

import { useRouter } from 'next/navigation';
import { Bot, HardHat, BarChart3, ArrowRight, LineChart } from 'lucide-react';

const roles = [
  {
    label: 'Technicien',
    desc: 'Saisie du prénom — chat IA, tickets, pannes',
    href: '/tech/login',
    icon: HardHat,
    color: '#22c55e',
    protected: false,
  },
  {
    label: 'Responsable',
    desc: 'Accès protégé — dashboard, gestion, rapports',
    href: '/manager/login',
    icon: BarChart3,
    color: '#6366f1',
    protected: true,
  },
  {
    label: 'Directeur',
    desc: 'Accès protégé — synthèse KPIs, rapports IA',
    href: '/directeur/login',
    icon: LineChart,
    color: '#0ea5e9',
    protected: true,
  },
];

export default function HomePage() {
  const router = useRouter();

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-primary)',
      padding: 24,
      gap: 40,
    }}>
      {/* Logo */}
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: 68, height: 68, borderRadius: '50%',
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 16px',
          boxShadow: '0 0 40px rgba(99,102,241,0.3)',
        }}>
          <Bot size={34} color="white" />
        </div>
        <div style={{
          fontSize: 32, fontWeight: 900,
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          letterSpacing: '-0.5px',
        }}>
          COPILOTE
        </div>
        <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 6 }}>
          Qui êtes-vous ?
        </div>
      </div>

      {/* Cartes rôles */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, width: '100%', maxWidth: 420 }}>
        {roles.map(({ label, desc, href, icon: Icon, color, protected: isProtected }) => (
          <button
            key={href}
            onClick={() => router.push(href)}
            style={{
              display: 'flex', alignItems: 'center', gap: 18,
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 16, padding: '20px 22px',
              cursor: 'pointer', textAlign: 'left',
              transition: 'all 0.15s', width: '100%',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.border = `1px solid ${color}66`;
              (e.currentTarget as HTMLElement).style.background = `${color}0d`;
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.border = '1px solid var(--border)';
              (e.currentTarget as HTMLElement).style.background = 'var(--bg-card)';
            }}
          >
            <div style={{
              width: 48, height: 48, borderRadius: 13, flexShrink: 0,
              background: `${color}18`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon size={24} color={color} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-primary)' }}>{label}</span>
                {isProtected && (
                  <span style={{ fontSize: 10, fontWeight: 600, color, background: `${color}18`, borderRadius: 4, padding: '1px 6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Protégé
                  </span>
                )}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.4 }}>{desc}</div>
            </div>
            <ArrowRight size={18} color="var(--text-secondary)" />
          </button>
        ))}
      </div>

      <div style={{ fontSize: 12, color: 'var(--text-secondary)', opacity: 0.4 }}>
        COPILOTE v1.0
      </div>
    </div>
  );
}
