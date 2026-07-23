-- FlowTech Supabase PostgreSQL Database Schema
-- Dispatch Hub Origin: 1231 Meadow Creek Dr

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TECHNICIANS TABLE
CREATE TABLE IF NOT EXISTS technicians (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    badge_number VARCHAR(20) UNIQUE NOT NULL,
    status VARCHAR(30) DEFAULT 'available', -- 'available', 'en_route', 'on_site', 'off_duty'
    rating NUMERIC(3,2) DEFAULT 4.95,
    current_lat NUMERIC(10,6) DEFAULT 32.8831, -- Coordinates near Meadow Creek Dr
    current_lng NUMERIC(10,6) DEFAULT -96.9712,
    base_location VARCHAR(255) DEFAULT '1231 Meadow Creek Dr',
    prep_time_minutes INT DEFAULT 4,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. BOOKINGS TABLE
CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id VARCHAR(20) UNIQUE NOT NULL,
    service_type VARCHAR(100) NOT NULL,
    priority VARCHAR(20) DEFAULT 'urgent',
    service_address VARCHAR(255) NOT NULL,
    contact_phone VARCHAR(30) NOT NULL,
    dispatch_origin VARCHAR(255) DEFAULT '1231 Meadow Creek Dr',
    prep_time_mins INT DEFAULT 4,
    drive_time_mins INT NOT NULL,
    total_eta_mins INT NOT NULL,
    estimated_price NUMERIC(10,2) NOT NULL,
    status VARCHAR(30) DEFAULT 'dispatched',
    technician_id UUID REFERENCES technicians(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. DISPATCH LOGS TABLE
CREATE TABLE IF NOT EXISTS dispatch_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID REFERENCES bookings(id),
    log_message TEXT NOT NULL,
    telemetry_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed Initial Technicians located at/near 1231 Meadow Creek Dr Hub
INSERT INTO technicians (name, badge_number, status, rating, current_lat, current_lng, base_location, prep_time_minutes)
VALUES 
    ('Alex Martinez', 'FLW-4092', 'en_route', 4.98, 32.8850, -96.9730, '1231 Meadow Creek Dr', 4),
    ('David Kim', 'FLW-3108', 'available', 4.92, 32.8810, -96.9680, '1231 Meadow Creek Dr', 5),
    ('Sarah Jenkins', 'FLW-5501', 'available', 4.96, 32.8890, -96.9750, '1231 Meadow Creek Dr', 3)
ON CONFLICT (badge_number) DO NOTHING;
