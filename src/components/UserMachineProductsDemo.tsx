import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import UserMachineProductsGrid from './UserMachineProductsGrid';

// Initialize Supabase client for auth
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

interface Machine {
  id: string;
  name: string;
  machine_code: string;
  location?: string;
}

const UserMachineProductsDemo: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [selectedMachineId, setSelectedMachineId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      if (!supabase) {
        setError('Supabase client not configured');
        setLoading(false);
        return;
      }

      try {
        const { data: { session }, error: authError } = await supabase.auth.getSession();
        
        if (authError) {
          console.error('Auth error:', authError);
          setError('Authentication error');
          setLoading(false);
          return;
        }

        if (session?.user) {
          setUser(session.user);
          await fetchUserMachines(session.user.id);
        } else {
          setError('No authenticated user found');
        }
      } catch (error) {
        console.error('Error checking auth:', error);
        setError('Failed to check authentication');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Fetch user's machines
  const fetchUserMachines = async (userId: string) => {
    if (!supabase) return;

    try {
      const { data: machinesData, error: machinesError } = await supabase
        .from('machines')
        .select('id, name, machine_code, location')
        .eq('user_id', userId)
        .order('name');

      if (machinesError) {
        console.error('Error fetching machines:', machinesError);
        setError('Failed to fetch machines');
        return;
      }

      setMachines(machinesData || []);
      
      // Auto-select first machine if available
      if (machinesData && machinesData.length > 0 && !selectedMachineId) {
        setSelectedMachineId(machinesData[0].id);
      }
    } catch (error) {
      console.error('Error fetching machines:', error);
      setError('Failed to fetch machines');
    }
  };

  // Handle login
  const handleLogin = async () => {
    if (!supabase) return;

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });

      if (error) {
        console.error('Login error:', error);
        setError('Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Login failed');
    }
  };

  // Handle logout
  const handleLogout = async () => {
    if (!supabase) return;

    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Logout error:', error);
      } else {
        setUser(null);
        setMachines([]);
        setSelectedMachineId('');
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              User Machine Products Demo
            </h1>
            <p className="text-gray-600">
              Sign in to view products assigned to your machines
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          <button
            onClick={handleLogin}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Sign in with Google
          </button>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              This demo requires authentication to access your machine products.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                User Machine Products Demo
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                Signed in as: <span className="font-medium">{user.email}</span>
              </div>
              <button
                onClick={handleLogout}
                className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Machine Selection */}
        <div className="mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Select a Machine
            </h2>
            
            {machines.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-400 mb-4">
                  <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Machines Found</h3>
                <p className="text-gray-500">
                  You don't have any machines assigned to your account yet.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {machines.map((machine) => (
                  <button
                    key={machine.id}
                    onClick={() => setSelectedMachineId(machine.id)}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                      selectedMachineId === machine.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <h3 className="font-semibold text-gray-900 mb-1">
                      {machine.name}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">
                      Code: <span className="font-mono">{machine.machine_code}</span>
                    </p>
                    {machine.location && (
                      <p className="text-sm text-gray-500">
                        Location: {machine.location}
                      </p>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Products Display */}
        {selectedMachineId && (
          <div className="bg-white rounded-lg shadow">
            <UserMachineProductsGrid
              machineId={selectedMachineId}
              showMachineInfo={true}
              showUserInfo={true}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default UserMachineProductsDemo; 