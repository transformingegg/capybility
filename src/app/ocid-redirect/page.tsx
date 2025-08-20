"use client";

import { LoginCallBack } from '@opencampus/ocid-connect-js';
import { useRouter } from 'next/navigation';

export default function RedirectPage() {
  const router = useRouter();

  // On success, redirect the user back to the dashboard
  const loginSuccess = () => {
    // --- NEW TROUBLESHOOTING LOG ---
    console.log("LoginCallBack SUCCESS! Redirecting to dashboard...");
    router.push('/user-dashboard');
  };

  // On error, log it and redirect back to the dashboard
  const loginError = (error: Error) => {
    console.error('OCID Login error:', error);
    router.push('/user-dashboard');
  };

  return (
    <LoginCallBack 
      successCallback={loginSuccess}
      errorCallback={loginError}
       customErrorComponent={null}
        customLoadingComponent={null}
    />
  );
}