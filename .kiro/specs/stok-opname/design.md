# STOK OPNAME SYSTEM - DESIGN SPECIFICATION

---

## 🏗️ ARCHITECTURE OVERVIEW

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                      │
│  ┌──────────────────────────────────────────────────┐   │
│  │  StokOpnamePage                                  │   │
│  │  ├── OpnameForm (Active Tab)                     │   │
│  │  ├── SessionHistory (History Tab)                │   │
│  │  └── VarianceReport (Reports Tab)                │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                          ↓ API Calls
┌─────────────────────────────────────────────────────────┐
│                    BACKEND (Express)                     │
│  ┌──────────────────────────────────────────────────┐   │
│  │  OpnameController                                │   │
│  │  ├── POST /api/opname/start                      │   │
│  │  ├── POST /api/opname/:id/items                  │   │
│  │  ├── POST /api/opname/:id/complete               │   │
│  │  ├── POST /api/opname/:id/approve                │   │
│  │  └── GET /api/opname/:id/report                  │   │
│  └──────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────┐   │
│  │  OpnameService (Business Logic)                  │   │
│  │  ├── startOpname()                               │   │
│  │  ├── recordCount()                               │   │
│  │  ├── completeOpname()                            │   │
│  │  ├── approveOpname()                             │   │
│  │  └── calculateVariance()                         │   │
│  └──────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────┐   │
│  │  OpnameRepository (Data Access)                  │   │
│  │  ├── CRUD operations                             │   │
│  │  └── Complex queries                             │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                          ↓ SQL
┌─────────────────────────────────────────────────────────┐
│                  DATABASE (Supabase)                     │
│  ├── opname_sessions                                    │
│  ├── opname_items                                       │
│  └── opname_approvals                                   │
└─────────────────────────────────────────────────────────┘
```

---

## 📊 DATABASE SCHEMA DESIGN

### Table: opname_sessions
**Purpose**: Track stok opname sessions

```sql
CREATE TABLE opname_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    outlet_id UUID NOT NULL REFERENCES outlets(id) ON DELETE CASCADE,
    session_number VARCHAR(50) NOT NULL UNIQUE,
    status VARCHAR(20) DEFAULT 'draft',
    opname_type VARCHAR(20) DEFAULT 'full',
    started_by UUID NOT NULL REFERENCES users(id),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_by UUID REFERENCES users(id),
    completed_at TIMESTAMP WITH TIME ZONE,
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    notes TEXT,
    total_items INT DEFAULT 0,
    items_counted INT DEFAULT 0,
    total_variance NUMERIC(19,4) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT valid_status CHECK (status IN ('draft', 'in_progress', 'completed', 'approved', 'rejected'))
);

CREATE INDEX idx_opname_sessions_tenant ON opname_sessions(tenant_id);
CREATE INDEX idx_opname_sessions_outlet ON opname_sessions(outlet_id);
CREATE INDEX idx_opname_sessions_status ON opname_sessions(status);
CREATE INDEX idx_opname_sessions_created ON opname_sessions(created_at DESC);
```

### Table: opname_items
**Purpose**: Track individual item counts

```sql
CREATE TABLE opname_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    opname_session_id UUID NOT NULL REFERENCES opname_sessions(id) ON DELETE CASCADE,
    bahan_id UUID NOT NULL REFERENCES bahan(id),
    stock_sistem NUMERIC(19,4) NOT NULL,
    stock_fisik NUMERIC(19,4),
    variance NUMERIC(19,4),
    variance_pct NUMERIC(5,2),
    variance_category VARCHAR(20),
    notes TEXT,
    recorded_by UUID REFERENCES users(id),
    recorded_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_opname_items_session ON opname_items(opname_session_id);
CREATE INDEX idx_opname_items_bahan ON opname_items(bahan_id);
CREATE INDEX idx_opname_items_variance ON opname_items(variance DESC);
```

### Table: opname_approvals
**Purpose**: Audit trail untuk approval workflow

```sql
CREATE TABLE opname_approvals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    opname_session_id UUID NOT NULL REFERENCES opname_sessions(id) ON DELETE CASCADE,
    approval_level INT NOT NULL,
    approved_by UUID NOT NULL REFERENCES users(id),
    approved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(20) NOT NULL,
    comments TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_opname_approvals_session ON opname_approvals(opname_session_id);
CREATE INDEX idx_opname_approvals_level ON opname_approvals(approval_level);
```

---

## 🔄 SERVICE LAYER DESIGN

### OpnameService Methods

```javascript
class OpnameService {
  // Session Lifecycle
  async startOpname(tenantId, outletId, userId, type = 'full')
  async recordCount(sessionId, itemId, fisikValue, userId, tenantId)
  async completeOpname(sessionId, userId, tenantId)
  async approveOpname(sessionId, userId, tenantId)
  async rejectOpname(sessionId, reason, userId, tenantId)
  
  // Variance Analysis
  async calculateVariance(sessionId, tenantId)
  async getVarianceReport(sessionId, tenantId)
  
