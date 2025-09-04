import { NextResponse } from 'next/server';
import { createSession } from '@/lib/session';
import { verifyMessage } from 'ethers';

const ADMIN_WALLET_ADDRESS = process.env.ADMIN_WALLET;

export async function POST(request: Request) {
  try {
    if (!ADMIN_WALLET_ADDRESS) {
        throw new Error("ADMIN_WALLET is not set in the environment variables.");
    }
    const { address, signature, message } = await request.json();

    if (!address || !signature || !message) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // 1. Verify the signature
    const recoveredAddress = verifyMessage(message, signature);

    // 2. Check if the recovered address matches the provided address and the admin address
    if (recoveredAddress.toLowerCase() !== address.toLowerCase() || address.toLowerCase() !== ADMIN_WALLET_ADDRESS.toLowerCase()) {
      return NextResponse.json({ error: 'Invalid signature or unauthorized wallet' }, { status: 401 });
    }

    // 3. Create a session for the user
    await createSession(address);

    return NextResponse.json({ success: true, message: 'Authentication successful' });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
