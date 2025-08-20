"use client";

import { useOCAuth } from '@opencampus/ocid-connect-js';
import Image from 'next/image';
import { useEffect } from 'react';

export default function OCIDButton() {
  const { isInitialized, authState, ocAuth } = useOCAuth();

  // --- UPDATED TROUBLESHOOTING LOG ---
  // Let's explicitly log the user object to see if it's missing.
  console.log('OCIDButton State:', { 
    isInitialized: isInitialized, 
    isAuthenticated: authState.isAuthenticated,
    user: authState.user, // This is the new, important part
    isLoading: authState.isLoading,
    error: authState.error 
  });

  useEffect(() => {
    if (isInitialized && authState.isAuthenticated && authState.user) {
      console.log("useEffect: User is authenticated with a valid user object.");
      console.log("useEffect: Full user data:", authState.user);
    }
  }, [isInitialized, authState.isAuthenticated, authState.user]);

  const handleLogout = async () => {
    try {
      await ocAuth.signOutRedirect();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (!isInitialized) {
    return <div className="text-sm text-gray-500 animate-pulse h-[50px] w-[200px]">Initializing OCID...</div>;
  }

  // The condition that is likely failing
  if (authState.isAuthenticated && authState.user) {
    // --- RENDER CONNECTED STATE ---
    return (
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3 p-2 border border-gray-200 rounded-lg">
          <Image
            src={authState.user.picture}
            alt="User Avatar"
            width={32}
            height={32}
            className="rounded-full"
          />
          <div className="flex-grow">
            <p className="text-sm font-semibold text-gray-800">{authState.user.name}</p>
            <p className="text-xs text-gray-500">OCID Linked</p>
          </div>
        </div>
        <button onClick={handleLogout} className="hover:opacity-90 transition-opacity">
          <Image 
            src="/img/RectangularConnectedOCID.png" 
            alt="OCID Connected"
            width={180}
            height={40}
          />
        </button>
      </div>
    );
  }

  // --- RENDER NOT CONNECTED STATE ---
  return (
    <button onClick={() => ocAuth.signInWithRedirect()} className="hover:opacity-90 transition-opacity">
      <Image 
        src="/img/PillConnectOCID.png" 
        alt="Connect with OCID"
        width={200}
        height={50}
      />
    </button>
  );
}