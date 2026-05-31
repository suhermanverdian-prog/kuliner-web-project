-- ==========================================================================
-- 👑 KEN ENTERPRISE - SQL DATABASE MIGRATION SCRIPT v1.0
-- Kepatuhan Arsitektur Tingkat Nasional — SCBD Grade Enterprise Standard
-- 
-- 1. Penyelarasan skema tabel pengadaan (pembelian & pembelian_items) dengan tenant_id & RLS.
-- 2. Penerapan CHECK constraint untuk validasi status transisi opname.
-- ==========================================================================

-- --- Langkah 1: Penyelarasan Tabel pembelian & RLS ---
-- Tambahkan kolom tenant_id jika belum ada
ALTER TABLE pembelian 
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;

-- Tambahkan indeks pencarian berkinerja tinggi
CREATE INDEX IF NOT EXISTS idx_pembelian_tenant_id ON pembelian(tenant_id);

-- Aktifkan Row-Level Security (RLS) demi Complete Data Isolation
ALTER TABLE pembelian ENABLE ROW LEVEL SECURITY;

-- Buat Kebijakan RLS (Policy) untuk isolasi data aman
DROP POLICY IF EXISTS tenant_pembelian_isolation_policy ON pembelian;
CREATE POLICY tenant_pembelian_isolation_policy ON pembelian
    FOR ALL
    USING (tenant_id = auth.jwt() ->> 'tenant_id')
    WITH CHECK (tenant_id = auth.jwt() ->> 'tenant_id');


-- --- Langkah 2: Penyelarasan Tabel pembelian_items & RLS ---
-- Tambahkan kolom tenant_id jika belum ada
ALTER TABLE pembelian_items 
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;

-- Tambahkan indeks pencarian
CREATE INDEX IF NOT EXISTS idx_pembelian_items_tenant_id ON pembelian_items(tenant_id);

-- Aktifkan RLS
ALTER TABLE pembelian_items ENABLE ROW LEVEL SECURITY;

-- Buat Kebijakan RLS
DROP POLICY IF EXISTS tenant_pembelian_items_isolation_policy ON pembelian_items;
CREATE POLICY tenant_pembelian_items_isolation_policy ON pembelian_items
    FOR ALL
    USING (tenant_id = auth.jwt() ->> 'tenant_id')
    WITH CHECK (tenant_id = auth.jwt() ->> 'tenant_id');


-- --- Langkah 3: Penegakan CHECK Constraint untuk Transisi Status Opname ---
-- Hapus status 'active' yang tidak valid di skema enterprise design
-- Pastikan seluruh record terelasi diubah ke 'in_progress' terlebih dahulu
UPDATE opname_sessions 
SET status = 'in_progress' 
WHERE status = 'active';

-- Tambahkan CHECK constraint pada tabel opname_sessions
ALTER TABLE opname_sessions 
DROP CONSTRAINT IF EXISTS valid_status;

ALTER TABLE opname_sessions 
ADD CONSTRAINT valid_status 
CHECK (status IN ('draft', 'in_progress', 'completed', 'approved', 'rejected'));

-- --- SELESAI ---
