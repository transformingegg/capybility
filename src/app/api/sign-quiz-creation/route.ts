import { NextResponse } from "next/server";
import { ethers } from "ethers";

// First, fix your contract address
const QUIZ_CREATOR_NFT_ADDRESS = process.env.NEXT_PUBLIC_QUIZ_CREATOR_NFT_ADDRESS as `0x${string}`;

export async function POST(request: Request) {
  try {
    const { walletAddress, quizId } = await request.json();
    
    /*console.log("Generating signature for:", {
      walletAddress,
      quizId,
      contractAddress: QUIZ_CREATOR_NFT_ADDRESS
    });*/

    // Simplify provider initialization
    const provider = new ethers.JsonRpcProvider("https://rpc.edu-chain.raas.gelato.cloud/");

    // Use the full ABI for the nonce function
    const contractABI = [
      "function getNonce(address user) view returns (uint256)",
      "function mint(string calldata quizId, bytes calldata signature) external payable returns (uint256)"
    ];

    const contract = new ethers.Contract(QUIZ_CREATOR_NFT_ADDRESS, contractABI, provider);
    
    try {
      const nonce = await contract.getNonce(walletAddress);
      //console.log("Current nonce:", nonce.toString());

      // Generate message hash matching the contract's implementation
      const messageHash = ethers.solidityPackedKeccak256(
        ["address", "string", "uint256", "address"],
        [walletAddress, quizId, nonce, QUIZ_CREATOR_NFT_ADDRESS]
      );
      //console.log("Generated message hash:", messageHash);

      // Sign the hash with prefix
      const signer = new ethers.Wallet(process.env.SIGNER_PRIVATE_KEY!);
      const messageHashBytes = ethers.getBytes(messageHash);
      const signature = await signer.signMessage(messageHashBytes);
      //console.log("Generated signature:", signature);

      return NextResponse.json({ 
        success: true, 
        signature,
        messageHash,
        nonce: nonce.toString()
      });
    } catch (contractError) {
      console.error("Contract interaction error:", contractError);
      throw contractError;
    }
  } catch (error) {
    console.error("Signature generation error:", error);
    return NextResponse.json({ 
      success: false, 
      error: "Failed to generate signature" 
    });
  }
}