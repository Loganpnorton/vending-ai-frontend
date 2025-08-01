import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import type { User } from '@supabase/supabase-js';
import LoginScreen from './LoginScreen';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

interface AuthWrapperProps {
  children: React.ReactNode;
  redirectUrl?: string;
}

const AuthWrapper: React.FC<AuthWrapperProps> = ({ children, redirectUrl }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    if (!supabase) {
      setIsCheckingAuth(false);
      return;
    }

    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user ?? null);
      } catch (error) {
        console.error('Error getting session:', error);
      } finally {
        setIsCheckingAuth(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setUser(session?.user ?? null);
        setIsCheckingAuth(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const handleLoginSuccess = () => {
    // The auth state change will be handled by the listener above
  };

  const handleLogout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
  };

  // Loading state while checking authentication
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-white text-lg">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Show login screen if not authenticated
  if (!user) {
    return (
      <LoginScreen 
        onLoginSuccess={handleLoginSuccess}
        redirectUrl={redirectUrl}
      />
    );
  }

  // Show authenticated content
  return (
    <div>
      {/* Optional: Add a logout button or user info */}
      <div className="fixed top-4 right-4 z-50">
        <div className="bg-gray-800 rounded-lg p-3 flex items-center space-x-3">
          <span className="text-white text-sm">
            {user.email}
          </span>
          <button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
          >
            Logout
          </button>
        </div>
      </div>
      
      {children}
    </div>
  );
};

export default AuthWrapper; 