# STOK OPNAME SYSTEM - REQUIREMENTS SPECIFICATION

**Project**: Coffeeshop POS - Stok Opname Module  
**Phase**: 1 - Core Foundation  
**Target Rating**: 6/10 (Phase 1)  
**Duration**: 2 weeks  

---

## 📋 FUNCTIONAL REQUIREMENTS

### FR-1: Session Management
- **FR-1.1**: User dapat membuat session stok opname baru
  - Input: Outlet, Tipe opname (full/cycle/spot_check)
  - Output: Session dengan nomor unik (OPNAME-OUTLET-YYYYMMDD-001)
  - Status: draft → in_progress → completed → approved/rejected

- **FR-1.2**: System otomatis fetch semua bahan aktif dengan stok sistem
  - Hanya bahan dengan status aktif
  - Include: ID, Nama, Unit, Stok Sistem, Harga

- **FR-1.3**: User dapat melihat progress opname
  - Total items, Items counted, Percentage complete

### FR-2: Item Counting
- **FR-2.1**: User input stok fisik per item
  - Real-time variance calculation (fisik - sistem)
  - Variance percentage calculation
  - Auto-categorization (normal jika < 5%)

- **FR-2.2**: Bulk input support
  - Barcode scanning (Phase 2)
  - Manual input dengan validation

- **FR-2.3**: Search & filter items
  - By name, category, variance status

### FR-3: Approval Workflow
- **FR-3.1**: 2-level approval process
  - Level 1: Preparer (completes counting)
  - Level 2: Approver (reviews & approves)

- **FR-3.2**: Rejection capability
  - Approver dapat reject dengan reason
  - Preparer dapat restart opname

- **FR-3.3**: Approval history & audit trail
  - Siapa approve, kapan, dengan comments

### FR-4: Variance Reporting
- **FR-4.1**: Variance summary
  - Total items, Variance count, Variance %
  - Breakdown by category

- **FR-4.2**: Variance details
  - Per-item variance dengan kategori
  - Sorted by variance amount

- **FR-4.3**: Export capability
  - PDF, Excel format

### FR-5: Accounting Integration
- **FR-5.1**: Auto-create adjustment journals
  - Positive variance: Dr. Inventory, Cr. Gain
  - Negative variance: Dr. Loss, Cr. Inventory

- **FR-5.2**: Update inventory stock
  - Reflect fisik count sebagai new stock

---

## 🎯 NON-FUNCTIONAL REQUIREMENTS

### NFR-1: Performance
- API response time: < 200ms
- Page load time: < 2s
- Support 10,000+ items per session

### NFR-2: Usability
- Intuitive UI dengan clear workflow
- Mobile-friendly (Phase 2)
- Responsive design

### NFR-3: Data Integrity
- Immutable audit trail
- Transaction support
- Constraint validation

### NFR-4: Security
- Role-based access control
- Permission guards
- Activity logging

---

## 📊 DATA MODEL

### opname_sessions
```
id (UUID)
tenant_id (UUID) - FK
outlet_id (UUID) - FK
session_number (VARCHAR) - UNIQUE
status (VARCHAR) - draft|in_progress|completed|approved|rejected
opname_type (VARCHAR) - full|cycle|spot_check
started_by (UUID) - FK users
started_at (TIMESTAMP)
completed_by (UUID) - FK users
completed_at (TIMESTAMP)
approved_by (UUID) - FK users
approved_at (TIMESTAMP)
rejection_reason (TEXT)
notes (TEXT)
total_items (INT)
items_counted (INT)
total_variance (NUMERIC)
created_at (TIMESTAMP)
updated_at (TIMESTAMP)
```

### opname_items
```
id (UUID)
tenant_id (UUID) - FK
opname_session_id (UUID) - FK
bahan_id (UUID) - FK
stock_sistem (NUMERIC)
stock_fisik (NUMERIC)
variance (NUMERIC)
variance_pct (NUMERIC)
variance_category (VARCHAR) - normal|damage|theft|error|shrinkage
notes (TEXT)
recorded_by (UUID) - FK users
recorded_at (TIMESTAMP)
created_at (TIMESTAMP)
updated_at (TIMESTAMP)
```

