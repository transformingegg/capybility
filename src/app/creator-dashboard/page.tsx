"use client";
import dynamic from "next/dynamic";
import Dashboard from "../../components/Dashboard";

// Prevent hydration errors with dynamic import
const DynamicDashboard = dynamic(() => Promise.resolve(Dashboard), {
  ssr: false,
});

export default function CreatorDashboard() {
  return <DynamicDashboard />;
}