"use client";
import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import UrlForm from "../../components/UrlForm";
import BuildQuiz from "../../components/BuildQuiz";
import { useAccount, useSignMessage } from "wagmi";
import LoadingOverlay from "@/components/LoadingOverlay";
import PageLayout from "@/components/PageLayout";
import { ethers } from 'ethers';
import { useWriteContract } from 'wagmi';
import DrQuizBubble from '../../components/DrQuizBubble';
import QuizShareSection from '../../components/QuizShareSection';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

const QUIZ_CREATOR_NFT_ADDRESS = process.env.NEXT_PUBLIC_QUIZ_CREATOR_NFT_ADDRESS as `0x${string}`;
const QuizCreatorNFTAbi = [
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
    "name": "mint",
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
    "name": "nativeMintPrice",
    "outputs": [
      { "internalType": "uint256", "name": "", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "creator",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "quizId",
        "type": "string"
      }
    ],
    "name": "QuizCreated",
    "type": "event"
  },
  {
    "inputs": [
      { "internalType": "string", "name": "quizId", "type": "string" },
      { "internalType": "bytes", "name": "signature", "type": "bytes" }
    ],
    "name": "mintWithDiscount",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
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

const cardVariants = {
    hidden: { opacity: 0, x: 200 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -200 },
};

const MainContent = dynamic(
  () =>
    Promise.resolve(() => {
      interface QuizQuestion {
        question: string;
        choices: string[];
        correctAnswer: number;
      }

      const MainContentComponent = () => {
  const router = useRouter();
  const { isConnected, address } = useAccount();
  const { signMessageAsync } = useSignMessage();
        // Remove referral tracking
  const [step, setStep] = useState(1);
  const [url, setUrl] = useState("");
  const [autoGather, setAutoGather] = useState(true);
  const [extractedText, setExtractedText] = useState("");
  const [scrapedUrl, setScrapedUrl] = useState(""); // Cache key for scraping
  const [sourceTextForQuiz, setSourceTextForQuiz] = useState(""); // Cache key for quiz generation
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [editedQuiz, setEditedQuiz] = useState<QuizQuestion[]>([]);
  const [isSaved, setIsSaved] = useState(false);
  const [quizId, setQuizId] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [quizName, setQuizName] = useState<string>("");
  const [quizTags, setQuizTags] = useState<string[]>([]);
  const { writeContractAsync: mintNFT } = useWriteContract();
  //const mintPrice = parseEther("0.5"); // 0.5 EDU tokens
  const [mintPrice, setMintPrice] = useState<bigint | null>(null);
  const shareSectionRef = useRef<HTMLDivElement | null>(null);
  const [hasPermission, setHasPermission] = useState(false);
  const [isQuizSubmittable, setIsQuizSubmittable] = useState(false);
  const [scrapeError, setScrapeError] = useState<string | null>(null);

        // Add useEffect to fetch mint price when component mounts
        useEffect(() => {
          const fetchMintPrice = async () => {
            try {
              const provider = new ethers.JsonRpcProvider("https://rpc.edu-chain.raas.gelato.cloud/");
              const contract = new ethers.Contract(QUIZ_CREATOR_NFT_ADDRESS, QuizCreatorNFTAbi, provider);
              const price = await contract.nativeMintPrice();
              console.log("Mint price from contract:", price.toString()); // Debug log
              setMintPrice(price);
            } catch (error) {
              console.error("Error fetching mint price:", error);
            }
          };
          fetchMintPrice();
        }, []);

        useEffect(() => {
          if (!isConnected) {
            router.push('/');
          }
        }, [isConnected, router]);

        if (!isConnected) return null;

        const handleUrlSubmitted = async (submittedUrl: string, autoGatherValue: boolean) => {
            setUrl(submittedUrl);
            setAutoGather(autoGatherValue);
            setScrapeError(null); // Clear previous scrape errors

            // Only scrape if auto-gather is on AND the URL is new.
            if (autoGatherValue && submittedUrl !== scrapedUrl) {
              setIsLoading(true);
              setLoadingMessage("Scraping webpage content...");
              try {
                const response = await fetch("/api/scrape", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ url: submittedUrl }),
                });
                const data = await response.json();
                if (!response.ok || data.error) {
                  throw new Error(data.error || "Failed to scrape URL");
                }
                setExtractedText(data.scrapedText || "");
                setScrapedUrl(submittedUrl); // Cache the URL that was scraped
              } catch (error) {
                console.error("Error extracting text:", error);
                setScrapeError((error as Error).message);
                setIsLoading(false);
                setStep(2); // Show error in Step 2
                return; // Stop on error
              } finally {
                setIsLoading(false);
              }
            } else if (!autoGatherValue) {
              // If user unchecks the box, clear previous scrape data
              setExtractedText("");
              setScrapedUrl("");
            }
            setStep(2); // Move to next step
        };

        const handleGetQuiz = async () => {
          // Only generate quiz if the source text has changed.
          if (extractedText === sourceTextForQuiz) {
            setStep(3); // Move to next step without calling API
            return;
          }

          setIsLoading(true);
          setLoadingMessage("Generating quiz questions...");
          setScrapeError(null); // Clear scrape errors before quiz generation
          try {
            const response = await fetch("/api/generate-quiz", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ text: extractedText, userAddress: address }),
            });
            
            if (!response.ok) {
              throw new Error('Failed to generate quiz');
            }
            
            const data = await response.json();
            if (data.error) {
              throw new Error(data.error);
            }
            
            setEditedQuiz(data.quiz.quiz);
            setQuizName(data.quiz.quizName);
            setQuizTags(data.quiz.tags);
            setSourceTextForQuiz(extractedText); // Cache the text used for generation
            setStep(3); // Move to quiz building step
          } catch (error) {
            console.error("Error generating quiz:", error);
            setSaveMessage((error as Error).message);
          } finally {
            setIsLoading(false);
            setLoadingMessage("");
          }
        };

        const handleMintQuiz = async (e?: React.MouseEvent) => {
          if (!isQuizSubmittable) {
            alert("Your quiz must have exactly 5 questions to be saved.");
            return;
          }
          if (e) e.preventDefault();

          setScrapeError(null); // Clear scrape errors before minting
          setSaveMessage(null); // Clear previous save/mint errors
          setIsLoading(true);
          setLoadingMessage("Saving quiz and minting NFT...");

          try {
            if (!address) throw new Error("Wallet not connected");

            // Create signature for saving
            const message = `Save quiz: ${quizName}`;
            const signature = await signMessageAsync({ message });

            // 1. Save quiz
            const saveResponse = await fetch("/api/save-quiz", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ 
                quiz: editedQuiz, 
                walletAddress: address,
                quizName,
                tags: quizTags,
                sourceUrl: url,
                signature,
                message
              }),
            });
            const saveData = await saveResponse.json();
            if (!saveData.success) throw new Error(saveData.error || "Failed to save quiz");

            // 2. Get signature for minting
            const signResponse = await fetch("/api/sign-quiz-creation", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ walletAddress: address, quizId: saveData.quizId }),
            });
            const signData = await signResponse.json();
            if (!signData.success) throw new Error("Failed to get signature");

            if (!mintPrice) throw new Error("Mint price not loaded");

            // 3. CapyFriends discount logic
            let mintFunction: "mint" | "mintWithDiscount" = "mint";
            let mintValue: bigint = mintPrice;
            const capyStatusResp = await fetch(`/api/check-capy-status?address=${address}`);
            const capyStatus = await capyStatusResp.json();
            if (capyStatus.hasNFT) {
              const provider = new ethers.JsonRpcProvider("https://rpc.edu-chain.raas.gelato.cloud/");
              const contract = new ethers.Contract(QUIZ_CREATOR_NFT_ADDRESS, QuizCreatorNFTAbi, provider);
              const discountBps = await contract.discountBps();
              mintFunction = "mintWithDiscount";
              mintValue = (mintPrice * BigInt(discountBps)) / 10000n;
            }

            // 4. Mint NFT
            const tx = await mintNFT({
              address: QUIZ_CREATOR_NFT_ADDRESS,  
              abi: QuizCreatorNFTAbi,
              functionName: mintFunction,
              args: [saveData.quizId, signData.signature],
              value: mintValue
            });

            // 5. Wait for transaction confirmation
            const provider = new ethers.JsonRpcProvider("https://rpc.edu-chain.raas.gelato.cloud/");
            const receipt = await provider.waitForTransaction(tx);
            if (receipt?.status !== 1) {
              throw new Error(`Transaction failed. View on explorer: https://educhain.blockscout.com/tx/${tx}`);
            }

            // 6. Parse tokenId from QuizCreated event
            let tokenId = null;
            try {
              const contract = new ethers.Contract(QUIZ_CREATOR_NFT_ADDRESS, QuizCreatorNFTAbi, provider);
              for (const log of receipt.logs) {
                try {
                  const parsedLog = contract.interface.parseLog(log);
                  if (parsedLog?.name === "QuizCreated") {
                    tokenId = parsedLog.args.tokenId.toString();
                    break;
                  }
                } catch {
                  // Not a QuizCreated event, skip
                }
              }
            } catch {
              // Parsing error
            }
            if (!tokenId) {
              throw new Error("Could not extract tokenId from transaction receipt.");
            }

            // 7. Create metadata
            const txHash = typeof tx === "string"
              ? tx
              : (typeof tx === "object" && tx && "hash" in tx ? (tx as { hash: string }).hash : "");
            const createMetadataResponse = await fetch("/api/create-quizcreator-metadata", {
              method: "POST",
              headers: { "Content-Type": "application/json", "Accept": "application/json" },
              body: JSON.stringify({
                tokenId,
                quizId: saveData.quizId,
                walletAddress: address,
                txHash,
                contractAddress: QUIZ_CREATOR_NFT_ADDRESS
              }),
            });
            const createMetadataText = await createMetadataResponse.text();
            let createMetadataData;
            try {
              createMetadataData = JSON.parse(createMetadataText);
            } catch {
              throw new Error("Error parsing metadata API response.");
            }
            if (!createMetadataData.success) {
              throw new Error("Failed to create metadata: " + (createMetadataData.error || "Unknown error"));
            }

            // 8. Mark quiz as minted
            const markMintedResponse = await fetch("/api/mark-quiz-minted", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ quizId: saveData.quizId }),
            });
            const markMintedData = await markMintedResponse.json();
            if (!markMintedData.success) {
              throw new Error("Failed to mark quiz as minted: " + (markMintedData.error || "Unknown error"));
            }

            // 9. Update UI state
            setQuizId(saveData.quizId);
            setIsSaved(true);
            setSaveMessage("Quiz saved and NFT minted successfully! 🎉");
            setStep(5); // Move to share step

          } catch (error) {
            console.error("Error during save/mint:", error);
            setSaveMessage((error as Error).message);
          } finally {
            setIsLoading(false);
            setLoadingMessage("");
          }
        };

        const handleQuizUpdated = (
          updatedQuiz: QuizQuestion[],
          updatedName: string,
          updatedTags: string[]
        ) => {
          setEditedQuiz(updatedQuiz);
          setQuizName(updatedName);
          setQuizTags(updatedTags);
        };

        return (
          <PageLayout fullWidth={true}>
            <div 
              style={{
                backgroundImage: "url('/img/capyback.webp')",
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundAttachment: 'fixed',
                minHeight: 'calc(100vh - 65px)',
              }}
            >
              <div className="max-w-4xl mx-auto p-6 space-y-8">
                <LoadingOverlay isVisible={isLoading} message={loadingMessage} />
                
                <Card>
                  <CardHeader>
                    <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                      <CardTitle className="text-3xl">Create a Quiz</CardTitle>
                      <Button asChild>
                        <Link href="/">Back To Dashboard</Link>
                      </Button>
                    </div>
                  </CardHeader>
                </Card>

                {/* Add DrQuizBubble here */}
                <DrQuizBubble 
                  text="QUIZ creation time! Let me do the heavy lifting for you - and I'll do it with my blindfold on! Just follow my lead and you'll have an awesome quiz in no time."
                  collapsedText="Dr Quiz will guide you through quiz creation"
                />

                <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  transition={{ duration: 0.3 }}
                >
                  {step === 1 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Step 1: Link</CardTitle>
                        <CardDescription>Where is the information you want to make a quiz about located? Please provide the web link to it.</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <UrlForm 
                          onUrlSubmit={() => {}} // We'll use the footer button
                          url={url} 
                          setUrl={setUrl} 
                          autoGather={autoGather}
                          setAutoGather={setAutoGather}
                        />
                      </CardContent>
                      <CardFooter className="flex justify-end">
                        <Button onClick={() => handleUrlSubmitted(url, autoGather)} disabled={isLoading || !url}>
                          Next: Content
                        </Button>
                      </CardFooter>
                    </Card>
                  )}

                  {step === 2 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Step 2: Content</CardTitle>
                        <CardDescription>
                          {scrapeError ? (
                            <>
                              <span className="text-red-500 font-semibold">Failed to gather information automatically. You will need to copy and paste in the content you want to use as the basis for the quiz.</span>
                              <br />
                              <span>You can edit it here before generating the quiz.</span>
                            </>
                          ) : (
                            <>
                              Review the gathered content. <span>You can edit it here before generating the quiz.</span>
                            </>
                          )}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <Textarea
                          value={extractedText}
                          onChange={(e) => setExtractedText(e.target.value)}
                          className="w-full h-64"
                          placeholder="Enter or edit the content for your quiz here..."
                        />
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="permission-checkbox"
                            checked={hasPermission}
                            onCheckedChange={(checked) => setHasPermission(checked as boolean)}
                          />
                          <Label htmlFor="permission-checkbox">
                            I have the appropriate permissions to use this information.
                          </Label>
                        </div>
                      </CardContent>
                      <CardFooter className="flex justify-between">
                          <Button variant="outline" onClick={() => setStep(1)}>Previous: Link</Button>
                          <Button
                              onClick={handleGetQuiz}
                              disabled={!extractedText.trim() || isLoading || !hasPermission || !!scrapeError}
                          >
                              Next: Quiz Builder
                          </Button>
                      </CardFooter>
                    </Card>
                  )}

                  {step === 3 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Step 3: Quiz Builder</CardTitle>
                        <CardDescription>
                          Your 5-question quiz has been automatically generated. Use the &apos;Next&apos; and &apos;Previous&apos; buttons in the wizard below to review and edit the quiz name, tags, and each question. The final step is a full review. Once you&apos;re happy, you can proceed to the minting step.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pt-6">
                        <BuildQuiz
                          quizJson={JSON.stringify({
                            quiz: editedQuiz,
                            quizName,
                            tags: quizTags
                          })}
                          onQuizUpdated={handleQuizUpdated}
                          isSubmittable={setIsQuizSubmittable}
                        />
                      </CardContent>
                      <CardFooter className="flex justify-between items-center gap-4">
                        <Button variant="outline" onClick={() => setStep(2)}>
                          Previous: Content
                        </Button>
                        <Button
                          onClick={() => setStep(4)}
                          disabled={!isQuizSubmittable}
                        >
                          Next: Mint NFT
                        </Button>
                      </CardFooter>
                    </Card>
                  )}

                  {step === 4 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Step 4: Mint NFT</CardTitle>
                        <CardDescription>
                          Let&apos;s put your Quiz ownership on chain! This will require a small transaction fee in EDU tokens. Clicking the SAVE AND MINT button below will trigger a transaction in your web3 wallet. Please review and confirm it.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="flex flex-col items-center justify-center space-y-4">
                        <Button
                          onClick={handleMintQuiz}
                          disabled={isLoading || isSaved || !mintPrice}
                          type="button"
                          size="lg"
                        >
                          {isLoading ? "MINTING..." : "Save and Mint NFT"}
                        </Button>
                        {saveMessage && (
                          <p className="text-sm text-red-500 mt-4">{saveMessage}</p>
                        )}
                      </CardContent>
                      <CardFooter className="flex justify-between items-center gap-4">
                        <Button variant="outline" onClick={() => setStep(3)}>
                          Previous: Quiz Builder
                        </Button>
                        <Button
                          onClick={() => setStep(5)}
                          disabled={!isSaved}
                          type="button"
                        >
                          Next: Share
                        </Button>
                      </CardFooter>
                    </Card>
                  )}

                  {step === 5 && (
                    <Card ref={shareSectionRef}>
                      <CardHeader>
                        <CardTitle>Step 5: Share</CardTitle>
                        <CardDescription>Your quiz has been created and the NFT has been minted. Share it with the world!</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <QuizShareSection quizId={quizId!} quizName={quizName} hashtags={quizTags} />
                      </CardContent>
                      <CardFooter className="flex justify-end items-center gap-4 mt-4">
                        <Button onClick={() => router.push(`/doquiz/${quizId}`)} variant="outline">
                          Do Your Quiz
                        </Button>
                        <span className="text-sm text-gray-500">OR</span>
                        <Button onClick={() => router.push('/creator-dashboard')}>
                            Go to Creator Dashboard
                        </Button>
                      </CardFooter>
                    </Card>
                  )}
                </motion.div>
              </AnimatePresence>
              </div>
            </div>
          </PageLayout>
        );
      };

      return <MainContentComponent />;
    }),
  { ssr: false }
);

export default function Home() {
  return <MainContent />;
}