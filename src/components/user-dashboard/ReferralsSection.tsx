import React, { useState } from "react";
import { useAccount } from "wagmi";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Referral {
  referee: string;
  hasCompletedQuiz: boolean;
}

const REFERRAL_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://capybility.xyz";

export default function ReferralsSection() {
  const { address } = useAccount();
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showReferrals, setShowReferrals] = useState(false);

  const referralLink = `${REFERRAL_BASE_URL}/?ref=${address}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleShowReferrals = () => {
    if (!address) return;
    setLoading(true);
    fetch(`/api/referral-list?referer=${address}`)
      .then(res => {
        if (!res.ok) throw new Error("Failed to fetch referrals");
        return res.json();
      })
      .then(data => {
        setReferrals(data.referrals || []);
        setLoading(false);
        setShowReferrals(true);
      })
      .catch(err => {
        setReferrals([]);
        setLoading(false);
        setShowReferrals(true);
        console.error("Referral fetch error:", err);
      });
  };

  // Count referrals who have completed a quiz
  const countedReferrals = referrals.filter(r => r.hasCompletedQuiz);

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Referrals</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <label className="font-semibold">Your referral link:</label>
          <div className="flex items-center gap-2 mt-1">
            <div className="bg-gray-100 p-2 rounded select-all text-sm flex-1">{referralLink}</div>
            <Button size="sm" variant="outline" onClick={handleCopy}>{copied ? "Copied!" : "Copy"}</Button>
          </div>
        </div>
        {!showReferrals && (
          <Button size="default" variant="default" className="mb-4" onClick={handleShowReferrals} disabled={loading}>
            {loading ? "Loading..." : "Show My Referrals"}
          </Button>
        )}
        {showReferrals && (
          <>
            <div className="mb-2 text-primary text-sm font-semibold">Referrals Made:</div>
            {loading ? (
              <div>Loading...</div>
            ) : referrals.length === 0 ? (
              <div className="text-gray-500">Nil</div>
            ) : (
              <table className="w-full text-sm mb-2 border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="text-left px-3 py-2">Wallet</th>
                    <th className="text-left px-3 py-2">Quiz Submitted</th>
                  </tr>
                </thead>
                <tbody>
                  {referrals.map((r, idx) => (
                    <tr key={r.referee} className={idx % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                      <td className={r.hasCompletedQuiz ? "text-blue-600 px-3 py-2" : "text-black px-3 py-2"}>
                        {r.referee}{!r.hasCompletedQuiz && " *"}
                      </td>
                      <td className="px-3 py-2">
                        {r.hasCompletedQuiz ? "Yes" : "No"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <div className="mt-2 font-semibold">
              Counting referrals (completed a quiz): <span className="text-blue-600">{countedReferrals.length}</span>
            </div>
            <div className="mt-2 text-xs text-gray-400" style={{ fontSize: "0.75rem" }}>
              * not yet submitted one quiz, so they do not count as a referral
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
