"use client";
import { useState, useEffect } from "react";
import { sectionStyles } from "@/utils/styles";

interface NFTRarityDistribution {
  [key: string]: number;
}

interface Statistics {
  totalCompletions: number;
  rarityDistribution: NFTRarityDistribution;
}

export default function StatisticsSection({ address }: { address: `0x${string}` | undefined }) {
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStatistics = async () => {
      if (!address) return;

      try {
        // Get total completions
        const completionsResponse = await fetch(`/api/user-stats/completions?address=${address}`);
        const completionsData = await completionsResponse.json();
        console.log("Completions data:", completionsData);

        // Get NFT metadata for rarity distribution
        const nftsResponse = await fetch(`/api/user-stats/nfts?address=${address}`);
        const nftsData = await nftsResponse.json();
        console.log("NFTs data:", nftsData);

        if (!nftsData.success) {
          throw new Error(nftsData.error || "Failed to fetch NFT data");
        }

        setStatistics({
          totalCompletions: completionsData.completions,
          rarityDistribution: nftsData.rarityDistribution
        });
      } catch (error) {
        console.error("Error fetching statistics:", error);
        setError(error instanceof Error ? error.message : "Unknown error occurred");
      } finally {
        setIsLoading(false);
      }
    };

    fetchStatistics();
  }, [address]);

  if (isLoading) return <div className={sectionStyles}>Loading statistics...</div>;
  if (error) return <div className={sectionStyles}>Error loading statistics: {error}</div>;

  return (
    <div className={sectionStyles}>
      <h2 className="text-2xl font-bold mb-4">My Statistics</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Total Completions</h3>
          <p className="text-3xl font-bold text-blue-600">
            {statistics?.totalCompletions || 0}
          </p>
        </div>

        <div className="p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">NFT Collection</h3>
          {statistics?.rarityDistribution && Object.keys(statistics.rarityDistribution).length > 0 ? (
            Object.entries(statistics.rarityDistribution)
              .sort(([,a], [,b]) => b - a)
              .map(([rarity, count]) => (
                <div key={rarity} className="flex justify-between items-center mb-2">
                  <span className="font-medium">{rarity}:</span>
                  <span className="text-blue-600 font-bold">{count}</span>
                </div>
              ))
          ) : (
            <p className="text-gray-500">No NFTs found</p>
          )}
        </div>
      </div>
    </div>
  );
}