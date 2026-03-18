import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-push-secret');
  if (secret !== process.env.PUSH_API_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { title, body, url, role, tag } = await req.json();

  if (!process.env.VAPID_EMAIL || !process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
    return NextResponse.json({ error: 'Push notifications non configurées (VAPID manquant)' }, { status: 500 });
  }

  webpush.setVapidDetails(
    process.env.VAPID_EMAIL,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );

  const { data: subs } = await supabase
    .from('push_subscriptions')
    .select('*')
    .eq('role', role || 'manager');

  let pushSent = 0;
  if (subs && subs.length > 0) {
    const payload = JSON.stringify({ title, body, url: url || '/manager/tickets', tag: tag || 'ticket-urgent' });
    const results = await Promise.allSettled(
      subs.map(sub =>
        webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload
        )
      )
    );
    pushSent = results.filter(r => r.status === 'fulfilled').length;

    const expired = results
      .map((r, i) => ({ r, i }))
      .filter(({ r }) => r.status === 'rejected' && (r.reason as { statusCode?: number })?.statusCode === 410)
      .map(({ i }) => subs[i].endpoint);

    if (expired.length > 0) {
      await supabase.from('push_subscriptions').delete().in('endpoint', expired);
    }
  }

  return NextResponse.json({ pushSent });
}
