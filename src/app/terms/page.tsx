import MainLayout from '@/components/MainLayout';

export default function Terms() {
  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto prose prose-lg">
        <h1>Terms of Use</h1>
        <p>Last updated: {new Date().toLocaleDateString()}</p>
        
        <h2>1. Acceptance of Terms</h2>
        <p>
          By accessing and using CAPYBILITY, you accept and agree to be bound by these Terms of Use.
        </p>

        <h2>2. Use License</h2>
        <p>
          Permission is granted to temporarily access and use CAPYBILITY for personal, 
          non-commercial transitory viewing only.
        </p>

        {/* Add more terms sections as needed */}
      </div>
    </MainLayout>
  );
}