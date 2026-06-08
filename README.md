# ☕ KEN COFFEE ROASTERS — Enterprise POS System

> **Full-Stack Coffee Shop Management System** built with React + Express + Supabase.
> Designed for scalable Multi-Tenant operations following Clean Architecture principles.

---

## 🏗️ Architecture Overview

```mermaid
graph TB
    subgraph Frontend["Frontend (React + Vite)"]
        UI["UI Components<br/>(Button, Card, Input)"]
        Pages["Pages<br/>(ShiftPage, POS, etc.)"]
        Hooks["React-Query Hooks<br/>(useShifts, useMutations)"]
        Store["Zustand Store<br/>(useShiftStore)"]
    end

    subgraph Backend["Backend (Express.js)"]
        Routes["Routes<br/>(shiftRoutes.js)"]
        Controllers["Controllers<br/>(shiftController.js)"]
        Services["Services<br/>(shiftService.js)"]
        Repos["Repositories<br/>(shiftRepository.js)"]
        ErrHandler["Global Error Handler<br/>(errorHandler.js + AppError)"]
    end

    subgraph Database["Database (Supabase / PostgreSQL)"]
        Tables["Tables<br/>(shifts, transactions, menu, users, outlets)"]
        RLS["Row Level Security<br/>(tenant_isolation policy)"]
        Views["Views<br/>(shift_summary)"]
    end

    Pages --> Hooks
    Pages --> Store
    Hooks --> Routes
    Routes --> Controllers
    Controllers --> Services
    Services --> Repos
    Repos --> Tables
    Tables --> RLS
    ErrHandler -.- Controllers
```

---

## 📂 Project Structure

```
Coffeeshop/
├── apps/
│   ├── saas-super-admin/         # SaaS control panel (React + Vite)
│   ├── pos-client/               # Cashier POS, KDS & offline Dexie DB
│   ├── customer-portal/          # Customer self-ordering portal (Vite)
│   └── merchant-office/          # Merchant ERP, accounting & back-office
│
├── packages/
│   └── ui-kit/                   # Shared CSS, assets & Tailwind designs
│
├── backend/                      # Express.js API Server (SaaS core backend)
│   └── src/
│       ├── routes/               # HTTP route definitions
│       ├── controllers/          # Request/response handling
│       ├── services/             # Business logic & validation
│       ├── repositories/         # Supabase data access layer
│       └── middleware/           # Auth, JWT, RLS
│
├── archive-frontend/             # Backup of the old monolith frontend
├── package.json                  # Root monorepo workspace settings
├── Mulai_Aplikasi.bat            # Windows interactive bootstrapper
└── vercel.json                   # Cloud hosting configuration
```

---

## 🛡️ Security Model

| Layer | Mechanism | Description |
|-------|-----------|-------------|
| **Database** | Row Level Security (RLS) | Every table enforces `tenant_id` isolation via PostgreSQL policies |
| **Backend** | JWT Token Validation | `tenant_id` extracted from JWT, passed through Controller → Service → Repository |
| **Backend** | AppError + Global Handler | Centralized error catching prevents information leakage |
| **Data** | Soft-Delete (`is_active`) | Financial records are never physically deleted |

---

## 🎨 Design System

- **Color Palette**: Zinc spectrum (base) + Amber (accent)
- **Grid System**: Strict 8px multiples
- **Typography**: Inter (labels) + JetBrains Mono (numbers/currency)
- **Dark Mode**: Full adaptive support with semantic CSS variables
- **Components**: Shared tailwind configuration in `packages/ui-kit`

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Supabase project (with schema applied)

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd Coffeeshop

# Install monorepo dependencies (from root)
npm install
```

### Running Locally

You can use the interactive bootstrapper on Windows:
```bash
# Launch interactive helper
./Mulai_Aplikasi.bat
```

Or run via npm workspaces:
```bash
# Start backend and Merchant Office
npm run dev

# Start backend and all applications concurrently
npm run dev:all
```

### Environment Variables

Create a `.env` file in the root directory and in each app:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
JWT_SECRET=your-jwt-secret
PORT=3000
```

---

## ✅ CI/CD Pipeline

GitHub Actions runs automatically on every push to `main` or `develop`:

1. **Lint** — ESLint checks for code quality
2. **Test** — Vitest runs all unit tests
3. **Build** — Vite production build validation

---

## 📋 License

Proprietary — KEN Enterprise © 2026
