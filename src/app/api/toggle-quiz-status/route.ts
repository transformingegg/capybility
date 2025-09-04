import { NextResponse, NextRequest } from "next/server";
import { Pool } from "pg";
import { getSession } from "@/lib/session";

export async function POST(request: NextRequest) {
  const session = await getSession();

  if (!session?.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { quizId, field } = await request.json();

    if (!quizId || !field) {
      return NextResponse.json({ success: false, error: "Missing quizId or field" }, { status: 400 });
    }

    // Validate field to prevent SQL injection
    if (field !== 'is_flagged' && field !== 'is_featured') {
        return NextResponse.json({ success: false, error: "Invalid field specified" }, { status: 400 });
    }

    const pool = new Pool({
      connectionString: process.env.POSTGRES_URL,
    });

    // Using template literal safely after validation
    const query = `UPDATE quizzes SET ${field} = NOT ${field} WHERE id = $1 RETURNING ${field}`;
    
    const result = await pool.query(query, [quizId]);

    await pool.end();

    if (result.rows.length === 0) {
        return NextResponse.json({ success: false, error: "Quiz not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, newValue: result.rows[0][field] });
  } catch (error) {
    console.error("Error toggling quiz status:", error);
    return NextResponse.json({ success: false, error: "Failed to toggle quiz status" }, { status: 500 });
  }
}
