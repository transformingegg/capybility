import { verifyMessage } from "ethers";
import { NextRequest } from "next/server";

const ADMIN_WALLET = process.env.NEXT_PUBLIC_ADMIN_WALLET?.toLowerCase();

export async function verifyAdmin(request: NextRequest): Promise<boolean> {
  if (!ADMIN_WALLET) {
    console.error("Admin wallet is not configured.");
    return false;
  }

  const signature = request.headers.get('X-Admin-Signature');
  const address = request.headers.get('X-Admin-Address');
  const message = request.headers.get('X-Admin-Message');

  if (!signature || !address || !message) {
    console.warn("Admin verification failed: Missing signature headers.");
    return false;
  }

  try {
    const recoveredAddress = verifyMessage(message, signature);
    
    if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
      console.warn("Admin verification failed: Signature does not match address.");
      return false;
    }

    if (address.toLowerCase() !== ADMIN_WALLET) {
      console.warn(`Admin verification failed: Address ${address} is not the configured admin.`);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error verifying admin signature:", error);
    return false;
  }
}
