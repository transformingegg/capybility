import MainLayout from '@/components/MainLayout';
import { sectionStyles } from "@/utils/styles";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";

export default function WhyCapybility() {
  return (
    <MainLayout>
      <div
        className="max-w-4xl mx-auto relative px-4 py-8"
        style={{
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          minHeight: '100vh',
        }}
      >
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>
              <span className="text-3xl font-bold text-primary">Guide</span>
            </CardTitle>
          </CardHeader>
        </Card>
        <div className="prose prose-lg">

          {/* Section 1: How to do a quiz */}
          <div className={sectionStyles + " mb-8"}>
            <h2 className="text-2xl font-bold mb-4 text-primary">How to Do Quizzes</h2>
            <ol className="list-decimal ml-6 mb-8">
              <li>Connect your wallet using the button at the top right.</li>
              <li>Go to the <b>User Dashboard</b> by clicking &quot;Do Quiz&quot; navigation on the navigation menu OR by clicking the &quot;User Dashboard&quot; button on the home page.</li>
              <li>Browse the available quizzes and select one to try. You can also just follow a direct link to a quiz that you got from a project or quiz creator directly.</li>
              <li>Answer the multiple choice questions and submit your quiz by &quot;signing&quot; with your wallet.</li>
              <li>Mint your quiz completion as an NFT with randomly generated rarity &ndash; Something special might come to those who get lucky here!</li>
              <li>Check your stats, completions, earned badges and promotion achievements in your user dashboard.</li>
            </ol>
            <p className="text-gray-600 mb-2 font-semibold">Rules for doing Quizzes:</p>
            <ul className="list-disc ml-6 mb-0">
              <li>To mint a quiz completion NFT there is a small fee (50% discount for capyfriends holders). This is primarily to stop bots.</li>
              <li>Any attempt at automated tools or scripts for quiz completion will be discovered and users will be banned from site use.</li>
              <li>Users can only attempt a quiz completion for a particular quiz once per 24 hour period. If they don&apos;t get it fully correct (5/5), they will have to wait until the next day to try again.</li>
            </ul>
          </div>

          {/* Section 2: How to create a quiz */}
          <div className={sectionStyles + " mb-8"}>
            <h2 className="text-2xl font-bold mb-4 text-primary">How to Create Quizzes</h2>
            <ol className="list-decimal ml-6 mb-8">
              <li>Connect your wallet using the button at the top right.</li>
              <li>Go to the <b>Creator Dashboard</b> by clicking &quot;CREATOR DASHBOARD&quot; on the homepage or by clicking &quot;Create&quot; in the navigation menu.</li>
              <li>Click the &quot;Create Quiz&quot; button.</li>
              <li>Follow the prompts of the quiz creation tool to add your content and generate questions. You will need your text content handy and a URL to where your content can be found (e.g. a webpage, medium article, x post, etc.).</li>
              <li>Use the AI generated Quiz to get a starting quiz, and then edit questions, answers, and tags as needed.</li>
              <li>Save your quiz and mint it as an NFT.</li>
              <li>Share your unique quiz link with others to invite participation.</li>
            </ol>
            <p className="text-gray-600 mb-2 font-semibold">Rules for Creating Quizzes:</p>
            <ul className="list-disc ml-6 mb-0">
              <li>To mint a quiz creation NFT there is a small fee (50% discount for capyfriends holders). This is primarily to stop bots.</li>
              <li>Any attempt at automated scripts for creating quizzes without interacting with the site in a meaningful way will be discovered and users will be banned from site use.</li>
              <li>Users can create as many quizzes as they like.</li>
              <li>Users creating nonsense quizzes or spamming the quiz creation tool will be banned from site use.</li>
            </ul>
          </div>

          {/* Section 3: How to participate in the Educhain Experts Promotion */}
          <div className={sectionStyles}>
            <h2 className="text-2xl font-bold mb-4 text-primary">How to Participate in the Educhain Experts Promotion</h2>
            <p className="text-gray-600 mb-4">
              The Educhain Experts Promotion is designed to reward expert uses of the educhain ecosystem. To participate, follow these steps:
            </p>
            <ol className="list-decimal ml-6 mb-8">
              <li>Complete qualifying quizzes and quiz completions listed in the <b>Promotions</b> section of your dashboard.</li>
              <li>Track your progress using the progress bars for quizzes and completions.</li>
              <li>Once you meet the requirements, click the &quot;Mint My Educhain Expert Badge&quot; button.</li>
              <li>Confirm the transaction in your wallet to receive your badge NFT.</li>
              <li>Your badge will be displayed in your dashboard once minted.</li>
            </ol>
            <p className="text-gray-600 mb-2 font-semibold">Rules for Promotions:</p>
            <ul className="list-disc ml-6 mb-0">
              <li>Capybility reserves the right to change, modify and / or cancel the promotion at any time for any reason.</li>
              <li>Any attempt at cheating during the promotion will be discovered and users will be banned from site use.</li>
              <li>Users can create as many quizzes as they like, and complete as many quizzes as are available. For this promotion, only quizzes tagged with &quot;EDUCHAIN&quot;, &quot;EDU CHAIN&quot; in upper or lower case variants will be included as qualifying quizzes.</li>
              <li>Users creating nonsense quizzes or spamming the quiz creation tool will be banned from site use.</li>
              <li>Rules and Conditions Subject to Change.</li>
            </ul>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}