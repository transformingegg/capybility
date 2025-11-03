import { NextResponse } from "next/server";
import { Pool } from "pg";
import { readFile } from "fs/promises";
import { join } from "path";

export async function GET(
  _request: Request,
  context: { params: Promise<{ tokenId: string }> }
) {
  try {
    const tokenId = (await context.params).tokenId;
    console.log(`Fetching Barabots image for token ID: ${tokenId}`);

    // Check if token has been paired with a transaction
    const pool = new Pool({
      connectionString: process.env.POSTGRES_URL,
    });

    let isPaired = false;
    let category = '';
    
    try {
      const pairingResult = await pool.query(`
        SELECT * FROM barabots_metadata_updates
        WHERE token_id = $1
        LIMIT 1
      `, [tokenId]);

      if (pairingResult.rows.length > 0) {
        isPaired = pairingResult.rows[0].paired_at !== null;
        category = pairingResult.rows[0].category;
      }
    } finally {
      await pool.end();
    }

    // If no database entry, fetch from blob metadata to get category
    if (!category) {
      const metadataFilename = `${tokenId}.json`;
      const blobUrl = `${process.env.BLOB_PUBLIC_URL || process.env.NEXT_PUBLIC_BLOB_PUBLIC_URL}/barabotsmetadata/${metadataFilename}`;
      
      const response = await fetch(blobUrl);
      if (response.ok) {
        const metadata = await response.json();
        category = metadata.attributes?.find((attr: { trait_type: string; value: string }) => attr.trait_type === 'Category')?.value || '';
      }
    }

    if (!category) {
      return NextResponse.json({ error: "Category not found for token" }, { status: 404 });
    }

    const categoryLower = category.toLowerCase();
    let imagePath: string;
    
    if (isPaired) {
      // Get rarity from evolved metadata
      const evolvedMetadataFilename = `${tokenId}-evolved.json`;
      const blobUrl = `${process.env.BLOB_PUBLIC_URL || process.env.NEXT_PUBLIC_BLOB_PUBLIC_URL}/barabotsmetadata/${evolvedMetadataFilename}`;
      
      const response = await fetch(blobUrl);
      if (!response.ok) {
        return NextResponse.json({ error: "Evolved metadata not found" }, { status: 404 });
      }
      
      const evolvedMetadata = await response.json();
      const rarity = evolvedMetadata.attributes?.find((attr: { trait_type: string; value: string }) => attr.trait_type === 'Rarity')?.value?.toLowerCase() || 'base';
      
      imagePath = join(process.cwd(), 'public', 'barabotsmetadata', 'img', `barabot-${categoryLower}-${rarity}.png`);
      console.log(`Token ${tokenId} is evolved (${category} ${rarity}), serving: barabot-${categoryLower}-${rarity}.png`);
    } else {
      // Serve crate image
      imagePath = join(process.cwd(), 'public', 'barabotsmetadata', 'img', `crate-${categoryLower}.png`);
      console.log(`Token ${tokenId} is crate (${category}), serving: crate-${categoryLower}.png`);
    }

    // Read and serve the image file
    const imageBuffer = await readFile(imagePath);
    
    return new NextResponse(new Uint8Array(imageBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'no-cache, no-store, must-revalidate', // Don't cache to always show fresh images
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

  } catch (error) {
    console.error(`Error in Barabots image endpoint for token ${(await context.params).tokenId}:`, error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
