import { NextResponse } from "next/server";
import { Pool } from "pg";

export async function GET(
  _request: Request,
  context: { params: Promise<{ tokenId: string }> }
) {
  try {
    const rawTokenId = (await context.params).tokenId;
    const tokenId = rawTokenId.replace(/\.json$/, "");
    console.log(`Fetching Barabots metadata for token ID: ${tokenId}`);

    // Check if token has been paired with a transaction
    const pool = new Pool({
      connectionString: process.env.POSTGRES_URL,
    });

    let isPaired = false;
    try {
      const pairingResult = await pool.query(`
        SELECT * FROM barabots_metadata_updates
        WHERE token_id = $1 AND paired_at IS NOT NULL
        LIMIT 1
      `, [tokenId]);

      isPaired = pairingResult.rows.length > 0;
    } finally {
      await pool.end();
    }

    // Determine which metadata file to serve
    const metadataFilename = isPaired ? `${tokenId}-evolved.json` : `${tokenId}.json`;
    const blobUrl = `${process.env.BLOB_PUBLIC_URL || process.env.NEXT_PUBLIC_BLOB_PUBLIC_URL}/barabotsmetadata/${metadataFilename}`;

    console.log(`Token ${tokenId} is ${isPaired ? 'paired' : 'not paired'}, serving: ${metadataFilename}`);

    const response = await fetch(blobUrl, { next: { revalidate: 60 } }); // Revalidate every minute for dynamic updates

    if (!response.ok) {
      if (response.status === 404) {
        console.log(`Barabots metadata not found in Blob for token ID: ${tokenId} (${metadataFilename})`);
        return NextResponse.json({ error: "Metadata not found" }, { status: 404 });
      }
      throw new Error(`Failed to fetch blob content: ${response.status} ${response.statusText}`);
    }

    const metadata = await response.json();

    return NextResponse.json(metadata, {
      status: 200,
      headers: {
        'Cache-Control': 'public, max-age=300', // Cache for 5 minutes to allow dynamic updates
        'x-vercel-cache-tags': `barabots-metadata,barabots-metadata-${tokenId}`
      }
    });

  } catch (error) {
    console.error(`Error in Barabots metadata endpoint for token ${(await context.params).tokenId}:`, error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}