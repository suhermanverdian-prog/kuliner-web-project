# 👑 KEN ENTERPRISE UI - DESIGN SYSTEM (V5.0)

Dokumentasi ini adalah **Satu-satunya Sumber Kebenaran (Single Source of Truth - SSOT)** untuk standar UI/UX di proyek Coffeeshop ERP. Setiap *developer* atau desainer wajib mematuhi panduan ini.

## 1. 🎨 The Golden Contrast Rule & Palette
Kami menggunakan secara eksklusif **Zinc Spectrum** untuk latar belakang dan **Amber Spectrum** untuk aksen utama. **DILARANG KERAS MENGGUNAKAN HITAM PEKAT (#000000)**.

### Mode Terang (Light Mode)
- **Background Utama:** `bg-zinc-50` (`#fafafa`)
- **Card / Panel:** `bg-white` (`#ffffff`)
- **Teks Utama:** `text-zinc-900`
- **Primary Action (Tombol):** `bg-amber-500 text-white hover:bg-amber-600`

### Mode Gelap (Dark Mode)
- **Background Utama:** `dark:bg-zinc-900` (`#18181b`)
- **Card / Panel:** `dark:bg-zinc-800` (`#27272a`)
- **Teks Utama:** `dark:text-zinc-100`
- **Primary Action (Tombol):** `dark:bg-amber-400 dark:text-zinc-900 hover:bg-amber-500`

### Semantic Status (Wajib Adaptive)
- **Sukses:** `text-emerald-600 dark:text-emerald-400`
- **Gagal/Error:** `text-rose-600 dark:text-rose-400`
- **Info:** `text-sky-600 dark:text-sky-400`

---

## 2. 🛡️ Anti-Invisibility Law (Hukum ke-5)
Dilarang menggunakan `text-white` secara statis di atas elemen yang memiliki latar belakang dinamis (misalnya `bg-card`). 
✅ **Benar:** `className="text-zinc-900 dark:text-zinc-100"`
❌ **Salah:** `className="text-white"` (Teks ini akan hilang saat pengguna beralih ke Light Mode).

---

## 3. 📐 The 8px Grid Law
Semua ruang, ukuran, dan jarak (padding, margin, gap, height) harus mematuhi **kelipatan 8px**.
- **Kecil:** `p-2` (8px)
- **Standar:** `p-4` (16px) atau `gap-4`
- **Besar:** `p-6` (24px)
- **Ekstra Besar:** `p-8` (32px)

### Standar Border Radius
- **Kartu/Modal Besar:** `rounded-2xl` (16px)
- **Tombol/Input:** `rounded-lg` (8px)
* (Jangan pernah menggunakan `rounded-md` atau `rounded-xl`).*

---

## 4. 🧮 Tipografi Angka (Financial Precision)
Semua nominal uang, total tagihan, harga, kuantitas stok, ID resi, dan tanggal wajib menggunakan font *monospace* agar tabel/kolom rata lurus.
✅ **Aturan Kelas:** Selalu tambahkan `font-mono tabular-nums`.

---

## 5. 🧪 Visual Regression Testing
Konfigurasi `playwright.config.js` telah disiapkan untuk menguji responsivitas dan kebocoran kontras secara otomatis.
Untuk menjalankan tes visual (*Light & Dark* secara paralel):
```bash
npm install -D @playwright/test
npx playwright install --with-deps
npx playwright test
```

---

# KEN Ecosystem — Complete Global UI/UX Design System (Version 1.0)

## 1. DESIGN FOUNDATION

### 1.1 Brand Identity
- Enterprise‑grade
- Premium
- Elegant
- Stable
- Intelligent
- Modern
- Warm luxury
- Minimalist

### 1.2 Design Philosophy
- **Functional Luxury** – mewah tetapi tetap usable.
- **Enterprise Minimalism** – UI bersih dan profesional.
- **Information First** – informasi penting paling menonjol.
- **Fast Interaction** – semua workflow harus cepat.
- **One Ecosystem** – semua divisi terasa satu produk.

## 2. GLOBAL COLOR SYSTEM

### 2.1 Core Palette
#### Dark Mode
| Role | Tailwind | HEX |
|------|----------|-----|
| Background | zinc-950 | #09090B |
| Surface | zinc-900 | #18181B |
| Elevated | zinc-800 | #27272A |
| Border | zinc-700 | #3F3F46 |
| Text Primary | zinc-100 | #F4F4F5 |
| Text Secondary | zinc-400 | #A1A1AA |
| Text Muted | zinc-500 | #71717A |

#### Light Mode
| Role | Tailwind | HEX |
|------|----------|-----|
| Background | zinc-50 | #FAFAFA |
| Surface | white | #FFFFFF |
| Elevated | zinc-100 | #F4F4F5 |
| Border | zinc-200 | #E4E4E7 |
| Text Primary | zinc-900 | #18181B |
| Text Secondary | zinc-600 | #52525B |
| Text Muted | zinc-500 | #71717A |

### 2.2 Accent Palette
| Purpose | Tailwind | HEX |
|---------|----------|-----|
| Primary Gold | amber-600 | #D97706 |
| Soft Gold | amber-500 | #F59E0B |
| Hover Gold | amber-400 | #FBBF24 |
| Copper | orange-700 | #C2410C |
| Success | green-600 | #16A34A |
| Danger | red-600 | #DC2626 |
| Warning | yellow-600 | #CA8A04 |
| Info | blue-600 | #2563EB |

## 3. TYPOGRAPHY SYSTEM

### 3.1 Font Pairing (Standard Mutlak)
- **Serif** (branding, hero, menu, titles): **Playfair Display**
- **Sans Serif** (dashboard, tables, forms, navigation, buttons): **Inter**
- **Monospace** (numbers, IDs, currency, dates): **JetBrains Mono** (wajib dengan kelas `font-mono tabular-nums`)

### 3.2 Typography Scale
| Token | Size (px) | Weight |
|-------|-----------|--------|
| Display XL | 48 | Bold |
| Display | 40 | Bold |
| H1 | 32 | SemiBold |
| H2 | 28 | SemiBold |
| H3 | 24 | Medium |
| H4 | 20 | Medium |
| Body Large | 18 | Regular |
| Body | 16 | Regular |
| Small | 14 | Regular |
| Caption | 12 | Medium |

### 3.3 Typography Rules
- Headings: max 2 font‑weight levels, adequate spacing, avoid excessive uppercase.
- Body: line‑height 150‑170 %, max 2 text colors.
- Tables: minimum 14 px, numbers right‑aligned, use `tabular‑nums`.

## 4. SPACING SYSTEM

### 4.1 8pt Grid (multiples of 8 px)
| Token | Value (px) |
|-------|------------|
| 1 | 4 |
| 2 | 8 |
| 3 | 12 |
| 4 | 16 |
| 5 | 20 |
| 6 | 24 |
| 8 | 32 |
| 10 | 40 |
| 12 | 48 |
| 16 | 64 |

### 4.2 Layout Rules
- **Desktop**: Sidebar 260‑280 px, content padding 24‑32 px, max width 1440 px.
- **Tablet**: Padding 20 px.
- **Mobile**: Padding 16‑20 px.

## 5. RADIUS SYSTEM
| Usage | Radius (px) |
|-------|------------|
| Small | 10 |
| Medium | 14 |
| Large | 20 |
| XL | 24 |
| XXL | 28 |
| Pill | 9999 |

## 6. SHADOW SYSTEM
- **Light Mode**: Soft – `0 2px 8px rgba(0,0,0,0.06)`; Medium – `0 8px 24px rgba(0,0,0,0.08)`.
- **Dark Mode**: Soft – `0 2px 8px rgba(0,0,0,0.30)`; Medium – `0 8px 24px rgba(0,0,0,0.35)`.

## 7. GLOBAL COMPONENT RULES

### 7.1 Cards
- Radius: 24 px, Padding: 16‑24 px, Subtle border, low elevation, soft shadow.

### 7.2 Buttons
- **Primary**: `bg-amber-600 text-zinc-950` (height 48‑56 px, radius 16 px).
- **Secondary**: outline, amber border.
- **Ghost**: no border, subtle hover.
- Icons optional, hover subtle, loading state mandatory.

### 7.3 Input Fields
- Height 48 px, radius 14 px, 1 px border, `px-4` horizontal padding.
- States: default subtle border, focus amber outline, error red border, disabled muted surface.

### 7.4 Tables
- Row height 52‑64 px, header medium weight, padding 16 px.
- Desktop: sticky header, sortable, searchable.
- Mobile: horizontal scroll, card transform.

### 7.5 Modals
- Radius 28 px, max‑width 720 px, backdrop blur.

### 7.6 Bottom Sheet (Mobile only)
- Rounded top 28 px, draggable, snap heights, smooth animation.

## 8. NAVIGATION SYSTEM
- **Sidebar**: width 260‑280 px, active amber accent, hover subtle surface.
- **Topbar**: height 64‑72 px, search width 320‑420 px.
- **Bottom Navbar**: max 5 items, active amber, inactive muted.

## 9. MOTION SYSTEM
- Durations: Fast 150 ms, Normal 250 ms, Slow 350 ms.
- Animations: subtle, smooth, meaningful; no excessive bouncing.

## 10. DATA VISUALIZATION
- Charts: line, bar, donut, area.
- Max colors 4, subtle gridlines, clean tooltip, minimal legend.

## 11. RESPONSIVE SYSTEM
- Breakpoints: Mobile <640 px, Tablet 640‑1024 px, Desktop 1024‑1440 px, Wide >1440 px.
- Mobile: single column, sticky CTA, bottom sheet preferred.
- Tablet: adaptive grid, collapsible sidebar.
- Desktop: multi‑column, persistent sidebar.

## 12. ACCESSIBILITY RULES
- WCAG AA contrast minimum.
- Click area minimum 44 × 44 px.
- Keyboard navigation: tab, enter submit, esc close.

## 13. GLOBAL UX RULES
- DO: clear hierarchy, ample whitespace, reusable components, responsive‑first, loading states.
- DON'T: overcrowding, excessive colors, random icons, too many fonts, harsh shadows.

## 14. DIVISION‑SPECIFIC FOCUS
- **Customer App**: visual heavy, emotional, product‑first.
- **POS / Cashier**: speed, large touch targets, minimal steps.
- **Kitchen Display**: readability, urgency, status visibility.
- **Inventory**: dense data, table efficiency, scanning workflow.
- **Finance**: structured data, clean tables, chart clarity.
- **HR Management**: employee data, timeline, approval workflow.
- **CRM & Marketing**: engagement, campaign visibility, loyalty tracking.
- **Analytics**: chart priority, comparison, KPI visibility.

---

*All the above rules are now incorporated into the unified **KEN Enterprise Design System** and must be treated as absolute, immutable law for any future development.*
