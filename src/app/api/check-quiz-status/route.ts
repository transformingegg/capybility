import { NextResponse } from "next/server";
import { Pool } from "pg";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const quizId = searchParams.get("quizId");
  const address = searchParams.get("address");

  if (!quizId || !address) {
    return NextResponse.json({ 
      success: false, 
      error: "Missing required parameters" 
    }, { status: 400 });
  }

  const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
  });

  try {
    // Find the user's most recent submission for a valid quiz (status = 'minted')
    const submissionResult = await pool.query(
      `SELECT qs.id, qs.score, qs.submitted_at, qs.nft_minted, q.status, JSONB_ARRAY_LENGTH(q.quiz_data->'quiz') as question_count
       FROM quiz_submissions qs
       JOIN quizzes q ON qs.quiz_id = q.id
       WHERE qs.quiz_id = $1 AND qs.wallet_address = $2 AND q.status = 'minted'
       ORDER BY qs.submitted_at DESC
       LIMIT 1`,
      [quizId, address]
    );
    const latestSubmission = submissionResult.rows[0];
    const questionCount = latestSubmission?.question_count;

    // Check for attempts in the last 24 hours
    const attemptsResult = await pool.query(
      `SELECT submitted_at 
       FROM quiz_submissions 
       WHERE quiz_id = $1 
       AND wallet_address = $2 
       AND submitted_at >= NOW() AT TIME ZONE 'UTC' - INTERVAL '1 day'
       ORDER BY submitted_at DESC
       LIMIT 1`,
      [quizId, address]
    );

    // Default response
    const response = {
      success: true,
      status: {
        hasCompletedQuiz: false,
        hasAttemptedToday: attemptsResult.rows.length > 0,
        lastAttemptTime: attemptsResult.rows[0]?.submitted_at,
        state: 'not_attempted',
        submissionId: undefined,
      }
    };

    // If no submission, user can take the quiz
    if (!latestSubmission) {
      return NextResponse.json(response);
    }

    // If perfect score
    const isPerfectScore = latestSubmission && latestSubmission.score === questionCount;
    if (isPerfectScore) {
      if (latestSubmission.nft_minted) {
        response.status.hasCompletedQuiz = true;
        response.status.state = 'completed_and_minted';
        return NextResponse.json(response);
      } else {
        response.status.state = 'pending_mint';
        response.status.submissionId = latestSubmission.id;
        return NextResponse.json(response);
      }
    }

    // If not perfect score, but attempted in last 24 hours
    if (attemptsResult.rows.length > 0) {
      response.status.state = 'attempted_today';
      return NextResponse.json(response);
    }

    // Otherwise, allow another attempt
    response.status.state = 'not_attempted';
    return NextResponse.json(response);

  } catch (error) {
    console.error("Error checking quiz status:", error);
    return NextResponse.json({ 
      success: false, 
      error: "Failed to check quiz status" 
    }, { status: 500 });
  } finally {
    await pool.end();
  }
}