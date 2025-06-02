"use client";
import { useState, useEffect } from "react";
import { useAccount, useSignMessage, useWriteContract } from "wagmi";
import { use } from "react";
import { ethers } from "ethers";
import LoadingOverlay from "@/components/LoadingOverlay";
import PageLayout from "@/components/PageLayout";
import { buttonStyles, sectionStyles } from "@/utils/styles";
//import CustomAlertDialog from "@/components/CustomAlertDialog";
import MintSuccessPopup from "@/components/MintSuccessPopup";
import { useRouter } from "next/navigation";

interface QuizQuestion {
  question: string;
  choices: string[];
  correctAnswer: number;
}

interface QuizData {
  id: string;
  quiz: QuizQuestion[];
  walletAddress: string;
  quizName: string;
}

interface QuizAttemptStatus {
  hasCompletedQuiz: boolean;
  hasAttemptedToday: boolean;
  lastAttemptTime?: string;
}

interface MetadataAttribute {
  trait_type: string;
  value: string;
}

const QUIZ_NFT_ADDRESS = "0x1B7088f19327AF194dC8e4668eF614733C4DF113" as `0x${string}`;

if (!QUIZ_NFT_ADDRESS.match(/^0x[a-fA-F0-9]{40}$/)) {
  throw new Error("Invalid QUIZ_NFT_ADDRESS");
}

const QUIZ_NFT_ABI = [
  {
    "inputs": [
      { "internalType": "string", "name": "quizId", "type": "string" },
      { "internalType": "bytes", "name": "signature", "type": "bytes" }
    ],
    "name": "mint",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "tokenId", "type": "uint256" }],
    "name": "getQuizId",
    "outputs": [{ "internalType": "string", "name": "", "type": "string" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "nativeMintPrice",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "from", "type": "address" },
      { "indexed": true, "internalType": "address", "name": "to", "type": "address" },
      { "indexed": true, "internalType": "uint256", "name": "tokenId", "type": "uint256" }
    ],
    "name": "Transfer",
    "type": "event"
  }
] as const;



