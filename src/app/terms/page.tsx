import MainLayout from '@/components/MainLayout';

export default function Terms() {
  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto prose prose-lg">
        <h1>Terms of Use</h1>
        <p>Last updated: {new Date().toLocaleDateString()}</p>

        <h2>1. Acceptance of Terms</h2>
        <p>
          By accessing or using CAPYBILITY, you agree to be bound by these Terms of Use and all applicable laws and regulations. If you do not agree, please do not use the platform.
        </p>

        <h2>2. Use of the Platform</h2>
        <ul>
          <li>
            You must be at least 13 years old to use CAPYBILITY.
          </li>
          <li>
            You are responsible for maintaining the security of your wallet and account.
          </li>
          <li>
            You agree not to use CAPYBILITY for any unlawful or prohibited purpose.
          </li>
        </ul>

        <h2>3. Intellectual Property</h2>
        <ul>
          <li>
            All content and software on CAPYBILITY, except for user-generated quizzes and the content input into the platform to create the quizzes, is the property of CAPYBILITY or its licensors.
          </li>
          <li>
            You retain rights to quizzes you create and content used to generate those quizzes, but grant CAPYBILITY a license to display and use them on the platform.
          </li>
        </ul>

        <h2>4. User Content</h2>
        <ul>
          <li>
            You are solely responsible for the content you submit, including quizzes and information.
          </li>
          <li>
            You must have the appropriate rights and permissions to use any content you submit.
          </li>
          <li>
            CAPYBILITY reserves the right to remove content that violates these terms or is otherwise objectionable.
          </li>
        </ul>

        <h2>5. NFTs and Blockchain</h2>
        <ul>
          <li>
            CAPYBILITY may issue NFTs as credentials for quiz completion or creation. You are responsible for any blockchain transaction fees.
          </li>
          <li>
            Blockchain transactions are irreversible and CAPYBILITY is not responsible for lost or stolen assets.
          </li>
        </ul>
        <h2>6. Prize Distribution and Promotions</h2>
        <ul>
          <li>
            From time to time, CAPYBILITY may offer prizes, rewards, or other incentives in connection with quizzes, contests, or promotional events (&quot;Prize Events&quot;).
          </li>
          <li>
            CAPYBILITY reserves the sole and absolute right to modify, suspend, or cancel any Prize Event, including the eligibility criteria, prize amounts, distribution methods, or any other aspect of a Prize Event, at any time and for any reason, with or without notice.
          </li>
          <li>
            Participation in any Prize Event does not guarantee receipt of a prize or reward. All decisions regarding Prize Events, including winner selection and prize distribution, are at the sole discretion of CAPYBILITY and are final.
          </li>
          <li>
            CAPYBILITY is not responsible for any loss, delay, or inability to receive a prize due to incorrect information, technical issues, or other circumstances beyond our control.
          </li>
        </ul>
        <h2>7. Disclaimer of Warranties</h2>
        <p>
          CAPYBILITY is provided &quot;as is&quot; and without warranties of any kind. We do not guarantee the accuracy, completeness, or reliability of any content or service.
        </p>

        <h2>8. Limitation of Liability</h2>
        <p>
          To the fullest extent permitted by law, CAPYBILITY and its affiliates shall not be liable for any damages arising from your use of the platform.
        </p>

        <h2>9. Changes to Terms</h2>
        <p>
          We may update these Terms of Use at any time. Continued use of CAPYBILITY after changes constitutes acceptance of the new terms.
        </p>

        <h2>10. Governing Law</h2>
        <p>
          These terms are governed by the laws of your jurisdiction, without regard to conflict of law principles.
        </p>

        <h2>11. Contact Us</h2>
        <p>
          For questions about these Terms, contact us at <a href="mailto:support@capybility.com">support@capybility.com</a>.
        </p>
      </div>
    </MainLayout>
  );
}