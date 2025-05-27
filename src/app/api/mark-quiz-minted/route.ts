import { NextResponse } from "next/server";
import { Pool } from "pg";

export async function POST(request: Request) {
  const { quizId, status } = await request.json();
  const newStatus = status || "minted";
  const pool = new Pool({ connectionString: process.env.POSTGRES_URL });

  try {
    await pool.query(
      "UPDATE quizzes SET status = $2 WHERE id = $1",
      [quizId, newStatus]
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    const err = error as Error;
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  } finally {
    await pool.end();
  }
}