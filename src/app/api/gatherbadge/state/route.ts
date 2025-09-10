import { NextResponse } from 'next/server';

const STATE_BLOB_KEY = 'badgeGather/badge-gather-state.json';
const BLOB_BASE_URL = process.env.BLOB_PUBLIC_URL || process.env.NEXT_PUBLIC_BLOB_PUBLIC_URL;

export async function GET() {
  try {
    const url = `${BLOB_BASE_URL}/${STATE_BLOB_KEY}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Not found');
    const state = await res.text();
    return new NextResponse(state, { headers: { 'Content-Type': 'application/json' } });
  } catch {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
}
