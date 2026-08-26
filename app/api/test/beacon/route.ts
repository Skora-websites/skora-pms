import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log('[BEACON] Received:', body);
    return NextResponse.json({ ok: true, received: body });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}