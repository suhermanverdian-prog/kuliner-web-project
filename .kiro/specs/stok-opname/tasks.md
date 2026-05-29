# STOK OPNAME SYSTEM - TASK BREAKDOWN

**Phase**: 1 - Core Foundation  
**Duration**: 2 weeks  
**Target Rating**: 6/10  

---

## WEEK 1: BACKEND FOUNDATION

### Task 1.1: Database Schema & Migrations
**Status**: `todo`  
**Effort**: 4 hours  
**Owner**: Backend Developer  

**Description**:
Create database schema untuk stok opname dengan 3 main tables:
- opname_sessions
- opname_items
- opname_approvals

**Acceptance Criteria**:
- [ ] Migration file created: `001_create_opname_tables.sql`
- [ ] All tables created dengan constraints
- [ ] Indexes created untuk performance
- [ ] Migration up/down tested
- [ ] Schema documented

**Dependencies**: None

**Notes**:
- Gunakan UUID untuk primary keys
- Add tenant_id untuk multi-tenancy
- Add timestamps untuk audit trail

---

### Task 1.2: OpnameRepository Layer
**Status**: `todo`  
**Effort**: 6 hours  
**Owner**: Backend Developer  

**Description**:
Implement repository layer untuk data access operations.

**Methods to Implement**:
```javascript
// Session Management
createSession(tenantId, outletId, data)
getSessionById(sessionId, tenantId)
getSessionsByOutlet(outletId, tenantId, filters)
updateSessionStatus(sessionId, status, tenantId)
finalizeSession(sessionId, completedBy, tenantId)

// Item Management
addItemsToSession(sessionId, items, tenantId)
recordItemCount(itemId, fisikValue, recordedBy, tenantId)
getSessionItems(sessionId, tenantId)
updateItemVariance(itemId, variance, category, tenantId)

// Approval Workflow
createApproval(sessionId, level, approvedBy, status, tenantId)
getApprovalHistory(sessionId, tenantId)
rejectSession(sessionId, reason, rejectedBy, tenantId)

// Reporting
getVarianceReport(sessionId, tenantId)
getVarianceSummary(outletId, dateRange, tenantId)
```

**Acceptance Criteria**:
- [ ] File created: `backend/src/repositories/opnameRepository.js`
- [ ] All CRUD operations implemented
- [ ] Error handling added
- [ ] Transaction support added
- [ ] Logging added
- [ ] Unit tests written (80%+ coverage)

**Dependencies**: Task 1.1

**Notes**:
- Follow procurement repository pattern
- Use Supabase client
- Add proper error handling

---

### Task 1.3: OpnameService Layer
**Status**: `todo`  
**Effort**: 8 hours  
**Owner**: Backend Developer  

**Description**:
Implement service layer dengan business logic untuk stok opname.

**Core Methods**:
```javascript
// Session Lifecycle
startOpname(tenantId, outletId, userId, type)
recordCount(sessionId, itemId, fisikValue, userId, tenantId)
completeOpname(sessionId, userId, tenantId)
approveOpname(sessionId, userId, tenantId)
rejectOpname(sessionId, reason, userId, tenantId)

// Variance Analysis
calculateVariance(sessionId, tenantId)
getVarianceReport(sessionId, tenantId)

// Utilities
generateSessionNumber(outletId, tenantId)
categorizeVariance(variance, variancePct)
createAdjustmentJournals(sessionId, tenantId)
```

**Acceptance Criteria**:
- [ ] File created: `backend/src/services/opnameService.js`
- [ ] All service methods implemented
- [ ] Business logic validation added
- [ ] Error handling comprehensive
- [ ] Logging for audit trail
- [ ] Integration tests written (70%+ coverage)

**Dependencies**: Task 1.2

**Notes**:
- Implement variance calculation logic
- Auto-categorize variance (< 5% = normal)
- Create journals saat approval
- Update inventory stock

---

### Task 1.4: OpnameController & Routes
**Status**: `todo`  
**Effort**: 6 hours  
**Owner**: Backend Developer  

**Description**:
Implement controller layer dan API routes untuk stok opname.

**API Endpoints**:
```
POST   /api/opname/start              - Start new session
GET    /api/opname/sessions           - List sessions
GET    /api/opname/:sessionId         - Get session details
POST   /api/opname/:sessionId/items   - Record item count
POST   /api/opname/:sessionId/complete - Complete opname
POST   /api/opname/:sessionId/approve  - Approve opname
POST   /api/opname/:sessionId/reject   - Reject opname
GET    /api/opname/:sessionId/report   - Get variance report
GET    /api/opname/outlet/:outletId/summary - Get outlet summary
```

