import { NextResponse } from "next/server";
import { Pool } from "pg";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get("address");

  if (!address) {
    return NextResponse.json({ success: false, error: "Missing address parameter" }, { status: 400 });
  }

  const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
  });

  try {
    const result = await pool.query(
      `
      SELECT 
      q.*,
      CASE
          WHEN EXISTS (
              SELECT 1
              FROM quiz_submissions qs
              WHERE qs.quiz_id = q.id
                AND qs.wallet_address = $1
                AND qs.submitted_at >= NOW() AT TIME ZONE 'UTC' - INTERVAL '1 day'
          ) THEN TRUE
          ELSE FALSE
      END AS has_attempted_today
  FROM quizzes q
  WHERE q.status = 'minted'
    AND NOT EXISTS (
        SELECT 1
        FROM quiz_submissions qs
        WHERE qs.quiz_id = q.id
          AND qs.wallet_address = $1
          AND qs.score = (SELECT JSONB_ARRAY_LENGTH(q.quiz_data->'quiz') FROM quizzes WHERE id = q.id)
    )
  ORDER BY q.created_at DESC;
      `,
      [address]
    );

    return NextResponse.json({ success: true, quizzes: result.rows });
  } catch (error) {
    console.error("Error fetching all quizzes:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch all quizzes" }, { status: 500 });
  } finally {
    await pool.end();
  }
}