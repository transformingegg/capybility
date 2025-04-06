import { NextResponse } from "next/server";
import { Pool } from "pg";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get("address");

  if (!address) {
    return NextResponse.json({ success: false, error: "No address provided" }, { status: 400 });
  }

  const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
  });

  try {
    // Modified query to correctly count tag occurrences across all completed quizzes
    const result = await pool.query(`
      WITH quiz_tags AS (
        SELECT DISTINCT
          qs.quiz_id,
          jsonb_array_elements_text(q.quiz_data->'tags') as tag
        FROM quiz_submissions qs
        JOIN quizzes q ON qs.quiz_id = q.id
        WHERE qs.wallet_address = $1
      )
      SELECT 
        tag,
        COUNT(*) as count
      FROM quiz_tags
      GROUP BY tag
      ORDER BY count DESC, tag ASC
    `, [address]);
    
    console.log("Knowledge pack tags:", result.rows); // Debug logging
    
    return NextResponse.json({ 
      success: true, 
      tags: result.rows 
    });
  } catch (error) {
    console.error("Error generating knowledge pack:", error);
    return NextResponse.json({ success: false, error: "Failed to generate knowledge pack" }, { status: 500 });
  } finally {
    await pool.end();
  }
}