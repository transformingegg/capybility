import { NextResponse } from "next/server";
import { Pool } from "pg";

export async function POST(request: Request) {
  try {
 

    const { quiz, walletAddress, quizName, tags, sourceUrl } = await request.json();
    console.log("Received data:", { quiz, walletAddress, quizName, tags, sourceUrl });

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
        tags
      }), 
      walletAddress,
      quizName || 'Untitled Quiz',
      sourceUrl || null  // Changed from url to sourceUrl
    ]);

    await pool.end();

    console.log("Saved quiz data:", result.rows[0]);

    return NextResponse.json({ 
      success: true, 
      quizId: result.rows[0].id,
      savedData: result.rows[0].quiz_data
    });
  } catch (error) {
    console.error("Error saving quiz:", error);
    return NextResponse.json({ success: false, error: "Failed to save quiz" }, { status: 500 });
  }
}