import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export interface AssignedProduct {
  id: string;
  stock_level: number;
  slot_position: number | null;
  product: {
    id: string;
    name: string;
    price: number;
    product_code: string;
    image_url?: string;
    description?: string;
    category?: string;
  };
}

interface UseProductSyncOptions {
  machineId: string;
  autoRefresh?: boolean;
  refreshInterval?: number; // in seconds
}

const useProductSync = (options: UseProductSyncOptions) => {
  const { 
    machineId,
    autoRefresh = true,
    refreshInterval = 30 // 30 seconds default
  } = options;
  
  const [assignedProducts, setAssignedProducts] = useState<AssignedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);

  // Fetch products from Supabase
  const fetchProducts = useCallback(async (): Promise<boolean> => {
    if (!machineId || machineId === 'unknown') {
      console.log('❌ No valid machine ID provided for product sync');
      setError('No valid machine ID provided');
      return false;
    }

    if (!supabase) {
      console.log('❌ No Supabase client available');
      setError('Supabase client not configured');
      return false;
    }

    // Validate machine ID format (basic UUID check)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(machineId)) {
      console.log('⚠️ Machine ID does not appear to be a valid UUID:', machineId);
      // Continue anyway - might be a different format
    }

    setLoading(true);
    setError(null);

    try {
      console.log('🔄 Fetching products for machine:', machineId);

      // Query machine_products table with related product data
      const { data, error: queryError } = await supabase
        .from('machine_products')
        .select(`
          id,
          current_stock,
          slot_position,
          products (
            id,
            name,
            base_price,
            product_code,
            description,
            category
          )
        `)
        .eq('machine_id', machineId)
        .order('slot_position', { ascending: true, nullsFirst: false });

      if (queryError) {
        console.error('❌ Supabase query error:', queryError);
        throw new Error(`Database query failed: ${queryError.message}`);
      }

      console.log('✅ Raw data from Supabase:', data);

      // Transform the data to match our interface
      const transformedProducts: AssignedProduct[] = (data || []).map((item: any) => ({
        id: item.id,
        stock_level: item.current_stock,
        slot_position: item.slot_position,
        product: {
          id: item.products.id,
          name: item.products.name,
          price: parseFloat(item.products.base_price),
          product_code: item.products.product_code,
          description: item.products.description,
          category: item.products.category,
          // Note: image_url will need to be fetched separately from product_images table
          image_url: undefined
        }
      }));

      // Fetch product images for all products
      const productIds = transformedProducts.map(p => p.product.id);
      if (productIds.length > 0) {
        try {
          const { data: imageData, error: imageError } = await supabase
            .from('product_images')
            .select('product_id, image_url, is_primary')
            .in('product_id', productIds)
            .eq('is_primary', true);

          if (!imageError && imageData) {
            // Create a map of product_id to image_url
            const imageMap = new Map<string, string>();
            imageData.forEach(img => {
              imageMap.set(img.product_id, img.image_url);
            });

            // Update products with their primary images
            transformedProducts.forEach(product => {
              const imageUrl = imageMap.get(product.product.id);
              if (imageUrl) {
                product.product.image_url = imageUrl;
              }
            });
          }
        } catch (imageError) {
          console.warn('⚠️ Failed to fetch product images:', imageError);
          // Continue without images - not critical
        }
      }

      // Sort by slot_position (nulls last), then by product name
      const sortedProducts = transformedProducts.sort((a, b) => {
        if (a.slot_position === null && b.slot_position === null) {
          return a.product.name.localeCompare(b.product.name);
        }
        if (a.slot_position === null) return 1;
        if (b.slot_position === null) return -1;
        return a.slot_position - b.slot_position;
      });

      // Filter out products with invalid data
      const validProducts = sortedProducts.filter(product => 
        product.product.name && 
        product.product.product_code && 
        !isNaN(product.product.price)
      );

      setAssignedProducts(validProducts);
      setLastFetched(new Date());
      
      console.log(`✅ Loaded ${validProducts.length} valid products for machine ${machineId}`);
      if (sortedProducts.length !== validProducts.length) {
        console.warn(`⚠️ Filtered out ${sortedProducts.length - validProducts.length} invalid products`);
      }
      
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Product sync failed:', errorMessage);
      
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [machineId]);

  // Manual refresh function
  const refetch = useCallback(async (): Promise<boolean> => {
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

    console.log(`🔄 Product sync auto-refresh enabled - every ${refreshInterval} seconds`);

    // Cleanup on unmount
    return () => {
      clearInterval(intervalRef);
      console.log('🔄 Product sync auto-refresh disabled');
    };
  }, [machineId, autoRefresh, refreshInterval, fetchProducts]);

  // Manual fetch when machineId changes
  useEffect(() => {
    if (machineId) {
      fetchProducts();
    }
  }, [machineId, fetchProducts]);

  return {
    assignedProducts,
    loading,
    error,
    lastFetched,
    refetch,
  };
};

export default useProductSync; 