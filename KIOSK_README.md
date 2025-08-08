# Vending Machine Kiosk Interface

A professional, touch-friendly vending machine interface built with React and Tailwind CSS, designed to run on tablets or kiosk displays.

## Features

### 🖥️ Kiosk Mode Interface
- **Full-screen kiosk experience** with dark theme optimized for touch interaction
- **Large, touch-friendly buttons** and product cards
- **Responsive grid layout** that adapts to different screen sizes
- **Professional animations** and transitions

### 📊 Real-time Machine Status
- **Live machine status** (online/offline) with visual indicators
- **Last sync time** display ("Last sync: X minutes ago")
- **Battery percentage** display (if available)
- **Offline detection** - marks machine as offline after 2 minutes without ping

### 🛍️ Product Management
- **Dynamic product grid** showing all products assigned to the machine
- **Product images, names, prices, and stock levels**
- **Slot position ordering** (A1, A2, B1, B2, etc.)
- **Stock status indicators** (In Stock, Only X left, Out of Stock)
- **Out-of-stock products** are greyed out and non-interactive

### 💳 Purchase Flow
- **Touch-friendly product modals** with detailed product information
- **Large "Buy" buttons** optimized for touch interaction
- **Purchase processing animation** with progress indicators
- **Success confirmation** with dispensing animation
- **Error handling** with user-friendly messages

### 🔄 Real-time Updates
- **Supabase real-time subscriptions** for live data updates
- **Automatic stock level updates** without page refresh
- **Live machine status updates**
- **Product changes reflected immediately**

### 🚫 Offline Handling
- **Full-screen offline overlay** when machine is offline
- **Non-interactive product grid** during offline periods
- **Clear offline messaging** with helpful instructions

## Setup Instructions

### 1. Environment Configuration
Create a `.env` file in the project root with your Supabase credentials:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 2. Database Requirements
Ensure your Supabase database has the following tables:

- **machines** - Machine information and status
- **products** - Product catalog
- **machine_products** - Relationship between machines and products with stock levels

### 3. Machine Pairing
1. Navigate to `/kiosk` in the application
2. Scan the QR code or enter the pairing code in your admin dashboard
3. The machine will automatically connect once paired

### 4. Kiosk Deployment
For production kiosk deployment:

1. **Full-screen mode**: Use browser full-screen mode or kiosk mode
2. **Auto-start**: Configure the application to start automatically
3. **Touch optimization**: Ensure touch events are properly configured
4. **Network connectivity**: Ensure stable internet connection for real-time updates

## Usage

### Accessing Kiosk Mode
- Navigate to `/kiosk` in the application
- Or click "Kiosk Mode" in the navigation menu

### Customer Experience
1. **Product Selection**: Tap any available product to view details
2. **Purchase**: Tap "Buy" to initiate purchase
3. **Collection**: Follow on-screen instructions to collect item
4. **Real-time Updates**: Stock levels update automatically

### Admin Controls
- **Reset Pairing**: Hover over the bottom-right corner to reveal admin controls
- **Machine Status**: Monitor machine status in the header
- **Offline Detection**: Automatic offline detection and user notification

## Technical Details

### Real-time Data Flow
- **Machine Status**: Subscribes to machine table changes
- **Product Updates**: Subscribes to machine_products and products tables
- **Stock Updates**: Real-time stock level updates
- **Connection Status**: Live connection status monitoring

### Offline Detection Logic
- Machine considered offline if no ping in last 2 minutes
- Full-screen overlay prevents interaction during offline periods
- Automatic recovery when machine comes back online

### Purchase Processing
- **Stock Validation**: Checks stock availability before purchase
- **Database Updates**: Updates stock levels in real-time
- **Error Handling**: Comprehensive error handling and user feedback
- **Success Flow**: Multi-stage purchase confirmation with animations

## Customization

### Styling
- **Dark theme** optimized for kiosk displays
- **High contrast** product cards for visibility
- **Touch-friendly** button sizes and spacing
- **Responsive design** for different screen sizes

### Configuration
- **Refresh intervals** can be adjusted in hooks
- **Offline timeout** can be modified in machine data hook
- **Purchase flow** can be customized in purchase hook
- **UI elements** can be styled via Tailwind classes

## Troubleshooting

### Common Issues
1. **No products showing**: Check machine pairing and product assignments
2. **Offline status**: Verify machine connectivity and last ping time
3. **Purchase errors**: Check stock levels and database permissions
4. **Real-time not working**: Verify Supabase configuration and network

### Debug Information
- Check browser console for detailed logs
- Monitor network tab for API calls
- Verify Supabase real-time subscriptions
- Check localStorage for machine credentials

## Future Enhancements

- **Payment integration** with actual payment processors
- **Inventory management** with low stock alerts
- **Analytics dashboard** for sales tracking
- **Multi-language support** for international deployments
- **Accessibility features** for inclusive design
- **Advanced animations** and visual effects
