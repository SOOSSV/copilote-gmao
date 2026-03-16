'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { LayoutDashboard, ClipboardList, MessageCircle, LogOut } from 'lucide-react';

export default function TechLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isLogin = pathname === '/tech/login';

  useEffect(() => {
    if (isLogin) return;
    if (typeof window !== 'undefined' && !localStorage.getItem('tech_id')) {
      router.replace('/tech/login');
    }
  }, [isLogin, router]);

  if (isLogin) return <>{children}</>;

  function logout() {
    localStorage.removeItem('tech_id');
    localStorage.removeItem('tech_prenom');
    localStorage.removeItem('tech_nom');
    localStorage.removeItem('tech_email');
    router.replace('/tech/login');
  }

  const nav = [
    { href: '/tech', icon: LayoutDashboard, label: 'Mes tickets' },
    { href: '/tech/historique', icon: ClipboardList, label: 'Historique' },
    { href: '/tech/chat', icon: MessageCircle, label: 'Chat IA' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', paddingBottom: 80 }}>
      {/* Top bar */}
      <div style={{ position: 'sticky', top: 0, zIndex: 100, background: 'var(--bg-card)', borderBottom: '1px solid var(--border)', padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, background: 'linear-gradient(135deg, #22c55e, #16a34a)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>COPILOTE</div>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Espace Technicien</div>
        </div>
        <button onClick={logout} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
          <LogOut size={16} /> Quitter
        </button>
      </div>

      {/* Content */}
      <main>{children}</main>

      {/* Bottom nav */}
      <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'var(--bg-card)', borderTop: '1px solid var(--border)', display: 'flex', zIndex: 100 }}>
        {nav.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (href !== '/tech' && pathname.startsWith(href));
          return (
            <Link key={href} href={href} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '10px 0 12px', textDecoration: 'none', color: active ? '#22c55e' : 'var(--text-secondary)' }}>
              <Icon size={20} />
              <span style={{ fontSize: 10, fontWeight: active ? 700 : 400 }}>{label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
