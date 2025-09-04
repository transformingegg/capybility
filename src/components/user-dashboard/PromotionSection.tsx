"use client";
import { useState, useEffect } from "react";
import { useReadContract, useWriteContract } from "wagmi";
import { ethers } from "ethers";
import MintSuccessPopup from "@/components/MintSuccessPopup";
import { useRouter } from "next/navigation";
import Image from "next/image";
import BadgeSubmissionSection from './BadgeSubmissionSection';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface PromotionStats {
  qualifyingQuizzes: number;
  qualifyingQuizCompletions: number;
}

const PROMOTION_NFT_ADDRESS = process.env.NEXT_PUBLIC_PROMOTION_NFT_ADDRESS as `0x${string}`;

const PROMOTION_NFT_ABI = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "internalType": "string",
        "name": "promotionType",
        "type": "string"
      },
      {
        "internalType": "bytes",
        "name": "signature",
        "type": "bytes"
      }
    ],
    "name": "mint",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "internalType": "string",
        "name": "promotionType",
        "type": "string"
      }
    ],
    "name": "hasMintedPromotionType",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "user", "type": "address" },
      { "indexed": true, "internalType": "uint256", "name": "tokenId", "type": "uint256" },
      { "indexed": false, "internalType": "string", "name": "promotionType", "type": "string" }
    ],
    "name": "PromotionMinted",
    "type": "event"
  }
];

