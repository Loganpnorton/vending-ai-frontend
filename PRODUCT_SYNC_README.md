# Product Sync Implementation

This document describes the new product sync functionality implemented for the vending machine UI app.

## Overview

The product sync feature automatically fetches and displays products assigned to the current machine using Supabase as the backend database. It provides real-time inventory updates with visual indicators for stock levels.

## Features

- **Automatic Product Fetching**: On app startup, automatically fetches products assigned to the current machine
- **Real-time Updates**: Auto-refreshes every 30 seconds to keep inventory current
- **Grid Layout**: Displays products in a responsive grid layout sorted by slot position
- **Stock Level Indicators**: Visual indicators for in-stock, low stock, and out-of-stock products
- **Product Images**: Displays product images with fallback to placeholder
- **Error Handling**: Comprehensive error handling with retry functionality
- **Loading States**: Skeleton loading states during data fetch

## Configuration

### Environment Variables

Create a `.env` file in the project root with the following variables:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# API Configuration (optional - for machine check-ins)
VITE_API_BASE_URL=https://vending-ai-nexus.vercel.app
```

### Getting Supabase Credentials

1. Go to your Supabase project dashboard
2. Navigate to Settings > API
3. Copy the Project URL and anon/public key
4. Add them to your `.env` file

## Database Schema

The implementation uses the following Supabase tables:

### `machine_products` table
- `id`: UUID primary key
- `machine_id`: UUID (foreign key to machines table)
- `product_id`: UUID (foreign key to products table)
- `current_stock`: INTEGER (current stock level)
- `slot_position`: INTEGER (optional slot position in machine)
- `par_level`: INTEGER (reorder point)
- `price_override`: DECIMAL (optional machine-specific pricing)

### `products` table
- `id`: UUID primary key
- `name`: TEXT (product name)
- `product_code`: TEXT (unique product code)
- `base_price`: DECIMAL (product price)
- `description`: TEXT (product description)
- `category`: TEXT (product category)

### `product_images` table
- `id`: UUID primary key
- `product_id`: UUID (foreign key to products table)
- `image_url`: TEXT (image URL)
- `is_primary`: BOOLEAN (primary image flag)

## Components

### `useProductSync` Hook

The main hook that handles product data fetching:

```typescript
const {
  assignedProducts,
  loading,
  error,
  lastFetched,
  refetch,
} = useProductSync({
  machineId: 'your-machine-id',
  autoRefresh: true,
  refreshInterval: 30, // seconds
});
```

**Returns:**
- `assignedProducts`: Array of products with stock levels and slot positions
- `loading`: Boolean indicating loading state
- `error`: Error message if fetch failed
- `lastFetched`: Timestamp of last successful fetch
- `refetch`: Function to manually refresh data

### `ProductSyncGrid` Component

The main component that displays products in a grid layout:

```typescript
<ProductSyncGrid 
  machineId="your-machine-id" 
  className="optional-css-class" 
/>
```

**Features:**
- Responsive grid layout (1 column on mobile, 2 on tablet, 3 on desktop)
- Loading skeleton states
- Error handling with retry button
- Stock level indicators
- Out-of-stock visual overlays
- Product images with fallbacks
- Slot position display
- Price formatting
- Category tags

## Data Flow

1. **App Startup**: Machine ID is retrieved from localStorage
2. **Initial Fetch**: Products are fetched from Supabase using the machine ID
3. **Data Transformation**: Raw data is transformed to match the component interface
4. **Image Fetching**: Product images are fetched separately for products with images
5. **Sorting**: Products are sorted by slot position (nulls last), then by name
6. **Display**: Products are rendered in the grid with appropriate styling
7. **Auto-refresh**: Data is refreshed every 30 seconds

## Error Handling

The implementation includes comprehensive error handling:

- **No Machine ID**: Shows error if machine ID is not provided
- **Supabase Not Configured**: Shows error if environment variables are missing
- **Network Errors**: Handles network failures gracefully
- **Database Errors**: Shows specific database error messages
- **Image Load Errors**: Falls back to placeholder for failed image loads

## Stock Level Indicators

- **In Stock** (green): Stock level > 5
- **Low Stock** (yellow): Stock level 1-5
- **Out of Stock** (red): Stock level = 0

## Development Features

In development mode, the component shows debug information:
- Machine ID
- Number of products loaded
- Last fetch timestamp
- Auto-refresh status
- Supabase configuration status

## Usage Example

```typescript
import ProductSyncGrid from './components/ProductSyncGrid';

function App() {
  const machineId = localStorage.getItem('machine_id');
  
  return (
    <div>
      <h1>Vending Machine Inventory</h1>
      <ProductSyncGrid machineId={machineId} />
    </div>
  );
}
```

## Troubleshooting

### Common Issues

1. **"Supabase client not configured"**
   - Check that `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set in `.env`
   - Restart the development server after adding environment variables

2. **"No products found"**
   - Verify that the machine ID exists in the database
   - Check that products are assigned to the machine in the `machine_products` table

3. **"Database query failed"**
   - Check that the database tables exist and have the correct schema
   - Verify that Row Level Security (RLS) policies allow the query

4. **Images not loading**
   - Check that product images exist in the `product_images` table
   - Verify that image URLs are accessible

### Debug Information

In development mode, the component shows detailed debug information to help troubleshoot issues. Check the browser console for additional logging information. 