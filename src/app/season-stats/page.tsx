"use client";
import { useState, useEffect } from "react";
import { useAccount, useSignMessage } from "wagmi";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight, Loader2 } from "lucide-react";
import PageLayout from "@/components/PageLayout";
import { distYUZU } from "@/config/constants";

interface ReferralStat {
  referer: string;
  referral_count: number;
  yuzu?: number; // Optional since it's calculated client-side
}

interface QuizCreatorStat {
  wallet_address: string;
  quiz_count: number;
  yuzu?: number; // Optional since it's calculated client-side
}

interface NFTRarityStat {
  wallet_address: string;
  common_count: number;
  uncommon_count: number;
  rare_count: number;
  epic_count: number;
  legendary_count: number;
  score: number;
  yuzu?: number; // Optional since it's calculated client-side
}

interface CombinedYuzuStat {
  wallet_address: string;
  referral_yuzu: number;
  creation_yuzu: number;
  completion_yuzu: number;
  total_yuzu: number;
}

export default function SeasonStatsPage() {
  const { isConnected, address } = useAccount();
  const { signMessageAsync } = useSignMessage();
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedTables, setExpandedTables] = useState<Set<string>>(new Set());
  
  // Data states
  const [referralStats, setReferralStats] = useState<ReferralStat[]>([]);
  const [quizCreatorStats, setQuizCreatorStats] = useState<QuizCreatorStat[]>([]);
  const [nftRarityStats, setNftRarityStats] = useState<NFTRarityStat[]>([]);
  const [combinedYuzuStats, setCombinedYuzuStats] = useState<CombinedYuzuStat[]>([]);
  
  // Loading states for each table
  const [loadingReferrals, setLoadingReferrals] = useState(false);
  const [loadingQuizzes, setLoadingQuizzes] = useState(false);
  const [loadingNFTs, setLoadingNFTs] = useState(false);

  // Check authentication on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const response = await fetch('/api/check-admin-session');
      const data = await response.json();
      setIsAuthenticated(data.isAuthenticated);
    } catch (error) {
      console.error('Error checking auth status:', error);
      setIsAuthenticated(false);
    }
  };

  const handleAuthenticate = async () => {
    if (!isConnected || !address) {
      alert('Please connect your wallet first');
      return;
    }

    setIsLoading(true);
    try {
      const message = `Admin login attempt from ${address} at ${new Date().toISOString()}`;
      const signature = await signMessageAsync({ message });

      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, signature, address })
      });

      const data = await response.json();
      if (data.success) {
        setIsAuthenticated(true);
      } else {
        alert('Authentication failed: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Authentication error:', error);
      alert('Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchReferralStats = async () => {
    setLoadingReferrals(true);
    try {
      const response = await fetch('/api/season-stats/referrals');
      const data = await response.json();
      if (data.success) {
        // Calculate YUZU distribution based on referral_count
        const stats = data.data;
        
        // Calculate modifiedScore = referral_count^(2/3) for each row
        const modifiedScores = stats.map((stat: ReferralStat) => Math.pow(stat.referral_count, 2/3));
        
        // Get total of all modifiedScores
        const totalModifiedScores = modifiedScores.reduce((sum: number, modScore: number) => sum + modScore, 0);
        
        // Calculate YUZU for each row and sort by referral_count (largest to smallest)
        const withYuzu = stats.map((stat: ReferralStat, index: number) => ({
          ...stat,
          yuzu: totalModifiedScores > 0 ? Math.round((modifiedScores[index] / totalModifiedScores) * (distYUZU * 0.4)) : 0
        })).sort((a: ReferralStat, b: ReferralStat) => b.referral_count - a.referral_count);
        
        setReferralStats(withYuzu);
      } else {
        console.error('Failed to fetch referral stats:', data.error);
      }
    } catch (error) {
      console.error('Error fetching referral stats:', error);
    } finally {
      setLoadingReferrals(false);
    }
  };

  const fetchQuizCreatorStats = async () => {
    setLoadingQuizzes(true);
    try {
      const response = await fetch('/api/season-stats/quiz-creators');
      const data = await response.json();
      if (data.success) {
        // Calculate YUZU distribution based on quiz_count
        const stats = data.data;
        
        // Calculate modifiedScore = quiz_count^(2/3) for each row
        const modifiedScores = stats.map((stat: QuizCreatorStat) => Math.pow(stat.quiz_count, 2/3));
        
        // Get total of all modifiedScores
        const totalModifiedScores = modifiedScores.reduce((sum: number, modScore: number) => sum + modScore, 0);
        
        // Calculate YUZU for each row and sort by quiz_count (largest to smallest)
        const withYuzu = stats.map((stat: QuizCreatorStat, index: number) => ({
          ...stat,
          yuzu: totalModifiedScores > 0 ? Math.round((modifiedScores[index] / totalModifiedScores) * (distYUZU * 0.2)) : 0
        })).sort((a: QuizCreatorStat, b: QuizCreatorStat) => b.quiz_count - a.quiz_count);
        
        setQuizCreatorStats(withYuzu);
      } else {
        console.error('Failed to fetch quiz creator stats:', data.error);
      }
    } catch (error) {
      console.error('Error fetching quiz creator stats:', error);
    } finally {
      setLoadingQuizzes(false);
    }
  };

  // Shard controls
  const [shardGenerating, setShardGenerating] = useState(false);
  const [masterCreating, setMasterCreating] = useState(false);
  const [shardProgress, setShardProgress] = useState<{ lastProcessed: number; totalSupply: number; isComplete: boolean } | null>(null);

  const handleGenerateShard = async () => {
    if (!confirm('Generate a shard of up to 50 NFTs starting from the last processed token?')) return;
    setShardGenerating(true);
    try {
      const response = await fetch('/api/season-stats/nft-rarity/generate-shard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}) // No startToken needed - uses DB state
      });
      const data = await response.json();
      if (response.ok) {
        alert(`Shard created: ${data.shardFile}\nProcessed ${data.nftCount} NFTs (tokens ${data.startToken}-${data.lastTokenProcessed})\n${data.remainingTokens} tokens remaining`);
        setShardProgress({
          lastProcessed: data.lastTokenProcessed,
          totalSupply: data.totalSupply,
          isComplete: data.isComplete
        });
      } else {
        console.error('Shard generation failed', data);
        alert('Shard generation failed: ' + (data.error || 'unknown'));
      }
    } catch (e) {
      console.error('Error generating shard', e);
      alert('Error generating shard');
    } finally {
      setShardGenerating(false);
    }
  };

  const handleCreateMaster = async () => {
    if (!confirm('Create a master file by aggregating all NFT shards by wallet?')) return;
    setMasterCreating(true);
    try {
      const response = await fetch('/api/season-stats/nft-rarity/create-master', { method: 'POST' });
      const data = await response.json();
      if (response.ok) {
        alert(`Master created: ${data.masterFile}\n${data.totalHolders} unique holders, ${data.totalNFTs} total NFTs\nProcessed ${data.shardsProcessed} shards`);
      } else {
        console.error('Create master failed', data);
        alert('Create master failed: ' + (data.error || 'unknown'));
      }
    } catch (e) {
      console.error('Error creating master', e);
      alert('Error creating master');
    } finally {
      setMasterCreating(false);
    }
  };

  const handleLoadLatestMaster = async () => {
    setLoadingNFTs(true);
    try {
      const response = await fetch('/api/season-stats/nft-rarity/load-master');
      const data = await response.json();
      if (response.ok) {
        // Step 1: Calculate scores for each wallet
        const withScores = data.data.map((stat: NFTRarityStat) => {
          // Handle both new format (rarity_count) and legacy format (rarity)
          const legacyStat = stat as NFTRarityStat & { 
            common?: number; 
            uncommon?: number; 
            rare?: number; 
            epic?: number; 
            legendary?: number; 
          };
          const common = Number(stat.common_count ?? legacyStat.common ?? 0) || 0;
          const uncommon = Number(stat.uncommon_count ?? legacyStat.uncommon ?? 0) || 0;
          const rare = Number(stat.rare_count ?? legacyStat.rare ?? 0) || 0;
          const epic = Number(stat.epic_count ?? legacyStat.epic ?? 0) || 0;
          const legendary = Number(stat.legendary_count ?? legacyStat.legendary ?? 0) || 0;
          const score = (common * 1) + (uncommon * 2) + (rare * 3) + (epic * 4) + (legendary * 10);
          return { ...stat, score };
        });

        // Step 2: Calculate YUZU distribution
        // Calculate modifiedScore = score^(2/3) for each row
        const modifiedScores = withScores.map((stat: NFTRarityStat) => Math.pow(stat.score, 2/3));
        
        // Get total of all modifiedScores
        const totalModifiedScores = modifiedScores.reduce((sum: number, modScore: number) => sum + modScore, 0);
        
        // Calculate YUZU for each row: (modifiedScore / totalModifiedScores) * distYUZU
        const withYuzu = withScores.map((stat: NFTRarityStat, index: number) => ({
          ...stat,
          yuzu: totalModifiedScores > 0 ? Math.round((modifiedScores[index] / totalModifiedScores) * (distYUZU * 0.4)) : 0
        }));

        // Sort by score (largest to smallest)
        const sortedData = withYuzu.sort((a: NFTRarityStat, b: NFTRarityStat) => b.score - a.score);

        setNftRarityStats(sortedData);
        alert(`Loaded master: ${data.masterFile}\n${data.data.length} holders loaded`);
      } else {
        console.error('Load master failed', data);
        alert('Load master failed: ' + (data.error || 'No master files found. Please generate shards first.'));
      }
    } catch (error) {
      console.error('Error loading master:', error);
      alert('Error loading master. Please check if master files exist or generate new shards.');
    } finally {
      setLoadingNFTs(false);
    }
  };

  const toggleTable = (tableName: string) => {
    const newExpandedTables = new Set(expandedTables);
    
    if (newExpandedTables.has(tableName)) {
      newExpandedTables.delete(tableName);
    } else {
      newExpandedTables.add(tableName);
      
      // Fetch data when expanding
      switch (tableName) {
        case 'referrals':
          if (referralStats.length === 0) fetchReferralStats();
          break;
        case 'quiz-creators':
          if (quizCreatorStats.length === 0) fetchQuizCreatorStats();
          break;
        case 'nft-rarity':
          // Don't automatically fetch - just show the control buttons
          break;
        case 'combined-yuzu':
          // Generate combined data when opening
          generateCombinedYuzuStats();
          break;
      }
    }
    
    setExpandedTables(newExpandedTables);
  };

  const generateCombinedYuzuStats = () => {
    // Combine YUZU from all three sections
    const walletMap = new Map<string, { referral: number; creation: number; completion: number }>();
    
    // Add referral YUZU
    referralStats.forEach(stat => {
      const wallet = stat.referer.toLowerCase();
      if (!walletMap.has(wallet)) {
        walletMap.set(wallet, { referral: 0, creation: 0, completion: 0 });
      }
      walletMap.get(wallet)!.referral = stat.yuzu || 0;
    });
    
    // Add quiz creation YUZU
    quizCreatorStats.forEach(stat => {
      const wallet = stat.wallet_address.toLowerCase();
      if (!walletMap.has(wallet)) {
        walletMap.set(wallet, { referral: 0, creation: 0, completion: 0 });
      }
      walletMap.get(wallet)!.creation = stat.yuzu || 0;
    });
    
    // Add NFT completion YUZU
    nftRarityStats.forEach(stat => {
      const wallet = stat.wallet_address.toLowerCase();
      if (!walletMap.has(wallet)) {
        walletMap.set(wallet, { referral: 0, creation: 0, completion: 0 });
      }
      walletMap.get(wallet)!.completion = stat.yuzu || 0;
    });
    
    // Convert to array and calculate totals
    const combinedStats = Array.from(walletMap.entries()).map(([wallet, yuzu]) => ({
      wallet_address: wallet,
      referral_yuzu: yuzu.referral,
      creation_yuzu: yuzu.creation,
      completion_yuzu: yuzu.completion,
      total_yuzu: yuzu.referral + yuzu.creation + yuzu.completion
    })).sort((a, b) => b.total_yuzu - a.total_yuzu); // Sort by total YUZU descending
    
    setCombinedYuzuStats(combinedStats);
  };

  // Check if all sections have data loaded
  const allSectionsLoaded = referralStats.length > 0 && quizCreatorStats.length > 0 && nftRarityStats.length > 0;

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (!isAuthenticated) {
    return (
      <PageLayout>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Card>
            <CardHeader>
              <CardTitle>Season Stats - Admin Access Required</CardTitle>
            </CardHeader>
            <CardContent>
              {!isConnected ? (
                <p>Please connect your wallet to authenticate.</p>
              ) : (
                <div className="space-y-4">
                  <p>Admin authentication required to access season statistics.</p>
                  <Button 
                    onClick={handleAuthenticate}
                    disabled={isLoading}
                    className="w-full"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Authenticating...
                      </>
                    ) : (
                      'Authenticate as Admin'
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Season Statistics Dashboard</h1>
        
        {/* Referrals Table */}
        <Card className="mb-6">
          <CardHeader 
            className="cursor-pointer hover:bg-gray-50"
            onClick={() => toggleTable('referrals')}
          >
            <CardTitle className="flex items-center justify-between">
              <span>Referral Statistics</span>
              {expandedTables.has('referrals') ? (
                <ChevronDown className="h-5 w-5" />
              ) : (
                <ChevronRight className="h-5 w-5" />
              )}
            </CardTitle>
          </CardHeader>
          {expandedTables.has('referrals') && (
            <CardContent>
              {loadingReferrals ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  Loading referral statistics...
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-300 px-4 py-2 text-left">Referrer Wallet</th>
                        <th className="border border-gray-300 px-4 py-2 text-left">Referral Count</th>
                        <th className="border border-gray-300 px-4 py-2 text-center">YUZU</th>
                      </tr>
                    </thead>
                    <tbody>
                      {referralStats.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="border border-gray-300 px-4 py-2 text-center text-gray-500">
                            No referral data found
                          </td>
                        </tr>
                      ) : (
                        referralStats.map((stat, index) => (
                          <tr key={stat.referer} className={index % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                            <td className="border border-gray-300 px-4 py-2 font-mono">
                              {truncateAddress(stat.referer)}
                            </td>
                            <td className="border border-gray-300 px-4 py-2">
                              {stat.referral_count}
                            </td>
                            <td className="border border-gray-300 px-4 py-2 text-center font-semibold text-orange-600">
                              {stat.yuzu || 0}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                  {referralStats.length > 0 && (
                    <p className="text-sm text-gray-600 mt-2">
                      Total referrers: {referralStats.length}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          )}
        </Card>

        {/* Quiz Creators Table */}
        <Card className="mb-6">
          <CardHeader 
            className="cursor-pointer hover:bg-gray-50"
            onClick={() => toggleTable('quiz-creators')}
          >
            <CardTitle className="flex items-center justify-between">
              <span>EDUCHAIN Quiz Creators</span>
              {expandedTables.has('quiz-creators') ? (
                <ChevronDown className="h-5 w-5" />
              ) : (
                <ChevronRight className="h-5 w-5" />
              )}
            </CardTitle>
          </CardHeader>
          {expandedTables.has('quiz-creators') && (
            <CardContent>
              {loadingQuizzes ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  Loading quiz creator statistics...
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-300 px-4 py-2 text-left">Creator Wallet</th>
                        <th className="border border-gray-300 px-4 py-2 text-left">EDUCHAIN Quiz Count</th>
                        <th className="border border-gray-300 px-4 py-2 text-center">YUZU</th>
                      </tr>
                    </thead>
                    <tbody>
                      {quizCreatorStats.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="border border-gray-300 px-4 py-2 text-center text-gray-500">
                            No EDUCHAIN quiz creators found
                          </td>
                        </tr>
                      ) : (
                        quizCreatorStats.map((stat, index) => (
                          <tr key={stat.wallet_address} className={index % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                            <td className="border border-gray-300 px-4 py-2 font-mono">
                              {truncateAddress(stat.wallet_address)}
                            </td>
                            <td className="border border-gray-300 px-4 py-2">
                              {stat.quiz_count}
                            </td>
                            <td className="border border-gray-300 px-4 py-2 text-center font-semibold text-orange-600">
                              {stat.yuzu || 0}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                  {quizCreatorStats.length > 0 && (
                    <p className="text-sm text-gray-600 mt-2">
                      Total EDUCHAIN quiz creators: {quizCreatorStats.length}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          )}
        </Card>

        {/* NFT Rarity Table */}
        <Card className="mb-6">
          <CardHeader 
            className="cursor-pointer hover:bg-gray-50"
            onClick={() => toggleTable('nft-rarity')}
          >
            <CardTitle className="flex items-center justify-between">
              <span>QuizCompletionNFT Rarity Statistics</span>
              {expandedTables.has('nft-rarity') ? (
                <ChevronDown className="h-5 w-5" />
              ) : (
                <ChevronRight className="h-5 w-5" />
              )}
            </CardTitle>
          </CardHeader>
          {expandedTables.has('nft-rarity') && (
            <CardContent>
              {loadingNFTs ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  Loading NFT rarity statistics...
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-300 px-4 py-2 text-left">Wallet</th>
                        <th className="border border-gray-300 px-4 py-2 text-center">Common</th>
                        <th className="border border-gray-300 px-4 py-2 text-center">Uncommon</th>
                        <th className="border border-gray-300 px-4 py-2 text-center">Rare</th>
                        <th className="border border-gray-300 px-4 py-2 text-center">Epic</th>
                        <th className="border border-gray-300 px-4 py-2 text-center">Legendary</th>
                        <th className="border border-gray-300 px-4 py-2 text-center">Score</th>
                        <th className="border border-gray-300 px-4 py-2 text-center">YUZU</th>
                      </tr>
                    </thead>
                    <tbody>
                      {nftRarityStats.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="border border-gray-300 px-4 py-2 text-center text-gray-500">
                            No NFT rarity data found
                          </td>
                        </tr>
                      ) : (
                        nftRarityStats.map((stat, index) => (
                          <tr key={stat.wallet_address} className={index % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                            <td className="border border-gray-300 px-4 py-2 font-mono">
                              {truncateAddress(stat.wallet_address)}
                            </td>
                            <td className="border border-gray-300 px-4 py-2 text-center">
                              {stat.common_count}
                            </td>
                            <td className="border border-gray-300 px-4 py-2 text-center">
                              {stat.uncommon_count}
                            </td>
                            <td className="border border-gray-300 px-4 py-2 text-center">
                              {stat.rare_count}
                            </td>
                            <td className="border border-gray-300 px-4 py-2 text-center">
                              {stat.epic_count}
                            </td>
                            <td className="border border-gray-300 px-4 py-2 text-center">
                              {stat.legendary_count}
                            </td>
                            <td className="border border-gray-300 px-4 py-2 text-center font-semibold">
                              {stat.score}
                            </td>
                            <td className="border border-gray-300 px-4 py-2 text-center font-semibold text-orange-600">
                              {stat.yuzu || 0}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                  <div className="flex items-center justify-between mt-4">
                    <div className="space-x-2">
                      <Button onClick={handleGenerateShard} disabled={shardGenerating}>
                        {shardGenerating ? 'Generating shard...' : 'Generate shard (500 NFTs)'}
                      </Button>
                      <Button onClick={handleCreateMaster} disabled={masterCreating}>
                        {masterCreating ? 'Creating master...' : 'Create master from shards'}
                      </Button>
                      <Button onClick={handleLoadLatestMaster} disabled={loadingNFTs}>
                        {loadingNFTs ? 'Loading...' : 'Load latest master'}
                      </Button>
                    </div>
                    <div className="text-sm text-gray-600">
                      {shardProgress ? (
                        <span>
                          Progress: {shardProgress.lastProcessed}/{shardProgress.totalSupply} tokens
                          {shardProgress.isComplete && ' ✅ Complete'}
                        </span>
                      ) : (
                        'Generate shards to track progress'
                      )}
                    </div>
                  </div>

                  {nftRarityStats.length > 0 && (
                    <p className="text-sm text-gray-600 mt-2">
                      Total NFT holders: {nftRarityStats.length}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          )}
        </Card>

        {/* Combined YUZU Summary Table */}
        <Card className="mb-6">
          <CardHeader 
            className={`cursor-pointer hover:bg-gray-50 ${!allSectionsLoaded ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={() => allSectionsLoaded && toggleTable('combined-yuzu')}
          >
            <CardTitle className="flex items-center justify-between">
              <span>Combined YUZU Distribution Summary</span>
              {allSectionsLoaded ? (
                expandedTables.has('combined-yuzu') ? (
                  <ChevronDown className="h-5 w-5" />
                ) : (
                  <ChevronRight className="h-5 w-5" />
                )
              ) : (
                <span className="text-sm text-gray-500">Load all sections first</span>
              )}
            </CardTitle>
          </CardHeader>
          {expandedTables.has('combined-yuzu') && allSectionsLoaded && (
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 px-4 py-2 text-left">Wallet</th>
                      <th className="border border-gray-300 px-4 py-2 text-center">Referral YUZU</th>
                      <th className="border border-gray-300 px-4 py-2 text-center">Creation YUZU</th>
                      <th className="border border-gray-300 px-4 py-2 text-center">Completion YUZU</th>
                      <th className="border border-gray-300 px-4 py-2 text-center">Total YUZU</th>
                    </tr>
                  </thead>
                  <tbody>
                    {combinedYuzuStats.map((stat, index) => (
                      <tr key={stat.wallet_address} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="border border-gray-300 px-4 py-2 font-mono text-sm">
                          {truncateAddress(stat.wallet_address)}
                        </td>
                        <td className="border border-gray-300 px-4 py-2 text-center">
                          {stat.referral_yuzu.toLocaleString()}
                        </td>
                        <td className="border border-gray-300 px-4 py-2 text-center">
                          {stat.creation_yuzu.toLocaleString()}
                        </td>
                        <td className="border border-gray-300 px-4 py-2 text-center">
                          {stat.completion_yuzu.toLocaleString()}
                        </td>
                        <td className="border border-gray-300 px-4 py-2 text-center font-semibold">
                          {stat.total_yuzu.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {combinedYuzuStats.length > 0 && (
                  <p className="text-sm text-gray-600 mt-2">
                    Total unique wallets: {combinedYuzuStats.length}
                  </p>
                )}
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </PageLayout>
  );
}