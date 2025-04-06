"use client";
import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { useRouter } from "next/navigation";
import PageLayout from "@/components/PageLayout";
import StatisticsSection from "@/components/user-dashboard/StatisticsSection";
import KnowledgePackSection from "@/components/user-dashboard/KnowledgePackSection";
import FutureFeatureSection from "@/components/user-dashboard/FutureFeatureSection";

export default function UserDashboard() {
  const router = useRouter();
  const { isConnected, address } = useAccount();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Wait a brief moment to allow wallet state to initialize
    const timer = setTimeout(() => {
      setIsInitialized(true);
      if (!isConnected) {
        router.push('/');
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [isConnected, router]);

  // Show nothing while initializing
  if (!isInitialized) return null;
  
  // Show nothing if not connected (will redirect)
  if (!isConnected) return null;

  return (
    <PageLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-800">My Stats</h1>
        <StatisticsSection address={address} />
        <KnowledgePackSection address={address} />
        <FutureFeatureSection />
      </div>
    </PageLayout>
  );
}