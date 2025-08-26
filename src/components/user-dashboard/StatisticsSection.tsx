"use client";
import { useState } from "react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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
  const [showStatistics, setShowStatistics] = useState(false);

  const fetchStatistics = async () => {
    if (!address) return;

    setIsLoading(true);
    setError(null);

    try {
      const completionsResponse = await fetch(`/api/user-stats/completions?address=${address}`);
      const completionsData = await completionsResponse.json();
      console.log("Completions data:", completionsData);

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
      setIsLoading(false);
    }
  };

  const handleGenerateStatistics = () => {
    setShowStatistics(true);
    fetchStatistics();
  };

  const mostRecentNFT = statistics?.nfts?.length
    ? statistics.nfts.reduce((max, nft) => (nft.tokenId > max.tokenId ? nft : max), statistics.nfts[0])
    : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Statistics</CardTitle>
      </CardHeader>
      <CardContent>
        {!showStatistics ? (
          <Button onClick={handleGenerateStatistics}>
            Generate My Statistics
          </Button>
        ) : isLoading ? (
          <p>Loading statistics...</p>
        ) : error ? (
          <p>Error loading statistics: {error}</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Total Mints</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{statistics?.totalCompletions || 0}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">NFT Collection</CardTitle>
              </CardHeader>
              <CardContent>
                {statistics?.rarityDistribution && Object.keys(statistics.rarityDistribution).length > 0 ? (
                  Object.entries(statistics.rarityDistribution)
                    .sort(([, a], [, b]) => b - a)
                    .map(([rarity, count]) => (
                      <div key={rarity} className="flex justify-between items-center mb-1 text-sm">
                        <span className="font-medium">{rarity}:</span>
                        <span className="font-bold">{count}</span>
                      </div>
                    ))
                ) : (
                  <p className="text-sm text-muted-foreground">No NFTs found</p>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Most Recent Mint</CardTitle>
              </CardHeader>
              <CardContent>
                {mostRecentNFT ? (
                  <div className="flex flex-col items-center">
                    <Image
                      src={mostRecentNFT.image}
                      alt={`NFT #${mostRecentNFT.tokenId}`}
                      width={120}
                      height={120}
                      className="rounded-lg shadow-md"
                    />
                    <span className="mt-2 text-sm text-muted-foreground">Token ID: {mostRecentNFT.tokenId}</span>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No recent mint found</p>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </CardContent>
    </Card>
  );
}