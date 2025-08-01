# Machine Pairing Screen Setup

## Environment Configuration

Create a `.env` file in the root directory with your Supabase credentials:

```env
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

## Required Supabase Database Setup

The component requires a complete database setup. Run the provided SQL script in your Supabase SQL Editor:

### Quick Setup

1. **Open your Supabase Dashboard**
2. **Go to SQL Editor**
3. **Copy and paste the entire contents of `supabase-setup.sql`**
4. **Run the script**

This will create:
- `pending_machine_links` table
- `machines` table
- Required RPC functions
- Proper indexes and security policies

### Manual Setup (Alternative)

If you prefer to set up manually, you'll need:

#### 1. Tables
```sql
-- Create pending_machine_links table
CREATE TABLE pending_machine_links (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    pairing_code TEXT NOT NULL UNIQUE,
    link_id UUID NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    used_at TIMESTAMP WITH TIME ZONE NULL,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '1 hour')
);

-- Create machines table
CREATE TABLE machines (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    machine_id TEXT NOT NULL UNIQUE,
    machine_token TEXT NOT NULL,
    link_id UUID NOT NULL REFERENCES pending_machine_links(link_id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);
```

#### 2. RPC Functions

**create_pending_machine_link()** - Generates pairing codes:
```sql
CREATE OR REPLACE FUNCTION create_pending_machine_link()
RETURNS TABLE(pairing_code text, link_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_pairing_code TEXT;
    new_link_id UUID;
    attempts INTEGER := 0;
    max_attempts INTEGER := 10;
BEGIN
    -- Generate a unique 6-digit pairing code
    LOOP
        new_pairing_code := LPAD(FLOOR(RANDOM() * 1000000)::text, 6, '0');
        
        -- Check if this pairing code already exists and is not expired
        IF NOT EXISTS (
            SELECT 1 FROM pending_machine_links 
            WHERE pairing_code = new_pairing_code 
            AND expires_at > NOW()
        ) THEN
            EXIT;
        END IF;
        
        attempts := attempts + 1;
        IF attempts >= max_attempts THEN
            RAISE EXCEPTION 'Unable to generate unique pairing code after % attempts', max_attempts;
        END IF;
    END LOOP;
    
    -- Generate a unique link_id
    new_link_id := gen_random_uuid();
    
    -- Insert the pending link
    INSERT INTO pending_machine_links (pairing_code, link_id, created_at, expires_at)
    VALUES (new_pairing_code, new_link_id, NOW(), NOW() + INTERVAL '1 hour');
    
    -- Return the generated data
    pairing_code := new_pairing_code;
    link_id := new_link_id;
    
    RETURN NEXT;
END;
$$;
```

**get_machine_id_by_pairing_code()** - Checks pairing status:
```sql
CREATE OR REPLACE FUNCTION get_machine_id_by_pairing_code(pairing_code_param text)
RETURNS TABLE(machine_id text, machine_token text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if the pairing code has been used to create a machine
    SELECT m.machine_id, m.machine_token
    INTO machine_id, machine_token
    FROM machines m
    JOIN pending_machine_links pml ON m.link_id = pml.link_id
    WHERE pml.pairing_code = pairing_code_param
      AND pml.used_at IS NOT NULL
      AND m.is_active = true;
    
    -- Only return if we found a machine
    IF machine_id IS NOT NULL AND machine_token IS NOT NULL THEN
        RETURN NEXT;
    END IF;
END;
$$;
```

## Usage

1. Set up your Supabase project and create the required RPC functions
2. Configure your environment variables
3. Run the development server: `npm run dev`
4. The app will automatically show the pairing screen for unpaired machines

## Features

- ✅ Automatic pairing code generation
- ✅ QR code display for easy scanning
- ✅ 5-second polling for pairing status
- ✅ localStorage persistence of machine credentials
- ✅ Automatic redirect to product screen after pairing
- ✅ Reset functionality for debugging
- ✅ Fullscreen kiosk-optimized layout
- ✅ Error handling and retry logic
- ✅ Loading states and user feedback

## Component Structure

- `MachinePairingScreen`: Main pairing interface
- `ProductScreen`: Placeholder screen for paired machines
- `App.tsx`: Handles routing between screens

The component is designed to evolve into the permanent frontend UI once paired, with clean separation between pairing and product functionality. 