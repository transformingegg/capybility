import MainLayout from "@/components/MainLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import Image from "next/image";

export default function BarabotsLearnPage() {
  return (
    <MainLayout>
      <div
        className="max-w-4xl mx-auto px-4 py-8 relative"
        style={{
          backgroundImage: 'url(/img/capyback.webp)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          minHeight: '100vh',
        }}
      >
        {/* Top Heading Card with Barabots Image */}
        <Card className="mb-8 relative !p-0 bg-[#fbfcfc]">
          <div className="px-6 py-0">
            <div className="w-full max-w-md mx-auto relative">
              <Image
                src="/img/BaraBotsmAIN.png"
                alt="Barabots Main"
                width={400}
                height={200}
                className="w-full h-auto"
              />
            </div>
          </div>
        </Card>

        {/* Introduction Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-primary">What are Barabots?</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              The Barabots collection starts as <strong>CRATES</strong>, are assembled into <strong>BARABOTS</strong>, and eventually (&#34;date TBA&#34;), sets of barabots (one from each category) will be able to be burned to create [REDACTED].
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="border rounded-lg p-4 bg-[#f8f9f9] text-center">
                <Image
                  src="/barabotsmetadata/img/crate-culture.png"
                  alt="Barabots Crate"
                  width={120}
                  height={120}
                  className="w-full h-auto mb-3"
                />
                <h3 className="font-bold text-lg mb-2 text-blue-800">CRATES</h3>
                <p className="text-sm text-gray-700">
                  Mysterious containers that hold potential Barabots. CRATE whitelists are given as rewards for participating in creating and doing Capybility quizzes.
                </p>
              </div>
              <div className="border rounded-lg p-4 bg-[#f8f9f9] text-center">
                <Image
                  src="/barabotsmetadata/img/barabot-culture-legendary.png"
                  alt="Assembled Barabot"
                  width={120}
                  height={120}
                  className="w-full h-auto mb-3"
                />
                <h3 className="font-bold text-lg mb-2 text-green-800">BARABOTS</h3>
                <p className="text-sm text-gray-700">
                  Fully assembled robots with unique rarities. There are 20 Barabots to collect across 4 rarities and 5 categories.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* How to Get Crates Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-primary">How to Get CRATES</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              CRATE whitelists are given as rewards for participating in creating and doing Capybility quizzes. CRATE whitelists are also given to select partner communities and community members, and for other promotions.
            </p>
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
              <h4 className="font-bold text-yellow-800 mb-2">Barabot Rewards for Quiz Creators</h4>
              <p className="text-sm text-gray-700 mb-2">
                When someone creates a Quiz with an EDUCHAIN tag (or variations of EDUCHAIN, e.g. edu chain), they can choose to enable "Barabot Rewards". If "Barabot Rewards" is enabled, a cut off time is created 3, 5, or 7 days from the quiz creation time, a category related to the quiz content is also chosen.
              </p>
              <p className="text-sm text-gray-700 mb-2">
                <strong>IF THE QUIZ HAS AT LEAST 10 SUCCESSFUL PARTICIPANTS BY THE CUT OFF TIME, BARABOT CRATE whitelist rewards will be given as follows:</strong>
              </p>
              <ul className="list-disc ml-6 text-sm text-gray-700">
                <li>1 free mint whitelist will be given to the quiz creator.</li>
                <li>1 free mint whitelist will be given to one random participant</li>
                <li>A discount whitelist will be given randomly to one third (rounded down) of all participants in the quiz</li>
              </ul>
              <p className="text-sm text-red-600 mt-2">
                <em>Quizzes deemed to be repetitive, and unrelated to educhain or opencampus will be flagged and removed, rewards will not be given in this instance.</em>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Categories Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-primary">CATEGORIES</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              Categories represent the types of actions that can be taken on chain in the opencampuses EDUCHAIN ecosystem.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border rounded-lg p-4 bg-[#f8f9f9]">
                <Image
                  src="/barabotsmetadata/img/crate-build.png"
                  alt="Build Category"
                  width={80}
                  height={80}
                  className="w-[70%] h-auto mb-3 mx-auto"
                />
                <h4 className="font-bold text-purple-800 mb-2">🏗️ BUILD</h4>
                <p className="text-sm text-gray-700">Contracts and actions primarily aimed at developing DApps skills associated with building new features for EDUCHAIN, e.g. hackquests, programming, etc.</p>
              </div>
              <div className="border rounded-lg p-4 bg-[#f8f9f9]">
                <Image
                  src="/barabotsmetadata/img/crate-work.png"
                  alt="Work Category"
                  width={80}
                  height={80}
                  className="w-[70%] h-auto mb-3 mx-auto"
                />
                <h4 className="font-bold text-blue-800 mb-2">💼 WORK</h4>
                <p className="text-sm text-gray-700">Contracts and actions primarily aimed at helping people with employment related matters, e.g. payments, employment, job seeking, etc.</p>
              </div>
              <div className="border rounded-lg p-4 bg-[#f8f9f9]">
                <Image
                  src="/barabotsmetadata/img/crate-learn.png"
                  alt="Learn Category"
                  width={80}
                  height={80}
                  className="w-[70%] h-auto mb-3 mx-auto"
                />
                <h4 className="font-bold text-green-800 mb-2">📚 LEARN</h4>
                <p className="text-sm text-gray-700">Contracts and actions primarily aimed at helping people Learn things, and teachers teach things. e.g. course creation, course participation, classroom software, etc.</p>
              </div>
              <div className="border rounded-lg p-4 bg-[#f8f9f9]">
                <Image
                  src="/barabotsmetadata/img/crate-culture.png"
                  alt="Culture Category"
                  width={80}
                  height={80}
                  className="w-[70%] h-auto mb-3 mx-auto"
                />
                <h4 className="font-bold text-pink-800 mb-2">🎨 CULTURE</h4>
                <p className="text-sm text-gray-700">Contracts and actions primarily aimed at instilling cultural values in the ecosystem, bringing the vibes, and having fun as collectors and community together.</p>
              </div>
              <div className="border rounded-lg p-4 bg-[#f8f9f9]">
                <Image
                  src="/barabotsmetadata/img/crate-defi.png"
                  alt="DEFI Category"
                  width={80}
                  height={80}
                  className="w-[70%] h-auto mb-3 mx-auto"
                />
                <h4 className="font-bold text-orange-800 mb-2">💰 DEFI</h4>
                <p className="text-sm text-gray-700">Contracts and actions primarily aimed at participation in Decentralised finance actions, e.g. swapping one token for another.</p>
              </div>
              <div className="border rounded-lg p-4 bg-[#f8f9f9] flex items-center justify-center">
                <p className="text-center text-primary font-bold text-lg">FIVE CATEGORIES TO COLLECT</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Rarity Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-primary">RARITY</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              Crates do not have a rarity, but they do have a category. It is only when a crate is assembled that the Barabot rarity becomes known. Rarity chances are as follows:
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="border rounded-lg p-4 text-center bg-gray-50">
                <h4 className="font-bold text-gray-800">BASE</h4>
                <p className="text-2xl text-gray-600">65%</p>
              </div>
              <div className="border rounded-lg p-4 text-center bg-blue-50">
                <h4 className="font-bold text-blue-800">RARE</h4>
                <p className="text-2xl text-gray-600">30%</p>
              </div>
              <div className="border rounded-lg p-4 text-center bg-purple-50">
                <h4 className="font-bold text-purple-800">EPIC</h4>
                <p className="text-2xl text-gray-600">4.6%</p>
              </div>
              <div className="border rounded-lg p-4 text-center bg-yellow-50">
                <h4 className="font-bold text-yellow-800">LEGENDARY</h4>
                <p className="text-2xl text-gray-600">0.4%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Assembling Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-primary">ASSEMBLING - P.O.O.C.A</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row items-center gap-6 mb-4">
              <div className="flex-1">
                <p className="mb-4">
                  To ASSEMBLE a crate into a Barabot, the tool needed is an <strong>ON CHAIN TRANSACTION THAT MATCHES THE CATEGORY OF THE CRATE</strong>. e.g. to assemble a DEFI crate, you might use a sailfish transaction you have recently done. To a LEARN crate, you might use a Capybility Quiz transaction that you have recently done.
                </p>
                <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
                  <h4 className="font-bold text-blue-800 mb-2">What is P.O.O.C.A?</h4>
                  <p className="text-sm text-gray-700">
                    <strong>Proof Of On Chain Action</strong> - Every assembled BARABOT you can see represents an on chain action taken by an EDUCHAIN connected participant somewhere in the world. We chose to implement P.O.O.C.A in our collection so that users would be encouraged to participate across the many types of DApps that EDUCHAIN has to offer.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Costs Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-primary">COSTS</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border rounded-lg p-4 text-center bg-green-50">
                <h4 className="font-bold text-green-800 mb-2">Free Mint</h4>
                <p className="text-sm text-gray-700">Free (only cost is gas)</p>
              </div>
              <div className="border rounded-lg p-4 text-center bg-blue-50">
                <h4 className="font-bold text-blue-800 mb-2">Discount Mint</h4>
                <p className="text-sm text-gray-700">5 EDU</p>
              </div>
              <div className="border rounded-lg p-4 text-center bg-purple-50">
                <h4 className="font-bold text-purple-800 mb-2">Full Price Mint</h4>
                <p className="text-sm text-gray-700">20 EDU</p>
              </div>
              <div className="border rounded-lg p-4 text-center bg-gray-50">
                <h4 className="font-bold text-gray-800 mb-2">Assembly Cost</h4>
                <p className="text-sm text-gray-700">1 EDU</p>
                <p className="text-sm text-gray-700">To go from CRATE to BARABOT</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Future Features Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-primary">FUTURE FEATURES</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-l-4 border-purple-400 p-4">
              <h4 className="font-bold text-purple-800 mb-2">Burning for [REDACTED]</h4>
              <p className="text-sm text-gray-700 mb-2">
                Eventually, when burning a set of 5 Barabots to create a [REDACTED], the rarity of the resulting [REDACTED] will be the same as the lowest rarity in the burned set. A burnable set must contain one of each CATEGORY. e.g. Burning 4 RARE's and 1 BASE will create a BASE [REDACTED].
              </p>
              <p className="text-sm text-gray-600">
                <em>There will be a limit to the amount of [REDACTED] that can be made by burning Barabots.</em>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Trading Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-primary">TRADING</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              Crates and Assembled Barabots are fully tradeable assets. They are not soulbound like other Capybility NFTs. This means they are able to be traded on marketplaces that support educhain. E.g. ED3
            </p>
          </CardContent>
        </Card>

        {/* Partner Community Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-primary">PARTNER COMMUNITIES</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              Want to be a partner community to secure some CRATES for your community? Great! Mark contact <a href='https://discord.gg/hGYKakYugz' className="text-yellow-500 underline hover:text-yellow-400">Via Discord</a> and we can support the ecosystem together!
            </p>
          </CardContent>
        </Card>

        {/* Disclaimer Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-red-600">DISCLAIMER</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-red-50 border-l-4 border-red-400 p-4">
              <p className="text-sm text-gray-700 mb-2">
                <strong>ALL DETAILS, PRICING, PROCEDURES AND AVAILABILITY OF THE BARABOTS COLLECTION MAY CHANGE AT THE DISCRETION OF CAPYBILITY AT ANY TIME AND FOR ANY REASON.</strong>
              </p>
              <p className="text-sm text-gray-700 mb-2">
                OUR INTENTION IS TO ENHANCE EDUCHAIN USAGE IN A FUN AND REWARDING WAY IN ORDER TO GROW THE CAPYBILITY USERBASE.
              </p>
              <p className="text-sm text-red-600">
                <strong>IF USERS ARE SUSPECTED OF CHEATING OR GAMING THE BARABOTS COLLECTION IN ANY WAY THAT NEGATIVELY EFFECTS THE REST OF THE COMMUNITY, THEY WILL BE BANNED FROM PARTICIPATION AND MAY NOT RECEIVE REWARDS.</strong>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}