### opname_approvals
```
id (UUID)
tenant_id (UUID) - FK
opname_session_id (UUID) - FK
approval_level (INT) - 1|2
approved_by (UUID) - FK users
approved_at (TIMESTAMP)
status (VARCHAR) - approved|rejected
comments (TEXT)
created_at (TIMESTAMP)
```

---

## 🔄 WORKFLOWS

### Workflow 1: Complete Opname
1. User start opname → Create session + fetch items
2. User input stok fisik → Calculate variance
3. User complete opname → Create approval request
4. Approver review → Approve/Reject
5. If approved → Create journals + Update stock

### Workflow 2: Reject & Restart
1. Approver reject opname
2. Preparer notified
3. Preparer dapat restart (clear counts, keep session)

---

## 📱 UI COMPONENTS

### Pages
- **StokOpnamePage**: Main page dengan tabs
  - Tab 1: Active Opname (Form)
  - Tab 2: History (List)
  - Tab 3: Reports (Analysis)

### Components
- **OpnameForm**: Input form dengan table
- **ApprovalWorkflow**: Status timeline + approval form
- **VarianceReport**: Summary + breakdown
- **StartOpnameModal**: Session creation

---

## ✅ ACCEPTANCE CRITERIA

### AC-1: Session Creation
- [ ] User dapat create session dengan outlet & type
- [ ] Session number auto-generated dengan format benar
- [ ] Semua bahan aktif ter-fetch dengan stok sistem
- [ ] Session status = draft

### AC-2: Item Counting
- [ ] User dapat input stok fisik
- [ ] Variance auto-calculated (fisik - sistem)
- [ ] Variance % calculated
- [ ] Category auto-assigned (normal jika < 5%)
- [ ] Progress indicator updated

### AC-3: Completion & Approval
- [ ] User dapat complete opname
- [ ] Approval request created
- [ ] Approver dapat approve/reject
- [ ] Rejection reason captured
- [ ] Approval history recorded

### AC-4: Journal Creation
- [ ] Journals auto-created saat approval
- [ ] Correct accounts used (1-2000, 2-1000, etc)
- [ ] Amounts calculated correctly
- [ ] Inventory stock updated

### AC-5: Reporting
- [ ] Variance summary displayed
- [ ] Breakdown by category
- [ ] Export to PDF/Excel works
- [ ] Historical data accessible

---

## 🧪 TEST SCENARIOS

### TS-1: Happy Path
1. Create opname session
2. Input all items
3. Complete opname
4. Approve opname
5. Verify journals created
6. Verify stock updated

### TS-2: Partial Variance
1. Create opname
2. Input some items with variance
3. Complete & approve
4. Verify only variance items have journals

### TS-3: Rejection Flow
1. Create opname
2. Complete opname
3. Reject with reason
4. Restart opname
5. Verify counts cleared

### TS-4: Multi-outlet
1. Create opname di outlet A
2. Create opname di outlet B
3. Verify data isolated per outlet

---

## 📚 DEPENDENCIES

### Backend
- Express.js (routing)
- Supabase (database)
- Zod (validation)
- UUID (ID generation)

### Frontend
- React (UI)
- React Query (data fetching)
- Tailwind CSS (styling)
- React Table (data table)

---

## 🚀 DELIVERABLES

### Week 1: Backend
- [ ] Database migrations
- [ ] Repository layer
- [ ] Service layer
- [ ] Controller & routes
- [ ] Unit tests

### Week 2: Frontend
- [ ] Page structure
- [ ] Form component
- [ ] Approval workflow UI
- [ ] Variance report
- [ ] Integration & testing

---

## 📝 NOTES

- Gunakan pattern yang sama dengan procurement module
- Implement error handling & logging
- Add permission guards untuk setiap endpoint
- Maintain audit trail untuk compliance
