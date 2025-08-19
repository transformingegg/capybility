"use client";
import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { useRouter } from "next/navigation";
import PageLayout from "@/components/PageLayout";
import StatisticsSection from "@/components/user-dashboard/StatisticsSection";
import KnowledgePackSection from "@/components/user-dashboard/KnowledgePackSection";
import FutureFeatureSection from "@/components/user-dashboard/FutureFeatureSection";
import AvailableQuizzesSection from "@/components/user-dashboard/AvailableQuizzesSection";
import PromotionSection from "@/components/user-dashboard/PromotionSection";
import OCIDButton from "@/components/OCIDButton"; // Import the self-contained button

export default function UserDashboard() {
  const router = useRouter();
  const { isConnected, address } = useAccount();
  const [isInitialized, setIsInitialized] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialized(true);
      if (!isConnected) {
        router.push('/');
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [isConnected, router]);

  if (!isInitialized || !isConnected) {
    return null;
  }

  return (
    <PageLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <h1 className="text-3xl font-bold text-gray-800">Quiz Completer Dashboard</h1>
          
          <div>
            {/* Render the self-contained button component */}
            <OCIDButton />
          </div>
        </div>
        
        <AvailableQuizzesSection />
        <StatisticsSection address={address} />
        <PromotionSection address={address} /> 
        <KnowledgePackSection address={address} />
        <FutureFeatureSection />
      </div>
    </PageLayout>
  );
}