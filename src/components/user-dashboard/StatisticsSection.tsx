"use client";
import { useState } from "react";
import { sectionStyles, buttonStyles } from "@/utils/styles";
import Image from "next/image";

interface NFTRarityDistribution {
  [key: string]: number;
}

interface NFTInfo {
  tokenId: number;
  image: string;
}

interface Statistics {
  totalCompletions: number;
  rarityDistribution: NFTRarityDistribution;
  nfts: NFTInfo[];
}

export default function StatisticsSection({ address }: { address: `0x${string}` | undefined }) {
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showStatistics, setShowStatistics] = useState(false); // New state variable

  const fetchStatistics = async () => {
    if (!address) return;

    setIsLoading(true); // Start loading
    setError(null); // Clear any previous errors

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
        totalCompletions: nftsData.totalNFTs,
        rarityDistribution: nftsData.rarityDistribution,
        nfts: nftsData.nfts || [],
      });
    } catch (error) {
      console.error("Error fetching statistics:", error);
      setError(error instanceof Error ? error.message : "Unknown error occurred");
    } finally {
      setIsLoading(false); // Stop loading
    }
  };

  const handleGenerateStatistics = () => {
    setShowStatistics(true); // Show statistics
    fetchStatistics(); // Fetch statistics
  };

  const mostRecentNFT = statistics?.nfts?.length
    ? statistics.nfts.reduce((max, nft) => (nft.tokenId > max.tokenId ? nft : max), statistics.nfts[0])
    : null;

  return (
    <div className={sectionStyles}>
      <h2 className="text-2xl font-bold mb-4">My Statistics</h2>

      {!showStatistics ? (
        <button
          onClick={handleGenerateStatistics}
          className={buttonStyles}
        >
          Generate My Statistics
        </button>
      ) : isLoading ? (
        <div className={sectionStyles}>Loading statistics...</div>
      ) : error ? (
        <div className={sectionStyles}>Error loading statistics: {error}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Total Quiz Completion Mints</h3>
            <p className="text-3xl font-bold text-blue-600">{statistics?.totalCompletions || 0}</p>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">NFT Collection</h3>
            {statistics?.rarityDistribution && Object.keys(statistics.rarityDistribution).length > 0 ? (
              Object.entries(statistics.rarityDistribution)
                .sort(([, a], [, b]) => b - a)
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
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Recent Mint</h3>
            {mostRecentNFT ? (
              <div className="flex flex-col items-center">
                <Image
                  src={mostRecentNFT.image}
                  alt={`NFT #${mostRecentNFT.tokenId}`}
                  width={120}
                  height={120}
                  style={{ borderRadius: 12, boxShadow: "0 4px 24px rgba(0,0,0,0.2)" }}
                />
                <span className="mt-2 text-gray-700 font-medium">Token ID: {mostRecentNFT.tokenId}</span>
              </div>
            ) : (
              <p className="text-gray-500">No recent mint found</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}