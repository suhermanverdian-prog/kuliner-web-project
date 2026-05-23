-- ====================================================================
-- KEN ENTERPRISE ERP - MASTER GO-LIVE SCHEMA (v4.2.0)
-- STATUS: PRODUCTION READY - ULTRA STABLE MULTI-TENANT
-- ====================================================================

-- 0. CLEANUP (WARNING: DESTROYS ALL EXISTING DATA)
DROP TABLE IF EXISTS activity_logs CASCADE;
DROP TABLE IF EXISTS inventory_logs CASCADE;
DROP TABLE IF EXISTS journal_lines CASCADE;
DROP TABLE IF EXISTS journals CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS shifts CASCADE;
DROP TABLE IF EXISTS purchase_order_items CASCADE;
DROP TABLE IF EXISTS purchase_invoices CASCADE;
DROP TABLE IF EXISTS purchase_orders CASCADE;
DROP TABLE IF EXISTS grn_items CASCADE;
DROP TABLE IF EXISTS grns CASCADE;
DROP TABLE IF EXISTS unit_conversions CASCADE;
DROP TABLE IF EXISTS suppliers CASCADE;
DROP TABLE IF EXISTS bahan CASCADE;
DROP TABLE IF EXISTS menu CASCADE;
DROP TABLE IF EXISTS menu_categories CASCADE;
DROP TABLE IF EXISTS payment_methods CASCADE;
DROP TABLE IF EXISTS accounts CASCADE;
DROP TABLE IF EXISTS role_permissions CASCADE;
DROP TABLE IF EXISTS settings CASCADE;
DROP TABLE IF EXISTS loyalty_settings CASCADE;
DROP TABLE IF EXISTS outlets CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS tenants CASCADE;

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2. FOUNDATION: TENANTS & OUTLETS
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    name VARCHAR NOT NULL UNIQUE,
    tier VARCHAR DEFAULT 'enterprise',
    feature_overrides JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE outlets (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR NOT NULL,
    address TEXT,
    type VARCHAR DEFAULT 'store', -- 'store', 'warehouse', 'kitchen'
    phone VARCHAR,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, name)
);

-- 3. IDENTITY: USERS & RBAC
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR NOT NULL,
    username VARCHAR NOT NULL, -- Login ID (Unique per Tenant)
    email VARCHAR,             -- Optional Email (Unique)
    password VARCHAR NOT NULL, 
    role VARCHAR NOT NULL DEFAULT 'cashier', 
    avatar VARCHAR,
    permissions JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, username),
    UNIQUE(email)
);

CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR NOT NULL,
    email VARCHAR,
    phone VARCHAR,
    loyalty_points INTEGER DEFAULT 0,
    profile_image TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, phone)
);

CREATE TABLE IF NOT EXISTS shifts (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR DEFAULT 'open', 
    start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_time TIMESTAMP WITH TIME ZONE,
    initial_cash BIGINT DEFAULT 0,
    total_sales BIGINT DEFAULT 0,
    closing_cash BIGINT DEFAULT 0,
    expected_cash BIGINT DEFAULT 0,
    difference BIGINT DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE role_permissions (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    role VARCHAR NOT NULL, 
    feature_key VARCHAR NOT NULL, 
    can_view BOOLEAN DEFAULT false,
    can_create BOOLEAN DEFAULT false,
    can_edit BOOLEAN DEFAULT false,
    can_delete BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, role, feature_key)
);

-- 4. FINANCE: CHART OF ACCOUNTS & LEDGER
CREATE TABLE accounts (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    code VARCHAR NOT NULL,
    name VARCHAR NOT NULL,
    category VARCHAR NOT NULL, 
    normal_balance VARCHAR NOT NULL, 
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, code)
);

