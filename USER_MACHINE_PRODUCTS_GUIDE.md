# User Machine Products Guide

This guide explains how to implement automatic product fetching for users' accounts that are assigned to specific machines using Supabase tables.

## Overview

The system automatically pulls products assigned to a user's account that are assigned to a specific machine. This ensures that users only see products they own and that are assigned to machines they own.

## Features

- **User Authentication**: Requires valid Supabase authentication
- **Machine Ownership Verification**: Ensures users can only access their own machines
- **Product Ownership Verification**: Ensures users only see products they own
- **Real-time Updates**: Auto-refreshes every 30 seconds
- **Comprehensive Error Handling**: Detailed error messages and retry functionality
- **Responsive Design**: Works on all device sizes
- **Stock Level Indicators**: Visual indicators for stock status
- **Slot Position Support**: Displays product slot positions in machines

## API Endpoint

### `GET /api/user-machine-products`

**Authentication Required**: Bearer token from Supabase

**Query Parameters**:
- `machine_id` (UUID): The machine ID to fetch products for
- `machine_code` (string): Alternative to machine_id, the machine code

**Headers**:
```
Authorization: Bearer <supabase_access_token>
Content-Type: application/json
```

**Example Request**:
```bash
curl -X GET "https://your-domain.com/api/user-machine-products?machine_id=550e8400-e29b-41d4-a716-446655440000" \
  -H "Authorization: Bearer YOUR_SUPABASE_TOKEN" \
  -H "Content-Type: application/json"
```

**Response Format**:
```json
{
  "success": true,
  "machine": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Main Lobby Vending Machine",
    "machine_code": "VM-001"
  },
  "user": {
    "id": "user-uuid",
    "email": "user@example.com"
  },
  "products": [
    {
      "id": "product-uuid",
      "name": "Coca-Cola Classic",
      "description": "Refreshing classic cola",
      "price": 2.50,
      "stock_level": 15,
      "par_level": 50,
      "slot_position": 1,
      "image_url": "https://example.com/image.jpg",
      "category": "Beverages",
      "product_code": "P001",
      "is_available": true,
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ],
  "count": 1,
  "timestamp": "2024-01-01T12:00:00Z"
}
```

## Database Schema

The system uses the following Supabase tables:

### `machines` table
- `id`: UUID primary key
- `name`: TEXT (machine name)
- `machine_code`: TEXT (unique machine code)
- `location`: TEXT (optional location)
- `user_id`: UUID (foreign key to auth.users)

### `products` table
- `id`: UUID primary key
- `name`: TEXT (product name)
- `description`: TEXT (product description)
- `base_price`: DECIMAL (product price)
- `category`: TEXT (product category)
- `product_code`: TEXT (unique product code)
- `user_id`: UUID (foreign key to auth.users)

### `machine_products` table
- `id`: UUID primary key
- `machine_id`: UUID (foreign key to machines)
- `product_id`: UUID (foreign key to products)
- `current_stock`: INTEGER (current stock level)
- `par_level`: INTEGER (reorder point)
- `price_override`: DECIMAL (optional machine-specific pricing)
- `slot_position`: INTEGER (optional slot position)

### `product_images` table
- `id`: UUID primary key
- `product_id`: UUID (foreign key to products)
- `image_url`: TEXT (image URL)
- `is_primary`: BOOLEAN (primary image flag)

## Frontend Implementation

### 1. Hook Usage

```typescript
import useUserMachineProducts from './hooks/useUserMachineProducts';

const MyComponent = () => {
  const {
    products,
    loading,
    error,
    lastFetched,
    refresh,
    machineInfo,
    userInfo,
    count
  } = useUserMachineProducts({
    machineId: 'your-machine-id',
    autoRefresh: true,
    refreshInterval: 30
  });

  // Use the data...
};
```

### 2. Component Usage

```typescript
import UserMachineProductsGrid from './components/UserMachineProductsGrid';

const MyPage = () => {
  return (
    <UserMachineProductsGrid
      machineId="your-machine-id"
      showMachineInfo={true}
      showUserInfo={true}
    />
  );
};
```

### 3. Demo Component

```typescript
import UserMachineProductsDemo from './components/UserMachineProductsDemo';

const App = () => {
  return <UserMachineProductsDemo />;
};
```

## Security Features

### Authentication
- Requires valid Supabase JWT token
- Token must be included in Authorization header
- Invalid or expired tokens return 401 error

### Authorization
- Users can only access machines they own
- Users can only see products they own
- Machine ownership is verified via `user_id` field
- Product ownership is verified via `user_id` field

### Row Level Security (RLS)
The database uses RLS policies to ensure data security:

```sql
-- Machines policy
CREATE POLICY "Users can view their own machines" ON public.machines
  FOR SELECT USING (auth.uid() = user_id);

-- Products policy
CREATE POLICY "Users can view their own products" ON public.products
  FOR SELECT USING (auth.uid() = user_id);
```

## Error Handling

