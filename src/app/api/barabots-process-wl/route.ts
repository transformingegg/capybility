import { NextResponse } from "next/server";
import { Pool } from "pg";

const API_KEY = process.env.BARABOTS_PROCESS_API_KEY;

interface BarabotsQuiz {
  id: string;
  wallet_address: string;
  barabots_category: string;
}

export async function POST(request: Request) {
  // Check API key for security
  const authHeader = request.headers.get('authorization');
  const providedKey = authHeader?.replace('Bearer ', '');

  if (!providedKey || providedKey !== API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return processWL();
}

export async function GET(request: Request) {
  // Cron job endpoint - only accepts requests from Vercel cron
  const userAgent = request.headers.get('user-agent') || '';
  const isVercelCron = userAgent.includes('vercel-cron');

  if (!isVercelCron) {
    return NextResponse.json({ error: 'Unauthorized - cron only' }, { status: 401 });
  }

  return processWL();
}

async function processWL() {
  const startTime = Date.now();
  console.log(`[${new Date().toISOString()}] Starting Barabots WL processing...`);

  const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
  });

  try {
    // Find expired Barabots quizzes that haven't been processed
    const expiredQuizzes = await pool.query(`
      SELECT id, wallet_address, barabots_category, barabots_duration_days
      FROM quizzes
      WHERE is_barabots_quiz = true
        AND barabots_processed = false
        AND barabots_end_date < NOW()
    `);

    console.log(`[${new Date().toISOString()}] Found ${expiredQuizzes.rows.length} expired Barabots quizzes to process`);

    if (expiredQuizzes.rows.length === 0) {
      console.log(`[${new Date().toISOString()}] No quizzes to process, exiting early`);
      return NextResponse.json({
        success: true,
        processed: 0,
        message: 'No expired quizzes to process'
      });
    }

    let totalProcessed = 0;
    let totalWLDistributed = 0;

    for (const quiz of expiredQuizzes.rows) {
      try {
        const result = await processBarabotsQuiz(pool, quiz);
        totalProcessed++;
        totalWLDistributed += result.wlDistributed;
        console.log(`[${new Date().toISOString()}] Processed quiz ${quiz.id}: ${result.completers} completers, ${result.wlDistributed} WL spots`);
      } catch (error) {
        console.error(`[${new Date().toISOString()}] Error processing quiz ${quiz.id}:`, error);
        // Continue processing other quizzes even if one fails
      }
    }

    const duration = Date.now() - startTime;
    console.log(`[${new Date().toISOString()}] Barabots WL processing completed in ${duration}ms. Processed: ${totalProcessed}, WL distributed: ${totalWLDistributed}`);

    return NextResponse.json({
      success: true,
      processed: totalProcessed,
      wlDistributed: totalWLDistributed,
      duration: `${duration}ms`
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[${new Date().toISOString()}] Barabots WL processing failed after ${duration}ms:`, error);
    return NextResponse.json({
      success: false,
      error: (error as Error).message,
      duration: `${duration}ms`
    }, { status: 500 });
  } finally {
    await pool.end();
  }
}

async function processBarabotsQuiz(pool: Pool, quiz: BarabotsQuiz) {
  const { id: quizId, wallet_address: creatorAddress, barabots_category: category } = quiz;

  // Get perfect completers (score = 5)
  const completersResult = await pool.query(`
    SELECT wallet_address
    FROM quiz_submissions
    WHERE quiz_id = $1 AND score = 5
  `, [quizId]);

  const completers = completersResult.rows.map(row => row.wallet_address);
  const completerCount = completers.length;

  let wlDistributed = 0;

  if (completerCount >= 3) {
    // Creator gets free WL
    await pool.query(`
      INSERT INTO barabots_free_wl (wallet_address, category, added_by, notes)
      VALUES ($1, $2, 'system', $3)
    `, [creatorAddress, category, `Barabots quiz creator reward - 3+ participants (Quiz ID: ${quizId})`]);
    wlDistributed++;

    // 1/3 of completers get discount WL (random)
    const discountCount = Math.floor(completerCount / 3);
    const shuffledCompleters = [...completers].sort(() => Math.random() - 0.5);
    const discountWinners = shuffledCompleters.slice(0, discountCount);

    for (const winner of discountWinners) {
      await pool.query(`
        INSERT INTO barabots_discount_wl (wallet_address, category, added_by, notes)
        VALUES ($1, $2, 'system', $3)
      `, [winner, category, `Barabots quiz completion reward - 3+ participants (Quiz ID: ${quizId})`]);
      wlDistributed++;
    }

    // 1 remaining completer gets free WL
    const remainingCompleters = shuffledCompleters.slice(discountCount);
    if (remainingCompleters.length > 0) {
      const freeWinner = remainingCompleters[Math.floor(Math.random() * remainingCompleters.length)];
      await pool.query(`
        INSERT INTO barabots_free_wl (wallet_address, category, added_by, notes)
        VALUES ($1, $2, 'system', $3)
      `, [freeWinner, category, `Barabots quiz completion reward - free winner (Quiz ID: ${quizId})`]);
      wlDistributed++;
    }

  } else if (completerCount > 0) {
    // Creator gets discount WL
    await pool.query(`
      INSERT INTO barabots_discount_wl (wallet_address, category, added_by, notes)
      VALUES ($1, $2, 'system', $3)
    `, [creatorAddress, category, `Barabots quiz creator reward - <3 participants (Quiz ID: ${quizId})`]);
    wlDistributed++;
  }

  // Mark quiz as processed
  await pool.query(`
    UPDATE quizzes SET barabots_processed = true WHERE id = $1
  `, [quizId]);

  return { completers: completerCount, wlDistributed };
}