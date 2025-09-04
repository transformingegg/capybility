import { NextResponse } from "next/server";
import { Pool } from "pg";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();

  if (!session?.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
  });

  try {
    const result = await pool.query(
      "SELECT id, quiz_name, wallet_address, source_url, quiz_data, NOT is_archived as is_active, is_flagged, is_featured, created_at FROM quizzes ORDER BY is_featured DESC, is_flagged DESC, created_at DESC"
    );
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Error fetching all quizzes:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch all quizzes" }, { status: 500 });
  } finally {
    await pool.end();
  }
}
