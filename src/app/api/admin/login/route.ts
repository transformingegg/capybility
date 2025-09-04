import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { verifyMessage } from 'ethers';

const ADMIN_WALLET = process.env.NEXT_PUBLIC_ADMIN_WALLET?.toLowerCase();

export async function POST(request: NextRequest) {
  const { address, signature, message } = await request.json();

  if (!address || !signature || !message) {
    return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
  }

  if (!ADMIN_WALLET) {
    console.error("Admin wallet not configured");
    return NextResponse.json({ success: false, error: 'Admin wallet not configured' }, { status: 500 });
  }

  try {
    const recoveredAddress = verifyMessage(message, signature);

    if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
      return NextResponse.json({ success: false, error: 'Invalid signature' }, { status: 401 });
    }

    if (address.toLowerCase() !== ADMIN_WALLET) {
      return NextResponse.json({ success: false, error: 'Not an admin' }, { status: 403 });
    }

    const session = await getSession();
    session.address = address;
    session.isAdmin = true;
    await session.save();

    return NextResponse.json({ success: true, message: "Admin login successful." });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
