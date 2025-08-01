# Backend Products Endpoint Implementation

## Issue
The frontend is receiving **HTTP 405 "Method not allowed"** when calling `POST /api/machine-products`. This means the endpoint doesn't exist on your backend yet.

## Current Status
- ✅ `POST /api/machine-checkin` - **Working** (HTTP 200)
- ❌ `POST /api/machine-products` - **Missing** (HTTP 405)

## Required Backend Implementation

### Endpoint: `POST /api/machine-products`

**Request Headers:**
```
Content-Type: application/json
Authorization: Bearer <supabase_access_token>  # Optional but recommended
```

**Request Body:**
```json
{
  "machine_id": "string"
}
```

**Expected Response:**
```json
{
  "success": true,
  "products": [
    {
      "id": "string",
      "name": "string",
      "price": 2.50,
      "stock_level": 10,
      "image_url": "https://example.com/image.jpg",  # Optional
      "description": "string",  # Optional
      "category": "string",  # Optional
      "is_available": true
    }
  ]
}
```

## Implementation Examples

### Option 1: Simple Static Response
```javascript
// In your backend API route
app.post('/api/machine-products', async (req, res) => {
  const { machine_id } = req.body;
  
  // For now, return static products
  const products = [
    {
      id: '1',
      name: 'Coca-Cola Classic',
      price: 2.50,
      stock_level: 15,
      image_url: 'https://via.placeholder.com/64x64/ff0000/ffffff?text=CC',
      description: 'Refreshing classic cola',
      category: 'Beverages',
      is_available: true
    },
    {
      id: '2',
      name: 'Doritos Nacho Cheese',
      price: 1.75,
      stock_level: 8,
      image_url: 'https://via.placeholder.com/64x64/ff6b00/ffffff?text=DC',
      description: 'Crunchy nacho cheese chips',
      category: 'Snacks',
      is_available: true
    }
  ];
  
  res.json({
    success: true,
    products
  });
});
```

### Option 2: Database Integration
```javascript
// In your backend API route
app.post('/api/machine-products', async (req, res) => {
  const { machine_id } = req.body;
  
  try {
    // Query your database for products associated with this machine
    const products = await db.query(`
      SELECT 
        id,
        name,
        price,
        stock_level,
        image_url,
        description,
        category,
        is_available
      FROM products 
      WHERE machine_id = $1 AND is_active = true
      ORDER BY name
    `, [machine_id]);
    
    res.json({
      success: true,
      products: products.rows
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch products'
    });
  }
});
```

## Frontend Fallback
The frontend now includes a fallback that provides mock products when the endpoint returns 405. This allows development to continue while you implement the backend.

## Testing
Once you implement the endpoint, test it with:
```bash
curl -X POST https://your-backend.com/api/machine-products \
  -H "Content-Type: application/json" \
  -d '{"machine_id": "VM-6229-018"}'
```

## Next Steps
1. Implement the `POST /api/machine-products` endpoint on your backend
2. Test with the curl command above
3. The frontend will automatically switch from mock data to real data once the endpoint works
4. Consider adding authentication validation similar to your machine-checkin endpoint 