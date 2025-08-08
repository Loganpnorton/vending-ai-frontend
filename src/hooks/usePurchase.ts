import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { MachineProduct } from '../lib/supabase';

interface PurchaseOptions {
  machineId: string;
  onSuccess?: (product: MachineProduct) => void;
  onError?: (error: string) => void;
}



const usePurchase = (options: PurchaseOptions) => {
  const { machineId, onSuccess, onError } = options;
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastPurchase, setLastPurchase] = useState<MachineProduct | null>(null);

  const purchaseProduct = useCallback(async (product: MachineProduct): Promise<boolean> => {
    if (!product.product) {
      const errorMsg = 'Product information not available';
      setError(errorMsg);
      onError?.(errorMsg);
      return false;
    }

    if (product.stock_level <= 0) {
      const errorMsg = 'Product is out of stock';
      setError(errorMsg);
      onError?.(errorMsg);
      return false;
    }

    setIsProcessing(true);
    setError(null);

    try {
      console.log('🛒 Processing purchase for:', product.product.name);
      console.log('💰 Price:', product.product.price);
      console.log('📦 Stock before:', product.stock_level);

      // Simulate purchase processing time
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Update stock level in database
      const { error: updateError } = await supabase
        .from('machine_products')
        .update({ 
          stock_level: product.stock_level - 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', product.id);

      if (updateError) {
        console.error('❌ Error updating stock:', updateError);
        const errorMsg = `Failed to update stock: ${updateError.message}`;
        setError(errorMsg);
        onError?.(errorMsg);
        return false;
      }

      // Create purchase record (you can add a purchases table later)
      console.log('✅ Purchase successful!');
      console.log('📦 Stock after:', product.stock_level - 1);

      setLastPurchase(product);
      onSuccess?.(product);

      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Purchase failed:', errorMessage);
      setError(errorMessage);
      onError?.(errorMessage);
      return false;
    } finally {
      setIsProcessing(false);
    }
  }, [machineId, onSuccess, onError]);

  const resetPurchase = useCallback(() => {
    setError(null);
    setLastPurchase(null);
  }, []);

  return {
    purchaseProduct,
    resetPurchase,
    isProcessing,
    error,
    lastPurchase,
  };
};

export default usePurchase;
