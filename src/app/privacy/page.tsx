import MainLayout from '@/components/MainLayout';

export default function Privacy() {
  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto prose prose-lg">
        <h1>Privacy Policy</h1>
        <p>Last updated: {new Date().toLocaleDateString()}</p>
        
        <h2>1. Information We Collect</h2>
        <p>
          We collect information when you connect your wallet, create quizzes, 
          and complete quizzes on CAPYBILITY.
        </p>

        <h2>2. How We Use Your Information</h2>
        <p>
          Your information is used to provide and improve CAPYBILITY services, 
          verify quiz completion, and mint NFT credentials.
        </p>

        {/* Add more privacy policy sections as needed */}
      </div>
    </MainLayout>
  );
}