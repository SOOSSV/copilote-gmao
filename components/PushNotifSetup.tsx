'use client';

import { useEffect, useState } from 'react';
import { Bell, BellOff } from 'lucide-react';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)));
}

export default function PushNotifSetup({ role = 'manager' }: { role?: string }) {
  const [status, setStatus] = useState<'idle' | 'granted' | 'denied' | 'loading'>('idle');

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
    // Enregistrer le SW
    navigator.serviceWorker.register('/sw.js').catch(() => {});
    // Vérifier permission actuelle
    if (Notification.permission === 'granted') {
      checkSubscription();
    } else if (Notification.permission === 'denied') {
      setStatus('denied');
    }
  }, []);

  async function checkSubscription() {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    setStatus(sub ? 'granted' : 'idle');
  }

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

  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return null;

  if (status === 'granted') {
    return (
      <button onClick={unsubscribe} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', background: '#22c55e22', border: '1px solid #22c55e44', borderRadius: 8, color: '#22c55e', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
        <Bell size={13} /> Notifs activées
      </button>
    );
  }

  if (status === 'denied') {
    return (
      <span style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', color: 'var(--text-secondary)', fontSize: 12 }}>
        <BellOff size={13} /> Notifs bloquées
      </span>
    );
  }

  return (
    <button onClick={subscribe} disabled={status === 'loading'} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-secondary)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
      <Bell size={13} /> {status === 'loading' ? '...' : 'Activer notifs'}
    </button>
  );
}
