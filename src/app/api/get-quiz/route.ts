import { NextResponse } from "next/server";
import { Pool } from "pg";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ success: false, error: "No quiz ID provided" }, { status: 400 });
  }

  const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
  });

  try {
    const result = await pool.query("SELECT * FROM quizzes WHERE id = $1", [id]);
    if (result.rows.length > 0) {
      return NextResponse.json({ success: true, quiz: result.rows[0] });
    } else {
      return NextResponse.json({ success: false, error: "Quiz not found" }, { status: 404 });
    }
  } catch (error) {
    console.error("Error fetching quiz:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch quiz" }, { status: 500 });
  } finally {
    await pool.end();
  }
}