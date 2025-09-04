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
    const archiveStatus = 'archive' in body ? body.archive : body.archived;

    if (!quizId || typeof archiveStatus !== 'boolean') {
      return NextResponse.json({ success: false, error: "quizId and archive status are required" }, { status: 400 });
    }

    // 1. Check for Admin Session
    const session = await getSession();
    if (session?.isAdmin) {
      // Admin is authorized, proceed directly
      await pool.query("UPDATE quizzes SET is_archived = $1 WHERE id = $2", [archiveStatus, quizId]);
      return NextResponse.json({ success: true, message: "Archived by admin" });
    }

    // 2. If not admin, check for Creator Signature
    if (!address || !signature || !message) {
      return NextResponse.json({ error: "Unauthorized: Missing signature" }, { status: 401 });
    }

    const recoveredAddress = verifyMessage(message, signature);
    if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
      return NextResponse.json({ error: "Unauthorized: Invalid signature" }, { status: 401 });
    }

    // 3. Verify Ownership
    const ownerResult = await pool.query("SELECT wallet_address FROM quizzes WHERE id = $1", [quizId]);
    if (ownerResult.rows.length === 0) {
      return NextResponse.json({ success: false, error: "Quiz not found" }, { status: 404 });
    }

    const ownerAddress = ownerResult.rows[0].wallet_address;
    if (ownerAddress.toLowerCase() !== recoveredAddress.toLowerCase()) {
      return NextResponse.json({ error: "Unauthorized: You are not the owner of this quiz" }, { status: 403 });
    }

    // 4. Creator is authorized, proceed with update
    await pool.query("UPDATE quizzes SET is_archived = $1 WHERE id = $2 AND wallet_address = $3", [archiveStatus, quizId, recoveredAddress]);
    
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Error archiving quiz:", error);
    return NextResponse.json({ success: false, error: "Failed to archive quiz" }, { status: 500 });
  } finally {
    await pool.end();
  }
}