### Common Error Responses

**401 Unauthorized**:
```json
{
  "success": false,
  "error": "Unauthorized - Bearer token required"
}
```

**403 Forbidden**:
```json
{
  "success": false,
  "error": "Access denied - You do not own this machine"
}
```

**404 Not Found**:
```json
{
  "success": false,
  "error": "Machine not found",
  "searched_for": "machine-id-or-code"
}
```

**500 Internal Server Error**:
```json
{
  "success": false,
  "error": "Internal server error",
  "details": "Error message"
}
```

## Environment Setup

### Required Environment Variables

Create a `.env` file in your project root:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# API Configuration
VITE_API_BASE_URL=https://your-backend-domain.com
```

### Backend Environment Variables

Your backend needs these environment variables:

```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

## Usage Examples

### Basic Implementation

```typescript
import React from 'react';
import UserMachineProductsGrid from './components/UserMachineProductsGrid';

const MachineProductsPage = () => {
  const machineId = '550e8400-e29b-41d4-a716-446655440000';
  
  return (
    <div>
      <h1>My Machine Products</h1>
      <UserMachineProductsGrid machineId={machineId} />
    </div>
  );
};
```

### With Machine Selection

```typescript
import React, { useState } from 'react';
import UserMachineProductsGrid from './components/UserMachineProductsGrid';

const MachineSelector = () => {
  const [selectedMachine, setSelectedMachine] = useState('');
  const machines = [
    { id: 'machine-1', name: 'Main Lobby Machine' },
    { id: 'machine-2', name: 'Break Room Machine' }
  ];

  return (
    <div>
      <select 
        value={selectedMachine} 
        onChange={(e) => setSelectedMachine(e.target.value)}
      >
        <option value="">Select a machine</option>
        {machines.map(machine => (
          <option key={machine.id} value={machine.id}>
            {machine.name}
          </option>
        ))}
      </select>

      {selectedMachine && (
        <UserMachineProductsGrid machineId={selectedMachine} />
      )}
    </div>
  );
};
```

### Custom Hook Usage

```typescript
import React from 'react';
import useUserMachineProducts from './hooks/useUserMachineProducts';

const CustomProductsDisplay = () => {
  const {
    products,
    loading,
    error,
    refresh,
    machineInfo
  } = useUserMachineProducts({
    machineId: 'your-machine-id',
    autoRefresh: false // Disable auto-refresh
  });

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>{machineInfo?.name}</h2>
      <button onClick={refresh}>Refresh</button>
      <div>
        {products.map(product => (
          <div key={product.id}>
            <h3>{product.name}</h3>
            <p>Stock: {product.stock_level}</p>
            <p>Price: ${product.price}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
```

## Testing

### Test the API Endpoint

```bash
# Test with curl
curl -X GET "https://your-domain.com/api/user-machine-products?machine_id=YOUR_MACHINE_ID" \
  -H "Authorization: Bearer YOUR_SUPABASE_TOKEN"

# Test with JavaScript
const response = await fetch('/api/user-machine-products?machine_id=YOUR_MACHINE_ID', {
  headers: {
    'Authorization': `Bearer ${supabaseToken}`,
    'Content-Type': 'application/json'
  }
});
```

### Test the Frontend Component

```typescript
// Test the hook
const { products, loading, error } = useUserMachineProducts({
  machineId: 'test-machine-id'
});

// Test the component
<UserMachineProductsGrid machineId="test-machine-id" />
```

## Troubleshooting

### Common Issues

1. **Authentication Errors**
   - Ensure user is logged in to Supabase
   - Check that the access token is valid
   - Verify environment variables are set correctly

2. **CORS Errors**
   - Ensure backend CORS is configured properly
   - Check that the API base URL is correct

3. **No Products Found**
   - Verify the machine exists and belongs to the user
   - Check that products are assigned to the machine
   - Ensure products belong to the authenticated user

4. **Permission Denied**
   - Verify the user owns the machine
   - Check that the user owns the products
   - Ensure RLS policies are configured correctly

### Debug Information

The system provides detailed console logging:

```javascript
// Check these logs in browser console
console.log('✅ Auth token retrieved successfully');
console.log('🔄 Fetching user machine products for machine:', machineId);
console.log('✅ Loaded X user machine products for machine Y');
console.log('🏭 Machine info:', machineInfo);
console.log('👤 User info:', userInfo);
```

## Performance Considerations

- **Auto-refresh**: Default 30-second interval, configurable
- **Caching**: Consider implementing client-side caching for better performance
- **Pagination**: For large product lists, consider implementing pagination
- **Image Optimization**: Use optimized images and lazy loading

## Future Enhancements

- **Real-time Updates**: WebSocket integration for instant updates
- **Offline Support**: Service worker for offline functionality
- **Advanced Filtering**: Category, price, and stock level filters
- **Bulk Operations**: Multi-select and bulk actions
- **Export Functionality**: Export product data to CSV/PDF 