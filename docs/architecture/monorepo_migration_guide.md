# 📦 PANDUAN MIGRASI MONOREPO & CLEANUP - KEN ENTERPRISE
> **Arsitektur Monorepo Terpadu dengan Isolasi Aplikasi & Shared UI Kit**

---

## 🏛️ 1. STRUKTUR WORKSPACE BARU

Repository ini kini menggunakan sistem **NPM Workspaces** untuk mengelola seluruh ekosistem aplikasi KEN Enterprise secara monorepo:

```
/Coffeeshop                          ← Root Workspace
├── /apps
│   ├── /saas-super-admin            ← Portal Super Admin (Vite + React)
│   ├── /pos-client                  ← Aplikasi Kasir POS & KDS (Vite PWA)
│   ├── /customer-portal             ← Portal Self-Order QR (Vite + React)
│   └── /merchant-office             ← Dashboard Back-Office ERP (Vite + React)
├── /packages
│   └── /ui-kit                      ← Shared Tailwind tokens & utility
├── /api                             ← Vercel Serverless Entry Point (JANGAN DIHAPUS)
│   └── server.js                    ← Menjembatani request routing /api/* ke /backend
├── /backend                         ← Core API Server (Express + Supabase)
├── /docs                            ← Dokumentasi Arsitektur
│   └── /architecture
│       ├── architecture_blueprint.md
│       └── monorepo_migration_guide.md  ← (Dokumen ini)
└── package.json                     ← Konfigurasi Workspaces & Scripts Root
```

---

## ⚙️ 2. PERAN DARI FOLDER `/api` DI ROOT

Folder `/api` beserta file `/api/server.js` adalah **Vercel Serverless Entry Point**. 
*   **Kenapa wajib ada?** Konfigurasi deployment Vercel pada `vercel.json` mengarahkan rute `/api/(.*)` ke `api/server.js`.
*   **Fungsi:** Menjadi jembatan (proxy serverless) yang melakukan `require('../backend/src/server.js')` untuk mengaktifkan seluruh API Endpoint backend ketika dideploy ke Vercel tanpa perlu setup server terpisah.
*   **Catatan Penting:** Menghapus atau memindahkan folder ini akan memutus koneksi API lokal (pada `vercel dev`) dan menyebabkan error `net::ERR_CONNECTION_REFUSED` karena Vercel Dev server gagal memetakan rute API.

---

## 🛠️ 3. SINKRONISASI & VERIFIKASI FLOW SHIFT (BUG SOLVED)

Alur manajemen kasir shift end-to-end telah diperbaiki dan diverifikasi:
1.  **Pembukaan Shift (`POST /api/shifts`):** Validasi modal awal (`openCash`) dan `userId` dalam bentuk UUID yang valid.
2.  **Transaksi Penjualan:** Penambahan order melalui POS yang terafiliasi dengan `shift_id` aktif.
3.  **Penutupan Shift (`POST /api/shifts/:id/close`):**
    *   Mengagregasikan penjualan tunai, QRIS, dan debit secara otomatis sejak shift dibuka.
    *   Menghitung `expected_cash` = `initial_cash` + `currentCash`.
    *   Menghitung `difference` (selisih laci kasir).
    *   Menyimpan record ke database Supabase dan mengubah status shift menjadi `closed`.

### Status Pengujian (E2E Test)
Pengujian otomatis berhasil dilakukan menggunakan `node scripts/tests/test_shift_e2e.js`:
```bash
🏁 starting E2E SHIFT TEST (Open -> Transaction -> Close) 🏁
  ✅ Shift baru berhasil dibuka (Modal: Rp 100.000)
  ✅ Transaksi penjualan berhasil dibuat & dikonfirmasi (Rp 75.000)
  ✅ Shift berhasil ditutup (Laci: Rp 182.500, Selisih: Rp 0)
🎉 E2E Shift Test BERHASIL dengan Sempurna!
```

---

## 🗑️ 4. ANALISIS BERKAS USANG (`migrate.js`)

File `migrate.js` yang sebelumnya berada di root project **tidak lagi diperlukan** karena:
1.  Merujuk ke path monolith lama (`frontend/public/uploads`) yang saat ini sudah diarsipkan ke `_archive/`.
2.  Inisialisasi schema database produksi dan data awal (seeding) kini sepenuhnya dikelola oleh berkas SQL terstruktur di [MASTER_GO_LIVE_SCHEMA.sql](file:///c:/Users/HENI/Downloads/Pelatihan/apk/Coffeeshop/scripts/migrations/MASTER_GO_LIVE_SCHEMA.sql).
3.  `migrate.js` telah berhasil dipindahkan ke folder `_archive` di luar repositori utama dengan aman.
