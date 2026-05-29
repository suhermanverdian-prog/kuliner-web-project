-- KEN ERP MASTER MIGRATION SCRIPT (FIXED v2)
-- FASE 3: FULL SUPABASE INTEGRATION
-- Run this script in your Supabase SQL Editor.

-- 0. CLEANUP
DROP TABLE IF EXISTS journal_lines CASCADE;
DROP TABLE IF EXISTS journals CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS bahan CASCADE;
DROP TABLE IF EXISTS purchase_orders CASCADE;
DROP TABLE IF EXISTS grns CASCADE;
DROP TABLE IF EXISTS purchase_invoices CASCADE;
DROP TABLE IF EXISTS purchase_payments CASCADE;
DROP TABLE IF EXISTS accounts CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS tenants CASCADE;

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TENANTS TABLE
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR NOT NULL UNIQUE, -- Menambahkan UNIQUE untuk pendeteksian Upsert
    tier VARCHAR DEFAULT 'lite',
    feature_overrides JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. USERS TABLE
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR NOT NULL,
    username VARCHAR NOT NULL,
    password VARCHAR NOT NULL,
    role VARCHAR NOT NULL,
    avatar VARCHAR,
    permissions JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, username)
);

-- 4. ACCOUNTS (Chart of Accounts)
CREATE TABLE accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    code VARCHAR NOT NULL,
    name VARCHAR NOT NULL,
    category VARCHAR NOT NULL,
    normal_balance VARCHAR NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, code)
);

-- 5. INVENTORY (Bahan Baku)
CREATE TABLE bahan (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR NOT NULL,
    category VARCHAR,
    unit VARCHAR,
    stock NUMERIC DEFAULT 0,
    min_stock NUMERIC DEFAULT 0,
    cost NUMERIC DEFAULT 0,
    location VARCHAR,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, name) -- Agar script migrasi tidak duplikasi data
);

-- 6. TRANSACTIONS
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    order_number VARCHAR NOT NULL UNIQUE, -- Harus UNIQUE untuk Upsert
    customer_name VARCHAR,
    total NUMERIC DEFAULT 0,
    tax NUMERIC DEFAULT 0,
    service_charge NUMERIC DEFAULT 0,
    discount NUMERIC DEFAULT 0,
    payment_method VARCHAR,
    payment_status VARCHAR DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. JOURNALS (General Ledger)
CREATE TABLE journals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    reference VARCHAR NOT NULL,
    description TEXT,
    date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    total_debit NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE journal_lines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    journal_id UUID REFERENCES journals(id) ON DELETE CASCADE,
    account_code VARCHAR NOT NULL,
    account_name VARCHAR NOT NULL,
    debit NUMERIC DEFAULT 0,
    credit NUMERIC DEFAULT 0,
    date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. PROCUREMENT
CREATE TABLE purchase_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    po_number VARCHAR NOT NULL UNIQUE,
    supplier_name VARCHAR,
    total_amount NUMERIC DEFAULT 0,
    status VARCHAR DEFAULT 'Pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE grns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    po_id UUID REFERENCES purchase_orders(id),
    po_number VARCHAR,
    items JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. MATIKAN RLS UNTUK DEVELOPMENT
ALTER TABLE tenants DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE accounts DISABLE ROW LEVEL SECURITY;
ALTER TABLE bahan DISABLE ROW LEVEL SECURITY;
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE journals DISABLE ROW LEVEL SECURITY;
ALTER TABLE journal_lines DISABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE grns DISABLE ROW LEVEL SECURITY;
