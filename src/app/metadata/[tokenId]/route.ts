import { NextResponse } from "next/server";
import { list } from '@vercel/blob';
import { Pool } from "pg";

export async function GET(
  _request: Request,
  context: { params: Promise<{ tokenId: string }> }
) {
  try {
    const rawTokenId = (await context.params).tokenId;
    const tokenId = rawTokenId.replace(/\.json$/, "");    // Try to fetch from Vercel Blob by listing blobs with this prefix
    console.log(`Fetching metadata for token ID: ${tokenId}`);

    const { blobs } = await list({
      prefix: `metadata/${tokenId}.json`,
    });

    if (blobs.length === 0) {
      console.log(`Metadata not found in Blob for token ID: ${tokenId}, checking database...`);
      // Fallback to database
      const pool = new Pool({
        connectionString: process.env.POSTGRES_URL,
      });

      const result = await pool.query(
        'SELECT json_data FROM nft_metadata WHERE token_id = $1 AND metadata_type = $2',
        [tokenId, 'quiz']
      );

      await pool.end();

      if (result.rows.length === 0) {
        return NextResponse.json({ error: "Metadata not found" }, { status: 404 });
      }

      return NextResponse.json(result.rows[0].json_data);
    }

    // Fetch the actual content from the URL
    const blobUrl = blobs[0].url;
    const response = await fetch(blobUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch blob content: ${response.status} ${response.statusText}`);
    }

    // Parse and return as JSON
    const metadata = await response.json();
    return NextResponse.json(metadata, {
      status: 200,
      headers: {
        'Cache-Control': 'public, max-age=31536000, immutable'
      }
    });

  } catch (error) {
    console.error("Error in metadata endpoint:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}