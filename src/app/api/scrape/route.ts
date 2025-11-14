import { NextResponse } from "next/server";
import { scrapeWebpage } from "@/lib/scraper";

// Temporarily use nodejs runtime to avoid edge runtime issues
export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const { url } = await req.json();

    if (url) {
      console.log("Scraping URL:", url);
      try {
        const scrapedText = await scrapeWebpage(url);
        return NextResponse.json({ scrapedText });
      } catch (error) {
        console.error("Scraping error:", error);
        const errorMessage = error instanceof Error ? error.message : "Unknown scraping error";
        return NextResponse.json({ error: `Failed to scrape webpage: ${errorMessage}` }, { status: 500 });
      }
    }

    return NextResponse.json({ error: "No URL provided" }, { status: 400 });
  } catch (error) {
    console.error("Error processing request:", error);
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}