**Acceptance Criteria**:
- [ ] File created: `backend/src/controllers/opnameController.js`
- [ ] Routes file created: `backend/src/routes/opnameRoutes.js`
- [ ] All endpoints implemented
- [ ] Zod validation schemas added
- [ ] Permission guards added
- [ ] Error handling comprehensive
- [ ] Request/response logging added

**Dependencies**: Task 1.3

**Notes**:
- Add to server.js routes
- Use requireFeature guard
- Implement proper error responses

---

### Task 1.5: Backend Testing & Documentation
**Status**: `todo`  
**Effort**: 4 hours  
**Owner**: Backend Developer  

**Description**:
Write comprehensive tests dan dokumentasi untuk backend.

**Acceptance Criteria**:
- [ ] Unit tests untuk service layer (80%+ coverage)
- [ ] Integration tests untuk API endpoints (70%+ coverage)
- [ ] API documentation updated
- [ ] Database schema documented
- [ ] Error scenarios tested
- [ ] Performance tested (< 200ms response time)

**Dependencies**: Task 1.4

---

## WEEK 2: FRONTEND IMPLEMENTATION

### Task 2.1: Frontend Page Structure
**Status**: `todo`  
**Effort**: 8 hours  
**Owner**: Frontend Developer  

**Description**:
Create main stok opname page dengan tab navigation.

**Components to Create**:
- `StokOpnamePage.jsx` - Main page
- `OpnameForm.jsx` - Active opname form
- `SessionHistory.jsx` - History list
- `VarianceReport.jsx` - Reports tab

**Acceptance Criteria**:
- [ ] Main page created dengan tab navigation
- [ ] Tab 1: Active Opname (form)
- [ ] Tab 2: History (list)
- [ ] Tab 3: Reports (analysis)
- [ ] Responsive design implemented
- [ ] Loading states added
- [ ] Error states handled

**Dependencies**: Task 1.4

**Notes**:
- Use React hooks
- Use React Query untuk data fetching
- Use Tailwind CSS untuk styling

---

### Task 2.2: Opname Form Component
**Status**: `todo`  
**Effort**: 10 hours  
**Owner**: Frontend Developer  

**Description**:
Implement form component untuk input stok fisik dengan real-time calculation.

**Features**:
- Table dengan kolom: Bahan | Stok Sistem | Stok Fisik | Selisih | %
- Input field untuk stok fisik
- Real-time variance calculation
- Search/filter untuk items
- Bulk input support
- Progress indicator
- Summary statistics

**Acceptance Criteria**:
- [ ] Form component created
- [ ] Table dengan virtual scrolling (10,000+ items)
- [ ] Input validation implemented
- [ ] Real-time calculation working
- [ ] Search functionality working
- [ ] Progress tracking working
- [ ] Summary stats displayed
- [ ] Responsive design

**Dependencies**: Task 2.1

**Notes**:
- Use React Table library
- Implement virtual scrolling
- Add keyboard shortcuts
- Add undo/redo support

---

### Task 2.3: Approval Workflow UI
**Status**: `todo`  
**Effort**: 6 hours  
**Owner**: Frontend Developer  

**Description**:
Implement approval workflow UI dengan status timeline.

**Features**:
- Status timeline (Draft → In Progress → Completed → Approved)
- Approval form dengan comments
- Rejection form dengan reason
- Approval history
- User information

**Acceptance Criteria**:
- [ ] Approval component created
- [ ] Status timeline displayed
- [ ] Approval form working
- [ ] Rejection form working
- [ ] History view working
- [ ] User info displayed
- [ ] Responsive design

**Dependencies**: Task 2.1

---

### Task 2.4: Variance Report Component
**Status**: `todo`  
**Effort**: 8 hours  
**Owner**: Frontend Developer  

**Description**:
Implement variance report component dengan analytics.

**Features**:
- Summary statistics (Total items, Variance count, Variance %)
- Variance breakdown table
- Category distribution (Normal, Damage, Theft, Error, Shrinkage)
- Export to PDF/Excel
- Print functionality

**Acceptance Criteria**:
- [ ] Report component created
- [ ] Summary statistics displayed
- [ ] Variance table working
- [ ] Category breakdown working
- [ ] Export to PDF working
- [ ] Export to Excel working
- [ ] Print functionality working
- [ ] Responsive design

