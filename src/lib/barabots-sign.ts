import { ethers } from "ethers";

// Wallet private key for signing (store securely in .env)
const SIGNER_PRIVATE_KEY = process.env.SIGNER_PRIVATE_KEY;
if (!SIGNER_PRIVATE_KEY) {
  throw new Error("SIGNER_PRIVATE_KEY is not set in .env");
}
const signerWallet = new ethers.Wallet(SIGNER_PRIVATE_KEY);

interface SigningError {
  message: string;
  code?: string;
  reason?: string;
}

// Function to generate a signature for Barabots minting
export async function generateBarabotsMintSignature(
  toAddress: string,
  mintType: string,
  nonce: string,
  contractAddress: string
): Promise<{ success: boolean; signature?: string; error?: string }> {
  try {
    // Generate the message hash (same as in the Barabots contract)
    const messageHash = ethers.solidityPackedKeccak256(
      ["address", "string", "uint256", "address"],
      [toAddress, mintType, nonce, contractAddress]
    );

    // Sign the message hash directly (ethers will handle eth_sign prefix automatically)
    const signature = await signerWallet.signMessage(ethers.getBytes(messageHash));
    return { success: true, signature };
  } catch (error: unknown) {
    const signingError = error as SigningError;
    console.error("Error generating Barabots signature:", signingError);
    return { success: false, error: signingError.message };
  }
}

// Function to generate a signature for Barabots transaction pairing
export async function generateBarabotsPairSignature(
  walletAddress: string,
  tokenId: string,
  transactionHash: string
): Promise<string> {
  try {
    // Generate the message hash for pairing
    const messageHash = ethers.solidityPackedKeccak256(
      ["address", "uint256", "bytes32"],
      [walletAddress, tokenId, transactionHash]
    );

    // Sign the message hash directly (ethers will handle eth_sign prefix automatically)
    const signature = await signerWallet.signMessage(ethers.getBytes(messageHash));
    return signature;
  } catch (error: unknown) {
    const signingError = error as SigningError;
    console.error("Error generating Barabots pair signature:", signingError);
    throw new Error(signingError.message);
  }
}