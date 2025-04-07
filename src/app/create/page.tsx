"use client";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import UrlForm from "../../components/UrlForm";
import BuildQuiz from "../../components/BuildQuiz";
import { useAccount } from "wagmi";
import LoadingOverlay from "@/components/LoadingOverlay";
import PageLayout from "@/components/PageLayout";
import { buttonStyles, sectionStyles } from "@/utils/styles";
import { ethers } from 'ethers';
import { useWriteContract } from 'wagmi';
import DrQuizBubble from '../../components/DrQuizBubble';
import QuizShareSection from '../../components/QuizShareSection';


const QUIZ_CREATOR_NFT_ADDRESS = "0xf7d547b46F331229D4FeA41d85c6561DA5288678" as `0x${string}`;
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
    "name": "mintPrice",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
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
  }
] as const;

// Add this helper function at the top level with your other constants
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const MainContent = dynamic(
  () =>
    Promise.resolve(() => {
      interface QuizQuestion {
        question: string;
        choices: string[];
        correctAnswer: number;
      }

      // Add error interfaces
      interface ApiError {
        message: string;
        code?: string;
        details?: {
          reason?: string;
          [key: string]: unknown;
        };
      }

      interface TransactionError {
        message: string;
        code?: string;
        transaction?: {
          hash?: string;
          [key: string]: unknown;
        };
      }

      interface ExtendedError extends Error {
        code?: string | number;
        data?: unknown;
      }

      const MainContentComponent = () => {
        const router = useRouter();
        const { isConnected, address } = useAccount();
        const [url, setUrl] = useState("");
        const [isUrlSubmitted, setIsUrlSubmitted] = useState(false);
        const [extractedText, setExtractedText] = useState("");
        const [isEditing, setIsEditing] = useState(false);
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

        // Add useEffect to fetch mint price when component mounts
        useEffect(() => {
          const fetchMintPrice = async () => {
            try {
              const provider = new ethers.JsonRpcProvider("https://rpc.open-campus-codex.gelato.digital");
              const contract = new ethers.Contract(QUIZ_CREATOR_NFT_ADDRESS, QuizCreatorNFTAbi, provider);
              const price = await contract.mintPrice();
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

        const handleUrlSubmitted = (submittedUrl: string) => {
          setUrl(submittedUrl);
          setIsUrlSubmitted(true);
        };

        const handleSourceTypeSelected = async (type: 'scrape' | 'manual') => {
          if (type === 'scrape') {
            setIsLoading(true);
            setLoadingMessage("Scraping webpage content...");
            try {
              const response = await fetch("/api/scrape", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url }),
              });
              const data = await response.json();
              setExtractedText(data.scrapedText || "");
            } catch (error) {
              console.error("Error extracting text:", error);
              setExtractedText("");
            } finally {
              setIsLoading(false);
            }
          }
          setIsEditing(true);
        };

        const handleGetQuiz = async () => {
          setIsLoading(true);
          setLoadingMessage("Generating quiz questions...");
          try {
            const response = await fetch("/api/scrape", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ text: extractedText }),
            });
            
            if (!response.ok) {
              throw new Error('Failed to analyze text');
            }
            
            const data = await response.json();
            if (data.error) {
              throw new Error(data.error);
            }
            
            let cleanedAnalysis = data.analysis
              .trim()
              .replace(/Here is the quiz in the requested JSON format:\s*/i, "")
              .replace(/^```json\s*|\s*```$/g, "");
        
            const jsonStart = cleanedAnalysis.indexOf("{");
            const jsonEnd = cleanedAnalysis.lastIndexOf("}") + 1;
            if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
              cleanedAnalysis = cleanedAnalysis.slice(jsonStart, jsonEnd);
            }
            
            try {
              const parsedQuiz = JSON.parse(cleanedAnalysis);
              if (!parsedQuiz.quiz || !Array.isArray(parsedQuiz.quiz)) {
                throw new Error('Invalid quiz format received');
              }
              setEditedQuiz(parsedQuiz.quiz);
              setQuizName(parsedQuiz.quizName || "");
              setQuizTags(parsedQuiz.tags || []);
            } catch (parseError) {
              console.error("Error parsing quiz JSON:", parseError);
              setSaveMessage("Failed to parse quiz data. Please try again.");
            }
          } catch (error) {
            console.error("Error generating quiz:", error);
            setSaveMessage("Failed to generate quiz. Please try again.");
          } finally {
            setIsLoading(false);
            setLoadingMessage("");
          }
        };

        const handleSaveQuiz = async (e?: React.MouseEvent) => {
          // Prevent default button behavior if event exists
          if (e) {
            e.preventDefault();
            e.stopPropagation(); // Add this to ensure the event doesn't bubble up
          }
          
          try {
            // Debug log initial state
            console.log("Starting handleSaveQuiz...");
            console.log("Current mintPrice:", mintPrice?.toString());
            console.log("Current address:", address);
        
            if (!editedQuiz.length) {
              setSaveMessage("No quiz data to save");
              return false; // Prevent state reset
            }
            
            setIsLoading(true);
            setLoadingMessage("Saving quiz and minting NFT...");
            
            try {
              // First save the quiz
              const saveResponse = await fetch("/api/save-quiz", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                  quiz: editedQuiz, 
                  walletAddress: address,
                  quizName,
                  tags: quizTags,
                  sourceUrl: url // Add this line to include the URL
                }),
              });
          
              const saveData = await saveResponse.json();
              if (!saveData.success) {
                throw new Error(saveData.error || "Failed to save quiz");
              }
          
              // Get signature for minting
              console.log("Requesting signature with params:", {
                walletAddress: address,
                quizId: saveData.quizId
              });
              const signResponse = await fetch("/api/sign-quiz-creation", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  walletAddress: address,
                  quizId: saveData.quizId,
                }),
              });
          
              const signData = await signResponse.json();
              console.log("Raw signature response:", signData);
              if (!signData.success) {
                throw new Error("Failed to get signature");
              }
          
              // Mint NFT with EDU payment
              setLoadingMessage("Minting NFT...");
              
              if (!mintPrice) {
                throw new Error("Mint price not loaded");
              }
          
              // Debug log to verify the value being sent
              console.log("Sending mint price:", mintPrice.toString());
              
              // After getting signature, log it
              console.log("Signature obtained:", signData.signature);
              console.log("Quiz ID:", saveData.quizId);
          
              // Before minting, log all parameters
              console.log("Minting parameters:", {
                contractAddress: QUIZ_CREATOR_NFT_ADDRESS,
                quizId: saveData.quizId,
                signature: signData.signature,
                value: mintPrice?.toString(),
                sender: address
              });
          /*
              // Attempt to estimate gas before actual mint
              try {
                const provider = new ethers.JsonRpcProvider("https://rpc.open-campus-codex.gelato.digital");
                const contract = new ethers.Contract(QUIZ_CREATOR_NFT_ADDRESS, QuizCreatorNFTAbi, provider);
                
                const gasEstimate = await contract.mint.estimateGas(
                  saveData.quizId,
                  signData.signature,
                  { value: mintPrice }
                );
                console.log("Gas estimate:", gasEstimate.toString());
              } catch (estimateError) {
                console.error("Gas estimation failed:", estimateError);
              }
          */
              // Proceed with mint
              console.log("Attempting mint with:", {
                quizId: saveData.quizId,
                signature: signData.signature,
                senderAddress: address,
                contractAddress: QUIZ_CREATOR_NFT_ADDRESS
              });
              let tx; // Declare tx at a higher scope
              try {
                tx = await mintNFT({
                  address: QUIZ_CREATOR_NFT_ADDRESS,  
                  abi: QuizCreatorNFTAbi,
                  functionName: "mint",
                  args: [saveData.quizId, signData.signature],
                  value: mintPrice
                });
              } catch (error) {
                const txError = error as TransactionError;
                console.error("Transaction error:", txError);
                setSaveMessage(`Transaction failed: ${txError.transaction?.hash || txError.message}`);
                return false;
              }
          
              const provider = new ethers.JsonRpcProvider("https://rpc.open-campus-codex.gelato.digital");
              let receipt;
          
              // Add retry logic for transaction confirmation
              for (let attempt = 1; attempt <= 5; attempt++) {
                  console.log(`Attempt ${attempt}: Fetching transaction receipt for tx ${tx}`);
                  receipt = await provider.getTransactionReceipt(tx);
                  
                  if (!receipt) {
                      console.warn(`Attempt ${attempt}: Receipt not found. Retrying...`);
                      await delay(10000);
                      continue;
                  }

                  console.log("Receipt found:", receipt); // Add this log
                  console.log("Receipt status:", receipt.status); // Add this log
          
                  if (receipt.status !== 1) {
                      console.error("Transaction failed. Receipt:", receipt);
                      throw new Error(
                          `Transaction failed on the blockchain. Please check your wallet or view the transaction on the explorer: https://explorer.open-campus-codex.gelato.digital/tx/${tx}`
                      );
                  }

                  console.log("Transaction successful, looking for event..."); // Add this log
                  
                  // Inside handleSaveQuiz function, after successful transaction confirmation
                  if (receipt.status === 1) {
                      console.log("Processing successful transaction..."); // Add this log
                      // Get tokenId from receipt logs
                      const provider = new ethers.JsonRpcProvider("https://rpc.open-campus-codex.gelato.digital");
                      const contract = new ethers.Contract(
                        QUIZ_CREATOR_NFT_ADDRESS, 
                        QuizCreatorNFTAbi, 
                        provider
                      );
                      
                      const event = receipt.logs.find(log => {
                        try {
                          console.log("Parsing log:", log); // Add this
                          const parsedLog = contract.interface.parseLog(log);
                          console.log("Parsed log:", parsedLog); // Add this
                          const isQuizCreated = parsedLog?.name === "QuizCreated";
                          console.log("Is QuizCreated event?", isQuizCreated); // Add this
                          return isQuizCreated;
                        } catch (error) {
                          console.error("Error parsing log:", error);
                          return false;
                        }
                      });
                      
                      if (!event) {
                        console.log("No QuizCreated event found in logs"); // Add this
                      }
                    
                      if (event) {
                        try {
                          const parsedLog = contract.interface.parseLog(event);
                          if (!parsedLog) {
                            throw new Error("Failed to parse event log");
                          }
                          
                          const tokenId = parsedLog.args.tokenId.toString();
                          console.log("Extracted tokenId for metadata creation:", tokenId);
                    
                          // Create metadata
                          console.log("Sending metadata creation request...");
                          const createMetadataResponse = await fetch("/api/create-quizcreator-metadata", {
                            method: "POST",
                            headers: { 
                              "Content-Type": "application/json",
                              "Accept": "application/json"
                            },
                            body: JSON.stringify({
                              tokenId,
                              quizId: saveData.quizId,
                              walletAddress: address
                            }),
                          });
                    
                          console.log("Metadata API response status:", createMetadataResponse.status);
                          const responseText = await createMetadataResponse.text();
                          console.log("Raw API response:", responseText);
                    
                          try {
                            const createMetadataData = JSON.parse(responseText);
                            if (!createMetadataData.success) {
                              console.error("Failed to create metadata:", createMetadataData.error);
                            } else {
                              console.log("Metadata created successfully!");
                            }
                          } catch (jsonError) {
                            console.error("Error parsing API response:", jsonError);
                          }
                        } catch (parseError) {
                          console.error("Error in metadata creation process:", parseError);
                        }
                      }
                    
                      // Update UI state
                      setQuizId(saveData.quizId);
                      setIsSaved(true);
                      setSaveMessage("Quiz saved and NFT minted successfully! 🎉");
                  }
          
                  // Keep the quiz content visible
                  setIsEditing(true);
                  setIsUrlSubmitted(true);
                  
                  // Log success for debugging
                  console.log("Quiz saved successfully with ID:", saveData.quizId);
                  break; // Add explicit break here
              }
          
              if (!receipt) {
                  throw new Error("Transaction confirmation timed out. Please check the explorer for confirmation.");
              }
          
            } catch (error) {
              console.error("Error:", error);
              const apiError = error as ApiError;
              setSaveMessage("Failed to save quiz or mint NFT: " + (apiError.message || "Unknown error"));
              return false;
            } finally {
              setIsLoading(false);
              setLoadingMessage("");
            }
          } catch (error) {
            console.error("Full error object:", error);
            const typedError = error as ExtendedError;
            console.error("Error name:", typedError.name);
            console.error("Error code:", typedError.code);
            console.error("Error data:", typedError.data);
            setSaveMessage("Failed to save quiz or mint NFT: " + typedError.message);
            return false; // Prevent state reset on error
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

        const handleSkipUrl = () => {
          setUrl(""); // Clear URL when skipping
          setIsUrlSubmitted(true);
          setIsEditing(true);
        };

        return (
          <PageLayout>
            <LoadingOverlay isVisible={isLoading} message={loadingMessage} />
            <div className="grid gap-6">
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">
                  Create Quiz
                </h1>
                <Link 
                  href="/"
                  className="text-gray-600 hover:text-gray-900"
                >
                  ← Back to Dashboard
                </Link>
              </div>

              {/* Add DrQuizBubble here */}
              <DrQuizBubble 
                text="QUIZ creation time! Let me do the heavy lifting for you - and I'll do it with my blindfold on! Just follow my lead and you'll have an awesome quiz in no time."
                collapsedText="Dr Quiz will guide you through quiz creation"
              />

              {/* Rest of your existing content */}
              {!isSaved && (
                <>
                  <div className={sectionStyles}>
                    <UrlForm
                      onUrlSubmitted={handleUrlSubmitted}
                      onSourceTypeSelected={handleSourceTypeSelected}
                      onSkipUrl={handleSkipUrl}
                      isLoading={isLoading}
                      isUrlSubmitted={isUrlSubmitted}
                    />
                  </div>

                  {isEditing && (
                    <div className={sectionStyles}>
                      <h3 className="text-lg font-semibold mb-4">What content do you want Dr Q to use to create the quiz?</h3>
                      <textarea
                        value={extractedText}
                        onChange={(e) => setExtractedText(e.target.value)}
                        className="w-full h-64 p-4 border rounded-md mb-4"
                        placeholder="Enter or edit the content for your quiz here..."
                      />
                      <button
                        onClick={handleGetQuiz}
                        disabled={!extractedText.trim() || isLoading}
                        className={buttonStyles + ((!extractedText.trim() || isLoading) ? " opacity-50 cursor-not-allowed" : "")}
                      >
                        GET DR Q. TO CREATE A QUIZ
                      </button>
                    </div>
                  )}
                </>
              )}

              {editedQuiz.length > 0 && (
                <div className={sectionStyles}>
                  <BuildQuiz
                    quizJson={JSON.stringify({
                      quiz: editedQuiz,
                      quizName,
                      tags: quizTags
                    })}
                    onQuizUpdated={handleQuizUpdated}
                  />
                  <div className="mt-4 flex items-center gap-4">
                    <button
                      onClick={(e) => handleSaveQuiz(e)}
                      disabled={isLoading || isSaved}
                      type="button" // Add this to explicitly make it a button, not a submit
                      className={buttonStyles + ((isLoading || isSaved || !mintPrice) ? " opacity-50 cursor-not-allowed" : "")}
                    >
                      {isLoading ? "SAVING..." : isSaved ? "QUIZ SAVED" : "SAVE QUIZ"}
                    </button>
                    {saveMessage && (
                      <span className="text-sm text-green-600">
                        {saveMessage}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Add the new share section after quiz is saved */}
              {isSaved && quizId && (
                <div className={sectionStyles}>
                  <QuizShareSection quizId={quizId} />
                </div>
              )}
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