import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET(request: Request, { params }: { params: { tokenId: string } }) {
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