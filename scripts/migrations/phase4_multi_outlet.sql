-- KEN ERP PHASE 4: MULTI-OUTLET SYSTEM
-- Run this script in your Supabase SQL Editor.

-- 1. OUTLETS TABLE
CREATE TABLE IF NOT EXISTS outlets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR NOT NULL,
    address TEXT,
    phone VARCHAR,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. ADD outlet_id TO CORE TABLES
-- Transactions
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS outlet_id UUID REFERENCES outlets(id);

-- Inventory (Bahan)
ALTER TABLE bahan ADD COLUMN IF NOT EXISTS outlet_id UUID REFERENCES outlets(id);

-- Users (Membatasi user ke cabang tertentu)
ALTER TABLE users ADD COLUMN IF NOT EXISTS outlet_id UUID REFERENCES outlets(id);

-- Purchase Orders
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS outlet_id UUID REFERENCES outlets(id);

-- 3. DISABLE RLS FOR NOW
ALTER TABLE outlets DISABLE ROW LEVEL SECURITY;

-- 4. SEED A DEFAULT OUTLET (Optional)
-- Menghubungkan semua data lama ke satu outlet pusat jika belum ada
-- Ini akan dijalankan oleh script migrasi nanti.
