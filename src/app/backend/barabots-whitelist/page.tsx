"use client";
import { useAccount } from "wagmi";
import React, { useEffect, useState } from "react";
import MainLayout from "@/components/MainLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Upload, CheckCircle, AlertCircle } from "lucide-react";

interface AuthStatus {
  isAuthenticated: boolean;
  address?: string;
}

const BarabotsWhitelistPage = () => {
  const { address, isConnected } = useAccount();
  const [isLoading, setIsLoading] = useState(true);
  const [authStatus, setAuthStatus] = useState<AuthStatus | null>(null);
  const [mintTypes, setMintTypes] = useState<('free' | 'discount')[]>(['free']);
  const [bulkData, setBulkData] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    inserted?: number;
    details?: { inserted: string[] };
  } | null>(null);

  useEffect(() => {
    if (isConnected && address) {
      checkAuth();
    } else {
      setIsLoading(false);
    }
  }, [isConnected, address]);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/session');
      const data = await response.json();
      setAuthStatus(data);
    } catch (error) {
      console.error('Auth check error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!bulkData.trim()) {
      alert('Please enter wallet data');
      return;
    }

    if (mintTypes.length === 0) {
      alert('Please select at least one whitelist type');
      return;
    }

    if (!address) {
      alert('Admin address not found');
      return;
    }

    setIsSubmitting(true);
    setResult(null);

    try {
      const results = [];

      for (const mintType of mintTypes) {
        const response = await fetch('/api/barabots-whitelist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mintType,
            bulkData,
            adminAddress: address
          })
        });

        const data = await response.json();

        if (!response.ok) {
          setResult({ success: false, message: `Error for ${mintType}: ${data.error}` });
          return;
        }

        results.push({ mintType, ...data });
      }

      // Combine results
      const combinedResult = {
        success: true,
        message: `Processed for ${mintTypes.join(' and ')} whitelists`,
        inserted: results.reduce((sum, r) => sum + (r.inserted || 0), 0),
        details: {
          inserted: results.flatMap(r => r.details?.inserted || [])
        }
      };

      setResult(combinedResult);
      if (combinedResult.success) {
        setBulkData(''); // Clear the form on success
      }
    } catch (error) {
      console.error('Submit error:', error);
      setResult({ success: false, message: 'Network error occurred' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto p-6">
          <div className="flex items-center justify-center min-h-[200px]">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!isConnected) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto p-6">
          <Card>
            <CardContent className="p-6 text-center">
              <h1 className="text-2xl font-bold mb-4">Barabots Whitelist Management</h1>
              <p className="text-gray-600">Please connect your wallet to access admin features.</p>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  if (!authStatus?.isAuthenticated) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto p-6">
          <Card>
            <CardContent className="p-6 text-center">
              <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
              <p className="text-gray-600">You need admin privileges to access this page.</p>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Barabots Whitelist Management</h1>
              <p className="text-gray-600">
                Add multiple wallets to the whitelist for free or discount minting.
              </p>
            </div>
            <Button asChild variant="outline">
              <a href="/backend/barabots-contracts">Contract Categories</a>
            </Button>
          </div>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Bulk Add Wallets</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Whitelist Types</label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="free"
                    checked={mintTypes.includes('free')}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setMintTypes([...mintTypes, 'free']);
                      } else {
                        setMintTypes(mintTypes.filter(t => t !== 'free'));
                      }
                    }}
                  />
                  <label htmlFor="free" className="text-sm">Free Mint Whitelist</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="discount"
                    checked={mintTypes.includes('discount')}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setMintTypes([...mintTypes, 'discount']);
                      } else {
                        setMintTypes(mintTypes.filter(t => t !== 'discount'));
                      }
                    }}
                  />
                  <label htmlFor="discount" className="text-sm">Discount Mint Whitelist</label>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Wallet Data (one per line: wallet,category)
              </label>
              <Textarea
                placeholder={`0x1234...,build
0x5678...,work
0x9abc...,random
0xdef0...,culture`}
                value={bulkData}
                onChange={(e) => setBulkData(e.target.value)}
                rows={10}
                className="font-mono text-sm"
              />
              <p className="text-xs text-gray-500 mt-2">
                Format: wallet_address,category<br />
                Valid categories: build, work, defi, learn, culture, random<br />
                Use &quot;random&quot; for random category assignment
              </p>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !bulkData.trim() || mintTypes.length === 0}
              className="w-full"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Add to {mintTypes.length === 1 ? mintTypes[0] : 'Selected'} Whitelist{mintTypes.length > 1 ? 's' : ''}
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {result && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                {result.success ? (
                  <CheckCircle className="mr-2 h-5 w-5 text-green-500" />
                ) : (
                  <AlertCircle className="mr-2 h-5 w-5 text-red-500" />
                )}
                {result.success ? 'Success' : 'Error'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">{result.message}</p>

              {result.success && result.details && (
                <div className="space-y-2">
                  <div className="text-sm">
                    <strong>Inserted:</strong> {result.inserted} entries
                    {result.details?.inserted.length > 0 && (
                      <div className="mt-1 max-h-32 overflow-y-auto bg-gray-50 p-2 rounded text-xs font-mono">
                        {result.details.inserted.join(', ')}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-gray-600">
              <p>• Select one or both whitelist types (Free and/or Discount)</p>
              <p>• Enter one wallet per line in the format: <code>wallet_address,category</code></p>
              <p>• Valid categories: <code>build</code>, <code>work</code>, <code>defi</code>, <code>learn</code>, <code>culture</code>, <code>random</code></p>
              <p>• Use <code>random</code> to allow the user to choose any category when minting</p>
              <p>• The same wallet can be added to multiple whitelist types</p>
              <p>• Duplicate entries are allowed (no constraints)</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default BarabotsWhitelistPage;