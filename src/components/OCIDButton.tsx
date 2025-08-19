"use client";

import { useOCAuth } from '@opencampus/ocid-connect-js';
import Image from 'next/image';

// This component now manages its own state and logic.
// It no longer needs props like 'onClick'.
export default function OCIDButton() {
  const { authState, ocAuth } = useOCAuth();

  const handleLogout = async () => {
    try {
      // The guide implies signOutRedirect is the correct method
      await ocAuth.signOutRedirect();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Show a loading state while the SDK initializes
  if (authState.isLoading) {
    return <div className="text-sm text-gray-500 animate-pulse">Initializing OCID...</div>;
  }

  // --- RENDER CONNECTED STATE ---
  if (authState.isAuthenticated && authState.user) {
    return (
      <div className="flex items-center gap-4">
        {/* User info display */}
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
        {/* Disconnect button using your image */}
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