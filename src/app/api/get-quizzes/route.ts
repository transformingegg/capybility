import { NextResponse } from "next/server";
import { Pool } from "pg";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get("address");

  if (!address) {
    return NextResponse.json({ success: false, error: "No wallet address provided" }, { status: 400 });
  }

  const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
  });

  try {
    const result = await pool.query(
      "SELECT *, is_archived FROM quizzes WHERE wallet_address = $1 ORDER BY created_at DESC",
      [address]
    );
    return NextResponse.json({ success: true, quizzes: result.rows });
  } catch (error) {
    console.error("Error fetching quizzes:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch quizzes" }, { status: 500 });
  } finally {
    await pool.end();
  }
}