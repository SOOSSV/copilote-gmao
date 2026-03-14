'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { LayoutDashboard, BarChart3, LogOut } from 'lucide-react';

const nav = [
  { href: '/directeur',          icon: LayoutDashboard, label: 'Vue synthèse' },
  { href: '/directeur/rapports', icon: BarChart3,        label: 'Rapports IA' },
];

export default function DirecteurLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const isLoginPage = pathname === '/directeur/login';

  useEffect(() => {
    if (isLoginPage) return;
    if (typeof window !== 'undefined') {
      const auth = sessionStorage.getItem('directeur_auth');
      if (auth !== 'true') router.replace('/directeur/login');
    }
  }, [isLoginPage, router]);

  if (isLoginPage) return <>{children}</>;

  function isActive(href: string) {
    return pathname === href || (href !== '/directeur' && pathname.startsWith(href));
  }

  function handleLogout() {
    sessionStorage.removeItem('directeur_auth');
    router.replace('/directeur/login');
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <aside style={{
        width: 220,
        background: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column',
        padding: '24px 0', flexShrink: 0,
        position: 'fixed', top: 0, bottom: 0, left: 0,
      }}>
        {/* Logo */}
        <div style={{ padding: '0 20px 24px', borderBottom: '1px solid var(--border)' }}>
          <div style={{
            fontSize: 18, fontWeight: 800,
            background: 'linear-gradient(135deg, #0ea5e9, #6366f1)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>COPILOTE</div>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>Espace Directeur</div>
        </div>

        {/* Nav */}
        <nav style={{ padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
          {nav.map(({ href, icon: Icon, label }) => {
            const active = isActive(href);
            return (
              <Link key={href} href={href} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px', borderRadius: 10,
                background: active ? 'rgba(14,165,233,0.15)' : 'transparent',
                color: active ? '#0ea5e9' : 'var(--text-secondary)',
                textDecoration: 'none', fontSize: 14, fontWeight: active ? 600 : 400,
                transition: 'all 0.15s',
              }}>
                <Icon size={18} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Déconnexion */}
        <div style={{ padding: '16px 12px', borderTop: '1px solid var(--border)' }}>
          <button
            onClick={handleLogout}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              width: '100%', padding: '10px 12px', borderRadius: 10,
              background: 'transparent', border: 'none',
              color: 'var(--text-secondary)', fontSize: 14, cursor: 'pointer',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.1)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--danger)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)'; }}
          >
            <LogOut size={18} />
            Déconnexion
          </button>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', padding: '8px 12px 0' }}>COPILOTE v1.0</div>
        </div>
      </aside>

      <main style={{ marginLeft: 220, flex: 1, minHeight: '100vh' }}>
        {children}
      </main>
    </div>
  );
}
