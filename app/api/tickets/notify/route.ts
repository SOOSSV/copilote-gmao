import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { title, body, url, role, tag } = await req.json();
  if (!title || !body) return NextResponse.json({ ok: false }, { status: 400 });

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `https://${req.headers.get('host')}`;

  await fetch(`${baseUrl}/api/push/send`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-push-secret': process.env.PUSH_API_SECRET!,
    },
    body: JSON.stringify({ title, body, url, role, tag }),
  }).catch(() => {});

  return NextResponse.json({ ok: true });
}
