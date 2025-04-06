import MainLayout from '@/components/MainLayout';

export default function WhyCapybility() {
  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Why CAPYBILITY?</h1>
        <div className="prose prose-lg">
          <p className="text-gray-600 mb-8">
            The wonderfully simple 5 question multiple choice quiz has so much to offer. What would it look like to provide the tools to allow ALL the stakeholders of an ecosystem? CAPYBILITY is attempting just that!. It is for Influencers, Researchers, Ecosystems, Web3 Projects, NFT Communities, Educators, Learners, and people who want to build up an online Knowledge Portfolio to show what they know. Find out more by watching the video below! 
          </p>
          
          {/* Video section */}
          <div className="aspect-w-16 aspect-h-9 mt-8 mb-8">
            <div className="w-full h-[400px] bg-gray-100 rounded-lg flex items-center justify-center">
              <p className="text-gray-500">Video Coming Soon</p>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}