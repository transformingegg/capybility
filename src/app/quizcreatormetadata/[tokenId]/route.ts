import { NextResponse } from "next/server";
import { Pool } from "pg";

export async function GET(
  request: Request,
  { params }: { params: { tokenId: string } }
) {
  try {
    const pool = new Pool({
      connectionString: process.env.POSTGRES_URL,
    });

    const result = await pool.query(
      'SELECT json_data FROM nft_metadata WHERE token_id = $1 AND metadata_type = $2',
      [params.tokenId, 'quizcreator']
    );

    await pool.end();

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Metadata not found" }, { status: 404 });
    }

    return NextResponse.json(result.rows[0].json_data);
  } catch (error) {
    console.error("Error serving metadata:", error);
    return NextResponse.json({ error: "Failed to serve metadata" }, { status: 500 });
  }
}