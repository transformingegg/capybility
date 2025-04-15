import { NextResponse } from "next/server";
import { Pool } from "pg";

export async function POST(request: Request) {
  try {
    const { quizId, walletAddress, mintTimestamp } = await request.json();

    // Validate required fields
    if (!quizId || !walletAddress || !mintTimestamp) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const pool = new Pool({
      connectionString: process.env.POSTGRES_URL,
    });

    try {
      // First check if this user has a perfect score for this quiz
      const perfectScoreCheck = await pool.query(
        `SELECT * FROM quiz_submissions 
         WHERE quiz_id = $1 
         AND wallet_address = $2 
         AND score = (
           SELECT JSONB_ARRAY_LENGTH(quiz_data->'quiz') 
           FROM quizzes 
           WHERE id = $1
         )`,
        [quizId, walletAddress]
      );

      if (perfectScoreCheck.rows.length === 0) {
        return NextResponse.json(
          { 
            success: false, 
            error: "No perfect score submission found for this quiz" 
          },
          { status: 404 }
        );
      }

      // Update the submission record to mark NFT as minted
      const updateResult = await pool.query(
        `UPDATE quiz_submissions 
         SET nft_minted = true, mint_timestamp = $3 
         WHERE quiz_id = $1 
         AND wallet_address = $2 
         AND score = (
           SELECT JSONB_ARRAY_LENGTH(quiz_data->'quiz') 
           FROM quizzes 
           WHERE id = $1
         )
         RETURNING *`,
        [quizId, walletAddress, mintTimestamp]
      );

      if (updateResult.rows.length === 0) {
        return NextResponse.json(
          { 
            success: false, 
            error: "Failed to update record" 
          },
          { status: 500 }
        );
      }

      return NextResponse.json({ 
        success: true,
        message: "NFT mint recorded successfully"
      });
    } catch (dbError) {
      console.error("Database error recording mint:", dbError);
      return NextResponse.json(
        { 
          success: false, 
          error: "Database error recording mint" 
        },
        { status: 500 }
      );
    } finally {
      await pool.end();
    }
  } catch (error) {
    console.error("Error recording mint:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to process request" 
      },
      { status: 500 }
    );
  }
}