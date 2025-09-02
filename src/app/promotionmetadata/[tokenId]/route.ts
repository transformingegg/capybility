import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  context: { params: Promise<{ tokenId: string }> }
) {
  try {
    const tokenId = (await context.params).tokenId;
    console.log(`Fetching promotion metadata for token ID: ${tokenId}`);

    // Fetch the blob directly by URL
    const blobUrl = `${process.env.BLOB_PUBLIC_URL || process.env.NEXT_PUBLIC_BLOB_PUBLIC_URL}/promotion-metadata/${tokenId}.json`;
    const response = await fetch(blobUrl);
    if (response.status === 404) {
      console.log(`Promotion metadata not found in Blob for token ID: ${tokenId}`);
      return NextResponse.json({ error: "Metadata not found" }, { status: 404 });
    }
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