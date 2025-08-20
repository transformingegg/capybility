"use client";

import { useOCAuth } from '@opencampus/ocid-connect-js';
import Image from 'next/image';
import { useEffect, useState } from 'react';

interface OCIDUser {
  name: string;
  picture: string;
  email: string;
}

export default function OCIDButton() {
  const { isInitialized, authState, ocAuth } = useOCAuth();
  const [user, setUser] = useState<OCIDUser | null>(null);

  // --- NEW DIAGNOSTIC LOG ---
  // This log will run every time the component renders, showing us the current state.
  console.log(`--- OCIDButton Render --- User state is:`, user);

  const handleLogout = async () => {
    try {
      await ocAuth.signOutRedirect();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // This useEffect will now sync the user data from the SDK to our component's state
  useEffect(() => {
    console.log("useEffect triggered. Checking auth state...");
    if (isInitialized && authState.isAuthenticated) {
      const fullAuthState = ocAuth.getAuthState();
      if (fullAuthState?.user) {
        // Only set the state if it's not already set, to avoid potential loops
        if (!user) {
          console.log("User data found, calling setUser:", fullAuthState.user);
          setUser(fullAuthState.user);
        }
      }
    } else {
      // If the user logs out or is not authenticated, ensure state is null
      if (user) {
        console.log("User is not authenticated, clearing user state.");
        setUser(null);
      }
    }
    // We've removed ocAuth from the dependency array as it can sometimes cause unnecessary re-renders.
    // The core logic depends on the initialization and authentication flags.
  }, [isInitialized, authState.isAuthenticated, user]);


  if (!isInitialized) {
    return <div className="text-sm text-gray-500 animate-pulse h-[50px] w-[200px]">Initializing OCID...</div>;
  }

  // Now, we simply check our own state variable 'user'.
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

  // If our user state is null, show the connect button.
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