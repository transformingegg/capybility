import { NextResponse } from "next/server";
import { Pool } from "pg";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get("address");
  const search = searchParams.get("search");

  if (!address) {
    return NextResponse.json({ success: false, error: "Missing address parameter" }, { status: 400 });
  }

  if (!search) {
    return NextResponse.json({ success: true, quizzes: [] });
  }

  const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
  });

  try {
    // Search in quiz_name and tags (case insensitive)
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
    AND (
        LOWER(q.quiz_name) LIKE LOWER($2)
        OR EXISTS (
            SELECT 1 
            FROM jsonb_array_elements_text(q.quiz_data->'tags') AS tag
            WHERE LOWER(tag) LIKE LOWER($2)
        )
    )
    AND NOT EXISTS (
        SELECT 1
        FROM quiz_submissions qs
        WHERE qs.quiz_id = q.id
          AND qs.wallet_address = $1
          AND qs.score = (SELECT JSONB_ARRAY_LENGTH(q.quiz_data->'quiz') FROM quizzes WHERE id = q.id)
    )
  ORDER BY q.is_featured DESC, q.is_flagged ASC, q.created_at DESC;
      `,
      [address, `%${search}%`]
    );

    return NextResponse.json({ success: true, quizzes: result.rows });
  } catch (error) {
    console.error("Error searching quizzes:", error);
    return NextResponse.json({ success: false, error: "Failed to search quizzes" }, { status: 500 });
  } finally {
    await pool.end();
  }
}