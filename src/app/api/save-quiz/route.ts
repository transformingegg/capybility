import { NextResponse } from "next/server";
import { Pool } from "pg";
import { verifyMessage } from "ethers";

export async function POST(request: Request) {
  try {
    const { quiz, walletAddress, quizName, tags, sourceUrl, signature, message, isBarabotsQuiz, barabotsCategory, barabotsDuration } = await request.json();
    console.log("Received data:", { quiz: !!quiz, walletAddress, quizName, tags, sourceUrl, isBarabotsQuiz, barabotsCategory, barabotsDuration });

    if (!signature || !message) {
      return NextResponse.json({ error: "Missing signature" }, { status: 401 });
    }

    const recoveredAddress = verifyMessage(message, signature);
    if (recoveredAddress.toLowerCase() !== walletAddress.toLowerCase()) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    if (!quiz || !Array.isArray(quiz) || !walletAddress) {
      return NextResponse.json({ error: "Invalid quiz or wallet address format" }, { status: 400 });
    }

    const pool = new Pool({
      connectionString: process.env.POSTGRES_URL,
    });

    const insertQuery = `
      INSERT INTO quizzes (quiz_data, wallet_address, quiz_name, source_url, created_at, status, is_barabots_quiz, barabots_category, barabots_duration_days, barabots_end_date, barabots_processed) 
      VALUES ($1, $2, $3, $4, NOW(), $5, $6, $7, $8, $9, $10)
      RETURNING *`;

    // Calculate Barabots end date if applicable
    const barabotsEndDate = isBarabotsQuiz ? new Date(Date.now() + (barabotsDuration || 3) * 24 * 60 * 60 * 1000).toISOString() : null;

    const result = await pool.query(insertQuery, [
      JSON.stringify({ 
        quiz,
        quizName, 
        tags
      }), 
      walletAddress,
      quizName || 'Untitled Quiz',
      sourceUrl || null,
      'pending',
      isBarabotsQuiz || false,
      barabotsCategory || null,
      barabotsDuration || null,
      barabotsEndDate,
      false // barabots_processed
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