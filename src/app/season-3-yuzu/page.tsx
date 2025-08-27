

import PageLayout from "@/components/PageLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import Image from "next/image";

export default function Season3YuzuPage() {
  return (
    <PageLayout backgroundImage="/img/capyback.webp">
      <div className="max-w-2xl mx-auto px-4 py-8 relative">
        {/* Top Heading Card with Yuzu Coin */}
        <Card className="mb-8 relative">
          <CardHeader className="flex flex-row items-center p-6">
            <CardTitle className="text-3xl font-bold text-primary text-left flex-1">Earn YUZU Points with Capybility</CardTitle>
            <div className="ml-4">
              <Image src="/img/yuzucoin.svg" alt="Yuzu Coin" width={160} height={160} />
            </div>
          </CardHeader>
        </Card>

        {/* Why Earn Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-primary">Why Earn Yuzu with Capybility?</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-2">
              Yuzu is the on-chain rewards system of <strong>EDU Chain</strong>, designed to reward active users.
            </p>
            <p className="mb-2">
              By using <strong>Capybility</strong>, you can collect Yuzu Points that can be spent on EDULand NFTs to unlock $EDU rewards — with up to 150M EDU tokens allocated for participants.
            </p>
            <a href="https://opencampus-xyz.medium.com/yuzu-heatwave-everything-you-need-to-know-b1775ab4e018" className="text-blue-600 underline mb-2 inline-block">Learn more →</a>
            
          </CardContent>
        </Card>

        {/* How to Earn Card with Capy.svg bottom center, 2x2 grid of earning methods */}
        <Card className="mb-8 relative">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-primary">How to Earn Yuzu with Capybility in Season 3 - HEATWAVE!</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              This season, CAPYBILITY has [TBA] YUZU to give away. There are 4 main ways to earn YUZU with <strong>Capybility</strong>:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* 1 */}
              <div className="border rounded-lg p-4 relative bg-white shadow">
                <span className="absolute -top-4 -left-4 bg-primary text-white font-bold rounded-full w-8 h-8 flex items-center justify-center shadow-lg">1</span>
                <div className="font-bold text-primary mb-2">Make Quizzes tagged with EDUCHAIN</div>
                <div className="text-sm text-gray-700">20% split evenly between all quiz making users proportional to the number of quizzes made with at least one participant.</div>
              </div>
              {/* 2 */}
              <div className="border rounded-lg p-4 relative bg-white shadow">
                <span className="absolute -top-4 -left-4 bg-primary text-white font-bold rounded-full w-8 h-8 flex items-center justify-center shadow-lg">2</span>
                <div className="font-bold text-primary mb-2">Do Quizzes tagged with EDUCHAIN</div>
                <div className="text-sm text-gray-700">40% split based on NFT completion rarities (the more rare your stack of completion NFTs and the more of them you have, the more you get).</div>
              </div>
              {/* 3 */}
              <div className="border rounded-lg p-4 relative bg-white shadow">
                <span className="absolute -top-4 -left-4 bg-primary text-white font-bold rounded-full w-8 h-8 flex items-center justify-center shadow-lg">3</span>
                <div className="font-bold text-primary mb-2">Get your friends to join Capybility</div>
                <div className="text-sm text-gray-700">They have to also do at least one quiz and mint an NFT - 40% split based on the number of friends referred.</div>
              </div>
              {/* 4 */}
              <div className="border rounded-lg p-4 relative bg-white shadow">
                <span className="absolute -top-4 -left-4 bg-primary text-white font-bold rounded-full w-8 h-8 flex items-center justify-center shadow-lg">4</span>
                <div className="font-bold text-primary mb-2">Become a CAPYBILITY EDUCHAIN EXPERT &amp; claim the Open Campus Badge</div>
                <div className="text-sm text-gray-700">Separate Pool of YUZU for the first 40 to complete this task.</div>
              </div>
            </div>
            <p className="mb-2">
              The amount of YUZU for each of these earning mechanisms is given above. You can monitor your performance on the above through your creator and user dashboards. 
              You can get more information about how to become a CAPYBILITY EDUCHAIN EXPERT below. 
            </p>
            <div className="w-full flex justify-center mt-8">
              <Image src="/img/Capy.svg" alt="Capy" width={256} height={256} />
            </div>
            <br />
            <br />
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 mt-2 mb-2">
              <strong className="text-primary">CAPYBILITY EDUCHAIN EXPERTS</strong><br />
               It&apos;s time for the true EDUCHAIN experts to shine! 
               The requirements for this badge are: 
               <ul className="list-disc ml-6">
                 <li>Create at least 10 quizzes tagged with EDUCHAIN that have at least 10 completions</li>
                 <li>Complete at least 50 quizzes tagged with EDUCHAIN.</li>
                 <li>Mint the CAPYBILITY EDUCHAIN EXPERT promo NFT - free mint</li>
                <li>Make it official by <strong>Claiming the Badge</strong> and getting it into your OCID reputation for good! Must have an OCID to complete this step</li> 
               </ul>
            </div>
            <br />
            <p className="mb-2">
              Got Questions? Ask in the <a href="https://discord.gg/capybility" className="text-blue-600 underline">CAPYBILITY DISCORD</a>
            </p>
            <a href="/user-dashboard" className="text-green-600 underline mb-4 inline-block">Start earning now →</a>
          </CardContent>
        </Card>

        {/* Useful Links Card with Palm Tree bottom right */}
        <Card className="relative">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-primary">Useful Links</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-none pl-0 mb-8">
              <li className="mb-1">
                <a href="https://yuzu.educhain.xyz/" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline font-bold">Yuzu Dashboard</a>
              </li>
              <li className="mb-1">
                <a href="https://dashboard.educhain.xyz/claim" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline font-bold">Claim Yuzu</a>
              </li>
              <li className="mb-1">
                <a href="https://educhain.xyz/ecosystem" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline font-bold">EDU Chain Ecosystem</a>
              </li>
              <li>
                <a href="https://x.com/educhain_xyz" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline font-bold">Follow @educhain_xyz</a>
              </li>
            </ul>
            <div className="absolute bottom-4 right-4">
              <Image src="/img/Palm_tree.svg" alt="Palm Tree" width={288} height={288} />
            </div>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}
