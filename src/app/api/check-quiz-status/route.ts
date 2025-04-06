import { NextResponse } from "next/server";
import { Pool } from "pg";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const quizId = searchParams.get("quizId");
  const address = searchParams.get("address");

  if (!quizId || !address) {
    return NextResponse.json({ 
      success: false, 
      error: "Missing required parameters" 
    }, { status: 400 });
  }

  const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
  });

  try {
    // Check for any successful completions
    const completionsResult = await pool.query(
      `SELECT * FROM quiz_submissions 
       WHERE quiz_id = $1 
       AND wallet_address = $2 
       AND score = (
         SELECT JSONB_ARRAY_LENGTH(quiz_data->'quiz') 
         FROM quizzes 
         WHERE id = $1
       )`,
      [quizId, address]
    );

    // Check for attempts in the last 24 hours
    const attemptsResult = await pool.query(
      `SELECT submitted_at 
       FROM quiz_submissions 
       WHERE quiz_id = $1 
       AND wallet_address = $2 
       AND submitted_at >= NOW() AT TIME ZONE 'UTC' - INTERVAL '1 day'
       ORDER BY submitted_at DESC
       LIMIT 1`,
      [quizId, address]
    );

    return NextResponse.json({
      success: true,
      status: {
        hasCompletedQuiz: completionsResult.rows.length > 0,
        hasAttemptedToday: attemptsResult.rows.length > 0,
        lastAttemptTime: attemptsResult.rows[0]?.submitted_at
      }
    });
  } catch (error) {
    console.error("Error checking quiz status:", error);
    return NextResponse.json({ 
      success: false, 
      error: "Failed to check quiz status" 
    }, { status: 500 });
  } finally {
    await pool.end();
  }
}