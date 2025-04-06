"use client";
import dynamic from "next/dynamic";
import Dashboard from "../components/Dashboard";
import MainLayout from '@/components/MainLayout';
import Link from 'next/link';
import { buttonStyles } from "@/utils/styles";

// Prevent hydration errors with dynamic import
const DynamicDashboard = dynamic(() => Promise.resolve(Dashboard), {
  ssr: false,
});

export default function Home() {
  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">
          You've found CAPYBILITY!
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          CAPYBILITY uses the simple effectiveness of 5 question multiple choice quizes to join project, users, educators and learners together to show their capabilities.  
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
          <div className="bg-white p-8 rounded-lg shadow-lg border-2 border-[#00c7df]">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Create Quizzes</h2>
            <p className="text-gray-600 mb-6">
              Create engaging quizzes and securer them as yours with an NFT mint. Track participating users and reward them for learning about your thing! 
            </p>
            <Link href="/creator-dashboard" className={buttonStyles}>
              CREATOR DASHBOARD
            </Link>
          </div>
          <div className="bg-white p-8 rounded-lg shadow-lg border-2 border-[#00c7df]">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Do Quizzes</h2>
            <p className="text-gray-600 mb-6">
              Take simple quizzes to build up your knowledge portfolio. Get rewarded along the way! 
            </p>
            <Link href="/user-dashboard" className={buttonStyles}>
              USER DASHBOARD
            </Link>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}