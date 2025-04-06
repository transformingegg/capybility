import { NextResponse } from "next/server";
import { Pool } from "pg";

export async function POST(request: Request) {
  try {
    const { quiz, walletAddress, quizName, tags, url } = await request.json();
    console.log("Received tags for saving:", tags); // Add logging for debugging

    if (!quiz || !Array.isArray(quiz) || !walletAddress) {
      return NextResponse.json({ error: "Invalid quiz or wallet address format" }, { status: 400 });
    }

    const pool = new Pool({
      connectionString: process.env.POSTGRES_URL,
    });

    const insertQuery = `
      INSERT INTO quizzes (quiz_data, wallet_address, quiz_name, source_url, created_at) 
      VALUES ($1, $2, $3, $4, NOW())
      RETURNING *`;

    const result = await pool.query(insertQuery, [
      JSON.stringify({ 
        quiz,
        quizName, 
        tags // Ensure tags are included in the quiz_data JSON
      }), 
      walletAddress,
      quizName || 'Untitled Quiz',
      url || null
    ]);

    await pool.end();

    console.log("Saved quiz data:", result.rows[0].quiz_data); // Verify saved data

    return NextResponse.json({ 
      success: true, 
      quizId: result.rows[0].id,
      savedData: result.rows[0].quiz_data // Return saved data for verification
    });
  } catch (error) {
    console.error("Error saving quiz:", error);
    return NextResponse.json({ success: false, error: "Failed to save quiz" }, { status: 500 });
  }
}