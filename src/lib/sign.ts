import { ethers } from "ethers";

// Wallet private key for signing (store securely in .env)
const SIGNER_PRIVATE_KEY = process.env.SIGNER_PRIVATE_KEY;
if (!SIGNER_PRIVATE_KEY) {
  throw new Error("SIGNER_PRIVATE_KEY is not set in .env");
}
const signerWallet = new ethers.Wallet(SIGNER_PRIVATE_KEY);

// Function to generate a signature for minting
export async function generateMintSignature(
  toAddress: string,
  quizId: string,
  nonce: string,
  contractAddress: string
): Promise<{ success: boolean; signature?: string; error?: string }> {
  try {
    // Generate the message hash (same as in the contract)
    const messageHash = ethers.solidityPackedKeccak256(
      ["address", "string", "uint256", "address"],
      [toAddress, quizId, nonce, contractAddress]
    );
    const ethSignedMessageHash = ethers.getBytes(messageHash);

    // Sign the message
    const signature = await signerWallet.signMessage(ethSignedMessageHash);
    return { success: true, signature };
  } catch (error: any) {
    console.error("Error generating signature:", error);
    return { success: false, error: error.message };
  }
}

// Create an interface for the data structure
interface QuizData {
  quiz: Array<{
    question: string;
    choices: string[];
    correctAnswer: number;
  }>;
  quizName: string;
  tags: string[];
}

// Use the interface instead of 'any'
export async function signQuizCreation(quizData: QuizData): Promise<string> {
  try {
    const messageHash = ethers.solidityPackedKeccak256(
      ["string", "string[]", "uint8[]"],
      [
        quizData.quizName,
        quizData.quiz.map(q => q.question),
        quizData.quiz.map(q => q.correctAnswer)
      ]
    );
    const ethSignedMessageHash = ethers.getBytes(messageHash);
    const signature = await signerWallet.signMessage(ethSignedMessageHash);
    return signature;
  } catch (error) {
    console.error('Error signing quiz creation:', error);
    throw error;
  }
}