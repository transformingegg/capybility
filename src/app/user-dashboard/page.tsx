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
import OCIDButton from "@/components/OCIDButton";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import ReferralsSection from "@/components/user-dashboard/ReferralsSection";

export default function UserDashboard() {
  const router = useRouter();
  const { isConnected, address } = useAccount();
  const [isInitialized, setIsInitialized] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialized(true);
      if (!isConnected) {
        router.push('/?auth_required=true');
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [isConnected, router]);

  if (!isInitialized || !isConnected) {
    return null;
  }

  return (
    <PageLayout fullWidth={true}>
      <div 
        style={{
          backgroundImage: "url('/img/capyback.webp')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
          minHeight: 'calc(100vh - 65px)', // Adjust 65px based on header height
        }}
      >
        <div className="max-w-4xl mx-auto p-6 space-y-8">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                <CardTitle className="text-3xl">Quiz Completer Dashboard</CardTitle>
                <div>
                  <OCIDButton />
                </div>
              </div>
            </CardHeader>
          </Card>
          
          <AvailableQuizzesSection />
          <PromotionSection address={address} /> 
          <StatisticsSection address={address} />
          <ReferralsSection />
          <KnowledgePackSection address={address} />
          <FutureFeatureSection />
        </div>
      </div>
    </PageLayout>
  );
}