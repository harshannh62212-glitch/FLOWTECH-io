-- FlowTech Supabase Schema: Customer Profiles & Dispatch Bookings

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  default_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id TEXT UNIQUE NOT NULL,
  service_type TEXT NOT NULL,
  priority TEXT DEFAULT 'urgent',
  service_address TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  customer_name TEXT DEFAULT 'Guest Customer',
  customer_email TEXT DEFAULT 'guest@flowtech.io',
  user_id UUID,
  dispatch_origin TEXT DEFAULT '1231 Meadow Creek Dr',
  prep_time_mins INTEGER DEFAULT 4,
  drive_time_mins INTEGER DEFAULT 10,
  total_eta_mins INTEGER DEFAULT 14,
  estimated_price NUMERIC(10,2) NOT NULL,
  status TEXT DEFAULT 'dispatched',
  technician_name TEXT DEFAULT 'Alex Martinez',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS Security Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public select on bookings" ON public.bookings FOR SELECT USING (true);
CREATE POLICY "Allow public insert on bookings" ON public.bookings FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on bookings" ON public.bookings FOR UPDATE USING (true);

CREATE POLICY "Allow public select on profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Allow public insert on profiles" ON public.profiles FOR INSERT WITH CHECK (true);
