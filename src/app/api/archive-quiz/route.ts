import { NextResponse } from "next/server";
import { Pool } from "pg";

export async function POST(request: Request) {
  try {
    const { quizId, archived } = await request.json();

    if (!quizId) {
      return NextResponse.json({ success: false, error: "No quiz ID provided" }, { status: 400 });
    }

    const pool = new Pool({
      connectionString: process.env.POSTGRES_URL,
    });

    await pool.query(
      "UPDATE quizzes SET is_archived = $1 WHERE id = $2",
      [archived, quizId]
    );

    await pool.end();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error archiving quiz:", error);
    return NextResponse.json({ success: false, error: "Failed to archive quiz" }, { status: 500 });
  }
}