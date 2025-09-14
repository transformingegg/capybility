import { NextResponse } from "next/server";
import { Pool } from "pg";
import { getSession } from "@/lib/session";
import { verifyMessage } from "ethers";

export async function POST(request: Request) {
  const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
  });

  try {
    const body = await request.json();
    const { quizId, address, signature, message } = body;

    if (!quizId) {
      return NextResponse.json({ success: false, error: "quizId is required" }, { status: 400 });
    }

    // 1. Check for Admin Session
    const session = await getSession();
    if (session?.isAdmin) {
      const flagStatus = 'flagStatus' in body ? body.flagStatus : true; // Default to flagging
      if (typeof flagStatus !== 'boolean') {
        return NextResponse.json({ success: false, error: "Invalid 'flagStatus' provided" }, { status: 400 });
      }
      // Admin is authorized to flag or unflag
      await pool.query("UPDATE quizzes SET is_flagged = $1 WHERE id = $2", [flagStatus, quizId]);
      return NextResponse.json({ success: true, message: `Quiz ${flagStatus ? 'flagged' : 'unflagged'} by admin` });
    }

    // 2. If not admin, check for User Signature (for flagging only)
    if (!address || !signature || !message) {
      return NextResponse.json({ error: "Unauthorized: Missing signature" }, { status: 401 });
    }

    const recoveredAddress = verifyMessage(message, signature);
    if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
      return NextResponse.json({ error: "Unauthorized: Invalid signature" }, { status: 401 });
    }

    // User is authorized, proceed with flagging
    await pool.query("UPDATE quizzes SET is_flagged = TRUE WHERE id = $1", [quizId]);
    return NextResponse.json({ success: true, message: "Quiz flagged by user" });

  } catch (error) {
    console.error("Error in flagging process:", error);
    return NextResponse.json({ success: false, error: "Failed to update flag status" }, { status: 500 });
  } finally {
    await pool.end();
  }
}
