import { NextResponse } from "next/server";
import { Pool } from "pg";

interface PromotionStats {
  qualifyingQuizzes: number;
  qualifyingQuizCompletions: number;
}

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
    // Query for qualifying quizzes (for testing change the 10 to 2)
    const qualifyingQuizzesResult = await pool.query(
      `
      SELECT COUNT(DISTINCT q.id)
      FROM quizzes q
      WHERE q.wallet_address = $1
        AND q.status = 'minted'
        AND EXISTS (
          SELECT 1
          FROM jsonb_array_elements_text(q.quiz_data->'tags') AS tag
          WHERE LOWER(REPLACE(TRIM(tag), ' ', '')) = 'educhain'
        )
        AND (
          SELECT COUNT(*)
          FROM quiz_submissions qs
          WHERE qs.quiz_id = q.id
            AND qs.score = (SELECT JSONB_ARRAY_LENGTH(q.quiz_data->'quiz') FROM quizzes WHERE id = q.id)
        ) >= 10
      `,
      [address]
    );

    // Query for qualifying quiz completions
    const qualifyingQuizCompletionsResult = await pool.query(
      `
      SELECT COUNT(DISTINCT qs.quiz_id)
      FROM quiz_submissions qs
      JOIN quizzes q ON qs.quiz_id = q.id
      WHERE qs.wallet_address = $1
        AND qs.nft_minted = true
        AND q.status = 'minted'
        AND EXISTS (
          SELECT 1
          FROM jsonb_array_elements_text(q.quiz_data->'tags') AS tag
          WHERE LOWER(REPLACE(TRIM(tag), ' ', '')) = 'educhain'
        )
        AND qs.score = (SELECT JSONB_ARRAY_LENGTH(q.quiz_data->'quiz') FROM quizzes WHERE id = q.id)
      `,
      [address]
    );

    const stats: PromotionStats = {
      qualifyingQuizzes: parseInt(qualifyingQuizzesResult.rows[0].count, 10) || 0,
      qualifyingQuizCompletions: parseInt(qualifyingQuizCompletionsResult.rows[0].count, 10) || 0,
    };

    return NextResponse.json({ success: true, stats });
  } catch (error) {
    console.error("Error fetching promotion statistics:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch promotion statistics" }, { status: 500 });
  } finally {
    await pool.end();
  }
}