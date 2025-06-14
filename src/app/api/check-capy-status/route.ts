import { NextResponse } from "next/server";
import { ethers } from "ethers";

const CAPY_NFT_ADDRESS = "0x6E4dB21D18d8B4D934E3745059Dda4b4AC351b73";
const BASE_RPC_URL = "https://mainnet.base.org"; // Base mainnet RPC

const ERC721_ABI = [
  "function balanceOf(address owner) view returns (uint256)"
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get("address");

  if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return NextResponse.json({ success: false, error: "Invalid address" }, { status: 400 });
  }

  try {
    const provider = new ethers.JsonRpcProvider(BASE_RPC_URL);
    const contract = new ethers.Contract(CAPY_NFT_ADDRESS, ERC721_ABI, provider);
    const balance = await contract.balanceOf(address);
    const hasNFT = BigInt(balance) > 0;
    console.log(`Address ${address} has Capy NFT: ${hasNFT}`);
    return NextResponse.json({ success: true, hasNFT });
  } catch (error) {
    console.error("Error checking NFT balance:", error);
    return NextResponse.json({ success: false, error: "Failed to check NFT balance" }, { status: 500 });
  }
}