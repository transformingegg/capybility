"use client";
import { useState } from "react";

interface DeepSeekAnalysisProps {
  extractedText: string;
  onAnalysisFetched: (analysis: string) => void; // Add this prop to the interface
}

export default function DeepSeekAnalysis({ extractedText, onAnalysisFetched }: DeepSeekAnalysisProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleAnalyze = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/scrape", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: extractedText }),
      });
      const data = await response.json();
      
      // Clean the analysis to remove introductory text, ```json, and closing ```
      let cleanedAnalysis = data.analysis
        .trim() // Remove leading/trailing whitespace
        .replace(/Here is the quiz in the requested JSON format:\s*/i, "") // Remove the introductory text (case-insensitive)
        .replace(/^```json\s*|\s*```$/g, ""); // Remove ```json at start and ``` at end (with optional whitespace)

      // Ensure we only keep the JSON content by finding the first { and last } of the JSON object
      const jsonStart = cleanedAnalysis.indexOf("{");
      const jsonEnd = cleanedAnalysis.lastIndexOf("}") + 1;
      if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        cleanedAnalysis = cleanedAnalysis.slice(jsonStart, jsonEnd);
      }

      console.log("Cleaned analysis:", cleanedAnalysis); // Debug log to verify cleaning

      onAnalysisFetched(cleanedAnalysis); // Update the parent component's state with cleaned JSON
    } catch (error) {
      console.error("Error:", error);
      onAnalysisFetched("Failed to analyze the text. Please try again.");
    }
    setIsLoading(false);
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <button
        onClick={handleAnalyze}
        disabled={isLoading || !extractedText}
        className="bg-gaBlue text-white p-2 rounded-md hover:bg-gaBlue/90 disabled:bg-gaBlue/50 w-full"
      >
        {isLoading ? "Analyzing..." : "Analyze with DeepSeek V3"}
      </button>
    </div>
  );
}