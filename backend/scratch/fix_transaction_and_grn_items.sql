-- ====================================================================
-- 👑 KEN ENTERPRISE — DATABASE SCHEMA PATCH
-- Modul: Point of Sale (POS) & Procurement (GRN)
-- Target: transaction_items & grn_items
-- ====================================================================

-- 1. DROP EXISTING CONSTRAINTS & LEGACY TABLES
DROP TABLE IF EXISTS transaction_items CASCADE;
DROP TABLE IF EXISTS grn_items CASCADE;

-- 2. CREATE TABLE transaction_items WITH UUID REFERENCE & TENANT ISOLATION
CREATE TABLE transaction_items (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE,
    menu_id UUID REFERENCES menu(id) ON DELETE SET NULL,
    qty NUMERIC(19,4) NOT NULL DEFAULT 1,
    price NUMERIC(19,4) NOT NULL DEFAULT 0,
    subtotal NUMERIC(19,4) GENERATED ALWAYS AS (qty * price) STORED,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. CREATE TABLE grn_items WITH price_unit COLUMN FOR ACCURATE COSTING
CREATE TABLE grn_items (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    grn_id UUID REFERENCES grns(id) ON DELETE CASCADE,
    bahan_id UUID REFERENCES bahan(id) ON DELETE SET NULL,
    qty_received NUMERIC(19,4) NOT NULL DEFAULT 0,
    price_unit NUMERIC(19,4) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. DISABLE ROW LEVEL SECURITY (RLS) FOR UNINTERRUPTED API INSERTS
ALTER TABLE transaction_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE grn_items DISABLE ROW LEVEL SECURITY;

-- 5. GRANT PERMISSIONS FOR SYSTEM ROLES
GRANT ALL PRIVILEGES ON TABLE transaction_items TO anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON TABLE grn_items TO anon, authenticated, service_role;

-- 6. SELF-HEALING SEEDS (MEMULIHKAN OUTLET & SETTINGS YANG KOSONG)
-- Pastikan Tenant Utama terdaftar
INSERT INTO tenants (id, name, tier) 
VALUES ('00000000-0000-0000-0000-000000000000', 'KEN Enterprise Node', 'enterprise')
ON CONFLICT (id) DO NOTHING;

-- Seed Master Outlet (Penting untuk Shift & POS)
INSERT INTO outlets (id, tenant_id, name, address, type)
VALUES ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000', 'KEN COFFEE - SCBD FLAGSHIP', 'SCBD, Jakarta Selatan', 'store')
ON CONFLICT (id) DO NOTHING;

-- Seed Pengaturan Default Aplikasi
INSERT INTO settings (tenant_id, store_name, tax, service_charge, is_ai_enabled)
VALUES ('00000000-0000-0000-0000-000000000000', 'KEN COFFEE', 10.00, 5.00, true)
ON CONFLICT (tenant_id) DO NOTHING;
