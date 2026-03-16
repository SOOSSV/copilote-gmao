import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

webpush.setVapidDetails(
  process.env.VAPID_EMAIL!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  // Vérifier le secret pour que seul n8n puisse appeler cet endpoint
  const secret = req.headers.get('x-push-secret');
  if (secret !== process.env.PUSH_API_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { title, body, url, role, tag } = await req.json();

  // Récupérer toutes les subscriptions du rôle cible (manager par défaut)
  const { data: subs } = await supabase
    .from('push_subscriptions')
    .select('*')
    .eq('role', role || 'manager');

  if (!subs || subs.length === 0) {
    return NextResponse.json({ sent: 0, message: 'No subscribers' });
  }

  const payload = JSON.stringify({
    title,
    body,
    url: url || '/manager/tickets',
    tag: tag || 'ticket-urgent',
  });

  const results = await Promise.allSettled(
    subs.map(sub =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload
      )
    )
  );

  const sent = results.filter(r => r.status === 'fulfilled').length;
  const failed = results.filter(r => r.status === 'rejected').length;

  // Nettoyer les subscriptions expirées (410 Gone)
  const expiredEndpoints: string[] = [];
  results.forEach((r, i) => {
    if (r.status === 'rejected' && (r.reason as { statusCode?: number })?.statusCode === 410) {
      expiredEndpoints.push(subs[i].endpoint);
    }
  });
  if (expiredEndpoints.length > 0) {
    await supabase.from('push_subscriptions').delete().in('endpoint', expiredEndpoints);
  }

  return NextResponse.json({ sent, failed });
}
