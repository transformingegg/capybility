import { NextResponse } from "next/server";
import { list } from '@vercel/blob';

export async function GET(
  _request: Request,
  context: { params: Promise<{ tokenId: string }> }
) {
  try {
    const tokenId = (await context.params).tokenId;
    console.log(`Fetching promotion metadata for token ID: ${tokenId}`);

    // Try to fetch from Vercel Blob
    const { blobs } = await list({
      prefix: `promotion-metadata/${tokenId}.json`,
    });

    if (blobs.length === 0) {
      console.log(`Promotion metadata not found in Blob for token ID: ${tokenId}`);
      return NextResponse.json({ error: "Metadata not found" }, { status: 404 });
    }

    const blobUrl = blobs[0].url;

    const response = await fetch(blobUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch blob content: ${response.status} ${response.statusText}`);
    }

    const metadata = await response.json();
    return NextResponse.json(metadata, {
      status: 200,
      headers: {
        'Cache-Control': 'public, max-age=31536000, immutable'
      }
    });

  } catch (error) {
    console.error("Error in promotion metadata endpoint:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}