**Dependencies**: Task 2.1

**Notes**:
- Use jsPDF untuk PDF export
- Use xlsx untuk Excel export
- Add print CSS

---

### Task 2.5: Frontend Integration & Testing
**Status**: `todo`  
**Effort**: 8 hours  
**Owner**: Frontend Developer  

**Description**:
Integrate frontend dengan backend API dan comprehensive testing.

**Acceptance Criteria**:
- [ ] All API endpoints connected
- [ ] Loading states working
- [ ] Error handling working
- [ ] Success notifications working
- [ ] All workflows tested
- [ ] Responsive design tested
- [ ] Performance tested (< 2s load time)
- [ ] E2E tests written

**Dependencies**: Task 2.4

**Notes**:
- Test on multiple devices
- Test on multiple browsers
- Performance optimization

---

### Task 2.6: Frontend Documentation & Polish
**Status**: `todo`  
**Effort**: 4 hours  
**Owner**: Frontend Developer  

**Description**:
Documentation dan final polish untuk frontend.

**Acceptance Criteria**:
- [ ] Component documentation written
- [ ] User guide created
- [ ] Accessibility tested (WCAG 2.1 AA)
- [ ] UI/UX polish completed
- [ ] Performance optimized
- [ ] Browser compatibility tested

**Dependencies**: Task 2.5

---

## INTEGRATION & QA

### Task 3.1: End-to-End Testing
**Status**: `todo`  
**Effort**: 6 hours  
**Owner**: QA Engineer  

**Description**:
Comprehensive E2E testing untuk semua workflows.

**Test Scenarios**:
- [ ] Happy path: Create → Count → Complete → Approve
- [ ] Partial variance: Some items dengan variance
- [ ] Rejection flow: Reject → Restart
- [ ] Multi-outlet: Opname di multiple outlets
- [ ] Permission checks: Verify access control
- [ ] Error scenarios: Handle edge cases

**Acceptance Criteria**:
- [ ] All scenarios tested
- [ ] All edge cases handled
- [ ] Performance acceptable
- [ ] No critical bugs

**Dependencies**: Task 2.5

---

### Task 3.2: Performance & Security Testing
**Status**: `todo`  
**Effort**: 4 hours  
**Owner**: QA Engineer  

**Description**:
Performance dan security testing.

**Acceptance Criteria**:
- [ ] API response time < 200ms
- [ ] Page load time < 2s
- [ ] Support 10,000+ items
- [ ] SQL injection prevention verified
- [ ] XSS prevention verified
- [ ] CSRF prevention verified
- [ ] Authentication bypass tested
- [ ] Authorization bypass tested

**Dependencies**: Task 2.5

---

## DEPLOYMENT & DOCUMENTATION

### Task 4.1: Deployment Preparation
**Status**: `todo`  
**Effort**: 4 hours  
**Owner**: DevOps  

**Description**:
Prepare untuk deployment ke production.

**Acceptance Criteria**:
- [ ] Database migration script ready
- [ ] Deployment checklist created
- [ ] Rollback plan documented
- [ ] Monitoring setup
- [ ] Alert configuration
- [ ] Smoke tests defined

**Dependencies**: Task 3.2

---

### Task 4.2: Documentation & Training
**Status**: `todo`  
**Effort**: 4 hours  
**Owner**: Product Manager  

**Description**:
Complete documentation dan user training materials.

**Deliverables**:
- [ ] API documentation (Swagger)
- [ ] Database schema documentation
- [ ] User guide (step-by-step)
- [ ] Administrator guide
- [ ] Developer guide
- [ ] Troubleshooting guide

**Dependencies**: Task 4.1

---

## SUMMARY

| Phase | Week | Tasks | Hours | Status |
|-------|------|-------|-------|--------|
| Backend | 1 | 1.1-1.5 | 28 | todo |
| Frontend | 2 | 2.1-2.6 | 44 | todo |
| QA | 2 | 3.1-3.2 | 10 | todo |
| Deployment | 2 | 4.1-4.2 | 8 | todo |
| **TOTAL** | **2** | **12** | **90** | **todo** |

---

## NEXT STEPS

1. ✅ Requirements & Design finalized
2. ⏳ Start Task 1.1: Database Schema
3. ⏳ Start Task 1.2: Repository Layer
4. ⏳ Continue with remaining tasks in sequence

**Ready to start implementation?**
