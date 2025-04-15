import { NextResponse } from "next/server";
import { list } from '@vercel/blob';

export async function GET(
  _request: Request,
  context: { params: Promise<{ tokenId: string }> }
) {
  try {
    const tokenId = (await context.params).tokenId;
    
    console.log(`Fetching quiz creator metadata for token ID: ${tokenId}`);
    
    try {
      // Try to fetch from Vercel Blob by listing blobs with this prefix
      const { blobs } = await list({
        prefix: `quizcreatormetadata/${tokenId}.json`,
      });
      
      if (blobs.length === 0) {
        console.log(`Quiz creator metadata not found for token ID: ${tokenId}`);
        return NextResponse.json({ error: "Metadata not found" }, { status: 404 });
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
      console.error(`Error retrieving quiz creator metadata for token ${tokenId}:`, error);
      return NextResponse.json({ error: "Failed to retrieve metadata" }, { status: 500 });
    }
  } catch (error) {
    console.error("Error in quiz creator metadata endpoint:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}