"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Flame } from "lucide-react";

interface Season3Data {
  wallet: string;
  referralYuzu: number;
  creationYuzu: number;
  completionYuzu: number;
  totalYuzu: number;
}

export default function Season3YuzuSection({ address }: { address: `0x${string}` | undefined }) {
  const [data, setData] = useState<Season3Data | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!address) {
      setIsLoading(false);
      return;
    }

    const fetchSeasonData = async () => {
      try {
        const response = await fetch('/Season3.csv');
        const csvText = await response.text();
        
        // Parse CSV
        const lines = csvText.trim().split('\n');
        const normalizedAddress = address.toLowerCase();
        
        // Find the user's row (skip header)
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i];
          // Split by comma, but handle quoted values
          const matches = line.match(/(".*?"|[^,]+)(?=\s*,|\s*$)/g);
          
          if (matches && matches.length >= 5) {
            const wallet = matches[0].replace(/"/g, '').trim().toLowerCase();
            
            if (wallet === normalizedAddress) {
              // Remove commas and quotes from numbers
              const referralYuzu = parseInt(matches[1].replace(/[",]/g, '').trim());
              const creationYuzu = parseInt(matches[2].replace(/[",]/g, '').trim());
              const completionYuzu = parseInt(matches[3].replace(/[",]/g, '').trim());
              const totalYuzu = parseInt(matches[4].replace(/[",]/g, '').trim());
              
              setData({
                wallet,
                referralYuzu,
                creationYuzu,
                completionYuzu,
                totalYuzu,
              });
              break;
            }
          }
        }
      } catch (error) {
        console.error('Error fetching Season 3 data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSeasonData();
  }, [address]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flame className="text-orange-500" />
            Season 3 YUZU Heatwave
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">Loading your Season 3 earnings...</p>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flame className="text-orange-500" />
            Season 3 YUZU Heatwave
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">No Season 3 earnings found for this wallet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Flame className="text-orange-500" />
          Season 3 YUZU Heatwave
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Referral YUZU</p>
              <p className="text-2xl font-bold text-blue-600">
                {data.referralYuzu.toLocaleString()}
              </p>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Creation YUZU</p>
              <p className="text-2xl font-bold text-green-600">
                {data.creationYuzu.toLocaleString()}
              </p>
            </div>
            
            <div className="bg-purple-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Completion YUZU</p>
              <p className="text-2xl font-bold text-purple-600">
                {data.completionYuzu.toLocaleString()}
              </p>
            </div>
          </div>
          
          <div className="bg-orange-50 p-4 rounded-lg border-2 border-orange-200">
            <p className="text-sm text-gray-600 mb-1">Total YUZU</p>
            <p className="text-3xl font-bold text-orange-600">
              {data.totalYuzu.toLocaleString()}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
