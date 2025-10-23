import { NextResponse } from "next/server";
import { Pool } from "pg";
import { getSession } from "@/lib/session";

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: process.env.POSTGRES_URL?.includes('localhost')
    ? false
    : { rejectUnauthorized: false },
});

export async function GET() {
  try {
    // Verify admin authentication
    const session = await getSession();
    if (!session || !session.isAdmin) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // Query to get all referrers and count of their referrals (only counting those who completed at least one quiz)
    const query = `
      SELECT 
        r.referer,
        COUNT(DISTINCT r.referee) as referral_count
      FROM referrals r
      WHERE EXISTS (
        SELECT 1 
        FROM quiz_submissions qs 
        WHERE qs.wallet_address = r.referee
      )
      GROUP BY r.referer
      ORDER BY referral_count DESC, r.referer ASC
    `;

    const result = await pool.query(query);
    
    return NextResponse.json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error('Error fetching referral stats:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch referral statistics' },
      { status: 500 }
    );
  }
}