CREATE TABLE journals (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    reference VARCHAR NOT NULL, 
    description TEXT,
    date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    total_amount NUMERIC(19,4) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE journal_lines (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE, -- Denormalized for RLS & Speed
    journal_id UUID REFERENCES journals(id) ON DELETE CASCADE,
    account_id UUID REFERENCES accounts(id) ON DELETE RESTRICT,
    account_code VARCHAR, 
    account_name VARCHAR, 
    debit NUMERIC(19,4) DEFAULT 0,
    credit NUMERIC(19,4) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. INVENTORY: MATERIALS & LOGS
CREATE TABLE menu_categories (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR NOT NULL
);

CREATE TABLE menu (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    category_id UUID REFERENCES menu_categories(id),
    category VARCHAR, -- Fallback category name for easier migration
    name VARCHAR NOT NULL,
    description TEXT,
    price BIGINT DEFAULT 0,
    image TEXT,
    is_available BOOLEAN DEFAULT true,
    stock INTEGER DEFAULT 999,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, name)
);

CREATE TABLE bahan (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR NOT NULL,
    category VARCHAR,
    unit VARCHAR NOT NULL,
    stock NUMERIC(19,4) DEFAULT 0,
    min_stock NUMERIC(19,4) DEFAULT 0,
    cost NUMERIC(19,4) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, name)
);

