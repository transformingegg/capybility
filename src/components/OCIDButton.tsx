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

  // --- LOG 1: Log on every single render ---
  console.log(
    `%c--- [Render] ---`, 
    'color: blue; font-weight: bold;', 
    { 
      isInitialized, 
      isAuthenticated: authState.isAuthenticated, 
      userInAuthState: authState.user,
      userInComponentState: user 
    }
  );

  // --- LOG 2: Log when the component first mounts ---
  useEffect(() => {
    console.log('%c--- [Mount] --- OCIDButton component has mounted.', 'color: green;');
  }, []);

  // --- LOG 3: Log when the isInitialized flag changes ---
  useEffect(() => {
    console.log(`%c--- [Effect] --- isInitialized flag is now: ${isInitialized}`, 'color: purple;');
  }, [isInitialized]);

  // --- LOG 4: Log whenever the authState.user object changes ---
  useEffect(() => {
    console.log('%c--- [Effect] --- authState.user has changed.', 'color: orange;', authState.user);
    
    // Sync local state with the user object from the SDK
    if (authState.user) {
      console.log('%c--- [Action] --- User data found in authState. Calling setUser.', 'font-weight: bold;');
      setUser(authState.user);
    } else {
      console.log('%c--- [Action] --- No user data in authState. Setting user state to null.', 'font-weight: bold;');
      setUser(null);
    }
  }, [authState.user]);


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