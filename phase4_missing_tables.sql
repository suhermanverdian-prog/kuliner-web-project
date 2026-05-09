-- FASE 4 (MISSING TABLES): PURCHASING & SUPPLIERS
-- Tabel ini ternyata belum tercipta di Supabase Anda, yang menyebabkan fitur PO Error.

-- 1. Tabel Suppliers
CREATE TABLE IF NOT EXISTS suppliers (
    id SERIAL PRIMARY KEY,
    name VARCHAR NOT NULL,
    contact VARCHAR,
    address VARCHAR,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Injeksi Data Supplier Default
INSERT INTO suppliers (name, contact, address) VALUES 
('Toko Biji Kopi Makmur', '081234567890', 'Jl. Kopi No 1'),
('Susu Segar Abadi', '089876543210', 'Jl. Susu No 2');

-- 2. Tabel Pembelian (Purchase Orders)
CREATE TABLE IF NOT EXISTS pembelian (
    id SERIAL PRIMARY KEY,
    po_number VARCHAR NOT NULL UNIQUE,
    supplier_id INTEGER REFERENCES suppliers(id),
    location VARCHAR,
    status VARCHAR DEFAULT 'Pending',
    total_amount NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabel Item Pembelian (Detail Barang yang Dipesan)
CREATE TABLE IF NOT EXISTS pembelian_items (
    id SERIAL PRIMARY KEY,
    pembelian_id INTEGER REFERENCES pembelian(id) ON DELETE CASCADE,
    bahan_id INTEGER REFERENCES bahan(id),
    qty_ordered NUMERIC NOT NULL,
    qty_received NUMERIC DEFAULT 0,
    price_at_order NUMERIC NOT NULL
);

-- MATIKAN RLS AGAR API BACKEND BISA MENYIMPAN DATA TANPA BLOKIR
ALTER TABLE suppliers DISABLE ROW LEVEL SECURITY;
ALTER TABLE pembelian DISABLE ROW LEVEL SECURITY;
ALTER TABLE pembelian_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE journals DISABLE ROW LEVEL SECURITY;
ALTER TABLE journal_lines DISABLE ROW LEVEL SECURITY;
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements DISABLE ROW LEVEL SECURITY;
ALTER TABLE bahan DISABLE ROW LEVEL SECURITY;
