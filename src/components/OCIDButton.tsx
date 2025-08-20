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

  // This is the corrected effect. It depends on the authentication status,
  // not the user object which we now know is always undefined in authState.
  useEffect(() => {
    console.log(`%c--- [Effect] --- Auth status changed. isInitialized: ${isInitialized}, isAuthenticated: ${authState.isAuthenticated}`, 'color: purple;');

    // If the SDK is ready and the user is logged in...
    if (isInitialized && authState.isAuthenticated) {
      // ...then we get the user data by calling getAuthState().
      const fullAuthState = ocAuth.getAuthState();
      console.log('%c--- [Action] --- Calling ocAuth.getAuthState()', 'font-weight: bold;', fullAuthState);

      if (fullAuthState?.user) {
        // And save it to our component's state.
        console.log('%c--- [Action] --- User data found. Calling setUser.', 'font-weight: bold;');
        setUser(fullAuthState.user);
      }
    } else {
      // If not authenticated, ensure our local user state is null.
      setUser(null);
    }
  }, [isInitialized, authState.isAuthenticated, ocAuth]); // Depend on the auth status


  const handleLogout = async () => {
    try {
      await ocAuth.signOutRedirect();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // --- The rendering logic below is now correct because it depends on our 'user' state ---

  if (!isInitialized) {
    return <div className="text-sm text-gray-500 animate-pulse h-[50px] w-[200px]">Initializing OCID...</div>;
  }

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