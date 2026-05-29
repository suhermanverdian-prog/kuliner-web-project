# KEN ERP — Master Implementation Plan
> **Kitchen Enterprise Nodes** | Multi-tenant SaaS | Last Updated: 2026-05-11

---

## ✅ FASE 1: SaaS Feature Flag System (SELESAI)

### Tujuan
Membangun fondasi multi-tenant SaaS yang aman, di mana setiap fitur terkunci per paket langganan secara konsisten di UI dan API.

### Komponen yang Diimplementasikan

| Komponen | File | Status |
|---|---|---|
| Tier Defaults (Lite/Pro/Enterprise) | `featureFlags.js` | ✅ |
| `hasFeature()` helper | `featureFlags.js` | ✅ |
| `PAGE_FEATURE_MAP` (sidebar gating) | `featureFlags.js` | ✅ `akuntansi` ditambahkan |
| `rbacMiddleware` (backend parity) | `server.js` | ✅ Diperkuat |
| Sidebar dengan feature-gated navigation | `Sidebar.jsx` | ✅ |
| Dashboard conditional fetching | `Dashboard.jsx` | ✅ |
| Safety patterns: `safeTables` | `MejaPage.jsx` | ✅ |
| Safety patterns: `safeBahan`, `safeLocations` | `InventoriPage.jsx` | ✅ |
| Safety patterns: `safeMenus` | `KasirPage.jsx` | ✅ |
| API Proxy resource normalization | `api.js` | ✅ Diperbaiki |

### Bug yang Diperbaiki di Fase 1 (Post-Review)
- `PAGE_FEATURE_MAP` hilang entry `akuntansi` → **Diperbaiki**
- `initDB()` tidak seed tabel akuntansi → **Diperbaiki**
- `rbacMiddleware` tidak proteksi `/accounts` dan `/purchase_payments` → **Diperbaiki**
- API 404: `getGRN`, `getPurchaseInvoices` → **Diperbaiki via resource normalization**

---

## ✅ FASE 2: Sistem Akuntansi Double-Entry (SELESAI)

### Tujuan
Mengimplementasikan pembukuan profesional berbasis double-entry dimana setiap transaksi bisnis menghasilkan jurnal akuntansi otomatis yang seimbang (BR-016).

### Chart of Accounts (10 Akun Standar)

| Kode | Nama Akun | Kategori | Saldo Normal |
|---|---|---|---|
| 1-1000 | Kas & Bank | Aset | Debit |
| 1-2000 | Persediaan Bahan Baku | Aset | Debit |
| 1-3000 | Piutang Usaha | Aset | Debit |
| 2-1000 | Hutang Dagang | Liabilitas | Kredit |
| 2-2000 | Hutang Pajak | Liabilitas | Kredit |
| 3-1000 | Modal Owner | Ekuitas | Kredit |
| 4-1000 | Pendapatan Penjualan | Pendapatan | Kredit |
| 5-1000 | Harga Pokok Penjualan | Beban | Debit |
| 6-1000 | Biaya Operasional | Beban | Debit |
| 6-2000 | Biaya Waste & Susut | Beban | Debit |

### Automated Journaling Triggers

| Event | Debit | Kredit |
|---|---|---|
| **Penjualan (Checkout)** | Kas & Bank | Pendapatan Penjualan |
| | Pendapatan (Diskon) | — |
| | HPP | Persediaan |
| | — | Hutang Pajak |
| **Penerimaan Barang (GRN)** | Persediaan Bahan Baku | Hutang Dagang |
| **Pembayaran Hutang** | Hutang Dagang | Kas & Bank |

### Komponen yang Diimplementasikan

| Komponen | File | Status |
|---|---|---|
| `createJournalLocal()` helper (BR-016) | `server.js` | ✅ |
| Auto journal penjualan + potong stok | `server.js` `/api/transactions` | ✅ |
| Auto journal GRN + update HPP cost | `server.js` `/api/postatus` | ✅ |
| Auto journal pembayaran hutang | `server.js` `/api/purchase_payments` | ✅ |
| `GET /api/accounts` — Chart of Accounts | `server.js` | ✅ |
| `GET /api/journals` — Buku Besar | `server.js` | ✅ |
| `GET /api/accounting/summary` — P&L + Neraca + Cash Flow | `server.js` | ✅ |
| `GET /api/accounting/export/excel` — Export Buku Besar | `server.js` | ✅ |
| `AkunPage.jsx` — UI lengkap (3 tab) | `AkunPage.jsx` | ✅ |
| Dashboard KPI Laba Bersih real-time | `Dashboard.jsx` | ✅ |
| Route akuntansi di App.jsx | `App.jsx` | ✅ |
| Menu Akuntansi di Sidebar (feature-gated) | `Sidebar.jsx` | ✅ |

