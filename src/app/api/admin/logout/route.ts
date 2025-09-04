import { NextResponse } from 'next/server';

export async function POST() {
  try {
    // Remove the session cookie directly
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    cookieStore.set('session', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      expires: new Date(0), // Expire immediately
    });
    return NextResponse.json({ success: true, message: "Logout successful." });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
