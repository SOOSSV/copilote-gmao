import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

webpush.setVapidDetails(
  process.env.VAPID_EMAIL!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-push-secret');
  if (secret !== process.env.PUSH_API_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { title, body, url, role, tag } = await req.json();
  const ticketUrl = `https://copilote-gmao.vercel.app${url || '/manager/tickets'}`;

  // --- Email ---
  const emailResult = await transporter.sendMail({
    from: `"COPILOTE GMAO" <${process.env.SMTP_USER}>`,
    to: process.env.MANAGER_EMAIL,
    subject: title,
    html: `
      <div style="font-family:sans-serif;max-width:500px;margin:0 auto;background:#0f1117;color:#fff;border-radius:12px;padding:24px">
        <div style="font-size:22px;font-weight:800;color:#6366f1;margin-bottom:4px">COPILOTE</div>
        <div style="font-size:13px;color:#888;margin-bottom:20px">Alerte maintenance</div>
        <div style="font-size:18px;font-weight:700;margin-bottom:12px">${title}</div>
        <div style="background:#1a1d2e;border-radius:8px;padding:14px;font-size:14px;color:#ccc;margin-bottom:20px">${body}</div>
        <a href="${ticketUrl}" style="display:inline-block;background:#6366f1;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px">Voir le ticket →</a>
      </div>
    `,
  }).catch(() => null);

  // --- Push ---
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

    const expiredEndpoints: string[] = [];
    results.forEach((r, i) => {
      if (r.status === 'rejected' && (r.reason as { statusCode?: number })?.statusCode === 410) {
        expiredEndpoints.push(subs[i].endpoint);
      }
    });
    if (expiredEndpoints.length > 0) {
      await supabase.from('push_subscriptions').delete().in('endpoint', expiredEndpoints);
    }
  }

  return NextResponse.json({ email: emailResult ? 'sent' : 'failed', pushSent });
}
