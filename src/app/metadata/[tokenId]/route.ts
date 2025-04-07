import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { type NextRequest } from "next/server";

interface RouteParams {
  tokenId: string;
}

// Updated handler with proper typing for Route Handlers in Next.js 13+
export async function GET(
  _request: NextRequest,  // Added underscore to indicate unused parameter
  context: { params: RouteParams }
) {
  const { tokenId } = context.params;

  try {
    const metadataPath = path.join(process.cwd(), "public", "metadata", `${tokenId}.json`);
    if (!fs.existsSync(metadataPath)) {
      return NextResponse.json({ error: "Metadata not found" }, { status: 404 });
    }

    const metadata = JSON.parse(fs.readFileSync(metadataPath, "utf-8"));
    return NextResponse.json(metadata);
  } catch (error) {
    console.error("Error serving metadata:", error);
    return NextResponse.json({ error: "Failed to serve metadata" }, { status: 500 });
  }
}