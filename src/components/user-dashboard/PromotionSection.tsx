"use client";
import { useState, useEffect } from "react";
import { sectionStyles, buttonStyles } from "@/utils/styles";
import { useReadContract, useWriteContract } from "wagmi";
import { ethers } from "ethers";
import MintSuccessPopup from "@/components/MintSuccessPopup";
import { useRouter } from "next/navigation";
import Image from "next/image";
import BadgeSubmissionSection from './BadgeSubmissionSection'; // Import the new component


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
  //const [tokenId, setTokenId] = useState<string | null>(null); 
  const [nftImageUrl, setNftImageUrl] = useState<string>("");
  const router = useRouter();
  const { writeContractAsync: mintPromotionNFT } = useWriteContract();
  const promotionType = "Educhain Expert"; // Define promotion type
  const [hasMinted, setHasMinted] = useState(false);

  const { data: hasMintedData, refetch: refetchHasMinted } = useReadContract({ // Use useReadContract
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

  //change here back to qualifyingQuizzes as 10 and qualifyingQuizCompletions as 50
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
        refetchHasMinted(); // Refetch hasMinted status after fetching promotion stats
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

  const handleMintPromotion = async () => {
    if (!address) {
      alert("Please connect your wallet.");
      return;
    }

    setIsMinting(true);
    try {
      // 1. Get Signature
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
      //setSignature(signData.signature as `0x${string}`);

      // 2. Mint NFT
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

      // 3. Get Token ID
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

      // 4. Create Metadata
      const createMetadataResponse = await fetch("/api/create-promotion-metadata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tokenId: tokenId,
          walletAddress: address,
          promotionType: promotionType,
        }),
      });

      const createMetadataData = await createMetadataResponse.json();
      if (!createMetadataData.success) {
        throw new Error("Failed to create metadata");
      }

      // 5. Set State and Show Popup
      //setTokenId(tokenId);
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

  return ( //change the qualifyingQuizzes to 10 and QuizCompletions to 50 they are just at 2 for testing. 
    <div className={sectionStyles}>
      <h2 className="text-2xl font-bold mb-4">Promotion ({promotionType})</h2>

      {!showPromotion ? (
        <button
          onClick={handleCheckExpertStatus}
          className={buttonStyles}
        >
          CHECK {promotionType} STATUS
        </button>
      ) : isLoading ? (
        <div>Loading {promotionType} status...</div>
      ) : error ? (
        <div>Error loading {promotionType} status: {error}</div>
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
                {Math.min(promotionStats.qualifyingQuizzes, 10)} / 10
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
                {Math.min(promotionStats.qualifyingQuizCompletions, 50)} / 50
              </span>
            </div>
          </div>
          {hasQualified && !isMinting && !hasMinted && (
            <button
              onClick={handleMintPromotion}
              className={buttonStyles}
            >
              Mint My {promotionType} Badge
            </button>
          )}
          {hasMinted && (
            <div className="flex flex-col items-center mt-4">
              <Image
                src="/img/EduchainExpertPromo.png"
                alt={`${promotionType} Badge`}
                width={40}
                height={40}
                className="w-40 h-40 object-contain mb-2 rounded-lg shadow"
              />
              <p className="text-green-700 font-semibold text-center">
                Congratulations! You have already achieved and minted this badge!
              </p>

              {/* --- THIS IS THE CHANGE --- */}
              {/* The BadgeSubmissionSection will now appear here when hasMinted is true */}
              <BadgeSubmissionSection />

            </div>
          )}
          {isMinting && <p>Minting Promotion NFT...</p>}
        </div>
      ) : (
        <p>No promotion statistics available.</p>
      )}
      <MintSuccessPopup
        open={showMintSuccess}
        rarity="" // No rarity for promotion badges
        nftImageUrl={nftImageUrl}
        onGoToDashboard={() => {
          setShowMintSuccess(false);
          router.push("/user-dashboard");
        }}
      />
    </div>
  );
}