"use client";

import { useState, useEffect } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from "wagmi";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ExternalLink, ArrowLeft } from "lucide-react";
import PageLayout from "@/components/PageLayout";
import { useRouter } from "next/navigation";
import AssemblySuccessPopup from "@/components/AssemblySuccessPopup";
import { BARABOTS_ABI } from "../../../lib/barabots-abi";

interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  attributes: Array<{
    trait_type: string;
    value: string;
  }>;
}

interface Transaction {
  hash: string;
  timestamp: string;
  from: string;
  to: string;
  value: string;
  contractAddress: string;
  category: string | null;
  notes: string | null;
  selectable: boolean;
  used: boolean;
}

interface BarabotViewPageProps {
  params: Promise<{ tokenId: string }>;
}

export default function BarabotViewPage({ params }: BarabotViewPageProps) {
  const { address, isConnected } = useAccount();
  const router = useRouter();

  // Read assembly price from contract
  const { data: assemblyPrice } = useReadContract({
    address: process.env.NEXT_PUBLIC_BARABOTS_CONTRACT as `0x${string}`,
    abi: BARABOTS_ABI,
    functionName: 'getAssemblyPrice',
  });
  const [tokenId, setTokenId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [nftData, setNftData] = useState<{
    tokenId: string;
    metadata: NFTMetadata | null;
    transactions: Transaction[];
  } | null>(null);
  const [pairingTransaction, setPairingTransaction] = useState<string>("");
  const [pairing, setPairing] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [showAssemblyPopup, setShowAssemblyPopup] = useState(false);
  const [assemblyStatus, setAssemblyStatus] = useState<'assembling' | 'success'>('assembling');
  const [assemblyResult, setAssemblyResult] = useState<{
    newImageUrl: string;
    rarity: string;
  } | null>(null);

  // Contract interaction hooks
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  useEffect(() => {
    params.then((p) => setTokenId(p.tokenId));
  }, [params]);

  useEffect(() => {
    if (address && isConnected && tokenId) {
      fetchNFTData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, isConnected, tokenId]);

  // Handle successful assembly transaction
  useEffect(() => {
    if (isConfirmed && hash && pairing) {
      handleAssemblySuccess(hash);
    }
  }, [isConfirmed, hash, pairing]);

  const fetchNFTData = async () => {
    if (!address || !tokenId) return;

    setLoading(true);
    try {
      // Add cache-busting parameter to ensure fresh data
      const response = await fetch(`/api/barabot-view?wallet=${address}&tokenId=${tokenId}&t=${Date.now()}`);
      const data = await response.json();

      if (response.ok) {
        setNftData(data);
      } else {
        console.error('Error fetching NFT data:', data.error);
      }
    } catch (error) {
      console.error('Error fetching NFT data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePairTransaction = async () => {
    if (!address || !tokenId || !pairingTransaction) {
      alert('Please select a transaction');
      return;
    }

    setPairing(true);
    setShowAssemblyPopup(true);
    setAssemblyStatus('assembling');

    try {
      // Debug: Log transaction details before sending
      console.log('AssembleBarabot Transaction:', {
        address: process.env.NEXT_PUBLIC_BARABOTS_CONTRACT,
        abi: BARABOTS_ABI,
        functionName: 'assembleBarabot',
        args: [BigInt(tokenId)],
        value: assemblyPrice
      });
      // Call the contract's assembleBarabot function
      writeContract({
        address: process.env.NEXT_PUBLIC_BARABOTS_CONTRACT as `0x${string}`,
        abi: BARABOTS_ABI,
        functionName: 'assembleBarabot',
        args: [BigInt(tokenId)],
        value: assemblyPrice as bigint, // Pay assembly price from contract
      });
    } catch (error) {
      console.error('Error calling assembleBarabot:', error);
      setPairing(false);
      setShowAssemblyPopup(false);
      alert('Failed to initiate assembly transaction');
    }
  };

  const handleAssemblySuccess = async (txHash: string) => {
    try {
      // Call the assembly API with the payment transaction hash
      const response = await fetch('/api/barabot-assemble', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: address,
          tokenId: tokenId,
          assemblyTransactionHash: txHash
        })
      });

      const data = await response.json();

      if (response.ok) {
        // Assembly successful - show success state
        setAssemblyStatus('success');
        setAssemblyResult({
          newImageUrl: data.newImageUrl,
          rarity: data.rarity || 'Barabot'
        });
        
        // Refresh NFT data to show updated metadata after a delay
        setTimeout(async () => {
          await fetchNFTData();
        }, 2000);
        
        setPairingTransaction("");
      } else {
        setPairing(false);
        setShowAssemblyPopup(false);
        alert(data.error || 'Failed to complete assembly');
      }
    } catch (error) {
      console.error('Error completing assembly:', error);
      setPairing(false);
      setShowAssemblyPopup(false);
      alert('Failed to complete assembly');
    } finally {
      setPairing(false);
    }
  };

  if (!isConnected) {
    return (
      <PageLayout>
        <div className="max-w-2xl mx-auto p-6">
          <Card>
            <CardContent className="p-6 text-center">
              <h1 className="text-2xl font-bold mb-4">Barabot Details</h1>
              <p className="text-gray-600">Please connect your wallet to view this Barabot.</p>
            </CardContent>
          </Card>
        </div>
      </PageLayout>
    );
  }

  if (loading) {
    return (
      <PageLayout>
        <div className="max-w-4xl mx-auto p-6">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading Barabot...</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  if (!nftData) {
    return (
      <PageLayout>
        <div className="max-w-2xl mx-auto p-6">
          <Card>
            <CardContent className="p-6 text-center">
              <h1 className="text-2xl font-bold mb-4">Barabot Not Found</h1>
              <p className="text-gray-600 mb-4">
                This Barabot doesn&apos;t exist or you don&apos;t own it.
              </p>
              <Button onClick={() => router.push('/barabots')}>
                View My Collection
              </Button>
            </CardContent>
          </Card>
        </div>
      </PageLayout>
    );
  }

  const isEvolved = nftData.metadata?.attributes?.find(attr => attr.trait_type === 'State')?.value === 'Barabot';

  return (
    <PageLayout>
      <div className="max-w-6xl mx-auto p-6">
        <Button
          variant="ghost"
          onClick={() => router.push('/barabots')}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Collection
        </Button>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* NFT Display */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Barabot #{nftData.tokenId}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <img
                    src={`/barabotsmetadata/img/${nftData.tokenId}?t=${Date.now()}`}
                    alt={nftData.metadata?.name || `Barabot #${nftData.tokenId}`}
                    className="w-full rounded-lg shadow-lg"
                  />
                </div>

                {nftData.metadata && (
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-lg">{nftData.metadata.name}</h3>
                      <p className="text-gray-600">{nftData.metadata.description}</p>
                    </div>

                    {nftData.metadata.attributes && nftData.metadata.attributes.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2">Attributes</h4>
                        <div className="grid grid-cols-2 gap-2">
                          {nftData.metadata.attributes.map((attr, index) => (
                            <div key={index} className="bg-gray-50 p-2 rounded">
                              <div className="text-sm text-gray-600">{attr.trait_type}</div>
                              <div className="font-medium">{attr.value}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Transaction Pairing & History */}
          <div className="space-y-6">
            {!isEvolved && (
              <Card>
                <CardHeader>
                  <CardTitle>Assemble your Barabot</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">
                    Select a transaction from your recent activity below to assemble this Barabot from its crate and reveal its rarity!
                  </p>
                  {pairingTransaction && (
                    <div className="mt-3 p-2 bg-blue-50 rounded text-sm">
                      <span className="font-semibold">Selected:</span> {pairingTransaction.slice(0, 10)}...{pairingTransaction.slice(-8)}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {isEvolved && (
              <Card className="bg-green-50 border-green-200">
                <CardHeader>
                  <CardTitle className="text-green-800">✨ Assembled Barabot</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-green-700">
                    This Barabot has been assembled! It has achieved its final form.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Recent Transactions */}
            <Card>
              <CardHeader>
                <CardTitle>Select Transaction</CardTitle>
              </CardHeader>
              <CardContent>
                {!isEvolved && (
                  <p className="text-sm text-gray-600 mb-3">
                    Select from your recent on-chain actions below. Choose a transaction to assemble your Barabot. Yellow "UNCATEGORIZED" transactions may appear for contracts that haven't been classified yet. Assembly requires payment of {(assemblyPrice ? Number(assemblyPrice) / 1e18 : 1).toFixed(2)} EDU.
                  </p>
                )}
                {nftData.transactions.length > 0 ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      {nftData.transactions.slice(currentPage * 10, (currentPage + 1) * 10).map((tx, index) => {
                        const isSelected = pairingTransaction === tx.hash;
                        const isDisabled = !tx.selectable || isEvolved;
                        
                        return (
                          <div 
                            key={index} 
                            className={`flex flex-col p-3 rounded transition-colors ${
                              isDisabled
                                ? 'bg-gray-100 opacity-50 cursor-not-allowed'
                                : isSelected 
                                  ? 'bg-blue-100 border-2 border-blue-500 cursor-pointer' 
                                  : 'bg-gray-50 hover:bg-gray-100 cursor-pointer border-2 border-transparent'
                            }`}
                            onClick={() => {
                              if (!isDisabled) {
                                setPairingTransaction(tx.hash);
                              }
                            }}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 flex-1">
                                {/* Category badge with USED status */}
                                <span className={`text-xs px-2 py-1 rounded font-semibold ${
                                  !tx.category
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : tx.category === 'unknown'
                                      ? 'bg-gray-200 text-gray-600'
                                      : tx.used
                                        ? 'bg-red-100 text-red-800'
                                        : 'bg-blue-100 text-blue-800'
                                }`}>
                                  {(!tx.category ? 'UNCATEGORIZED' : tx.category.toUpperCase())}{tx.used ? ' - USED' : ''}
                                </span>
                                {/* Truncated transaction hash */}
                                <div className="text-sm font-mono text-gray-700">
                                  {tx.hash.slice(0, 8)}...{tx.hash.slice(-6)}
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.open(`https://educhain.blockscout.com/tx/${tx.hash}`, '_blank');
                                }}
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            </div>
                            
                            {/* Contract notes/description */}
                            {tx.notes && (
                              <div className="text-xs text-gray-600 mt-1">
                                {tx.notes}
                              </div>
                            )}
                            
                            {/* Date and contract address - only when selected */}
                            {isSelected && (
                              <div className="text-xs text-gray-500 mt-2 pt-2 border-t border-gray-200">
                                <div>{new Date(tx.timestamp).toLocaleString()}</div>
                                <div className="font-mono">{tx.to}</div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Pagination */}
                    {nftData.transactions.length > 10 && (
                      <div className="flex justify-between items-center pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={currentPage === 0}
                          onClick={() => setCurrentPage(p => p - 1)}
                        >
                          Previous
                        </Button>
                        <span className="text-sm text-gray-600">
                          Page {currentPage + 1} of {Math.ceil(nftData.transactions.length / 10)}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={(currentPage + 1) * 10 >= nftData.transactions.length}
                          onClick={() => setCurrentPage(p => p + 1)}
                        >
                          Next
                        </Button>
                      </div>
                    )}

                    {/* Assemble Button - Below the list */}
                    {!isEvolved && (
                      <Button
                        onClick={handlePairTransaction}
                        disabled={!pairingTransaction || pairing || isPending || isConfirming}
                        className="w-full mt-4"
                      >
                        {pairing || isPending || isConfirming ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            {isConfirming ? 'Confirming Assembly...' : 'Assembling...'}
                          </>
                        ) : (
                          `Pay ${(assemblyPrice ? Number(assemblyPrice) / 1e18 : 1).toFixed(2)} EDU to Assemble`
                        )}
                      </Button>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-600 text-center py-4">
                    No recent transactions found
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Assembly Success Popup */}
      <AssemblySuccessPopup
        open={showAssemblyPopup}
        status={assemblyStatus}
        tokenId={tokenId}
        newImageUrl={assemblyResult?.newImageUrl}
        rarity={assemblyResult?.rarity}
        onClose={() => {
          setShowAssemblyPopup(false);
          setAssemblyResult(null);
        }}
        onViewBarabot={() => {
          setShowAssemblyPopup(false);
          setAssemblyResult(null);
          // Refresh the page to show updated data
          window.location.reload();
        }}
      />
    </PageLayout>
  );
}
