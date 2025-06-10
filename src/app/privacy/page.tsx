import MainLayout from '@/components/MainLayout';

export default function Privacy() {
  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto prose prose-lg">
        <h1>Privacy Policy</h1>
        <p>Last updated: {new Date().toLocaleDateString()}</p>

        <h2>1. Introduction</h2>
        <p>
          CAPYBILITY ("we", "us", or "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform, including when you connect your wallet, create quizzes, and complete quizzes.
        </p>

        <h2>2. Information We Collect</h2>
        <ul>
          <li>
            <b>Wallet Information:</b> When you connect your wallet, we collect your public wallet address.
          </li>
          <li>
            <b>Quiz Data:</b> We collect information you provide when creating or completing quizzes, including quiz content, answers, and results.
          </li>
          <li>
            <b>Usage Data:</b> We may collect information about your interactions with the platform, such as pages visited, features used, and time spent.
          </li>
          <li>
            <b>Cookies & Analytics:</b> We may use cookies and analytics tools to improve our services and understand user behavior.
          </li>
        </ul>

        <h2>3. How We Use Your Information</h2>
        <ul>
          <li>To provide and improve CAPYBILITY services.</li>
          <li>To verify quiz completion and mint NFT credentials.</li>
          <li>To personalize your experience and communicate with you.</li>
          <li>To comply with legal obligations and protect our rights.</li>
        </ul>

        <h2>4. How We Share Your Information</h2>
        <ul>
          <li>
            <b>Public Information:</b> Some information, such as your wallet address and quiz completions, may be visible to other users or on the blockchain.
          </li>
          <li>
            <b>Service Providers:</b> We may share information with trusted third parties who help us operate and improve the platform.
          </li>
          <li>
            <b>Legal Requirements:</b> We may disclose your information if required by law or to protect our rights and safety.
          </li>
        </ul>

        <h2>5. Data Security</h2>
        <p>
          We use reasonable administrative, technical, and physical safeguards to protect your information. However, no method of transmission over the Internet or blockchain is 100% secure.
        </p>

        <h2>6. Your Rights and Choices</h2>
        <ul>
          <li>You may disconnect your wallet at any time.</li>
          <li>You may request deletion of your quiz data by contacting us.</li>
          <li>You may opt out of cookies via your browser settings.</li>
        </ul>

        <h2>7. Children's Privacy</h2>
        <p>
          CAPYBILITY is not intended for children under 13. We do not knowingly collect personal information from children under 13.
        </p>

        <h2>8. Changes to This Policy</h2>
        <p>
          We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated date.
        </p>

        <h2>9. Contact Us</h2>
        <p>
          If you have questions about this Privacy Policy, please contact us at <a href="mailto:support@capybility.com">support@capybility.com</a>.
        </p>
      </div>
    </MainLayout>
  );
}