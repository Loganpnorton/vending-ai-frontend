import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client for auth
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

interface UserMachineProduct {
  id: string;
  name: string;
  description?: string;
  price: number;
  stock_level: number;
  par_level: number;
  slot_position?: number;
  image_url?: string;
  category?: string;
  product_code: string;
  is_available: boolean;
  created_at: string;
  updated_at: string;
}

interface UserMachineProductsResponse {
  success: boolean;
  machine: {
    id: string;
    name: string;
    machine_code: string;
  };
  user: {
    id: string;
    email: string;
  };
  products: UserMachineProduct[];
  count: number;
  timestamp: string;
}

interface UseUserMachineProductsOptions {
  machineId: string;
  baseUrl?: string;
  autoRefresh?: boolean;
  refreshInterval?: number; // in seconds
}

const useUserMachineProducts = (options: UseUserMachineProductsOptions) => {
  const { 
    machineId,
    baseUrl = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? 'http://localhost:5175' : 'https://vending-ai-nexus.vercel.app'),
    autoRefresh = true,
    refreshInterval = 30 // 30 seconds default
  } = options;
  
  const [products, setProducts] = useState<UserMachineProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);
  const [machineInfo, setMachineInfo] = useState<{ id: string; name: string; machine_code: string } | null>(null);
  const [userInfo, setUserInfo] = useState<{ id: string; email: string } | null>(null);

  // Get auth token
  const getAuthToken = useCallback(async (): Promise<string | null> => {
    if (!supabase) {
      console.log('⚠️ No Supabase client available for auth');
      return null;
    }

    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('❌ Error getting auth session:', error);
        return null;
      }

      if (session?.access_token) {
        console.log('✅ Auth token retrieved successfully for user machine products');
        return session.access_token;
      } else {
        console.log('⚠️ No active auth session found for user machine products');
        return null;
      }
    } catch (error) {
      console.error('❌ Error retrieving auth token for user machine products:', error);
      return null;
    }
  }, []);

  // Fetch products
  const fetchProducts = useCallback(async (): Promise<boolean> => {
    if (!machineId) {
      console.log('❌ No machine ID provided for user machine products fetch');
      setError('No machine ID provided');
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('🔄 Fetching user machine products for machine:', machineId);
      console.log('🌐 Base URL:', baseUrl);
      console.log('🎯 Full URL:', `${baseUrl}/api/user-machine-products`);

      // Get auth token
      const authToken = await getAuthToken();
      
      if (!authToken) {
        console.error('❌ No auth token available - authentication required');
        setError('Authentication required - please log in');
        return false;
      }

      // Prepare headers
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      };

      console.log('📤 Sending user machine products request with auth token');

      const response = await fetch(`${baseUrl}/api/user-machine-products?machine_id=${machineId}`, {
        method: 'GET',
        headers,
      });

      console.log('📥 User machine products response status:', response.status);
      console.log('📥 User machine products response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ HTTP Error for user machine products:', response.status, errorText);
        
        // Handle specific error cases
        if (response.status === 401) {
          setError('Authentication failed - please log in again');
        } else if (response.status === 403) {
          setError('Access denied - you do not own this machine');
        } else if (response.status === 404) {
          setError('Machine not found');
        } else if (response.status === 405) {
          setError('API endpoint not implemented - contact administrator');
        } else {
          setError(`Server error: ${response.status} - ${errorText}`);
        }
        
        return false;
      }

      const result: UserMachineProductsResponse = await response.json();
      console.log('✅ User machine products fetch successful:', result);
      
      if (!result.success) {
        console.error('❌ API returned error:', result);
        setError(result.error || 'Unknown API error');
        return false;
      }

      setProducts(result.products || []);
      setMachineInfo(result.machine);
      setUserInfo(result.user);
      setLastFetched(new Date());
      
      console.log(`✅ Loaded ${result.count} user machine products for machine ${machineId}`);
      console.log('🏭 Machine info:', result.machine);
      console.log('👤 User info:', result.user);
      
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.log('❌ User machine products fetch failed:', errorMessage);
      
      // Detailed error logging
      console.error('🔍 User machine products error details:', {
        error: errorMessage,
        baseUrl,
        machineId,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        location: window.location.href
      });
      
      // Check if it's a CORS error
      if (errorMessage.includes('NetworkError') || errorMessage.includes('CORS') || errorMessage.includes('Failed to fetch')) {
        console.log('🌐 CORS error detected for user machine products - this is expected in development');
        console.log('💡 Set up your backend CORS or use a proxy for production');
        setError('CORS Error - Backend not accessible from browser');
      } else {
        setError(errorMessage);
      }
      
      return false;
    } finally {
      setLoading(false);
    }
  }, [machineId, baseUrl, getAuthToken]);

  // Manual refresh function
  const refresh = useCallback(async (): Promise<boolean> => {
    return await fetchProducts();
  }, [fetchProducts]);

  // Set up automatic refresh
  useEffect(() => {
    if (!autoRefresh || !machineId) return;

    // Initial fetch
    fetchProducts();

    // Set up interval for periodic refresh
    const intervalMs = refreshInterval * 1000;
    const intervalRef = setInterval(fetchProducts, intervalMs);

    console.log(`🔄 User machine products auto-refresh enabled - every ${refreshInterval} seconds`);

    // Cleanup on unmount
    return () => {
      clearInterval(intervalRef);
      console.log('🔄 User machine products auto-refresh disabled');
    };
  }, [machineId, autoRefresh, refreshInterval, fetchProducts]);

  // Manual fetch when machineId changes
  useEffect(() => {
    if (machineId) {
      fetchProducts();
    }
  }, [machineId, fetchProducts]);

  return {
    products,
    loading,
    error,
    lastFetched,
    refresh,
    machineInfo,
    userInfo,
    count: products.length
  };
};

export default useUserMachineProducts; 