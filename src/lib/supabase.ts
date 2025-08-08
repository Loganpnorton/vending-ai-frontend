import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface Machine {
  id: string;
  name: string;
  code: string;
  location?: string;
  last_ping?: string;
  connection_status: 'online' | 'offline';
  battery?: number;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  image_url?: string;
  category?: string;
  is_available: boolean;
  created_at: string;
  updated_at: string;
}

export interface MachineProduct {
  id: string;
  machine_id: string;
  product_id: string;
  slot_position: string;
  stock_level: number;
  max_stock_level: number;
  created_at: string;
  updated_at: string;
  product?: Product;
  machine?: Machine;
}

export interface MachineStatus {
  id: string;
  machine_id: string;
  name?: string;
  location?: string;
  battery: number;
  stock_level: number;
  temperature: number;
  errors: string[];
  uptime_minutes: number;
  last_maintenance?: string;
  created_at: string;
}
