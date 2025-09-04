import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';

export async function POST(_request: NextRequest) {
  try {
    const session = await getSession();
    session.destroy();
    return NextResponse.json({ success: true, message: "Logout successful." });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
