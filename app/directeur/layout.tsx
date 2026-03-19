'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { LayoutDashboard, BarChart3, LogOut, Ticket, Factory, Users, Package } from 'lucide-react';
import { RRLogoBadge } from '@/components/RRLogo';
import { supabase } from '@/lib/supabase';

const nav = [
  { href: '/directeur',               icon: LayoutDashboard, label: 'Vue synthèse' },
  { href: '/directeur/tickets',       icon: Ticket,          label: 'Tickets' },
  { href: '/directeur/machines',      icon: Factory,         label: 'Machines' },
  { href: '/directeur/techniciens',   icon: Users,           label: 'Techniciens' },
  { href: '/directeur/stocks',        icon: Package,         label: 'Stocks' },
  { href: '/directeur/rapports',      icon: BarChart3,       label: 'Rapports IA' },
];

export default function DirecteurLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isLoginPage = pathname === '/directeur/login';

  useEffect(() => {
    if (isLoginPage) return;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session || session.user.user_metadata?.role !== 'directeur') {
        router.replace('/directeur/login');
      }
    });
  }, [isLoginPage, router]);

  if (isLoginPage) return <>{children}</>;

  function isActive(href: string) {
    return pathname === href || (href !== '/directeur' && pathname.startsWith(href));
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace('/directeur/login');
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)' }}>

      {/* Sidebar desktop */}
      <aside className="dir-sidebar">
        <div style={{ padding: '0 20px 24px', borderBottom: '1px solid var(--border)' }}>
          <RRLogoBadge size={34} />
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 6 }}>Espace Directeur</div>
        </div>
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
              }}>
                <Icon size={18} />{label}
              </Link>
            );
          })}
        </nav>
        <div style={{ padding: '16px 12px', borderTop: '1px solid var(--border)' }}>
          <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 12px', borderRadius: 10, background: 'transparent', border: 'none', color: 'var(--text-secondary)', fontSize: 14, cursor: 'pointer' }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.1)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--danger)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)'; }}
          >
            <LogOut size={18} /> Déconnexion
          </button>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', padding: '8px 12px 0' }}>RR GMAO v1.0</div>
        </div>
      </aside>

      <main className="dir-main" style={{ paddingBottom: 0 }}>{children}</main>

      {/* Bottom nav mobile uniquement */}
      <nav className="dir-bottom-nav">
        {nav.map(({ href, icon: Icon, label }) => {
          const active = isActive(href);
          return (
            <Link key={href} href={href} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '8px 0 10px', textDecoration: 'none', color: active ? '#0ea5e9' : 'var(--text-secondary)', minWidth: 0 }}>
              <Icon size={18} />
              <span style={{ fontSize: 9, fontWeight: active ? 700 : 400, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%', textAlign: 'center' }}>{label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
