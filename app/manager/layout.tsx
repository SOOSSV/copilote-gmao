'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { LayoutDashboard, Ticket, Factory, Users, BarChart3, MessageCircle, PlusCircle, LogOut } from 'lucide-react';

const navManager = [
  { href: '/manager',             icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/manager/tickets',     icon: Ticket,          label: 'Tickets' },
  { href: '/manager/machines',    icon: Factory,         label: 'Machines' },
  { href: '/manager/techniciens', icon: Users,           label: 'Techniciens' },
  { href: '/manager/rapports',    icon: BarChart3,       label: 'Rapports IA' },
];

const navTerrain = [
  { href: '/manager/chat',    icon: MessageCircle, label: 'Chat IA' },
  { href: '/manager/nouveau', icon: PlusCircle,    label: 'Nouveau' },
];

const allNav = [...navManager, ...navTerrain];

export default function ManagerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const isLoginPage = pathname === '/manager/login';

  useEffect(() => {
    if (isLoginPage) return;
    if (typeof window !== 'undefined') {
      const auth = sessionStorage.getItem('manager_auth');
      if (auth !== 'true') {
        router.replace('/manager/login');
      }
    }
  }, [isLoginPage, router]);

  if (isLoginPage) return <>{children}</>;

  function isActive(href: string) {
    return pathname === href || (href !== '/manager' && pathname.startsWith(href));
  }

  function NavLink({ href, icon: Icon, label }: { href: string; icon: React.ElementType; label: string }) {
    const active = isActive(href);
    return (
      <Link href={href} style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 12px', borderRadius: 10,
        background: active ? 'rgba(99,102,241,0.15)' : 'transparent',
        color: active ? 'var(--accent)' : 'var(--text-secondary)',
        textDecoration: 'none', fontSize: 14, fontWeight: active ? 600 : 400,
        transition: 'all 0.15s',
      }}>
        <Icon size={18} />
        {label}
      </Link>
    );
  }

  function handleLogout() {
    sessionStorage.removeItem('manager_auth');
    router.replace('/manager/login');
  }

  return (
    <>
      <style>{`
        .mgr-sidebar {
          display: flex;
          width: 220px;
          background: var(--bg-secondary);
          border-right: 1px solid var(--border);
          flex-direction: column;
          padding: 24px 0;
          flex-shrink: 0;
          position: fixed;
          top: 0; bottom: 0; left: 0;
          overflow-y: auto;
          z-index: 100;
        }
        .mgr-main {
          margin-left: 220px;
          flex: 1;
          min-height: 100vh;
        }
        .mgr-bottom-nav {
          display: none;
        }
        @media (max-width: 768px) {
          .mgr-sidebar { display: none !important; }
          .mgr-main { margin-left: 0 !important; padding-bottom: 72px; }
          .mgr-bottom-nav {
            display: flex;
            position: fixed;
            bottom: 0; left: 0; right: 0;
            background: var(--bg-secondary);
            border-top: 1px solid var(--border);
            z-index: 200;
            padding: 6px 0 env(safe-area-inset-bottom, 6px);
          }
        }
      `}</style>

      <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)' }}>
        {/* Sidebar desktop */}
        <aside className="mgr-sidebar">
          {/* Logo */}
          <div style={{ padding: '0 20px 24px', borderBottom: '1px solid var(--border)' }}>
            <div style={{
              fontSize: 18, fontWeight: 800,
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>COPILOTE</div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>Espace Manager</div>
          </div>

          {/* Nav Manager */}
          <nav style={{ padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.8px', padding: '4px 12px 8px' }}>
              Supervision
            </div>
            {navManager.map(item => <NavLink key={item.href} {...item} />)}
          </nav>

          <div style={{ borderTop: '1px solid var(--border)', margin: '0 12px' }} />

          <nav style={{ padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.8px', padding: '4px 12px 8px' }}>
              Mode Terrain
            </div>
            {navTerrain.map(item => <NavLink key={item.href} {...item} />)}
          </nav>

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
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', padding: '8px 12px 0' }}>
              COPILOTE v1.0
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="mgr-main">
          {children}
        </main>

        {/* Bottom nav mobile */}
        <nav className="mgr-bottom-nav">
          {allNav.map(({ href, icon: Icon, label }) => {
            const active = isActive(href);
            return (
              <Link key={href} href={href} style={{
                flex: 1,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                gap: 3, padding: '6px 4px',
                color: active ? 'var(--accent)' : 'var(--text-secondary)',
                textDecoration: 'none', fontSize: 10, fontWeight: active ? 700 : 400,
                transition: 'color 0.15s',
              }}>
                <Icon size={20} />
                {label}
              </Link>
            );
          })}
          <button onClick={handleLogout} style={{
            flex: 1,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: 3, padding: '6px 4px',
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--danger)', fontSize: 10,
          }}>
            <LogOut size={20} />
            Sortir
          </button>
        </nav>
      </div>
    </>
  );
}
