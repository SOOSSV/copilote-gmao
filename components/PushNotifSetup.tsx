'use client';

import { useEffect, useState } from 'react';
import { Bell, BellOff, Smartphone } from 'lucide-react';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)));
}

export default function PushNotifSetup({ role = 'manager', fullCard = false }: { role?: string; fullCard?: boolean }) {
  const [mounted, setMounted] = useState(false);
  const [supported, setSupported] = useState(false);
  const [status, setStatus] = useState<'idle' | 'granted' | 'denied' | 'loading'>('idle');

  useEffect(() => {
    setMounted(true);
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
    setSupported(true);
    navigator.serviceWorker.register('/sw.js').catch(() => {});
    if (Notification.permission === 'granted') {
      navigator.serviceWorker.ready.then(reg =>
        reg.pushManager.getSubscription().then(sub => setStatus(sub ? 'granted' : 'idle'))
      );
    } else if (Notification.permission === 'denied') {
      setStatus('denied');
    }
  }, []);

  async function subscribe() {
    setStatus('loading');
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!),
      });
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription: sub.toJSON(), role }),
      });
      setStatus('granted');
    } catch {
      setStatus(Notification.permission === 'denied' ? 'denied' : 'idle');
    }
  }

  async function unsubscribe() {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub) {
      await fetch('/api/push/subscribe', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: sub.endpoint }),
      });
      await sub.unsubscribe();
    }
    setStatus('idle');
  }

  if (!mounted) return null;

  // Navigateur ne supporte pas les push (iOS sans PWA)
  if (!supported) {
    if (!fullCard) return (
      <span style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 10px', color: 'var(--text-secondary)', fontSize: 11 }}>
        <Smartphone size={12} /> Installer l&apos;app
      </span>
    );
    return (
      <div style={{ background: '#f59e0b18', border: '1px solid #f59e0b33', borderRadius: 10, padding: '10px 12px', fontSize: 12, color: '#f59e0b', lineHeight: 1.5 }}>
        <div style={{ fontWeight: 700, marginBottom: 4 }}>📱 iPhone : installer l&apos;appli</div>
        <div style={{ color: 'var(--text-secondary)', fontSize: 11 }}>Safari → icône partage → &quot;Sur l&apos;écran d&apos;accueil&quot; → relancer</div>
      </div>
    );
  }

  if (status === 'granted') {
    return (
      <button onClick={unsubscribe} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: '#22c55e22', border: '1px solid #22c55e55', borderRadius: 10, color: '#22c55e', fontSize: 13, fontWeight: 700, cursor: 'pointer', width: fullCard ? '100%' : 'auto', justifyContent: fullCard ? 'center' : 'flex-start' }}>
        <Bell size={14} /> Notifs activées ✓
      </button>
    );
  }

  if (status === 'denied') {
    return (
      <span style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 10px', color: 'var(--text-secondary)', fontSize: 11 }}>
        <BellOff size={12} /> Bloqué dans les réglages
      </span>
    );
  }

  return (
    <button onClick={subscribe} disabled={status === 'loading'} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: '#6366f1', border: 'none', borderRadius: 10, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', width: fullCard ? '100%' : 'auto', justifyContent: fullCard ? 'center' : 'flex-start' }}>
      <Bell size={14} /> {status === 'loading' ? 'Activation...' : 'Activer les notifs'}
    </button>
  );
}
