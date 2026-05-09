-- FASE 7: FULL ACCOUNTING & LEDGER

-- 1. Membuat Tabel Chart of Accounts (COA)
CREATE TABLE IF NOT EXISTS accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR NOT NULL UNIQUE,
    name VARCHAR NOT NULL,
    type VARCHAR NOT NULL, -- Asset, Liability, Equity, Revenue, Expense
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Memodifikasi tabel journal_lines untuk menggunakan account_id
-- (Penting untuk transisi dari string 'account_name' ke foreign key 'account_id')
-- Opsional: Jika tabel journal_lines sudah memiliki data, kita akan tambahkan kolom account_id nullable dulu.
ALTER TABLE journal_lines
ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES accounts(id);

-- 3. Injeksi Akun Default (Chart of Accounts Dasar untuk F&B)
INSERT INTO accounts (code, name, type) VALUES
('1-1000', 'Kas Tunai', 'Asset'),
('1-1010', 'Rekening Bank', 'Asset'),
('1-1020', 'QRIS Clearing', 'Asset'),
('1-1030', 'Debit/Credit Clearing', 'Asset'),
('1-2000', 'Inventory / Persediaan Bahan Baku', 'Asset'),
('2-1000', 'Accounts Payable / Hutang Usaha', 'Liability'),
('2-1010', 'Hutang Pajak (PPN)', 'Liability'),
('2-2000', 'GRNI (Goods Received Not Invoiced)', 'Liability'),
('3-1000', 'Modal Awal', 'Equity'),
('4-1000', 'Sales / Pendapatan Penjualan', 'Revenue'),
('4-1010', 'Pendapatan Jasa / Service Charge', 'Revenue'),
('5-1000', 'COGS / HPP (Harga Pokok Penjualan)', 'Expense'),
('5-2000', 'Beban Operasional / Waste', 'Expense')
ON CONFLICT (code) DO NOTHING;
