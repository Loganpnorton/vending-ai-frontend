import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client for auth
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

interface Product {
  id: string;
  name: string;
  price: number;
  stock_level: number;
  image_url?: string;
  description?: string;
  category?: string;
  is_available: boolean;
}

interface UseMachineProductsOptions {
  machineId: string;
  baseUrl?: string;
  autoRefresh?: boolean;
  refreshInterval?: number; // in seconds
}

const useMachineProducts = (options: UseMachineProductsOptions) => {
  const { 
    machineId,
    baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://vending-ai-nexus.vercel.app',
    autoRefresh = true,
    refreshInterval = 30 // 30 seconds default
  } = options;
  
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);

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
        console.log('✅ Auth token retrieved successfully for products');
        return session.access_token;
      } else {
        console.log('⚠️ No active auth session found for products');
        return null;
      }
    } catch (error) {
      console.error('❌ Error retrieving auth token for products:', error);
      return null;
    }
  }, []);

  // Fetch products
  const fetchProducts = useCallback(async (): Promise<boolean> => {
    if (!machineId) {
      console.log('❌ No machine ID provided for products fetch');
      setError('No machine ID provided');
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('🔄 Fetching products for machine:', machineId);
      console.log('🌐 Base URL:', baseUrl);
      console.log('🎯 Full URL:', `${baseUrl}/api/machine-products`);

      // Get auth token
      const authToken = await getAuthToken();
      
      // Prepare headers
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // Add auth token if available
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
        console.log('🔐 Including auth token in products request');
      } else {
        console.log('⚠️ No auth token available for products - proceeding without authentication');
      }

      console.log('📤 Sending products request with headers:', headers);

      const response = await fetch(`${baseUrl}/api/machine-products`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          machine_id: machineId,
        }),
      });

      console.log('📥 Products response status:', response.status);
      console.log('📥 Products response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ HTTP Error for products:', response.status, errorText);
        
        // Detailed error logging
        const errorDetails = {
          status: response.status,
          statusText: response.statusText,
          url: `${baseUrl}/api/machine-products`,
          headers: Object.fromEntries(response.headers.entries()),
          body: errorText,
          machineId
        };
        
        console.error('🔍 Detailed products error info:', errorDetails);
        
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Products fetch successful:', result);
      
      // Handle different response formats
      let productsData: Product[] = [];
      
      if (result.products && Array.isArray(result.products)) {
        productsData = result.products;
      } else if (Array.isArray(result)) {
        productsData = result;
      } else if (result.data && Array.isArray(result.data)) {
        productsData = result.data;
      } else {
        console.warn('⚠️ Unexpected products response format:', result);
        productsData = [];
      }

      setProducts(productsData);
      setLastFetched(new Date());
      
      console.log(`✅ Loaded ${productsData.length} products for machine ${machineId}`);
      
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.log('❌ Products fetch failed:', errorMessage);
      
      // Detailed error logging
      console.error('🔍 Products error details:', {
        error: errorMessage,
        baseUrl,
        machineId,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        location: window.location.href
      });
      
      // Check if it's a CORS error
      if (errorMessage.includes('NetworkError') || errorMessage.includes('CORS') || errorMessage.includes('Failed to fetch')) {
        console.log('🌐 CORS error detected for products - this is expected in development');
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

    console.log(`🔄 Products auto-refresh enabled - every ${refreshInterval} seconds`);

    // Cleanup on unmount
    return () => {
      clearInterval(intervalRef);
      console.log('🔄 Products auto-refresh disabled');
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
  };
};

export default useMachineProducts; 