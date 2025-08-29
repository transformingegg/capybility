"use client";
import { useState, useEffect } from "react";
import { useAccount, useSignMessage, useWriteContract } from "wagmi";
import { use } from "react";
import { ethers } from "ethers";
import LoadingOverlay from "@/components/LoadingOverlay";
import PageLayout from "@/components/PageLayout";

import MintSuccessPopup from "@/components/MintSuccessPopup";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

import { motion, AnimatePresence } from "framer-motion";

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
  sourceUrl?: string;
  hashtags?: string[];
}

interface QuizAttemptStatus {
  hasCompletedQuiz: boolean;
  hasAttemptedToday: boolean;
  lastAttemptTime?: string;
}

const QUIZ_NFT_ADDRESS = process.env.NEXT_PUBLIC_QUIZ_COMPLETION_NFT_ADDRESS as `0x${string}`;

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
  },
  {
        "inputs": [
            {
                "internalType": "string",
                "name": "quizId",
                "type": "string"
            },
            {
                "internalType": "bytes",
                "name": "signature",
                "type": "bytes"
            }
        ],
        "name": "mintWithDiscount",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "payable",
        "type": "function"
    },
  {
    "inputs": [],
    "name": "discountBps",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

function ensureQuizSuffix(name: string) {
  return /quiz$/i.test(name.trim()) ? name : `${name.trim()} QUIZ`;
}

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
    // Referral tracking: set referrer from URL param in sessionStorage
    useEffect(() => {
      if (typeof window === 'undefined') return;
      const urlParams = new URLSearchParams(window.location.search);
      const ref = urlParams.get('ref');
      if (ref) {
        sessionStorage.setItem('referrer', ref);
        console.log('Referrer picked up from URL:', ref);
      }
    }, []);
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
  const [viewMode, setViewMode] = useState<'single' | 'all'>('single');
  const [[currentQuestionIndex, direction], setPage] = useState([0, 0]);

 
  const paginate = (newDirection: number) => {
    setPage([currentQuestionIndex + newDirection, newDirection]);
  };

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 300 : -300,
      opacity: 0,
    }),
  };

  const router = useRouter();

  useEffect(() => {
    const fetchMintPrice = async () => {
      const provider = new ethers.JsonRpcProvider("https://rpc.edu-chain.raas.gelato.cloud/");
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
          // Parse hashtags from quiz_data.tags (array or comma-separated string)
          let hashtags: string[] = [];
          if (data.quiz.quiz_data?.tags) {
            if (Array.isArray(data.quiz.quiz_data.tags)) {
              hashtags = data.quiz.quiz_data.tags;
            } else if (typeof data.quiz.quiz_data.tags === 'string') {
              hashtags = data.quiz.quiz_data.tags.split(',').map((tag: string) => tag.trim()).filter(Boolean);
            }
          }
          setQuiz({
            id: data.quiz.id,
            quiz: data.quiz.quiz_data.quiz,
            walletAddress: data.quiz.wallet_address,
            quizName: data.quiz.quiz_name || data.quiz.quiz_data.quizName || "Untitled Quiz",
            sourceUrl: data.quiz.source_url || null,
            hashtags,
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
      
      const capyStatusResp = await fetch(`/api/check-capy-status?address=${address}`);
      const capyStatus = await capyStatusResp.json();
      const isCapyHolder = !!capyStatus.hasNFT;

      

      let mintFunction: "mint" | "mintWithDiscount" = "mint";
      let mintValue: bigint = nativeMintPrice ?? 0n;

      if (nativeMintPrice == null) {
        alert("Mint price not loaded. Please try again in a moment.");
        setIsLoading(false);
        return;
      }

      if (isCapyHolder) {
        const provider = new ethers.JsonRpcProvider("https://rpc.edu-chain.raas.gelato.cloud/");
        const contract = new ethers.Contract(QUIZ_NFT_ADDRESS, QUIZ_NFT_ABI, provider);
        const [onchainMintPrice, discountBps] = await Promise.all([
          contract.nativeMintPrice(),
          contract.discountBps(),
        ]);
        mintFunction = "mintWithDiscount";
        mintValue = (BigInt(onchainMintPrice) * BigInt(discountBps)) / 10000n;
      }

      
      const mintTimestamp = new Date().toISOString();
      
      
      
      const tx = await mintNFT({
        address: QUIZ_NFT_ADDRESS,
        abi: QUIZ_NFT_ABI,
        functionName: mintFunction,
        args: [resolvedParams.id, signature],
        value: mintValue
      }) as string | { hash: string };

      let txHash: string;
      if (typeof tx === "string") {
        txHash = tx;
      } else if (typeof tx === "object" && tx !== null && "hash" in tx && typeof tx.hash === "string") {
        txHash = tx.hash;
      } else {
        throw new Error("mintNFT did not return a valid transaction hash.");
      }

      const provider = new ethers.JsonRpcProvider("https://rpc.edu-chain.raas.gelato.cloud/");

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

        // Set the image URL to the metadata endpoint
        const metadataUrl = createMetadataData.metadataUrl;
        console.log("Metadata URL returned from API:", metadataUrl);
        const imageUrl = `/metadata/img/${tokenId}`;
        const rarityValue = createMetadataData.rarity || "";

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
  if (!quiz) {
    return (
      <PageLayout fullWidth>
        <LoadingOverlay isVisible={isLoading} message={loadingMessage} />
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-3xl font-bold">Loading Quiz...</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Please wait while we fetch the quiz details.</p>
          </CardContent>
        </Card>
      </PageLayout>
    );
  }

  // Log rarity value before rendering
  console.log("MintSuccessPopup rarity value:", rarity);

  return (
    <PageLayout fullWidth>
      <LoadingOverlay isVisible={isLoading} message={loadingMessage} />
      
      <Card className="mb-6 bg-gray-800 text-white rounded-none">
        <div className="max-w-2xl mx-auto py-8 text-center">
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-white">{ensureQuizSuffix(quiz.quizName)}</CardTitle>
          </CardHeader>
          {quiz.sourceUrl && (
            <CardContent>
              <div className="text-sm text-gray-300">
                This is where you will find the answers:{" "}
                <a
                  href={quiz.sourceUrl}
                  className="underline break-all text-yellow-500 hover:text-yellow-400"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {quiz.sourceUrl}
                </a>
              </div>
            </CardContent>
          )}
        </div>
      </Card>

      <div className="max-w-2xl mx-auto my-8">
        <div className="flex items-center space-x-2 mb-4">
          <Switch
            id="view-mode-switch"
            checked={viewMode === 'all'}
            onCheckedChange={(checked) => setViewMode(checked ? 'all' : 'single')}
          />
          <Label htmlFor="view-mode-switch">View Whole Quiz</Label>
        </div>
        
        <div className="space-y-6">
          {isConnected ? (
            <>
              {!isSubmitted && !quizStatus?.hasCompletedQuiz && !quizStatus?.hasAttemptedToday ? (
                <>
                  {viewMode === 'all' ? (
                    <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
                      {quiz.quiz.map((question, index) => (
                        <Card key={index} className="mb-4">
                          <CardHeader>
                            <CardTitle className="text-xl" style={{ color: 'hsl(var(--primary))' }}>{`${index + 1}. ${question.question}`}</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <RadioGroup
                              onValueChange={(value) => handleAnswerChange(index, parseInt(value))}
                              value={answers[index]?.toString()}
                              className="ml-4 space-y-1"
                            >
                              {question.choices.map((choice, choiceIndex) => (
                                <Label
                                  key={choiceIndex}
                                  htmlFor={`q${index}-c${choiceIndex}`}
                                  className="flex items-center space-x-3 p-2 rounded-md hover:bg-muted cursor-pointer"
                                >
                                  <RadioGroupItem value={choiceIndex.toString()} id={`q${index}-c${choiceIndex}`} />
                                  <span className="text-base font-normal">{choice}</span>
                                </Label>
                              ))}
                            </RadioGroup>
                          </CardContent>
                        </Card>
                      ))}
                      <Button type="submit" disabled={answers.includes(-1)} className="w-full">
                        SUBMIT QUIZ
                      </Button>
                    </form>
                  ) : (
                    <div className="relative h-[450px] overflow-hidden">
                      <AnimatePresence initial={false} custom={direction}>
                        {currentQuestionIndex < quiz.quiz.length ? (
                          <motion.div
                            key={currentQuestionIndex}
                            custom={direction}
                            variants={variants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{
                              x: { type: "spring", stiffness: 300, damping: 30 },
                              opacity: { duration: 0.5 }
                            }}
                            className="absolute w-full"
                          >
                            <Card className="mb-4">
                              <CardHeader>
                                <CardTitle className="text-xl" style={{ color: 'hsl(var(--primary))' }}>{`${currentQuestionIndex + 1}. ${quiz.quiz[currentQuestionIndex].question}`}</CardTitle>
                              </CardHeader>
                              <CardContent>
                                <RadioGroup
                                  onValueChange={(value) => handleAnswerChange(currentQuestionIndex, parseInt(value))}
                                  value={answers[currentQuestionIndex]?.toString()}
                                  className="ml-4 space-y-1"
                                >
                                  {quiz.quiz[currentQuestionIndex].choices.map((choice, choiceIndex) => (
                                    <Label
                                      key={choiceIndex}
                                      htmlFor={`q${currentQuestionIndex}-c${choiceIndex}`}
                                      className="flex items-center space-x-3 p-2 rounded-md hover:bg-muted cursor-pointer"
                                    >
                                      <RadioGroupItem value={choiceIndex.toString()} id={`q${currentQuestionIndex}-c${choiceIndex}`} />
                                      <span className="text-base font-normal">{choice}</span>
                                    </Label>
                                  ))}
                                </RadioGroup>
                              </CardContent>
                              <CardFooter className="flex justify-between">
                                <Button
                                  onClick={() => paginate(-1)}
                                  disabled={currentQuestionIndex === 0}
                                  variant="outline"
                                >
                                  Previous
                                </Button>
                                <Button
                                  onClick={() => paginate(1)}
                                  disabled={answers[currentQuestionIndex] === -1}
                                >
                                  Next
                                </Button>
                              </CardFooter>
                            </Card>
                          </motion.div>
                        ) : (
                          <motion.div
                            key="submit-card"
                            initial={{ opacity: 0, x: 300 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -300 }}
                            transition={{
                              x: { type: "spring", stiffness: 300, damping: 30 },
                              opacity: { duration: 0.5 }
                            }}
                            className="absolute w-full"
                          >
                            <Card>
                              <CardHeader>
                                <CardTitle>Submit Your Answers</CardTitle>
                              </CardHeader>
                              <CardContent>
                                <p className="mb-4">If you are sure of your answers, submit your quiz using the button below. Be careful though, you are only allowed one attempt per day.</p>
                                <Button onClick={handleSubmit} className="w-full">
                                  SUBMIT QUIZ
                                </Button>
                              </CardContent>
                              <CardFooter>
                                <Button
                                  onClick={() => paginate(-1)}
                                  variant="outline"
                                >
                                  Previous
                                </Button>
                              </CardFooter>
                            </Card>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>
                      {quizStatus?.hasCompletedQuiz 
                        ? "You have already completed this quiz successfully!"
                        : quizStatus?.hasAttemptedToday
                        ? "You have already attempted this quiz today."
                        : "Quiz Submitted!"
                      }
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {quizStatus?.hasAttemptedToday && !quizStatus.hasCompletedQuiz && (
                      <p>Try again after {new Date(quizStatus.lastAttemptTime!).toLocaleString()}</p>
                    )}
                    {isSubmitted && score !== null && (
                      <>
                        <p className="mb-4">Your score: {score} out of {quiz.quiz.length}</p>
                        {score === quiz.quiz.length ? (
                          <>
                            {signature && !isMinting && !mintError && (
                              <Button onClick={handleMint} className="w-full">
                                MINT YOUR NFT
                              </Button>
                            )}
                            {isMinting && <p>Minting NFT...</p>}
                            {mintError && <p className="text-red-500">Minting failed: {mintError.message}</p>}
                          </>
                        ) : (
                          <div className="bg-yellow-50 p-4 rounded-lg text-yellow-700">
                            Try again tomorrow to get a perfect score ({quiz.quiz.length}/{quiz.quiz.length}) and mint your NFT!
                          </div>
                        )}
                        {tokenId && (
                          <p className="mt-4">
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
                      </>
                    )}
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Card>
              <CardContent className="text-center p-4">
                Please connect your wallet to take this quiz.
              </CardContent>
            </Card>
          )}
        </div>
        <div className="flex justify-end mt-8">
          <span className="text-xs text-gray-400">Quiz ID: {resolvedParams.id}</span>
        </div>
      </div>

      <MintSuccessPopup
        open={showMintSuccess}
        rarity={rarity}
        nftImageUrl={nftImageUrl}
        onGoToDashboard={() => {
          setShowMintSuccess(false);
          router.push("/user-dashboard");
        }}
        quizName={quiz?.quizName}
        quizId={quiz?.id}
        walletAddress={address}
  hashtags={quiz?.hashtags?.length ? quiz.hashtags.join(",") : "Capybility,QuizNFT"}
      />
    </PageLayout>
  );
}