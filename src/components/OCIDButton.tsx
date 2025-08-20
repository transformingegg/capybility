"use client";

import { useOCAuth } from '@opencampus/ocid-connect-js';
import Image from 'next/image';
import { useEffect } from 'react';

export default function OCIDButton() {
  // Destructure isInitialized from the hook. This is the key.
  const { isInitialized, authState, ocAuth } = useOCAuth();

  useEffect(() => {
    if (isInitialized && authState.isAuthenticated && authState.user) {
      console.log("OCID Login Successful. Full user data:", authState.user);
      console.log("User's .edu email:", authState.user.email);
    }
  }, [isInitialized, authState.isAuthenticated, authState.user]);

  const handleLogout = async () => {
    try {
      await ocAuth.signOutRedirect();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // --- THIS IS THE CRITICAL CHANGE ---
  // Do not render anything until the SDK has finished its initial check from local storage.
  // This prevents the button from showing the wrong state on page load.
  if (!isInitialized) {
    return <div className="text-sm text-gray-500 animate-pulse h-[50px] w-[200px]">Initializing OCID...</div>;
  }

  // Now that we know the SDK is initialized, we can safely check the auth state.
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