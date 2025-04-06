import { NextResponse } from "next/server";
import { Pool } from "pg";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const quizId = searchParams.get("quizId");

  if (!quizId) {
    return NextResponse.json({ success: false, error: "No quiz ID provided" }, { status: 400 });
  }

  const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
  });

  try {
    const result = await pool.query(
      `SELECT DISTINCT wallet_address 
       FROM quiz_submissions 
       WHERE quiz_id = $1 
       ORDER BY wallet_address`,
      [quizId]
    );
    
    return NextResponse.json({ 
      success: true, 
      completers: result.rows 
    });
  } catch (error) {
    console.error("Error fetching completers:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch completers" }, { status: 500 });
  } finally {
    await pool.end();
  }
}