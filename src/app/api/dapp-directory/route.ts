import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  const dirPath = path.join(process.cwd(), "src", "dirjson");
   const files = fs.readdirSync(dirPath)
    .filter((f) => /^\d+.*\.json$/.test(f))
    .sort((a, b) => {
      // Sort by leading number in filename
      const numA = parseInt(a.split(".")[0], 10);
      const numB = parseInt(b.split(".")[0], 10);
      return numA - numB;
    });

  const dapps = files.map((file) => {
    const filePath = path.join(dirPath, file);
    const raw = fs.readFileSync(filePath, "utf-8");
    try {
      const json = JSON.parse(raw);
      // If array, take first element
      return { ...json[0], _filename: file };
    } catch {
      return null;
    }
  }).filter(Boolean);

  return NextResponse.json(dapps);
}
