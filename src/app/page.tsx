"use client";
import MainLayout from '@/components/MainLayout';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { AuroraBackground } from '@/components/magicui/aurora-background';
import { AuroraText } from '@/components/magicui/aurora-text';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";


export default function Home() {
  const searchParams = useSearchParams();
  const [showAuthAlert, setShowAuthAlert] = useState(false);

  useEffect(() => {
    if (searchParams.get('auth_required')) {
      setShowAuthAlert(true);
    }
  }, [searchParams]);

  // Referral tracking
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const ref = params.get('ref');
      if (ref) {
        console.log('[Referral] Referral link found in URL (homepage):', ref);
        sessionStorage.setItem('referrer', ref);
        console.log('[Referral] Wallet stored in session (homepage):', ref);
      } else {
        const storedRef = sessionStorage.getItem('referrer');
        if (storedRef) {
          console.log('[Referral] Wallet loaded from session (homepage):', storedRef);
        }
      }
    }
  }, []);

  return (
    <MainLayout noPadding={true}>
      <AlertDialog open={showAuthAlert} onOpenChange={setShowAuthAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Wallet Connection Required</AlertDialogTitle>
            <AlertDialogDescription>
              You must have your wallet connected to access that page. Please connect your wallet and try again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogAction>OK</AlertDialogAction>
        </AlertDialogContent>
      </AlertDialog>
      <AuroraBackground className="bg-zinc-900">
        <div className="text-center py-8 md:py-12">
          <h1 className="text-4xl md:text-7xl font-bold text-white">
            Show you <AuroraText colors={["#fcdd3f", "#00c7df", "#fcdd3f"]} speed={2}>Know.</AuroraText>
          </h1>
        </div>
      </AuroraBackground>
      <div className="max-w-4xl mx-auto text-center pt-8 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle className="text-4xl">Create Quizzes</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow">
              <p className="text-gray-600 mb-6">
                Use our smart Quiz creating tool to make a quiz and get others to do it. Track participating users and reward them for learning about your thing! 
              </p>
            </CardContent>
            <CardFooter>
              <Link href="/creator-dashboard" className="w-full">
                <Button className="w-full">CREATOR DASHBOARD</Button>
              </Link>
            </CardFooter>
          </Card>
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle className="text-4xl">Do Quizzes</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow">
              <p className="text-gray-600 mb-6">
                Take simple quizzes to build up your knowledge portfolio. Get rewarded along the way! 
              </p>
            </CardContent>
            <CardFooter>
              <Link href="/user-dashboard" className="w-full">
                <Button className="w-full">USER DASHBOARD</Button>
              </Link>
            </CardFooter>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}