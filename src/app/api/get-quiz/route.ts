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
    const result = await pool.query("SELECT * FROM quizzes WHERE id = $1 AND status = 'minted'", [id]);
    if (result.rows.length > 0) {
      const quiz = result.rows[0];

      // The quiz_data field is already parsed as a JSON object by the pg driver
      if (quiz.quiz_data && Array.isArray(quiz.quiz_data.quiz)) {
        // Sanitize the questions to remove the correct answer
        type QuizQuestion = { question: string; choices: string[]; correctAnswer: number };
        const sanitizedQuestions = quiz.quiz_data.quiz.map((q: QuizQuestion) => {
          const { /* correctAnswer, */ ...questionWithoutAnswer } = q;
          return questionWithoutAnswer;
        });

        // Replace the original questions with the sanitized version
        quiz.quiz_data.quiz = sanitizedQuestions;
      }

      return NextResponse.json({ success: true, quiz });
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