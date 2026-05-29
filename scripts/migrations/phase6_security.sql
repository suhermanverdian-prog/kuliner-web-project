-- FASE 6: SECURITY, AUDIT & APPROVAL

-- 1. Modifikasi Tabel audit_logs (Menambahkan JSONB untuk rekam jejak presisi)
ALTER TABLE audit_logs 
ADD COLUMN IF NOT EXISTS old_value JSONB,
ADD COLUMN IF NOT EXISTS new_value JSONB,
ADD COLUMN IF NOT EXISTS table_name VARCHAR;

-- 2. Membuat Tabel role_permissions untuk RBAC
CREATE TABLE IF NOT EXISTS role_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role VARCHAR NOT NULL, -- owner, manager, kasir, koki, gudang
    feature_key VARCHAR NOT NULL, -- transactions, inventory, accounting, dsb
    can_view BOOLEAN DEFAULT false,
    can_create BOOLEAN DEFAULT false,
    can_edit BOOLEAN DEFAULT false,
    can_delete BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Injeksi Data Default Role Permissions
INSERT INTO role_permissions (role, feature_key, can_view, can_create, can_edit, can_delete) VALUES
-- OWNER: Akses Penuh
('owner', 'all_features', true, true, true, true),

-- MANAGER: Bisa Edit & Approve (Void, PO)
('manager', 'transactions', true, true, true, false),
('manager', 'inventory', true, true, true, false),
('manager', 'approvals', true, true, true, true),

-- KASIR: Hanya Operasional (Tidak bisa Hapus/Void sendiri)
('kasir', 'transactions', true, true, false, false),
('kasir', 'shift', true, true, false, false);
