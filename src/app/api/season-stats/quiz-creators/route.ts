import { NextResponse } from "next/server";
import { Pool } from "pg";
import { getSession } from "@/lib/session";

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: process.env.POSTGRES_URL?.includes('localhost')
    ? false
    : { rejectUnauthorized: false },
});

export async function GET() {
  try {
    // Verify admin authentication
    const session = await getSession();
    if (!session || !session.isAdmin) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // Query to get all quiz creators with EDUCHAIN tagged quizzes and their counts
    const query = `
      SELECT 
        q.wallet_address,
        COUNT(DISTINCT q.id) as quiz_count
      FROM quizzes q
      WHERE q.status = 'minted'
        AND EXISTS (
          SELECT 1
          FROM jsonb_array_elements_text(q.quiz_data->'tags') AS tag
          WHERE LOWER(REPLACE(TRIM(tag), ' ', '')) IN ('educhain', 'edu chain')
        )
      GROUP BY q.wallet_address
      ORDER BY quiz_count DESC, q.wallet_address ASC
    `;

    const result = await pool.query(query);
    
    return NextResponse.json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error('Error fetching quiz creator stats:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch quiz creator statistics' },
      { status: 500 }
    );
  }
}