import { NextResponse } from "next/server";
import { scrapeWebpage } from "@lib/scraper";

const HYPERBOLIC_API_KEY = process.env.HYPERBOLIC_API_KEY;

export async function POST(req: Request) {
  try {
    const { text, url } = await req.json();

    // Handle URL scraping
    if (url) {
      console.log("Scraping URL:", url);
      try {
        const scrapedText = await scrapeWebpage(url);
        return NextResponse.json({ scrapedText });
      } catch (error) {
        console.error("Scraping error:", error);
        return NextResponse.json({ error: "Failed to scrape webpage" }, { status: 500 });
      }
    }

    // Handle text analysis
    if (text) {
      console.log("Analyzing text:", text);
      try {
        const response = await fetch("https://api.hyperbolic.xyz/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${HYPERBOLIC_API_KEY}`,
          },
          body: JSON.stringify({
            model: "deepseek-ai/DeepSeek-V3",
            messages: [
              {
                role: "system",
                content: "You are an AI quiz creator that generates multiple-choice quizzes with answers to test understanding of given text.",
              },
              {
                role: "user",
                content: `Analyze the text below and create a 5-question multiple-choice quiz. Also generate a descriptive quiz name and 5 relevant tags. Return everything as a valid JSON object in the exact format shown below, with no additional text or commentary outside the JSON. Each question must have 4 choices, and "correctAnswer" must be the index (0-3) of the correct choice in the "choices" array. Example format:
{
  "quizName": "Introduction to Solar System",
  "tags": ["astronomy", "planets", "science", "space", "education"],
  "quiz": [
    {
      "question": "What is the capital of France?",
      "choices": ["Berlin", "Madrid", "Paris", "Rome"],
      "correctAnswer": 2
    },
    {
      "question": "Which planet is known as the Red Planet?",
      "choices": ["Earth", "Mars", "Jupiter", "Saturn"],
      "correctAnswer": 1
    }
  ]
}
The text to create the quiz from is:\n\n${text}`,
              },
            ],
            max_tokens: 512,
            temperature: 0.1,
            top_p: 0.9,
            stream: false,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error("API response not OK:", response.status, errorText);
          throw new Error(`API request failed with status ${response.status}: ${errorText}`);
        }

        const json = await response.json();
        console.log("API response:", JSON.stringify(json, null, 2));

        // Extract the content from the API response
        const content = json.choices?.[0]?.message?.content;
        if (!content) {
          throw new Error("API response missing 'choices' or 'message.content'");
        }

        // Return the raw content string without parsing
        return NextResponse.json({ analysis: content });
      } catch (error) {
        console.error("AI analysis error:", error);
        let errorMessage = "Failed to analyze text";
        if (error instanceof Error) {
          errorMessage += `: ${error.message}`;
        }
        return NextResponse.json({ error: errorMessage }, { status: 500 });
      }
    }

    return NextResponse.json({ error: "No valid input provided" }, { status: 400 });
  } catch (error) {
    console.error("Error processing request:", error);
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}