export default function PromotionSection({ address }: { address: `0x${string}` | undefined }) {
  const [promotionStats, setPromotionStats] = useState<PromotionStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPromotion, setShowPromotion] = useState(false);
  const [hasQualified, setHasQualified] = useState(false);
  const [isMinting, setIsMinting] = useState(false);
  const [showMintSuccess, setShowMintSuccess] = useState(false);
  const [nftImageUrl, setNftImageUrl] = useState<string>("");
  const router = useRouter();
  const { writeContractAsync: mintPromotionNFT } = useWriteContract();
  const promotionType = "Educhain Expert";
  const [hasMinted, setHasMinted] = useState(false);

  const { data: hasMintedData, refetch: refetchHasMinted } = useReadContract({
    address: PROMOTION_NFT_ADDRESS,
    abi: PROMOTION_NFT_ABI,
    functionName: 'hasMintedPromotionType',
    args: [address, promotionType],
  });

  useEffect(() => {
    if (hasMintedData !== undefined) {
      setHasMinted(Boolean(hasMintedData));
    }
  }, [hasMintedData]);

  useEffect(() => {
    if (address) {
      refetchHasMinted();
    }
  }, [address, refetchHasMinted]);

  useEffect(() => {
    if (promotionStats && promotionStats.qualifyingQuizzes >= 10 && promotionStats.qualifyingQuizCompletions >= 50) {
      setHasQualified(true);
    } else {
      setHasQualified(false);
    }
  }, [promotionStats]);

  const fetchPromotionStats = async () => {
    if (!address) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/get-promotion-stats?address=${address}`);
      const data = await response.json();

      if (data.success) {
        setPromotionStats(data.stats);
        refetchHasMinted();
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

  const handleMintPromotion = async () => {
    if (!address) {
      alert("Please connect your wallet.");
      return;
    }

    setIsMinting(true);
    try {
      const signResponse = await fetch("/api/sign-promotion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletAddress: address,
          promotionType: promotionType,
        }),
      });

      const signData = await signResponse.json();
      if (!signData.success) {
        throw new Error("Failed to get signature");
      }

      const tx = await mintPromotionNFT({
        address: PROMOTION_NFT_ADDRESS,
        abi: PROMOTION_NFT_ABI,
        functionName: "mint",
        args: [address, promotionType, signData.signature],
      }) as string | { hash: string };

      let txHash: string;
      if (typeof tx === "string") {
        txHash = tx;
      } else if (typeof tx === "object" && tx !== null && "hash" in tx && typeof tx.hash === "string") {
        txHash = tx.hash;
      } else {
        throw new Error("mintPromotionNFT did not return a valid transaction hash.");
      }

      const provider = new ethers.JsonRpcProvider("https://rpc.edu-chain.raas.gelato.cloud/");
      const receipt = await provider.getTransactionReceipt(txHash);

      if (!receipt) {
        throw new Error("Transaction not confirmed. Please check the explorer.");
      }

      const contract = new ethers.Contract(PROMOTION_NFT_ADDRESS, PROMOTION_NFT_ABI, provider);

      let event;
      for (let attempt = 1; attempt <= 3; attempt++) {
        console.log(`Attempt ${attempt}: Fetching transaction receipt for tx ${tx}`);
        const receipt = await provider.getTransactionReceipt(txHash);
        if (!receipt) {
          console.warn(`Attempt ${attempt}: Receipt not found. Retrying...`);
          await new Promise(resolve => setTimeout(resolve, 5000));
          continue;
        }

        console.log("Transaction receipt:", receipt);
        console.log("Receipt logs:", receipt.logs);

        event = receipt.logs.find((log: ethers.Log) => {
          try {
            const parsedLog = contract.interface.parseLog(log);
            console.log("Parsed log:", parsedLog);
            return parsedLog?.name === "PromotionMinted";
          } catch (e) {
            console.error("Error parsing log:", e);
            return false;
          }
        });

        if (event) break;
        console.warn(`Attempt ${attempt}: Transfer event not found in receipt logs. Retrying...`);
        await new Promise(resolve => setTimeout(resolve, 5000));
      }

      if (!event) {
        console.error("No PromotionMinted event found after retries. Receipt logs:", receipt?.logs);
        throw new Error(
          `Failed to mint NFT: PromotionMinted event not found in transaction receipt after multiple attempts. The transaction may have succeeded but the event was not detected. View the transaction on the explorer: https://explorer.open-campus-codex.gelato.digital/tx/${tx}`
        );
      }

      const parsedLog = contract.interface.parseLog(event);
      if (!parsedLog) {
        throw new Error("Failed to parse PromotionMinted event from transaction receipt.");
      }

      const tokenId = parsedLog.args.tokenId.toString();


      // Send all required fields to backend for verification and duplicate protection
      const createMetadataResponse = await fetch("/api/create-promotion-metadata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tokenId: tokenId,
          walletAddress: address,
          promotionType: promotionType,
          txHash: txHash,
          contractAddress: PROMOTION_NFT_ADDRESS
        }),
      });

      const createMetadataData = await createMetadataResponse.json();
      if (!createMetadataData.success) {
        throw new Error("Failed to create metadata");
      }

      setNftImageUrl(`/promotionmetadata/img/${tokenId}`);
      setShowMintSuccess(true);

    } catch (err: unknown) {
      console.error("Error minting promotion NFT:", err);
      if (err instanceof Error) {
        alert(err.message);
      } else {
        alert("An unknown error occurred.");
      }
    } finally {
      setIsMinting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Promotion ({promotionType})</CardTitle>
      </CardHeader>
      <CardContent>
        {!showPromotion ? (
          <Button onClick={handleCheckExpertStatus}>
            CHECK {promotionType.toUpperCase()} STATUS
          </Button>
        ) : isLoading ? (
          <div>Loading {promotionType} status...</div>
        ) : error ? (
          <div>Error loading {promotionType} status: {error}</div>
        ) : promotionStats ? (
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-1">
                <h3 className="text-sm font-medium">Qualifying Quizzes (10 required)</h3>
                <span className="text-sm text-muted-foreground">{Math.min(promotionStats.qualifyingQuizzes, 10)} / 10</span>
              </div>
              <Progress value={(promotionStats.qualifyingQuizzes / 10) * 100} />
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <h3 className="text-sm font-medium">Qualifying Quiz Completions (50 required)</h3>
                <span className="text-sm text-muted-foreground">{Math.min(promotionStats.qualifyingQuizCompletions, 50)} / 50</span>
              </div>
              <Progress value={(promotionStats.qualifyingQuizCompletions / 50) * 100} />
            </div>

            {hasQualified && !isMinting && !hasMinted && (
              <Button onClick={handleMintPromotion}>
                Mint My {promotionType} Badge
              </Button>
            )}
            {hasMinted && (
              <div className="flex flex-col items-center pt-4">
                <Image
                  src="/img/EduchainExpertCapybilityPromo.png"
                  alt={`${promotionType} Badge`}
                  width={160}
                  height={160}
                  className="object-contain mb-2 rounded-lg shadow-md"
                />
                <p className="text-green-700 font-semibold text-center">
                  Congratulations! You have already achieved and minted this badge!
                </p>
                <BadgeSubmissionSection />
              </div>
            )}
            {isMinting && <p>Minting Promotion NFT...</p>}
          </div>
        ) : (
          <p>No promotion statistics available.</p>
        )}
      </CardContent>
      <MintSuccessPopup
        open={showMintSuccess}
        rarity=""
        nftImageUrl={nftImageUrl}
        onGoToDashboard={() => {
          setShowMintSuccess(false);
          router.push("/user-dashboard");
        }}
      />
    </Card>
  );
}