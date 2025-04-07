import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { type NextRequest } from "next/server";

// Define the params interface
interface RouteParams {
  params: {
    tokenId: string;
  };
}

// Updated handler with proper typing
export async function GET(
  _request: NextRequest,  // Unused parameter with underscore
  { params }: RouteParams // Destructure params directly
) {
  const { tokenId } = params;

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