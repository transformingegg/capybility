import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  context: { params: Promise<{ tokenId: string }> }
) {
  try {
    const rawTokenId = (await context.params).tokenId;
    const tokenId = rawTokenId.replace(/\.json$/, "");
    console.log(`Fetching metadata for token ID: ${tokenId}`);

    const blobUrl = `${process.env.BLOB_PUBLIC_URL || process.env.NEXT_PUBLIC_BLOB_PUBLIC_URL}/metadata/${tokenId}.json`;
    console.log(`Attempting to fetch metadata from blob URL: ${blobUrl}`);

    const response = await fetch(blobUrl, { next: { revalidate: 3600 } }); // Revalidate cache every hour

    if (!response.ok) {
      if (response.status === 404) {
        console.log(`Metadata not found in Blob for token ID: ${tokenId}`);
        return NextResponse.json({ error: "Metadata not found" }, { status: 404 });
      }
      // For other errors (500, etc.), log the status and throw
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
    console.error(`Error in metadata endpoint for token ${(await context.params).tokenId}:`, error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}