  // Utilities
  async generateSessionNumber(outletId, tenantId)
  async categorizeVariance(variance, variancePct)
  async createAdjustmentJournals(sessionId, tenantId)
}
```

---

## 🎨 FRONTEND COMPONENT DESIGN

### Component Hierarchy

```
StokOpnamePage
├── Header
│   ├── Title
│   └── ActionButtons (Start, Export)
├── TabView
│   ├── Tab 1: Active Opname
│   │   └── OpnameForm
│   │       ├── SessionInfo
│   │       ├── ProgressBar
│   │       ├── SearchBar
│   │       ├── ItemsTable
│   │       │   ├── BahanName
│   │       │   ├── StokSistem
│   │       │   ├── StokFisik (Input)
│   │       │   ├── Variance (Calculated)
│   │       │   └── Category
│   │       └── ActionButtons (Complete, Save)
│   │
│   ├── Tab 2: History
│   │   └── SessionsList
│   │       ├── SessionCard
│   │       │   ├── SessionNumber
│   │       │   ├── Status
│   │       │   ├── Date
│   │       │   └── Actions (View, Approve)
│   │       └── Pagination
│   │
│   └── Tab 3: Reports
│       └── VarianceReport
│           ├── SummaryStats
│           ├── VarianceTable
│           ├── CategoryBreakdown
│           └── ExportButtons
│
└── Modals
    ├── StartOpnameModal
    ├── ApprovalModal
    └── ReportModal
```

---

## 📋 API ENDPOINT DESIGN

### Session Management

```
POST /api/opname/start
├── Input: { outletId, type, notes }
├── Output: { sessionId, sessionNumber, items[] }
└── Permissions: inventory_manager

GET /api/opname/sessions
├── Input: { outlet, status, dateRange }
├── Output: { sessions[], total, page }
└── Permissions: inventory_viewer

GET /api/opname/:sessionId
├── Output: { session, items[], approvals[] }
└── Permissions: inventory_viewer
```

### Item Recording

```
POST /api/opname/:sessionId/items
├── Input: { itemId, fisikValue, notes }
├── Output: { item, variance, category }
└── Permissions: inventory_manager

PUT /api/opname/:sessionId/items/:itemId
├── Input: { fisikValue, category, notes }
├── Output: { item }
└── Permissions: inventory_manager
```

### Workflow

```
POST /api/opname/:sessionId/complete
├── Input: { notes }
├── Output: { session, summary }
└── Permissions: inventory_manager

POST /api/opname/:sessionId/approve
├── Input: { comments }
├── Output: { session, journals[] }
└── Permissions: accounting_manager

POST /api/opname/:sessionId/reject
├── Input: { reason }
├── Output: { session }
└── Permissions: accounting_manager
```

### Reporting

```
GET /api/opname/:sessionId/report
├── Output: { summary, items[], breakdown }
└── Permissions: inventory_viewer

GET /api/opname/:sessionId/report/export
├── Input: { format: 'pdf'|'excel' }
├── Output: File download
└── Permissions: inventory_viewer
```

---

## 🔐 PERMISSION MODEL

### Roles & Permissions

| Role | Start | Record | Complete | Approve | View |
|------|-------|--------|----------|---------|------|
| Inventory Manager | ✓ | ✓ | ✓ | ✗ | ✓ |
| Accounting Manager | ✗ | ✗ | ✗ | ✓ | ✓ |
| Admin | ✓ | ✓ | ✓ | ✓ | ✓ |
| Viewer | ✗ | ✗ | ✗ | ✗ | ✓ |

---

## 🔄 STATE MANAGEMENT (Frontend)

### React Query Setup

```javascript
// Queries
useOpnameSession(sessionId)
useOpnameItems(sessionId)
useOpnameSessions(filters)
useVarianceReport(sessionId)

// Mutations
useStartOpname()
useRecordCount()
useCompleteOpname()
useApproveOpname()
useRejectOpname()
```

---

## 📱 UI/UX DESIGN PATTERNS

### Form Input Pattern
- Real-time validation
- Auto-focus next field
- Clear error messages
- Undo/Redo support

### Table Display Pattern
- Virtual scrolling (10,000+ items)
- Sortable columns
- Filterable rows
- Sticky header

### Status Timeline Pattern
- Visual progress indicator
- Timestamp display
- User information
- Action buttons

---

## 🧪 TESTING STRATEGY

### Unit Tests
- Service methods (variance calculation, categorization)
- Repository queries
- Validation logic

### Integration Tests
- API endpoints
- Database transactions
- Journal creation

### E2E Tests
- Complete opname workflow
- Approval workflow
- Rejection & restart

---

## 📊 ERROR HANDLING

### Error Types

| Error | Status | Message | Action |
|-------|--------|---------|--------|
| Session not found | 404 | Session tidak ditemukan | Redirect to list |
| Permission denied | 403 | Anda tidak memiliki akses | Show error |
| Validation error | 400 | Data tidak valid | Show field errors |
| Database error | 500 | Terjadi kesalahan | Retry or contact support |

---

## 🚀 DEPLOYMENT CONSIDERATIONS

### Database Migrations
- Run migrations in order
- Test rollback capability
- Backup before migration

### Feature Flags
- Enable/disable opname module
- Gradual rollout per outlet
- A/B testing support

### Monitoring
- Track API response times
- Monitor error rates
- Alert on failures

---

## 📝 IMPLEMENTATION NOTES

1. **Consistency**: Follow procurement module patterns
2. **Error Handling**: Comprehensive try-catch blocks
3. **Logging**: Log all state changes for audit
4. **Validation**: Validate at both frontend & backend
5. **Performance**: Use indexes for queries
6. **Security**: Implement permission guards
