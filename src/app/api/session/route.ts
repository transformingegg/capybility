import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';

export async function GET() {
  try {
    const session = await getSession();
    if (session && session.isAdmin) {
      return NextResponse.json({ isAuthenticated: true, address: session.address });
    }
    return NextResponse.json({ isAuthenticated: false });
  } catch (error) {
    console.error('Session check error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
