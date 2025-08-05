"use client";
import { useState } from "react";
import { sectionStyles, buttonStyles } from "@/utils/styles";

interface PromotionStats {
  qualifyingQuizzes: number;
  qualifyingQuizCompletions: number;
}

export default function PromotionSection({ address }: { address: `0x${string}` | undefined }) {
  const [promotionStats, setPromotionStats] = useState<PromotionStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPromotion, setShowPromotion] = useState(false);

  const fetchPromotionStats = async () => {
    if (!address) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/get-promotion-stats?address=${address}`);
      const data = await response.json();

      if (data.success) {
        setPromotionStats(data.stats);
      } else {
        throw new Error(data.error || "Failed to fetch promotion statistics");
      }
    } catch (error) {
      console.error("Error fetching promotion statistics:", error);
      setError(error instanceof Error ? error.message : "Unknown error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckExpertStatus = () => {
    setShowPromotion(true);
    fetchPromotionStats();
  };

  const getProgressBarWidth = (value: number, max: number): string => {
    const percentage = (value / max) * 100;
    return `${Math.min(percentage, 100)}%`; // Ensure it doesn't exceed 100%
  };

  return (
    <div className={sectionStyles}>
      <h2 className="text-2xl font-bold mb-4">Promotion (EDUCHAIN EXPERT)</h2>

      {!showPromotion ? (
        <button
          onClick={handleCheckExpertStatus}
          className={buttonStyles}
        >
          CHECK EDUCHAIN EXPERT STATUS
        </button>
      ) : isLoading ? (
        <div>Loading EDUCHAIN expert status...</div>
      ) : error ? (
        <div>Error loading EDUCHAIN expert status: {error}</div>
      ) : promotionStats ? (
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">Qualifying Quizzes (10 required)</h3>
            <div className="bg-gray-200 rounded-full h-4 relative">
              <div
                className="bg-green-500 rounded-full h-4 absolute top-0 left-0"
                style={{ width: getProgressBarWidth(promotionStats.qualifyingQuizzes, 10) }}
              ></div>
              <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-xs font-bold text-white">
                {promotionStats.qualifyingQuizzes} / 10
              </span>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Qualifying Quiz Completions (50 required)</h3>
            <div className="bg-gray-200 rounded-full h-4 relative">
              <div
                className="bg-green-500 rounded-full h-4 absolute top-0 left-0"
                style={{ width: getProgressBarWidth(promotionStats.qualifyingQuizCompletions, 50) }}
              ></div>
              <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-xs font-bold text-white">
                {promotionStats.qualifyingQuizCompletions} / 50
              </span>
            </div>
          </div>
        </div>
      ) : (
        <p>No promotion statistics available.</p>
      )}
    </div>
  );
}