import { NextResponse } from "next/server";
import { list } from '@vercel/blob';
import { Pool } from "pg";

export async function GET(
  _request: Request,
  context: { params: Promise<{ tokenId: string }> }
) {
  try {
    const tokenId = (await context.params).tokenId;
    
    console.log(`Fetching metadata for token ID: ${tokenId}`);
    
    try {
      // Try to fetch from Vercel Blob by listing blobs with this prefix
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
      
      const blobUrl = blobs[0].url;
      
      // Fetch the actual content from the URL
      const response = await fetch(blobUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch blob content: ${response.status} ${response.statusText}`);
      }
      
      // Return the content with appropriate headers
      const contentType = response.headers.get('content-type') || 'application/json';
      const content = await response.arrayBuffer();
      
      return new Response(content, {
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=31536000, immutable'
        }
      });
      
    } catch (error) {
      console.error(`Error retrieving metadata for token ${tokenId}:`, error);
      
      // Try database as fallback
      try {
        console.log(`Error retrieving from Blob, trying database fallback...`);
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
      } catch (dbError) {
        console.error(`Database fallback also failed:`, dbError);
        return NextResponse.json({ error: "Failed to retrieve metadata" }, { status: 500 });
      }
    }
  } catch (error) {
    console.error("Error in metadata endpoint:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}