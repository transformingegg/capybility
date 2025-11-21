"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Sparkles, Package, RefreshCw } from "lucide-react";
import PageLayout from "@/components/PageLayout";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import Image from "next/image";

interface BarabotNFT {
  tokenId: string;
  category: string;
  state: string;
  rarity?: string;
}

export default function BarabotsGridPage() {
  const { address, isConnected } = useAccount();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [barabots, setBarabots] = useState<BarabotNFT[]>([]);

  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  useEffect(() => {
    if (address && isConnected) {
      fetchBarabots();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, isConnected]);

  // Force refresh on component mount (page load) to ensure ownership is up-to-date
  useEffect(() => {
    if (address && isConnected) {
      fetchBarabots(true); // Force refresh with cache busting
    }
  }, []); // Empty dependency array - runs only on mount

  // Add focus event listener to refresh data when user returns to tab
  useEffect(() => {
    const handleFocus = () => {
      if (address && isConnected && !loading) {
        fetchBarabots();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [address, isConnected, loading]);

  // Auto-refresh every 30 seconds to catch ownership changes
  useEffect(() => {
    if (!address || !isConnected) return;

    const interval = setInterval(() => {
      fetchBarabots();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [address, isConnected]);

  const fetchBarabots = async (forceRefresh = false) => {
    if (!address) return;

    console.log('Fetching barabots for address:', address, 'forceRefresh:', forceRefresh);
    setLoading(true);
    try {
      // Add cache-busting parameter
      const cacheBust = forceRefresh ? `&t=${Date.now()}` : '';
      const response = await fetch(`/api/barabots-list?wallet=${address}${cacheBust}`);
      const data = await response.json();

      console.log('API response:', data);
      if (response.ok) {
        setBarabots(data.barabots || []);
        setLastRefresh(new Date());
      } else {
        console.error('Error fetching Barabots:', data.error);
      }
    } catch (error) {
      console.error('Error fetching Barabots:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <PageLayout>
        <div className="max-w-2xl mx-auto p-6">
          <Card>
            <CardContent className="p-6 text-center">
              <h1 className="text-2xl font-bold mb-4">My Barabots</h1>
              <p className="text-gray-600">Please connect your wallet to view your Barabots collection.</p>
            </CardContent>
          </Card>
        </div>
      </PageLayout>
    );
  }

  if (loading) {
    return (
      <PageLayout>
        <div className="max-w-6xl mx-auto p-6">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading your Barabots collection...</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  if (barabots.length === 0) {
    return (
      <PageLayout>
        <div className="max-w-4xl mx-auto p-6">
          {/* Hero Section for New Users */}
          <Card className="mb-8 bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200">
            <CardHeader>
              <CardTitle className="text-4xl text-center flex items-center justify-center gap-2">
                <Package className="text-blue-600" />
                Welcome to Barabots!
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-xl text-gray-600 mb-8">
                Start your collection journey today!
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-lg">
                  <div className="text-4xl mb-3">📦</div>
                  <h3 className="font-bold text-lg mb-2">Step 1: Mint</h3>
                  <p className="text-sm text-gray-600">Mint your crate!</p>
                </div>
                <div className="bg-white p-6 rounded-lg">
                  <div className="text-4xl mb-3">🔗</div>
                  <h3 className="font-bold text-lg mb-2">Step 2: Pair</h3>
                  <p className="text-sm text-gray-600">Select a crate and one of your on-chain transactions</p>
                </div>
                <div className="bg-white p-6 rounded-lg">
                  <div className="text-4xl mb-3">✨</div>
                  <h3 className="font-bold text-lg mb-2">Step 3: Assemble</h3>
                  <p className="text-sm text-gray-600">Construct your Barabot that was in your crate to reveal its rarity</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  onClick={() => router.push('/barabotsmint')}
                  size="lg"
                  className="w-full sm:w-auto"
                >
                  <Sparkles className="mr-2 h-6 w-6" />
                  Mint Your First Barabot
                </Button>
                <Button
                  onClick={() => router.push('/barabots-learn')}
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto"
                >
                  <Package className="mr-2 h-6 w-6" />
                  Learn about Barabots
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="max-w-7xl mx-auto p-6">
        {/* Hero/Landing Section */}
        <Card className="mb-8 bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200">
          <CardHeader>
            <div className="flex flex-col gap-4">
              <div>
                <CardTitle className="text-4xl mb-2">
                  BaraBots
                </CardTitle>
                <p className="text-gray-600 text-lg">
                  Get Crates, pair them with your EDUCHAIN activity to assemble them into BaraBots, Collect the rarest set you can!
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  onClick={() => router.push('/barabotsmint')}
                  size="lg"
                  className="w-full sm:w-auto"
                >
                  <Sparkles className="mr-2" />
                  Mint More Crates
                </Button>
                <Button
                  onClick={() => router.push('/barabots-learn')}
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto"
                >
                  <Package className="mr-2" />
                  Learn about Barabots
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
              <div className="space-y-4">
                <div className="bg-white p-4 rounded-lg">
                  <h3 className="font-bold text-lg mb-1">📦 Step 1: Mint</h3>
                  <p className="text-sm text-gray-600">Mint your crate!</p>
                  <p className="text-sm text-gray-600">Click 'Mint more Crates' above to get more Crates. You can get free and discounted mints by doing or creating quizzes.</p>
                </div>
                <div className="bg-white p-4 rounded-lg">
                  <h3 className="font-bold text-lg mb-1">✨ Step 2: Assemble</h3>
                  <p className="text-sm text-gray-600">Construct your Barabot by Pairing them with your EDUCHAIN transactions</p>
                  <p className="text-sm text-gray-600">Click on a crate below to go to the Assembly tool.</p>
                </div>
              </div>
              <div className="flex items-start justify-center">
                <div className="w-full max-w-xs">
                  <Image
                    src="/img/BIGBOT.png"
                    alt="BaraBot Mascot"
                    width={400}
                    height={400}
                    className="w-full h-auto object-contain opacity-80"
                    unoptimized
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Collection Stats */}
        <div className="mb-8">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold text-gray-600">{barabots.filter(b => b.state === 'Crate').length}</div>
                <div className="text-sm text-gray-600">Crates</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold text-green-600">{barabots.filter(b => b.state === 'Barabot').length}</div>
                <div className="text-sm text-gray-600">Barabots</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold text-blue-600">{barabots.length}</div>
                <div className="text-sm text-gray-600">Total Owned</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold text-purple-600">
                  {barabots.filter(b => b.rarity).length > 0 
                    ? Math.round((barabots.filter(b => b.state === 'Barabot').length / barabots.length) * 100) + '%'
                    : '0%'}
                </div>
                <div className="text-sm text-gray-600">Assembly Rate</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Button
                  onClick={() => fetchBarabots(true)}
                  variant="outline"
                  size="sm"
                  disabled={loading}
                  className="w-full"
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
                <div className="text-xs text-gray-600 mt-1">Refresh</div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-2xl font-bold">Your Collection</h2>
          <p className="text-gray-600">
            Click on any NFT to view details and pair with transactions
          </p>
          {lastRefresh && (
            <p className="text-sm text-gray-500 mt-2">
              Last updated: {lastRefresh.toLocaleTimeString()}
            </p>
          )}
        </div>

        {/* Crates Section */}
        {barabots.filter(b => b.state === 'Crate').length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-4">Crates ({barabots.filter(b => b.state === 'Crate').length})</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {barabots.filter(b => b.state === 'Crate').map((barabot) => (
                <Card
                  key={barabot.tokenId}
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => router.push(`/barabots/${barabot.tokenId}`)}
                >
                  <CardContent className="p-4">
                    <div className="mb-4 rounded-lg overflow-hidden bg-gray-100">
                      <Image
                        src={`/barabotsmetadata/img/${barabot.tokenId}`}
                        alt={`Barabot #${barabot.tokenId}`}
                        width={300}
                        height={300}
                        className="w-full h-auto object-cover"
                      />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg mb-1">Crate #{barabot.tokenId}</h3>
                      <div className="flex flex-wrap gap-2">
                        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                          {barabot.category}
                        </span>
                        <span className="text-xs px-2 py-1 bg-gray-100 text-gray-800 rounded">
                          {barabot.state}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Barabots Section */}
        {barabots.filter(b => b.state === 'Barabot').length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-4">Barabots ({barabots.filter(b => b.state === 'Barabot').length})</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {barabots.filter(b => b.state === 'Barabot').map((barabot) => (
                <Card
                  key={barabot.tokenId}
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => router.push(`/barabots/${barabot.tokenId}`)}
                >
                  <CardContent className="p-4">
                    <div className="mb-4 rounded-lg overflow-hidden bg-gray-100">
                      <Image
                        src={`/barabotsmetadata/img/${barabot.tokenId}`}
                        alt={`Barabot #${barabot.tokenId}`}
                        width={300}
                        height={300}
                        className="w-full h-auto object-cover"
                      />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg mb-1">Barabot #{barabot.tokenId}</h3>
                      <div className="flex flex-wrap gap-2">
                        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                          {barabot.category}
                        </span>
                        <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded">
                          {barabot.state}
                        </span>
                        {barabot.rarity && (
                          <span className="text-xs px-2 py-1 bg-purple-100 text-purple-800 rounded">
                            {barabot.rarity}
                          </span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

      </div>
    </PageLayout>
  );
}
