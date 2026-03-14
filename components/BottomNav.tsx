'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MessageCircle, Ticket, PlusCircle, Settings } from 'lucide-react';

const tabs = [
  { href: '/chat',     icon: MessageCircle, label: 'Chat IA' },
  { href: '/tickets',  icon: Ticket,        label: 'Tickets' },
  { href: '/nouveau',  icon: PlusCircle,    label: 'Nouveau' },
  { href: '/profil',   icon: Settings,      label: 'Profil' },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      background: 'var(--bg-secondary)',
      borderTop: '1px solid var(--border)',
      display: 'flex',
      zIndex: 50,
      paddingBottom: 'env(safe-area-inset-bottom)',
    }}>
      {tabs.map(({ href, icon: Icon, label }) => {
        const active = pathname.startsWith(href);
        return (
          <Link key={href} href={href} style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
            padding: '12px 0',
            textDecoration: 'none',
            color: active ? 'var(--accent)' : 'var(--text-secondary)',
            transition: 'color 0.15s',
          }}>
            <Icon size={22} />
            <span style={{ fontSize: '11px', fontWeight: active ? 600 : 400 }}>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
