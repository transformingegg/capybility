import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';

export async function GET() {
  try {
    const session = await getSession();
    if (
      session &&
      typeof session === 'object' &&
      'isAdmin' in session &&
      session.isAdmin === true &&
      'address' in session &&
      typeof session.address === 'string'
    ) {
      return NextResponse.json({ isAdmin: true, address: session.address });
    }
    return NextResponse.json({ isAdmin: false });
  } catch (error) {
    console.error('Session check error:', error);
    return NextResponse.json({ isAdmin: false }, { status: 500 });
  }
}
