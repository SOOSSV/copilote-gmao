'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { LayoutDashboard, ClipboardList, MessageCircle, LogOut } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function TechLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isLogin = pathname === '/tech/login';
  const [ticketActifs, setTicketActifs] = useState(0);

  useEffect(() => {
    if (isLogin) return;
    if (typeof window !== 'undefined' && !localStorage.getItem('tech_id')) {
      router.replace('/tech/login');
    }
  }, [isLogin, router]);

  useEffect(() => {
    if (isLogin) return;
    const id = typeof window !== 'undefined' ? localStorage.getItem('tech_id') : null;
    if (!id) return;

    // Comptage initial
    supabase.from('tickets').select('*', { count: 'exact', head: true })
      .eq('technicien_id', id).in('statut', ['ouvert', 'en_cours'])
      .then(({ count }) => setTicketActifs(count || 0));

    // Demande permission notifications
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // Écoute real-time nouveaux tickets assignés
    const channel = supabase.channel('tech-tickets-' + id)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'tickets',
        filter: `technicien_id=eq.${id}`,
      }, (payload) => {
        setTicketActifs(n => n + 1);
        if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
          new Notification('Nouveau ticket assigné', {
            body: (payload.new as { titre?: string }).titre || 'Un ticket vous a été assigné',
            icon: '/favicon.ico',
          });
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [isLogin]);

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
    <div className="tech-content" style={{ minHeight: '100vh', background: 'var(--bg-primary)', paddingBottom: 80 }}>
      {/* Top bar */}
      <div style={{ position: 'sticky', top: 0, zIndex: 100, background: 'var(--bg-card)', borderBottom: '1px solid var(--border)', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, background: 'linear-gradient(135deg, #22c55e, #16a34a)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>COPILOTE</div>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Espace Technicien</div>
        </div>

        {/* Nav desktop (visible uniquement ≥1025px) */}
        <div className="tech-nav-desktop" style={{ alignItems: 'center' }}>
          {nav.map(({ href, icon: Icon, label }) => {
            const active = pathname === href || (href !== '/tech' && pathname.startsWith(href));
            const badge = href === '/tech' && ticketActifs > 0 ? ticketActifs : 0;
            return (
              <Link key={href} href={href} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, textDecoration: 'none', fontSize: 13, fontWeight: active ? 700 : 400, color: active ? '#22c55e' : 'var(--text-secondary)', background: active ? '#22c55e14' : 'transparent', position: 'relative' }}>
                <div style={{ position: 'relative', display: 'inline-flex' }}>
                  <Icon size={16} />
                  {badge > 0 && <span style={{ position: 'absolute', top: -5, right: -7, background: '#ef4444', color: '#fff', borderRadius: 8, padding: '0 4px', fontSize: 9, fontWeight: 700, minWidth: 14, textAlign: 'center' }}>{badge}</span>}
                </div>
                {label}
              </Link>
            );
          })}
        </div>

        <button onClick={logout} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
          <LogOut size={16} /> Quitter
        </button>
      </div>

      {/* Content */}
      <main>{children}</main>

      {/* Bottom nav (mobile uniquement) */}
      <nav className="tech-bottom-nav" style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'var(--bg-card)', borderTop: '1px solid var(--border)', zIndex: 100 }}>
        {nav.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (href !== '/tech' && pathname.startsWith(href));
          const badge = href === '/tech' && ticketActifs > 0 ? ticketActifs : 0;
          return (
            <Link key={href} href={href} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '10px 0 12px', textDecoration: 'none', color: active ? '#22c55e' : 'var(--text-secondary)', position: 'relative' }}>
              <div style={{ position: 'relative', display: 'inline-flex' }}>
                <Icon size={20} />
                {badge > 0 && (
                  <span style={{ position: 'absolute', top: -6, right: -8, background: '#ef4444', color: '#fff', borderRadius: 8, padding: '0 4px', fontSize: 9, fontWeight: 700, minWidth: 14, textAlign: 'center' }}>{badge}</span>
                )}
              </div>
              <span style={{ fontSize: 10, fontWeight: active ? 700 : 400 }}>{label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
