"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Coins, Star, Zap } from "lucide-react";
import PageLayout from "@/components/PageLayout";
import MintBarabotPopup from "@/components/MintBarabotPopup";
import { ethers } from "ethers";

export default function BarabotsMintPage() {
  const { address, isConnected } = useAccount();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [minting, setMinting] = useState(false);
  const [eligibility, setEligibility] = useState<{
    free: { eligible: boolean; categories: string[]; hasRandom: boolean };
    discount: { eligible: boolean; categories: string[]; hasRandom: boolean };
  } | null>(null);
  const [selectedFreeCategory, setSelectedFreeCategory] = useState<string>('');
  const [selectedDiscountCategory, setSelectedDiscountCategory] = useState<string>('');
  const [showMintPopup, setShowMintPopup] = useState(false);
  const [mintStatus, setMintStatus] = useState<'minting' | 'creating-metadata' | 'success' | 'error'>('minting');
  const [mintResult, setMintResult] = useState<{
    tokenId: string;
    category: string;
  } | null>(null);
  const [mintError, setMintError] = useState<string>('');

  // Check eligibility on page load
  useEffect(() => {
    if (address && isConnected) {
      checkEligibility();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, isConnected]);

  const checkEligibility = async () => {
    if (!address) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/barabots-eligibility?wallet=${address}`);
      const data = await response.json();

      setEligibility(data);
    } catch (error) {
      console.error('Error checking eligibility:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMint = async (mintType: 'free' | 'discount' | 'full') => {
    if (!address || !isConnected) {
      setMintError('Please connect your wallet first');
      setMintStatus('error');
      setShowMintPopup(true);
      return;
    }

    // Determine which category to use based on mint type
    const selectedCategory = mintType === 'free' ? selectedFreeCategory : 
                           mintType === 'discount' ? selectedDiscountCategory : 
                           undefined;

    // For whitelist mints, ensure category is selected
    if ((mintType === 'free' || mintType === 'discount') && !selectedCategory) {
      setMintError('Please select a category for your mint');
      setMintStatus('error');
      setShowMintPopup(true);
      return;
    }

    setMinting(true);
    setShowMintPopup(true);
    setMintStatus('minting');
    
    try {
      // Get signature from backend
      const response = await fetch('/api/barabots-mint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: address,
          mintType,
          category: (mintType === 'free' || mintType === 'discount') ? selectedCategory : undefined
        })
      });

      const data = await response.json();
      if (!response.ok) {
        setMintError(data.error || 'Failed to get mint signature');
        setMintStatus('error');
        setMinting(false);
        return;
      }

      // Create contract instance
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const barabotsContract = new ethers.Contract(data.contractAddress, [
        mintType === 'free' ? "function mintFree(bytes signature) returns (uint256)" :
        mintType === 'discount' ? "function mintDiscount(bytes signature) payable returns (uint256)" :
        "function mintFullPrice() payable returns (uint256)"
      ], signer);

      // Execute mint transaction
      let tx;
      try {
        if (mintType === 'free') {
          tx = await barabotsContract.mintFree(data.signature);
        } else if (mintType === 'discount') {
          tx = await barabotsContract.mintDiscount(data.signature, { value: ethers.parseEther("0.005") });
        } else {
          tx = await barabotsContract.mintFullPrice({ value: ethers.parseEther("0.01") });
        }
      } catch (txError) {
        console.error('Transaction error:', txError);
        const error = txError as { reason?: string; message?: string };
        setMintError(error.reason || error.message || 'Transaction failed. User may have rejected it.');
        setMintStatus('error');
        setMinting(false);
        return;
      }

      // Update status to creating metadata
      setMintStatus('creating-metadata');

      const receipt = await tx.wait();
      
      console.log('Transaction receipt:', receipt);
      console.log('Receipt logs:', receipt.logs);
      
      // Extract token ID from the transaction receipt
      const iface = new ethers.Interface([
        "event BarabotMinted(address indexed user, uint256 indexed tokenId, uint256 mintType, uint256 price)"
      ]);
      
      let tokenId;
      for (const log of receipt.logs) {
        try {
          const parsed = iface.parseLog({
            topics: log.topics,
            data: log.data
          });
          
          if (parsed && parsed.name === 'BarabotMinted') {
            tokenId = parsed.args[1].toString();
            console.log('Found BarabotMinted event, tokenId:', tokenId);
            break;
          }
        } catch {
          // This log is not a BarabotMinted event, continue
        }
      }

      // Create metadata in blob storage
      let categoryForMetadata = selectedCategory;
      
      if (tokenId) {
        try {
          // Determine category: random for 'random' selections or full price mints, otherwise use selected
          if (selectedCategory === 'random-free' || selectedCategory === 'random-discount' || mintType === 'full') {
            categoryForMetadata = ['BUILD', 'WORK', 'DEFI', 'LEARN', 'CULTURE'][Math.floor(Math.random() * 5)];
          } else {
            categoryForMetadata = selectedCategory;
          }

          console.log('Creating metadata for tokenId:', tokenId, 'category:', categoryForMetadata);

          const metadataResponse = await fetch('/api/create-barabots-metadata', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              tokenId,
              walletAddress: address,
              category: categoryForMetadata,
              type: 'crate'
            })
          });

          const metadataResult = await metadataResponse.json();
          console.log('Metadata creation result:', metadataResult);
          
          if (!metadataResponse.ok) {
            console.error('Metadata creation failed:', metadataResult.error);
          }
        } catch (metadataError) {
          console.error('Error creating metadata:', metadataError);
          // Don't fail the mint if metadata creation fails
        }

        // Show success with the minted token
        setMintStatus('success');
        setMintResult({
          tokenId: tokenId,
          category: categoryForMetadata || selectedCategory || 'Barabot'
        });

        // Mark whitelist as used for free/discount mints
        if (mintType === 'free' || mintType === 'discount') {
          await markWhitelistUsed(mintType);
        }

        // Refresh eligibility
        await checkEligibility();
      } else {
        console.warn('No tokenId found');
        setMintError('Mint succeeded but could not find token ID');
        setMintStatus('error');
      }

    } catch (error) {
      console.error('Minting error:', error);
      const err = error as { reason?: string; message?: string };
      setMintError(err.reason || err.message || 'Minting failed. Please try again.');
      setMintStatus('error');
    } finally {
      setMinting(false);
    }
  };

  const markWhitelistUsed = async (mintType: 'free' | 'discount') => {
    if (!address) return;

    const categoryToMark = mintType === 'free' ? selectedFreeCategory : selectedDiscountCategory;

    try {
      await fetch('/api/barabots-mark-used', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: address, mintType, category: categoryToMark })
      });
    } catch (error) {
      console.error('Error marking whitelist as used:', error);
    }
  };

  if (!isConnected) {
    return (
      <PageLayout>
        <div className="max-w-2xl mx-auto p-6">
          <Card>
            <CardContent className="p-6 text-center">
              <h1 className="text-2xl font-bold mb-4">Barabots Minting</h1>
              <p className="text-gray-600">Please connect your wallet to mint Barabots NFTs.</p>
            </CardContent>
          </Card>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-4">Mint Your Barabot</h1>
          <p className="text-gray-600">
            Choose your minting option below. Free and discount mints are limited to whitelisted wallets.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Free Mint */}
          <Card className={`relative ${!eligibility?.free.eligible ? 'opacity-50' : ''}`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-500" />
                Free Mint
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Completely free mint for whitelisted users
              </p>
              
              {eligibility?.free.eligible && (
                <div className="mb-4">
                  <label className="text-sm font-medium mb-2 block">Select Category:</label>
                  <Select 
                    value={selectedFreeCategory} 
                    onValueChange={setSelectedFreeCategory}
                    disabled={!eligibility?.free.eligible || minting || loading}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {eligibility.free.categories.map(category => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                      {eligibility.free.hasRandom && (
                        <SelectItem value="random-free">Random</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              <Button
                onClick={() => handleMint('free')}
                disabled={!eligibility?.free.eligible || minting || loading || !selectedFreeCategory}
                className="w-full"
                variant={eligibility?.free.eligible ? "default" : "secondary"}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Star className="h-4 w-4 mr-2" />
                )}
                {loading ? 'Checking...' : eligibility?.free.eligible ? 'Mint Free' : 'Not Eligible'}
              </Button>
            </CardContent>
          </Card>

          {/* Discount Mint */}
          <Card className={`relative ${!eligibility?.discount.eligible ? 'opacity-50' : ''}`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Coins className="h-5 w-5 text-blue-500" />
                Discount Mint
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Reduced price mint for whitelisted users
              </p>
              
              {eligibility?.discount.eligible && (
                <div className="mb-4">
                  <label className="text-sm font-medium mb-2 block">Select Category:</label>
                  <Select 
                    value={selectedDiscountCategory} 
                    onValueChange={setSelectedDiscountCategory}
                    disabled={!eligibility?.discount.eligible || minting || loading}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {eligibility.discount.categories.map(category => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                      {eligibility.discount.hasRandom && (
                        <SelectItem value="random-discount">Random</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              <Button
                onClick={() => handleMint('discount')}
                disabled={!eligibility?.discount.eligible || minting || loading || !selectedDiscountCategory}
                className="w-full"
                variant={eligibility?.discount.eligible ? "default" : "secondary"}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Coins className="h-4 w-4 mr-2" />
                )}
                {loading ? 'Checking...' : eligibility?.discount.eligible ? 'Mint Discount' : 'Not Eligible'}
              </Button>
            </CardContent>
          </Card>

          {/* Full Price Mint */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-green-500" />
                Full Price Mint
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Standard price mint available to everyone
              </p>
              <Button
                onClick={() => handleMint('full')}
                disabled={minting}
                className="w-full"
              >
                {minting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Zap className="h-4 w-4 mr-2" />
                )}
                Mint Full Price
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Mint Popup */}
      <MintBarabotPopup
        open={showMintPopup}
        status={mintStatus}
        tokenId={mintResult?.tokenId}
        category={mintResult?.category}
        errorMessage={mintError}
        onClose={() => {
          setShowMintPopup(false);
          setMintResult(null);
          setMintError('');
        }}
        onViewBarabot={() => {
          if (mintResult?.tokenId) {
            router.push(`/barabots/${mintResult.tokenId}`);
          }
        }}
      />
    </PageLayout>
  );
}