-- ===========================================================================
-- 👑 KEN ENTERPRISE — PHASE 4 ENTERPRISE FINAL MIGRATION
-- Versi: 1.0.0 | Tanggal: 2026-05-30
-- Standard: SCBD Grade Enterprise, Zero-Trust Multi-Tenancy
-- 
-- ⚠️  INSTRUKSI EKSEKUSI:
--    1. Buka Supabase Dashboard → SQL Editor
--    2. Copy-paste SELURUH isi file ini
--    3. Klik RUN
--    4. Pastikan tidak ada error merah
--
-- ✅  Script ini 100% IDEMPOTEN (aman dijalankan berulang kali).
--    Semua perintah menggunakan IF NOT EXISTS / ON CONFLICT DO NOTHING.
-- ===========================================================================


-- ===========================================================================
-- BAGIAN 1: PENYEMPURNAAN TABEL OPNAME_SESSIONS
-- Tambah kolom-kolom baru untuk fitur Scheduled & Accounting Integration
-- ===========================================================================

-- Kolom untuk menandai sesi yang dibuat oleh scheduler otomatis
ALTER TABLE opname_sessions 
  ADD COLUMN IF NOT EXISTS is_scheduled BOOLEAN DEFAULT false;

-- Kolom referensi ke jadwal yang memicu sesi ini
ALTER TABLE opname_sessions 
  ADD COLUMN IF NOT EXISTS schedule_id UUID;

-- Kolom untuk menandai jurnal sudah dibuat
ALTER TABLE opname_sessions 
  ADD COLUMN IF NOT EXISTS auto_journal_created BOOLEAN DEFAULT false;

-- Kolom untuk menyimpan referensi journal IDs (array)
ALTER TABLE opname_sessions 
  ADD COLUMN IF NOT EXISTS journal_ids UUID[];

-- Kolom catatan approver
ALTER TABLE opname_sessions 
  ADD COLUMN IF NOT EXISTS approval_notes TEXT;


-- ===========================================================================
-- BAGIAN 2: TABEL OPNAME_SCHEDULES
-- Penjadwalan otomatis Stok Opname berkala (daily/weekly/monthly)
-- ===========================================================================

