'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { LayoutDashboard, Ticket, Factory, Users, BarChart3, MessageCircle, PlusCircle, LogOut, Package, CalendarClock, Repeat2, Sparkles, HardHat } from 'lucide-react';
import { RRLogoBadge } from '@/components/RRLogo';
import PushNotifSetup from '@/components/PushNotifSetup';
import { supabase } from '@/lib/supabase';

const navManager = [
  { href: '/manager',                icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/manager/tickets',        icon: Ticket,          label: 'Tickets' },
  { href: '/manager/machines',       icon: Factory,         label: 'Machines' },
  { href: '/manager/technicians',    icon: Users,           label: 'Techniciens' },
  { href: '/manager/stocks',         icon: Package,         label: 'Stocks' },
  { href: '/manager/preventif',      icon: CalendarClock,   label: 'Préventif' },
  { href: '/manager/recurrentes',    icon: Repeat2,         label: 'Récurrentes' },
  { href: '/manager/amelioratif',    icon: Sparkles,        label: 'Amélioratif' },
  { href: '/manager/rapports',       icon: BarChart3,       label: 'Rapports IA' },
];

const navTerrain = [
  { href: '/manager/technicians', icon: HardHat,       label: 'Gérer techniciens' },
  { href: '/manager/chat',        icon: MessageCircle, label: 'Chat IA' },
  { href: '/manager/nouveau',     icon: PlusCircle,    label: 'Nouveau' },
];


export default function ManagerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isLoginPage = pathname === '/manager/login';
  const [stockAlertes, setStockAlertes] = useState(0);

  useEffect(() => {
    if (isLoginPage) return;
    if (typeof window !== 'undefined') {
      const auth = localStorage.getItem('manager_auth');
      if (auth !== 'true') router.replace('/manager/login');
    }
  }, [isLoginPage, router]);

  useEffect(() => {
    if (isLoginPage) return;
    supabase.from('stocks').select('quantite_actuelle, seuil_minimum').eq('actif', true)
      .then(({ data }) => {
        setStockAlertes((data || []).filter(s => s.quantite_actuelle <= s.seuil_minimum).length);
      });
  }, [isLoginPage]);

  if (isLoginPage) return <>{children}</>;

  function isActive(href: string) {
    return pathname === href || (href !== '/manager' && pathname.startsWith(href));
  }

  function handleLogout() {
    localStorage.removeItem('manager_auth');
    router.replace('/manager/login');
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {/* Sidebar — visible desktop ≥1025px, masquée mobile/tablette via CSS */}
      <aside className="mgr-sidebar">
        <div style={{ padding: '0 20px 24px', borderBottom: '1px solid var(--border)' }}>
          <RRLogoBadge size={34} />
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 6 }}>Espace Manager</div>
        </div>

        <nav style={{ padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.8px', padding: '4px 12px 8px' }}>Supervision</div>
          {navManager.map(({ href, icon: Icon, label }) => {
            const active = isActive(href);
            const badge = href === '/manager/stocks' && stockAlertes > 0 ? stockAlertes : 0;
            return (
              <Link key={href} href={href} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px', borderRadius: 10,
                background: active ? 'rgba(37,99,235,0.15)' : 'transparent',
                color: active ? 'var(--accent)' : 'var(--text-secondary)',
                textDecoration: 'none', fontSize: 14, fontWeight: active ? 600 : 400,
              }}>
                <Icon size={18} />{label}
                {badge > 0 && <span style={{ marginLeft: 'auto', background: '#ef4444', color: '#fff', borderRadius: 10, padding: '1px 6px', fontSize: 10, fontWeight: 700 }}>{badge}</span>}
              </Link>
            );
          })}
        </nav>

        <div style={{ borderTop: '1px solid var(--border)', margin: '0 12px' }} />

        <nav style={{ padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.8px', padding: '4px 12px 8px' }}>Mode Terrain</div>
          {navTerrain.map(({ href, icon: Icon, label }) => {
            const active = isActive(href);
            return (
              <Link key={href} href={href} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px', borderRadius: 10,
                background: active ? 'rgba(37,99,235,0.15)' : 'transparent',
                color: active ? 'var(--accent)' : 'var(--text-secondary)',
                textDecoration: 'none', fontSize: 14, fontWeight: active ? 600 : 400,
              }}><Icon size={18} />{label}</Link>
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
            <div style={{ padding: '8px 4px 0' }}><PushNotifSetup role="manager" /></div>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', padding: '8px 12px 0' }}>RR GMAO v1.0</div>
        </div>
      </aside>

      {/* Main */}
      <main className="mgr-main">
        {children}
      </main>

    </div>
  );
}
