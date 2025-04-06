import { NextResponse } from "next/server";
import { Pool } from "pg";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get("address");

  if (!address) {
    return NextResponse.json({ success: false, error: "No address provided" }, { status: 400 });
  }

  const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
  });

  try {
    const result = await pool.query(
      "SELECT COUNT(*) as count FROM quiz_submissions WHERE wallet_address = $1",
      [address]
    );
    
    return NextResponse.json({ 
      success: true, 
      completions: parseInt(result.rows[0].count) 
    });
  } catch (error) {
    console.error("Error fetching completions:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch completions" }, { status: 500 });
  } finally {
    await pool.end();
  }
}