### Fitur Laporan (AkunPage)
- 📊 **Ringkasan Keuangan**: P&L, Balance Sheet, Cash Flow + 4 KPI cards
- 📒 **Buku Besar**: Daftar jurnal dengan expand per-line, pencarian
- 🗂️ **Chart of Accounts**: Tampilan kategori & saldo normal
- 📥 **Export Excel**: Buku Besar + CoA (via ExcelJS)
- 🖨️ **Print**: Laporan keuangan print-ready

---

## ✅ FASE 3: Database Migration (SELESAI)

### Tujuan
Migrasi dari `data.json` ke PostgreSQL murni via Supabase untuk memastikan integritas data akuntansi dan skalabilitas produksi.

### Komponen yang Diimplementasikan

| Komponen | Status | Detail |
|---|---|---|
| Master SQL Schema | ✅ | `master_migration.sql` (UUID based) |
| Migration Tool | ✅ | `migrate_to_supabase.js` (v2.2 De-dupe) |
| Cloud-Ready Backend | ✅ | `DB_MODE` toggle & cloud logic |
| Tenant Isolation | ✅ | `tenant_id` enforced on all cloud queries |

### Cara Mengaktifkan
Set `DB_MODE=cloud` pada file `.env` di root dan folder backend.

---

## 🔜 FASE 4: Multi-Outlet Management (Sprint 3)

### Tujuan
Membangun HQ Dashboard untuk manajemen chain restoran/cafe dengan banyak cabang.

### Rencana
- [ ] `OutletPage.jsx` — daftar outlet + performance per cabang
- [ ] HQ Dashboard — agregasi data dari semua outlet
- [ ] Stock Transfer antar outlet
- [ ] Konsolidasi laporan keuangan lintas outlet

---

## 🔜 FASE 5: AI Insights (Sprint 4)

### Tujuan
Menambahkan kecerdasan buatan untuk rekomendasi bisnis dan prediksi operasional.

### Rencana
- [ ] Integrasi OpenAI/DeepSeek untuk chat analitik
- [ ] Prediksi kebutuhan stok berdasarkan pola penjualan
- [ ] Rekomendasi menu berdasarkan data historis
- [ ] Smart alert: stok menipis, laba turun, dll

---

## Arsitektur Sistem

```
┌─────────────────────────────────────────────────────┐
│                  KEN ERP Frontend                    │
│  React + Vite + TailwindCSS + Lucide Icons           │
│                                                      │
│  ┌─────────┐ ┌──────────┐ ┌──────────┐ ┌─────────┐ │
│  │ Operasi │ │ Supply   │ │Keuangan  │ │  Bisnis │ │
│  │ POS/KDS │ │ Chain    │ │& Akunts. │ │  & CRM  │ │
│  └─────────┘ └──────────┘ └──────────┘ └─────────┘ │
└────────────────────┬────────────────────────────────┘
                     │ REST API
┌────────────────────▼────────────────────────────────┐
│                 KEN Backend (Node.js/Express)         │
│                                                      │
│  rbacMiddleware → Feature Flag Guard                 │
│  createJournalLocal() → Double-Entry Accounting      │
│  data.json (cache) ←→ Supabase (primary)             │
└─────────────────────────────────────────────────────┘
```

---

## Tier & Fitur

| Fitur | Lite | Pro | Enterprise |
|---|:---:|:---:|:---:|
| POS, KDS, Meja | ✅ | ✅ | ✅ |
| Inventori, Shift | ✅ | ✅ | ✅ |
| Laporan PDF | ✅ | ✅ | ✅ |
| Resep/BOM, Waste | ❌ | ✅ | ✅ |
| Pengadaan (PO/GRN) | ❌ | ✅ | ✅ |
| Laporan Excel, CRM | ❌ | ✅ | ✅ |
| **Akuntansi (Double-Entry)** | ❌ | ❌ | ✅ |
| Multi-Outlet, HQ | ❌ | ❌ | ✅ |
| AI Insights | ❌ | ❌ | ✅ |
