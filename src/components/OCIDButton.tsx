"use client";

import { useOCAuth } from '@opencampus/ocid-connect-js';
import Image from 'next/image';
import { useEffect, useState } from 'react'; // Import useState

// Define a type for the user object for better TypeScript support
interface OCIDUser {
  name: string;
  picture: string;
  email: string;
  // Add other user properties if needed
}

export default function OCIDButton() {
  const { isInitialized, authState, ocAuth } = useOCAuth();
  // Create a state variable to hold the user object
  const [user, setUser] = useState<OCIDUser | null>(null);

  const handleLogout = async () => {
    try {
      await ocAuth.signOutRedirect();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // This useEffect will now sync the user data from the SDK to our component's state
  useEffect(() => {
    if (isInitialized && authState.isAuthenticated) {
      const fullAuthState = ocAuth.getAuthState();
      if (fullAuthState?.user) {
        console.log("User data found, setting state:", fullAuthState.user);
        setUser(fullAuthState.user); // This will trigger a re-render with the user data
      }
    } else {
      // If the user logs out, clear our user state
      setUser(null);
    }
  }, [isInitialized, authState.isAuthenticated, ocAuth]);


  if (!isInitialized) {
    return <div className="text-sm text-gray-500 animate-pulse h-[50px] w-[200px]">Initializing OCID...</div>;
  }

  // --- FINAL LOGIC ---
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