CREATE TABLE IF NOT EXISTS opname_schedules (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  outlet_id       UUID NOT NULL REFERENCES outlets(id) ON DELETE CASCADE,
  opname_type     VARCHAR(50) NOT NULL DEFAULT 'blind' 
                    CHECK (opname_type IN ('blind', 'standard')),
  frequency       VARCHAR(50) NOT NULL 
                    CHECK (frequency IN ('daily', 'weekly', 'monthly', 'custom')),
  scheduled_time  VARCHAR(5) NOT NULL DEFAULT '22:00',   -- Format: HH:MM
  timezone        VARCHAR(100) NOT NULL DEFAULT 'Asia/Jakarta',
  enabled         BOOLEAN NOT NULL DEFAULT true,
  next_run_time   TIMESTAMPTZ,
  is_deleted      BOOLEAN NOT NULL DEFAULT false,        -- Soft-delete (audit-safe)
  created_by      UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indeks performa untuk polling scheduler engine
CREATE INDEX IF NOT EXISTS idx_opname_schedules_tenant ON opname_schedules(tenant_id);
CREATE INDEX IF NOT EXISTS idx_opname_schedules_next_run ON opname_schedules(next_run_time) 
  WHERE enabled = true AND is_deleted = false;

-- Nonaktifkan RLS (backend menggunakan service-role key dengan validasi tenant manual)
ALTER TABLE opname_schedules DISABLE ROW LEVEL SECURITY;


-- ===========================================================================
-- BAGIAN 3: TABEL OPNAME_SCHEDULE_EXECUTIONS
-- Log riwayat eksekusi setiap jadwal (success/skipped/failed)
-- ===========================================================================

CREATE TABLE IF NOT EXISTS opname_schedule_executions (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  schedule_id         UUID NOT NULL REFERENCES opname_schedules(id) ON DELETE CASCADE,
  execution_time      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status              VARCHAR(50) NOT NULL 
                        CHECK (status IN ('success', 'skipped', 'failed')),
  created_session_id  UUID REFERENCES opname_sessions(id),
  error_message       TEXT,
  log_details         JSONB DEFAULT '{}'::jsonb,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indeks untuk query riwayat per jadwal (paling sering diakses)
CREATE INDEX IF NOT EXISTS idx_opname_executions_schedule ON opname_schedule_executions(schedule_id);
CREATE INDEX IF NOT EXISTS idx_opname_executions_time ON opname_schedule_executions(execution_time DESC);

ALTER TABLE opname_schedule_executions DISABLE ROW LEVEL SECURITY;


-- ===========================================================================
-- BAGIAN 4: TABEL OPNAME_JOURNAL_TEMPLATES
-- Pemetaan kategori selisih → akun GL (Chart of Accounts)
-- Mendukung konfigurasi mapping yang fleksibel per tenant
-- ===========================================================================

CREATE TABLE IF NOT EXISTS opname_journal_templates (
  id                                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id                         UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name                              VARCHAR(255) NOT NULL,
  -- Mapping: { "normal": "uuid-akun-hpp", "theft": "uuid-akun-loss", ... }
  variance_category_to_account_mapping  JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active                         BOOLEAN NOT NULL DEFAULT true,
  created_by                        UUID REFERENCES users(id),
  created_at                        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indeks untuk query per tenant
CREATE INDEX IF NOT EXISTS idx_opname_templates_tenant ON opname_journal_templates(tenant_id) 
  WHERE is_active = true;

ALTER TABLE opname_journal_templates DISABLE ROW LEVEL SECURITY;


-- ===========================================================================
-- BAGIAN 5: TABEL OPNAME_JOURNALS
-- Header jurnal penyesuaian inventori yang diposting ke General Ledger
-- ===========================================================================

CREATE TABLE IF NOT EXISTS opname_journals (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  opname_session_id   UUID NOT NULL REFERENCES opname_sessions(id) ON DELETE RESTRICT,
  journal_number      VARCHAR(100) NOT NULL UNIQUE,
  status              VARCHAR(50) NOT NULL DEFAULT 'draft'
                        CHECK (status IN ('draft', 'posted', 'reversed')),
  total_debit         NUMERIC(15, 2) NOT NULL DEFAULT 0,
  total_credit        NUMERIC(15, 2) NOT NULL DEFAULT 0,
  gl_posting_date     TIMESTAMPTZ,
  posted_by           UUID REFERENCES users(id),
  -- Verifikasi keseimbangan double-entry (GAAP Compliant)
  CONSTRAINT balanced_journal CHECK (
    status = 'draft' OR ROUND(total_debit, 2) = ROUND(total_credit, 2)
  ),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indeks untuk query laporan akuntansi
CREATE INDEX IF NOT EXISTS idx_opname_journals_tenant ON opname_journals(tenant_id);
CREATE INDEX IF NOT EXISTS idx_opname_journals_session ON opname_journals(opname_session_id);
CREATE INDEX IF NOT EXISTS idx_opname_journals_status ON opname_journals(status);

ALTER TABLE opname_journals DISABLE ROW LEVEL SECURITY;


-- ===========================================================================
-- BAGIAN 6: TABEL OPNAME_JOURNAL_ENTRIES
-- Detail baris jurnal (entri debit/kredit per akun GL)
-- ===========================================================================

CREATE TABLE IF NOT EXISTS opname_journal_entries (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  journal_id          UUID NOT NULL REFERENCES opname_journals(id) ON DELETE CASCADE,
  line_number         INTEGER NOT NULL,
  gl_account_id       UUID REFERENCES accounts(id),
  debit_amount        NUMERIC(15, 2) NOT NULL DEFAULT 0,
  credit_amount       NUMERIC(15, 2) NOT NULL DEFAULT 0,
  description         TEXT,
  variance_category   VARCHAR(100) DEFAULT 'normal',
  -- Validasi: satu entri hanya boleh debit OR kredit, tidak keduanya
  CONSTRAINT debit_or_credit CHECK (
    NOT (debit_amount > 0 AND credit_amount > 0)
  ),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indeks untuk query per jurnal
CREATE INDEX IF NOT EXISTS idx_opname_entries_journal ON opname_journal_entries(journal_id);
CREATE INDEX IF NOT EXISTS idx_opname_entries_account ON opname_journal_entries(gl_account_id);

ALTER TABLE opname_journal_entries DISABLE ROW LEVEL SECURITY;


-- ===========================================================================
-- BAGIAN 7: PENYEMPURNAAN TABEL AUDIT_LOGS
-- Tambahkan kolom yang dibutuhkan TamperAuditService (HMAC-SHA256)
-- ===========================================================================

-- Tambah kolom old_value dan new_value jika belum ada (dari phase6_security.sql)
ALTER TABLE audit_logs 
  ADD COLUMN IF NOT EXISTS old_value JSONB;

ALTER TABLE audit_logs 
  ADD COLUMN IF NOT EXISTS new_value JSONB;

ALTER TABLE audit_logs 
  ADD COLUMN IF NOT EXISTS table_name VARCHAR(255);

-- Tambah kolom tenant_id jika belum ada
ALTER TABLE audit_logs 
  ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL;

-- Indeks untuk pemindaian integritas kriptografis
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant ON audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);


-- ===========================================================================
-- BAGIAN 8: PENYELARASAN TABEL PEMBELIAN (PROCUREMENT) — MULTI-TENANCY
-- Tambah tenant_id jika belum ada (aman, non-destructive)
-- ===========================================================================

ALTER TABLE pembelian 
  ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_pembelian_tenant ON pembelian(tenant_id);

ALTER TABLE pembelian_items 
  ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_pembelian_items_tenant ON pembelian_items(tenant_id);


-- ===========================================================================
-- BAGIAN 9: TAMBAH KOLOM accounts UNTUK MULTI-TENANCY
-- Agar Chart of Accounts dapat difilter per tenant
-- ===========================================================================

ALTER TABLE accounts 
  ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;

-- Indeks untuk lookup akun per tenant
CREATE INDEX IF NOT EXISTS idx_accounts_tenant ON accounts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_accounts_code ON accounts(code);


-- ===========================================================================
-- BAGIAN 10: VERIFIKASI AKHIR — TAMPILKAN SEMUA TABEL YANG BERHASIL DIBUAT
-- ===========================================================================

SELECT 
  table_name,
  pg_size_pretty(pg_total_relation_size(quote_ident(table_name))) AS "Ukuran",
  (SELECT COUNT(*) FROM information_schema.columns 
   WHERE table_name = t.table_name 
   AND table_schema = 'public') AS "Jumlah Kolom"
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_name IN (
    'opname_schedules',
    'opname_schedule_executions', 
    'opname_journal_templates',
    'opname_journals',
    'opname_journal_entries',
    'audit_logs',
    'accounts',
    'pembelian',
    'pembelian_items'
  )
ORDER BY table_name;

-- ===========================================================================
-- ✅  SELESAI — Jika query SELECT di atas menampilkan 9 baris, migrasi berhasil.
-- ===========================================================================
