import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Machine, MachineProduct } from '../lib/supabase';

interface UseMachineDataOptions {
  machineId: string;
  autoRefresh?: boolean;
  refreshInterval?: number; // in seconds
}

interface MachineData {
  machine: Machine | null;
  products: MachineProduct[];
  loading: boolean;
  error: string | null;
  lastFetched: Date | null;
  isOnline: boolean;
  lastSyncMinutes: number;
}

const useMachineData = (options: UseMachineDataOptions): MachineData => {
  const { 
    machineId,
    autoRefresh = true,
    refreshInterval = 30 // 30 seconds default
  } = options;
  
  const [machine, setMachine] = useState<Machine | null>(null);
  const [products, setProducts] = useState<MachineProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);

  // Calculate if machine is online (offline if no ping in last 2 minutes)
  const isOnline = useCallback((): boolean => {
    if (!machine?.last_ping) return false;
    const lastPing = new Date(machine.last_ping);
    const now = new Date();
    const diffMinutes = (now.getTime() - lastPing.getTime()) / (1000 * 60);
    return diffMinutes <= 2;
  }, [machine]);

  // Calculate minutes since last sync
  const lastSyncMinutes = useCallback((): number => {
    if (!machine?.last_ping) return 0;
    const lastPing = new Date(machine.last_ping);
    const now = new Date();
    return Math.floor((now.getTime() - lastPing.getTime()) / (1000 * 60));
  }, [machine]);

  // Fetch machine data
  const fetchMachineData = useCallback(async (): Promise<boolean> => {
    if (!machineId) {
      console.log('❌ No machine ID provided');
      setError('No machine ID provided');
      return false;
    }

    // Check if machine ID is a valid UUID
    if (!machineId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      console.log('⚠️ Machine ID is not a valid UUID:', machineId);
      setError('Invalid machine ID format. Please check machine pairing.');
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('🔄 Fetching machine data for:', machineId);

      // Fetch machine details
      const { data: machineData, error: machineError } = await supabase
        .from('machines')
        .select('*')
        .eq('id', machineId)
        .single();

      if (machineError) {
        console.error('❌ Error fetching machine:', machineError);
        setError(`Machine error: ${machineError.message}`);
        return false;
      }

      if (!machineData) {
        console.error('❌ Machine not found:', machineId);
        setError('Machine not found');
        return false;
      }

      setMachine(machineData);

      // Fetch machine products with product details
      const { data: productsData, error: productsError } = await supabase
        .from('machine_products')
        .select(`
          *,
          product:products(*)
        `)
        .eq('machine_id', machineId)
        .order('slot_position');

      if (productsError) {
        console.error('❌ Error fetching products:', productsError);
        setError(`Products error: ${productsError.message}`);
        return false;
      }

      setProducts(productsData || []);
      setLastFetched(new Date());
      
      console.log(`✅ Loaded machine data: ${machineData.name} with ${productsData?.length || 0} products`);
      
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Machine data fetch failed:', errorMessage);
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [machineId]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!machineId) return;

    console.log('🔄 Setting up real-time subscriptions for machine:', machineId);

    // Subscribe to machine updates
    const machineSubscription = supabase
      .channel(`machine-${machineId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'machines',
          filter: `id=eq.${machineId}`
        },
        (payload) => {
          console.log('🔄 Machine update received:', payload);
          if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            setMachine(payload.new as Machine);
          }
        }
      )
      .subscribe();

    // Subscribe to machine products updates
    const productsSubscription = supabase
      .channel(`machine-products-${machineId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'machine_products',
          filter: `machine_id=eq.${machineId}`
        },
        (payload) => {
          console.log('🔄 Machine products update received:', payload);
          if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            // Refresh products data
            fetchMachineData();
          }
        }
      )
      .subscribe();

    // Subscribe to product updates
    const productSubscription = supabase
      .channel('products')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'products'
        },
        (payload) => {
          console.log('🔄 Product update received:', payload);
          // Refresh products data to get updated product info
          fetchMachineData();
        }
      )
      .subscribe();

    // Initial fetch
    fetchMachineData();

    // Set up auto-refresh if enabled
    let intervalRef: NodeJS.Timeout | null = null;
    if (autoRefresh) {
      intervalRef = setInterval(fetchMachineData, refreshInterval * 1000);
      console.log(`🔄 Auto-refresh enabled - every ${refreshInterval} seconds`);
    }

    // Cleanup
    return () => {
      console.log('🔄 Cleaning up real-time subscriptions');
      machineSubscription.unsubscribe();
      productsSubscription.unsubscribe();
      productSubscription.unsubscribe();
      if (intervalRef) {
        clearInterval(intervalRef);
      }
    };
  }, [machineId, autoRefresh, refreshInterval, fetchMachineData]);

  return {
    machine,
    products,
    loading,
    error,
    lastFetched,
    isOnline: isOnline(),
    lastSyncMinutes: lastSyncMinutes(),
  };
};

export default useMachineData;
