"use client";

import { useOCAuth } from '@opencampus/ocid-connect-js';
import Image from 'next/image';
import { useEffect, useState } from 'react';

interface OCIDUser {
  name: string;
  picture: string;
  email: string;
}

// Helper function to decode the JWT payload
function parseJwt(token: string) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(function (c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error("Error decoding JWT", e);
    return null;
  }
}

export default function OCIDButton() {
  const { isInitialized, authState, ocAuth } = useOCAuth();
  const [user, setUser] = useState<OCIDUser | null>(null);

  useEffect(() => {
    if (isInitialized && authState.isAuthenticated) {
      const fullAuthState = ocAuth.getAuthState();
      if (fullAuthState?.idToken) {
        const decodedUser = parseJwt(fullAuthState.idToken);
        if (decodedUser) {
          setUser(decodedUser);
        }
      }
    } else {
      setUser(null);
    }
  }, [isInitialized, authState.isAuthenticated, ocAuth]);


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
        {/* This block is updated to show the email instead of the picture */}
        <div className="flex items-center gap-3 p-2 border border-gray-200 rounded-lg">
          <div className="flex-grow text-center">
            <p className="text-sm font-semibold text-gray-800">{user.email}</p>
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