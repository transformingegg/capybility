import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';

export async function GET(_request: NextRequest) {
  try {
    const session = await getSession();
    if (session.isAdmin) {
      return NextResponse.json({ isAdmin: true, address: session.address });
    }
    return NextResponse.json({ isAdmin: false });
  } catch (error) {
    console.error('Session check error:', error);
    return NextResponse.json({ isAdmin: false }, { status: 500 });
  }
}
