import { NextResponse } from "next/server";
import { Pool } from "pg";
import { verifyMessage } from "viem";

export async function POST(request: Request) {
  const { quizId, walletAddress, answers, score, signature, message } = await request.json();

  if (!quizId || !walletAddress || !answers || score === undefined || !signature || !message) {
    return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
  }

  const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
  });

  try {
    const isValid = verifyMessage({ address: walletAddress, message, signature });
    if (!isValid) {
      return NextResponse.json({ success: false, error: "Invalid wallet signature" }, { status: 401 });
    }

    const quizResult = await pool.query("SELECT quiz_data FROM quizzes WHERE id = $1", [quizId]);
    if (quizResult.rows.length === 0) {
      return NextResponse.json({ success: false, error: "Quiz not found" }, { status: 404 });
    }
    const quizData = quizResult.rows[0].quiz_data.quiz;

    let serverScore = 0;
    quizData.forEach((question: { correctAnswer: number }, index: number) => {
      if (answers[index] === question.correctAnswer) serverScore++;
    });
    if (serverScore !== score) {
      return NextResponse.json({ success: false, error: "Score tampering detected" }, { status: 403 });
    }

    const existingSubmissions = await pool.query(
      "SELECT score, submitted_at FROM quiz_submissions WHERE quiz_id = $1 AND wallet_address = $2 AND submitted_at >= (NOW() AT TIME ZONE 'UTC' - INTERVAL '1 day')",
      [quizId, walletAddress]
    );
    if (existingSubmissions.rows.length > 0) {
      return NextResponse.json({ success: false, error: "One attempt per day allowed" }, { status: 429 });
    }

    const perfectSubmissions = await pool.query(
      "SELECT score FROM quiz_submissions WHERE quiz_id = $1 AND wallet_address = $2 AND score = $3",
      [quizId, walletAddress, quizData.length]
    );
    if (perfectSubmissions.rows.length > 0) {
      return NextResponse.json({ success: false, error: `You have already completed this quiz with a perfect score (${quizData.length}/${quizData.length}).` }, { status: 403 });
    }

    await pool.query(
      "INSERT INTO quiz_submissions (quiz_id, wallet_address, score, submitted_at, signature) VALUES ($1, $2, $3, NOW(), $4)",
      [quizId, walletAddress, score, signature]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error submitting quiz:", error);
    return NextResponse.json({ success: false, error: "Failed to submit quiz" }, { status: 500 });
  } finally {
    await pool.end();
  }
}