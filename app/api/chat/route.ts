import { NextRequest, NextResponse } from 'next/server';

const N8N_CHAT_URL = process.env.N8N_CHAT_URL || '';

export async function POST(req: NextRequest) {
  if (!N8N_CHAT_URL) {
    return NextResponse.json({ output: '⚠️ Assistant IA non configuré sur le serveur.' }, { status: 500 });
  }

  try {
    const body = await req.json();

    const res = await fetch(N8N_CHAT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    const reply = data?.output || data?.text || data?.message || data?.response || 'Pas de réponse.';

    return NextResponse.json({ output: reply });
  } catch (err) {
    return NextResponse.json({ output: '⚠️ Erreur serveur. Réessayez.' }, { status: 500 });
  }
}