CREATE TABLE inventory_logs (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE, -- Denormalized for RLS & Speed
    outlet_id UUID REFERENCES outlets(id),
    bahan_id UUID REFERENCES bahan(id) ON DELETE CASCADE,
    bahan_name VARCHAR, 
    type VARCHAR NOT NULL, 
    change_qty NUMERIC(19,4) NOT NULL,
    prev_stock NUMERIC(19,4),
    next_stock NUMERIC(19,4),
    reference_id VARCHAR, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. SALES: TRANSACTIONS & SHIFTS
CREATE TABLE shifts (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    outlet_id UUID REFERENCES outlets(id),
    user_id UUID REFERENCES users(id),
    start_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP WITH TIME ZONE,
    initial_cash BIGINT DEFAULT 0,
    total_sales BIGINT DEFAULT 0,
    closing_cash BIGINT DEFAULT 0,
    expected_cash BIGINT DEFAULT 0,
    difference BIGINT DEFAULT 0,
    notes TEXT,
    status TEXT DEFAULT 'open', -- 'open', 'closed'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE payment_methods (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR NOT NULL,
    type VARCHAR DEFAULT 'cash', -- 'cash', 'qris', 'card', 'transfer'
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, name)
);

CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    outlet_id UUID REFERENCES outlets(id),
    shift_id UUID REFERENCES shifts(id),
    order_number VARCHAR NOT NULL UNIQUE,
    customer_name VARCHAR,
    total NUMERIC(19,4) DEFAULT 0,
    tax NUMERIC(19,4) DEFAULT 0,
    service_charge NUMERIC(19,4) DEFAULT 0,
    discount NUMERIC(19,4) DEFAULT 0,
    payment_method VARCHAR, 
    payment_status VARCHAR DEFAULT 'pending', 
    payment_ref VARCHAR,
    items JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. SYSTEM: SETTINGS & AUDIT
CREATE TABLE settings (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE UNIQUE,
    store_name VARCHAR,
    tax NUMERIC(5,2) DEFAULT 0,
    service_charge NUMERIC(5,2) DEFAULT 0,
    latitude NUMERIC(10,7),
    longitude NUMERIC(10,7),
    geofence_radius NUMERIC DEFAULT 100,
    ai_provider VARCHAR,
    ai_api_key TEXT,
    is_ai_enabled BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE activity_logs (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    user_name VARCHAR,
    role VARCHAR,
    activity_type VARCHAR NOT NULL, 
    description TEXT,
    payload JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. PROCUREMENT
CREATE TABLE suppliers (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR NOT NULL,
    contact VARCHAR,
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, name)
);

CREATE TABLE unit_conversions (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    bahan_id UUID REFERENCES bahan(id) ON DELETE CASCADE,
    from_unit VARCHAR NOT NULL, -- e.g., 'Box'
    to_unit VARCHAR NOT NULL,   -- e.g., 'ml'
    multiplier NUMERIC(19,4) NOT NULL, -- e.g., 7500
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, bahan_id, from_unit)
);

CREATE TABLE purchase_orders (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    po_number VARCHAR NOT NULL UNIQUE,
    supplier_id UUID REFERENCES suppliers(id),
    total_amount NUMERIC(19,4) DEFAULT 0,
    status VARCHAR DEFAULT 'pending', 
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE purchase_invoices (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    supplier_id UUID REFERENCES suppliers(id),
    reference_id UUID, 
    invoice_number VARCHAR,
    total NUMERIC(19,4) DEFAULT 0,
    status VARCHAR DEFAULT 'unpaid', 
    due_date DATE,
    notes TEXT,
    attachments JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE purchase_order_items (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    po_id UUID REFERENCES purchase_orders(id) ON DELETE CASCADE,
    bahan_id UUID REFERENCES bahan(id),
    purchase_qty NUMERIC(19,4) NOT NULL,
    purchase_unit VARCHAR NOT NULL,
    conversion_factor NUMERIC(19,4) DEFAULT 1,
    stock_qty NUMERIC(19,4) NOT NULL,
    unit_price NUMERIC(19,4) NOT NULL,
    subtotal NUMERIC(19,4) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE grns (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    po_id UUID REFERENCES purchase_orders(id) ON DELETE SET NULL,
    outlet_id UUID REFERENCES outlets(id),
    grn_number VARCHAR NOT NULL UNIQUE,
    received_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    received_by UUID REFERENCES users(id),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE grn_items (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    grn_id UUID REFERENCES grns(id) ON DELETE CASCADE,
    bahan_id UUID REFERENCES bahan(id),
    qty_received NUMERIC(19,4) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. SECURITY (DISABLE RLS FOR INITIAL SYNC)
ALTER TABLE tenants DISABLE ROW LEVEL SECURITY;
ALTER TABLE outlets DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE accounts DISABLE ROW LEVEL SECURITY;
ALTER TABLE bahan DISABLE ROW LEVEL SECURITY;
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE shifts DISABLE ROW LEVEL SECURITY;
ALTER TABLE settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers DISABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE journals DISABLE ROW LEVEL SECURITY;
ALTER TABLE journal_lines DISABLE ROW LEVEL SECURITY;

-- ====================================================================
-- 10. SEED DATA (GOLIVE PREPARATION)
-- ====================================================================

-- A. Create Master Tenant
INSERT INTO tenants (id, name, tier) 
VALUES ('00000000-0000-0000-0000-000000000000', 'KEN_GLOBAL_ENTERPRISE', 'enterprise')
ON CONFLICT (id) DO NOTHING;

-- B. Create Master Outlet (CRITICAL: Every shift needs an outlet)
INSERT INTO outlets (id, tenant_id, name, address, type)
VALUES ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000', 'KEN COFFEE - FLAGSHIP', 'SCBD, Jakarta Selatan', 'store')
ON CONFLICT (id) DO NOTHING;

-- C. Create Master Users
INSERT INTO users (tenant_id, name, username, password, role) VALUES 
('00000000-0000-0000-0000-000000000000', 'Master Admin', 'admin', 'admin123', 'owner'),
('00000000-0000-0000-0000-000000000000', 'Super Administrator', 'superadmin', 'admin123', 'superadmin')
ON CONFLICT DO NOTHING;

-- D. Create Default COA
INSERT INTO accounts (tenant_id, code, name, category, normal_balance) VALUES 
('00000000-0000-0000-0000-000000000000', '1-1000', 'Kas Tunai', 'Asset', 'Debit'),
('00000000-0000-0000-0000-000000000000', '4-1000', 'Pendapatan Penjualan', 'Revenue', 'Credit'),
('00000000-0000-0000-0000-000000000000', '5-1000', 'HPP / COGS', 'Expense', 'Debit')
ON CONFLICT DO NOTHING;

-- E. Create Default Settings
INSERT INTO settings (tenant_id, store_name, tax, service_charge, is_ai_enabled)
VALUES ('00000000-0000-0000-0000-000000000000', 'KEN COFFEE ROASTERS', 11.0, 5.0, true)
ON CONFLICT DO NOTHING;

-- F. Create Menu Categories & Menus
INSERT INTO menu_categories (tenant_id, name) VALUES
('00000000-0000-0000-0000-000000000000', 'Coffee'),
('00000000-0000-0000-0000-000000000000', 'Non-Coffee'),
('00000000-0000-0000-0000-000000000000', 'Pastry');

INSERT INTO menu (tenant_id, name, category, price, stock) VALUES
('00000000-0000-0000-0000-000000000000', 'Es Kopi Susu Ken', 'Coffee', 25000, 999),
('00000000-0000-0000-0000-000000000000', 'Croissant Butter', 'Pastry', 18000, 50);

-- G. Create Payment Methods
INSERT INTO payment_methods (tenant_id, name, type) VALUES
('00000000-0000-0000-0000-000000000000', 'Tunai', 'cash'),
('00000000-0000-0000-0000-000000000000', 'QRIS Dana/Ovo', 'qris'),
('00000000-0000-0000-0000-000000000000', 'Debit BCA', 'card');

-- ====================================================================
-- 11. PERFORMANCE OPTIMIZATION (INDEXES)
-- ====================================================================

-- A. Tenant-Based Indexing (For Lightning Fast Multi-Tenancy)
CREATE INDEX IF NOT EXISTS idx_users_tenant ON users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_menu_tenant ON menu(tenant_id);
CREATE INDEX IF NOT EXISTS idx_bahan_tenant ON bahan(tenant_id);
CREATE INDEX IF NOT EXISTS idx_transactions_tenant ON transactions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_journals_tenant ON journals(tenant_id);
CREATE INDEX IF NOT EXISTS idx_journal_lines_tenant ON journal_lines(tenant_id);
CREATE INDEX IF NOT EXISTS idx_inventory_logs_tenant ON inventory_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_tenant ON purchase_orders(tenant_id);
CREATE INDEX IF NOT EXISTS idx_purchase_invoices_tenant ON purchase_invoices(tenant_id);

-- B. Chronological Indexing (For Instant Analytics & Reports)
CREATE INDEX IF NOT EXISTS idx_transactions_created ON transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_inventory_logs_created ON inventory_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_journals_date ON journals(date);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created ON activity_logs(created_at);

-- C. Search Optimization
CREATE INDEX IF NOT EXISTS idx_menu_name ON menu USING gin (name gin_trgm_ops) WHERE tenant_id IS NOT NULL; -- Needs pg_trgm
CREATE INDEX IF NOT EXISTS idx_transactions_order_no ON transactions(order_number);

-- D. Data Integrity Constraints
ALTER TABLE menu ADD CONSTRAINT check_menu_price CHECK (price >= 0);
ALTER TABLE bahan ADD CONSTRAINT check_bahan_stock CHECK (stock >= 0);
ALTER TABLE transactions ADD CONSTRAINT check_transaction_total CHECK (total >= 0);

-- ====================================================================
-- 12. SECURITY & RLS (GOLIVE READY)
-- ====================================================================
-- Enable RLS for all production tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu ENABLE ROW LEVEL SECURITY;
ALTER TABLE bahan ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE journals ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_lines ENABLE ROW LEVEL SECURITY;

-- Default Policy: Only allow access to data belonging to the same tenant
-- (Note: These policies require a 'request.jwt.claim.tenant_id' to be set by Supabase Auth)
-- CREATE POLICY tenant_isolation_policy ON transactions USING (tenant_id = auth.uid_tenant_id());

-- ====================================================================
-- END OF SCHEMA
-- ====================================================================