function isHexString(value: string | null): value is `0x${string}` {
  return typeof value === "string" && /^0x[a-fA-F0-9]+$/.test(value);
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Add error interface
/*
interface MintError {
  message: string;
  code?: number;
  data?: unknown;
}
*/
// Add error interface
interface QuizError {
  message: string;
  code?: string;
  details?: {
    reason?: string;
    [key: string]: unknown;
  };
}

export default function QuizPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { isConnected, address } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [signature, setSignature] = useState<`0x${string}` | null>(null);
  const [tokenId, setTokenId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [showMintSuccess, setShowMintSuccess] = useState(false);
  const [quizStatus, setQuizStatus] = useState<QuizAttemptStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [nativeMintPrice, setNativeMintPrice] = useState<bigint | null>(null);
  const [nftImageUrl, setNftImageUrl] = useState<string>("");
  const [rarity, setRarity] = useState<string>(""); // Set this based on your logic
  const router = useRouter();

  useEffect(() => {
    const fetchMintPrice = async () => {
      const provider = new ethers.JsonRpcProvider("https://rpc.open-campus-codex.gelato.digital");
      const contract = new ethers.Contract(QUIZ_NFT_ADDRESS, QUIZ_NFT_ABI, provider);
      const price = await contract.nativeMintPrice();
      setNativeMintPrice(price);
    };
    fetchMintPrice();
  }, []);
  const { writeContractAsync: mintNFT, isPending: isMinting, error: mintError } = useWriteContract();

  useEffect(() => {
    const checkQuizStatus = async () => {
      if (!address) return;
      
      try {
        const response = await fetch(`/api/check-quiz-status?quizId=${resolvedParams.id}&address=${address}`);
        const data = await response.json();
        
        if (data.success) {
          setQuizStatus(data.status);
        } else {
          setError(data.error);
        }
      } catch (error) {
        console.error("Error checking quiz status:", error);
        setError("Failed to check quiz status");
      }
    };

    checkQuizStatus();
  }, [address, resolvedParams.id]);

  useEffect(() => {
    const fetchQuiz = async () => {
      setIsLoading(true);
      setLoadingMessage('Loading quiz...');
      try {
        const response = await fetch(`/api/get-quiz?id=${resolvedParams.id}`);
        const data = await response.json();
        if (data.success && data.quiz?.quiz_data?.quiz && data.quiz.status === "minted") {
          setQuiz({
            id: data.quiz.id,
            quiz: data.quiz.quiz_data.quiz,
            walletAddress: data.quiz.wallet_address,
            quizName: data.quiz.quiz_name || data.quiz.quiz_data.quizName || "Untitled Quiz"
          });
          setAnswers(new Array(data.quiz.quiz_data.quiz.length).fill(-1));
        } else {
          setQuiz(null);
        }
      } catch (error) {
        console.error("Error fetching quiz:", error);
        setQuiz(null);
      } finally {
        setIsLoading(false);
      }
    };
    fetchQuiz();
  }, [resolvedParams.id]);

  useEffect(() => {
    if (error) {
      alert(error);
      setError(null);
    }
  }, [error]);

  const handleAnswerChange = (questionIndex: number, choiceIndex: number) => {
    if (isSubmitted) return;
    const newAnswers = [...answers];
    newAnswers[questionIndex] = choiceIndex;
    setAnswers(newAnswers);
  };

  const handleSubmit = async () => {
    if (!isConnected || !address) {
      alert("Please connect your wallet to submit the quiz.");
      return;
    }

    setIsLoading(true);
    setLoadingMessage('Submitting quiz...');

    const message = `Submit quiz ${resolvedParams.id} at ${new Date().toISOString()}`;
    const signature = await signMessageAsync({ message });

    let calculatedScore = 0;
    if (quiz?.quiz) {
      quiz.quiz.forEach((question, index) => {
        if (answers[index] === question.correctAnswer) calculatedScore++;
      });
    }

    try {
      const response = await fetch("/api/submit-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quizId: resolvedParams.id,
          walletAddress: address,
          answers,
          score: calculatedScore,
          signature,
          message,
        }),
      });
      const data = await response.json();
      if (data.success) {
        setScore(calculatedScore);
        setIsSubmitted(true);

        // Only proceed with mint signature if perfect score
        if (calculatedScore === quiz?.quiz.length) {
          const signResponse = await fetch("/api/sign-mint", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              walletAddress: address,
              quizId: resolvedParams.id,
            }),
          });
          const signData = await signResponse.json();
          if (signData.success) {
            setSignature(signData.signature as `0x${string}`);
          } else {
            alert("Failed to generate mint signature: " + signData.error);
          }
        }
      } else {
        alert(data.error || "Submission failed.");
      }
    } catch (error: unknown) {
      const quizError = error as QuizError;
      console.error("Error submitting quiz:", quizError);
      alert(quizError.message || "Failed to submit quiz");
    } finally {
      setIsLoading(false);
    }
  };

  const handleMint = async () => {
    if (!signature || !address) {
      alert("Minting is not ready. Please try again.");
      return;
    }

    if (!address.match(/^0x[a-fA-F0-9]{40}$/)) {
      alert("Invalid wallet address.");
      return;
    }

    if (!isHexString(signature)) {
      alert("Invalid signature.");
      return;
    }

    setIsLoading(true);
    setLoadingMessage('Minting NFT...');

    try {
      const mintTimestamp = new Date().toISOString();
      
      if (nativeMintPrice == null) {
        alert("Mint price not loaded. Please try again in a moment.");
        setIsLoading(false);
        return;
      }
      
      const tx = await mintNFT({
        address: QUIZ_NFT_ADDRESS,
        abi: QUIZ_NFT_ABI,
        functionName: "mint",
        args: [resolvedParams.id, signature],
        value: nativeMintPrice 
      }) as string | { hash: string };

      let txHash: string;
      if (typeof tx === "string") {
        txHash = tx;
      } else if (typeof tx === "object" && tx !== null && "hash" in tx && typeof tx.hash === "string") {
        txHash = tx.hash;
      } else {
        throw new Error("mintNFT did not return a valid transaction hash.");
      }

      const provider = new ethers.JsonRpcProvider("https://rpc.open-campus-codex.gelato.digital");

      //const txHash = typeof tx === "string" ? tx : tx.hash;
      let receipt = null;      // Initialize receipt as null
      const maxAttempts = 10;  // Changed from let to const
      let attemptDelay = 5000; // This remains as let since it's updated

      // Poll for transaction receipt with exponential backoff
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          console.log(`Attempt ${attempt}: Fetching transaction receipt for tx ${tx}`);
          
          // Use getTransactionReceipt instead of waitForTransaction
          receipt = await provider.getTransactionReceipt(txHash);
          
          if (receipt) {
            console.log("Receipt found:", receipt);
            
            if (receipt.status !== 1) {
              console.error("Transaction failed. Receipt:", receipt);
              throw new Error(
                `Transaction failed on the blockchain. Please check your wallet or view the transaction on the explorer: https://explorer.open-campus-codex.gelato.digital/tx/${tx}`
              );
            }
            
            // If receipt is found and successful, break out of the loop
            break;
          }
          
          // If no receipt yet, wait with exponential backoff before trying again
          console.warn(`Attempt ${attempt}: Receipt not found. Waiting for ${attemptDelay/1000} seconds...`);
          await delay(attemptDelay);
          
          // Increase delay for next attempt (exponential backoff)
          attemptDelay = Math.min(attemptDelay * 1.5, 30000); // Cap at 30 seconds
        } catch (error) {
          const typedError = error as Error;

          if (typedError.message.includes("failed on the blockchain")) {
            throw error; // Re-throw if it's our specific error
          }
          console.error(`Error fetching receipt on attempt ${attempt}:`, error);
          await delay(attemptDelay);
          attemptDelay = Math.min(attemptDelay * 1.5, 30000);
        }
      }

      // After the polling loop, check if receipt was found
      if (!receipt) {
        throw new Error("Transaction confirmation timed out after multiple attempts. The transaction may still succeed. Please check the explorer for confirmation: " + 
          `https://explorer.open-campus-codex.gelato.digital/tx/${tx}`);
      }

      const contract = new ethers.Contract(QUIZ_NFT_ADDRESS, QUIZ_NFT_ABI, provider);

      let event;
      for (let attempt = 1; attempt <= 3; attempt++) {
        console.log(`Attempt ${attempt}: Fetching transaction receipt for tx ${tx}`);
        receipt = await provider.getTransactionReceipt(txHash);
        if (!receipt) {
          console.warn(`Attempt ${attempt}: Receipt not found. Retrying...`);
          await delay(5000);
          continue;
        }

        console.log("Transaction receipt:", receipt);
        console.log("Receipt logs:", receipt.logs);

        event = receipt.logs.find((log: ethers.Log) => {
          try {
            const parsedLog = contract.interface.parseLog(log);
            console.log("Parsed log:", parsedLog);
            return parsedLog?.name === "Transfer";
          } catch (e) {
            console.error("Error parsing log:", e);
            return false;
          }
        });

        if (event) break;
        console.warn(`Attempt ${attempt}: Transfer event not found in receipt logs. Retrying...`);
        await delay(5000);
      }

      if (!event) {
        console.error("No Transfer event found after retries. Receipt logs:", receipt?.logs);
        throw new Error(
          `Failed to mint NFT: Transfer event not found in transaction receipt after multiple attempts. The transaction may have succeeded but the event was not detected. View the transaction on the explorer: https://explorer.open-campus-codex.gelato.digital/tx/${tx}`
        );
      }

      const parsedLog = contract.interface.parseLog(event);
      if (!parsedLog) {
        throw new Error("Failed to parse Transfer event from transaction receipt.");
      }

      //const tokenId = parsedLog.args.tokenId.toString();

      // Initialize contract for event parsing
      //const contract = new ethers.Contract(QUIZ_NFT_ADDRESS, QUIZ_NFT_ABI, provider);

      // Look for the Transfer event in the receipt logs
      let transferEvent = null;
      let tokenId = null;

      // Ensure receipt is not null before proceeding
      if (!receipt) {
        throw new Error(
          `Receipt unexpectedly null when trying to parse logs. Transaction ID: ${tx}`
        );
      }

      for (const log of receipt.logs) {
        try {
          const parsedLog = contract.interface.parseLog(log);
          console.log("Parsed log:", parsedLog);
          
          if (parsedLog?.name === "Transfer") {
            transferEvent = log;
            tokenId = parsedLog.args.tokenId.toString();
            console.log("Found Transfer event with tokenId:", tokenId);
            break;
          }
        } catch (e) {
          console.error("Error parsing log:", e);
          // Continue to next log if parsing fails
        }
      }

      if (!transferEvent || !tokenId) {
        throw new Error(
          `Failed to extract tokenId from transaction. The transaction succeeded but the tokenId couldn't be determined. View the transaction on the explorer: https://explorer.open-campus-codex.gelato.digital/tx/${tx}`
        );
      }

      const recordMintResponse = await fetch("/api/record-mint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quizId: resolvedParams.id,
          walletAddress: address,
          mintTimestamp,
          tokenId
        }),
      });

      const recordMintData = await recordMintResponse.json();
      if (!recordMintData.success) {
        console.warn("Failed to record NFT mint:", recordMintData.error);
        // Continue anyway since the NFT mint itself was successful
      } else {
        console.log("Successfully recorded NFT mint in database");
      }

      const createMetadataResponse = await fetch("/api/create-metadata", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.NEXT_PUBLIC_METADATA_SECRET_KEY || "your-secret-key"}`,
        },
        body: JSON.stringify({
          tokenId,
          quizId: resolvedParams.id,
          walletAddress: address,
          timestamp: mintTimestamp,
        }),
      });

      const createMetadataData = await createMetadataResponse.json();
      if (!createMetadataData.success) {
        console.error("Failed to create metadata:", createMetadataData.error);
        alert("Failed to create metadata: " + createMetadataData.error);
      } else {
        setTokenId(tokenId);

        // Fetch the metadata JSON to get the image and rarity
        const metadataUrl = createMetadataData.metadataUrl;
        let imageUrl = "";
        let rarityValue = "";
        try {
          const metadataResp = await fetch(metadataUrl);
          const metadataJson = await metadataResp.json();
          imageUrl = metadataJson.image;
          // Find rarity attribute if present
          if (Array.isArray(metadataJson.attributes)) {
            const rarityAttr = metadataJson.attributes.find(
              (attr: MetadataAttribute) => attr.trait_type === "Rarity"
            );
            rarityValue = rarityAttr ? rarityAttr.value : "";
          }
        } catch (err) {
          console.error("Error fetching NFT metadata JSON:", err);
        }

        console.log("NFT minted successfully with imageURL of:", imageUrl);
        setNftImageUrl(imageUrl);
        setRarity(rarityValue);
        setShowMintSuccess(true);
      }
    } catch (error) {
      console.error("Error minting NFT:", error);
      alert((error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };
/*
  const handleError = (error: QuizError) => {
    console.error("Error:", error);
    alert(error.message || "An unknown error occurred");
  };
*/
  if (!quiz) return (
    <PageLayout>
      <LoadingOverlay isVisible={isLoading} message={loadingMessage} />
      <div className={sectionStyles}>
        <h1 className="text-3xl font-bold mb-6">Loading Quiz...</h1>
      </div>
    </PageLayout>
  );

  return (
    <PageLayout>
      <LoadingOverlay isVisible={isLoading} message={loadingMessage} />
      <div className="space-y-6">
        <div className={sectionStyles}>
          <h1 className="text-3xl font-bold">{quiz.quizName}</h1>
          <span className="text-sm text-gray-500">Quiz ID: {resolvedParams.id}</span>
        </div>
        
        {isConnected ? (
          <>
            {quiz.quiz.map((question, index) => (
              <div key={index} className={sectionStyles}>
                <h2 className="text-xl mb-4">{question.question}</h2>
                {question.choices.map((choice, choiceIndex) => (
                  <div key={choiceIndex} className="ml-4 mb-2">
                    <input
                      type="radio"
                      id={`q${index}-c${choiceIndex}`}
                      name={`question${index}`}
                      value={choiceIndex}
                      checked={answers[index] === choiceIndex}
                      onChange={() => handleAnswerChange(index, choiceIndex)}
                      disabled={isSubmitted || quizStatus?.hasCompletedQuiz || quizStatus?.hasAttemptedToday}
                    />
                    <label htmlFor={`q${index}-c${choiceIndex}`} className="ml-2">
                      {choice}
                    </label>
                  </div>
                ))}
              </div>
            ))}

            {quizStatus?.hasCompletedQuiz ? (
              <div className="bg-green-50 p-4 rounded-lg text-green-700 text-center">
                You have already completed this quiz successfully!
              </div>
            ) : quizStatus?.hasAttemptedToday ? (
              <div className="bg-yellow-50 p-4 rounded-lg text-yellow-700 text-center">
                You have already attempted this quiz today. 
                Try again after {new Date(quizStatus.lastAttemptTime!).toLocaleString()}
              </div>
            ) : !isSubmitted ? (
              <button
                onClick={handleSubmit}
                disabled={answers.includes(-1)}
                className={buttonStyles}
              >
                SUBMIT QUIZ
              </button>
            ) : (
              <div className={sectionStyles}>
                <h2 className="text-2xl mb-4">Quiz Submitted!</h2>
                <p className="mb-4">Your score: {score} out of {quiz.quiz.length}</p>
                
                {score === quiz.quiz.length ? (
                  // Perfect score - show mint button
                  <>
                    {signature && !isMinting && !mintError && (
                      <button
                        onClick={handleMint}
                        className={buttonStyles}
                      >
                        MINT YOUR NFT
                      </button>
                    )}
                    {isMinting && <p>Minting NFT...</p>}
                    {mintError && <p className="text-red-500">Minting failed: {mintError.message}</p>}
                  </>
                ) : (
                  // Non-perfect score - show try again message
                  <div className="bg-yellow-50 p-4 rounded-lg text-yellow-700">
                    Try again tomorrow to get a perfect score (5/5) and mint your NFT!
                  </div>
                )}

                {tokenId && (
                  <p>
                    NFT minted! View it at:{" "}
                    <a
                      href={`/metadata/${tokenId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 underline"
                    >
                      Metadata Link
                    </a>
                  </p>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="text-center p-4">
            Please connect your wallet to take this quiz.
          </div>
        )}
      </div>
      
      <MintSuccessPopup
        open={showMintSuccess}
        rarity={rarity}
        nftImageUrl={nftImageUrl}
        onGoToDashboard={() => {
          setShowMintSuccess(false);
          router.push("/user-dashboard");
        }}
      />
    </PageLayout>
  );
}