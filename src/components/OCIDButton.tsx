"use client";

import { useOCAuth } from '@opencampus/ocid-connect-js';
import Image from 'next/image';
import { useEffect } from 'react';

export default function OCIDButton() {
  const { isInitialized, authState, ocAuth } = useOCAuth();

  const handleLogout = async () => {
    try {
      await ocAuth.signOutRedirect();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // This useEffect is for debugging and can be removed later.
  // It will show us the contents of getAuthState() once the user is logged in.
  useEffect(() => {
    if (isInitialized && authState.isAuthenticated) {
      console.log("User is authenticated, getting full auth state from ocAuth.getAuthState():", ocAuth.getAuthState());
    }
  }, [isInitialized, authState.isAuthenticated, ocAuth]);


  if (!isInitialized) {
    return <div className="text-sm text-gray-500 animate-pulse h-[50px] w-[200px]">Initializing OCID...</div>;
  }

  // --- NEW LOGIC BASED ON THE DOCUMENTATION ---
  if (authState.isAuthenticated) {
    // The documentation shows user data comes from getAuthState()
    const fullAuthState = ocAuth.getAuthState();
    const user = fullAuthState?.user; // Safely access the user property from the returned object

    // If we have a user object from getAuthState(), render the connected state
    if (user) {
      return (
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 p-2 border border-gray-200 rounded-lg">
            <Image
              src={user.picture}
              alt="User Avatar"
              width={32}
              height={32}
              className="rounded-full"
            />
            <div className="flex-grow">
              <p className="text-sm font-semibold text-gray-800">{user.name}</p>
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
  }

  // --- RENDER NOT CONNECTED STATE ---
  // If not authenticated, or if authenticated but user object is missing from getAuthState(), show connect button.
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