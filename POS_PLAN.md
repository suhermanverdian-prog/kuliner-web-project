# 📋 Rencana Resolusi Sistem & Finalisasi Media Menu - KEN Enterprise
*Tanggal: 6 Juni 2026*
*Status: Selesai diimplementasikan*

Dokumen ini mencatat solusi dan penyesuaian arsitektural yang telah diimplementasikan untuk menjamin kedaulatan visual dan keandalan operasional sistem.

## 🛠️ Temuan Masalah & Tindakan Resolusi

### 1. Masalah Keamanan Peran Tamu (403 Forbidden)
- **Gejala:** Error `Gagal memuat bahan baku untuk BOM Error: Role guest tidak memiliki izin view untuk fitur inventory` saat modal kustomisasi dibuka oleh pelanggan mandiri (Guest).
- **Akar Masalah:** `ItemCustomizationModal.jsx` mencoba memanggil `api.getBahan()` untuk memuat modul BOM Modifiers. Pengguna bertipe `guest` tidak memiliki izin untuk membaca bahan baku di backend.
- **Resolusi Jangka Panjang:** 
  - Mengimplementasikan deteksi `isGuest` di `ItemCustomizationModal.jsx` menggunakan pencocokan path URL dan data peran dari local storage.
  - Melewati pemanggilan `api.getBahan()` dan inisialisasi BOM Checklist jika pengguna terdeteksi sebagai `guest`.
  - Halaman dan modal dijamin aman dan hanya meminta otorisasi database Supabase sesuai hak akses perannya.

### 2. Mismatch Ekstensi Gambar Menu (404 Not Found)
- **Gejala:** `/uploads/cafe_latte.webp:1 Failed to load resource: the server responded with a status of 404 ()`
- **Akar Masalah:** File di server fisik bertipe `.png` (misal: `cafe_latte.png`), sementara data menu di database Supabase mengarah ke format `.webp`. Selain itu, URL dari root `/uploads/...` tidak dialihkan ke prefix backend `/api/uploads/...`.
- **Resolusi Jangka Panjang:**
  - **Vercel CDN Routing:** Menambahkan aturan routing rewrite di `vercel.json` untuk meneruskan `/uploads/(.*)` langsung ke `/api/uploads/$1`.
  - **Smart Server-side Fallback (Express):** Mengimplementasikan middleware `/api/uploads/:filename` dinamis di `backend/src/server.js`. Rute ini secara pintar memeriksa keberadaan berkas gambar dengan urutan ekstensi yang paling cocok (`.png`, `.webp`, `.jpg`, `.jpeg`). Jika gambar diregistrasikan sebagai `.webp` namun hanya tersedia versi `.png`, server akan mengirimkan berkas `.png` tersebut secara transparan.

---
*Catatan ini dibuat di POS_PLAN.md sesuai batasan instruksi untuk tidak pernah memodifikasi Implementation_Plan.md, ARCHITECTURAL BLUEPRINT.md, dan task.md.*
