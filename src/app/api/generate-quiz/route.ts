import { NextResponse } from "next/server";

export const runtime = 'edge';
export const region = 'iad1';

const HYPERBOLIC_API_KEY = process.env.HYPERBOLIC_API_KEY;

async function fetchWithRetry(url: string, options: RequestInit, retries = 2, delayMs = 500): Promise<Response> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const response = await fetch(url, options);
    if (response.ok) return response;
    if (attempt < retries) {
      console.warn(`API call failed (attempt ${attempt + 1}), retrying...`);
      await new Promise(res => setTimeout(res, delayMs));
    } else {
      const errorText = await response.text();
      throw new Error(`API request failed with status ${response.status}: ${errorText}`);
    }
  }
  throw new Error("Unexpected error in fetchWithRetry");
}

export async function POST(req: Request) {
  try {
    const { text } = await req.json();

    if (!text) {
        return NextResponse.json({ error: "No text provided for analysis" }, { status: 400 });
    }

    console.log("Analyzing text for quiz generation...");
    try {
      const apiUrl = "https://api.hyperbolic.xyz/v1/chat/completions";
      const fetchOptions = {
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
          max_tokens: 1024,
          temperature: 0.1,
          top_p: 0.9,
          stream: false,
        }),
      };

      const response = await fetchWithRetry(apiUrl, fetchOptions, 2, 500);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("API response not OK:", response.status, errorText);
        throw new Error(`API request failed with status ${response.status}: ${errorText}`);
      }

      const json = await response.json();
      console.log("API response:", JSON.stringify(json, null, 2));

      const content = json.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error("API response missing 'choices' or 'message.content'");
      }
      
      let quizData;
      try {
        // The AI sometimes returns a JSON object enclosed in ```json ... ```, so we need to strip that.
        const jsonString = content.replace(/```json\n?|```/g, '').trim();
        quizData = JSON.parse(jsonString);
      } catch {
        console.error("Failed to parse AI response as JSON:", content);
        throw new Error("AI returned invalid JSON format.");
      }

      return NextResponse.json({ quiz: quizData });
    } catch (error) {
      console.error("AI analysis error:", error);
      let errorMessage = "Failed to analyze text";
      if (error instanceof Error) {
        errorMessage += `: ${error.message}`;
      }
      return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
  } catch (error) {
    console.error("Error processing request:", error);
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
