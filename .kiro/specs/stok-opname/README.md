# STOK OPNAME SYSTEM - SPECIFICATION OVERVIEW

**Project**: Coffeeshop POS - Stok Opname Module  
**Phase**: 1 - Core Foundation  
**Target Rating**: 6/10 (Phase 1) → 10/10 (All Phases)  
**Duration**: 2 weeks (Phase 1)  
**Total Effort**: 90 hours  

---

## 📋 SPECIFICATION FILES

### 1. **requirements.md**
Detailed functional & non-functional requirements dengan:
- Functional requirements (FR-1 to FR-5)
- Non-functional requirements (NFR-1 to NFR-4)
- Data model specification
- Workflows & UI components
- Acceptance criteria
- Test scenarios

**Use this for**: Understanding WHAT needs to be built

---

### 2. **design.md**
Technical design specification dengan:
- Architecture overview
- Database schema design
- Service layer design
- Frontend component design
- API endpoint design
- Permission model
- State management
- Error handling
- Testing strategy

**Use this for**: Understanding HOW to build it

---

### 3. **tasks.md**
Detailed task breakdown dengan:
- 12 tasks across 4 phases
- Task descriptions & acceptance criteria
- Dependencies & effort estimates
- Owner assignments
- Implementation notes

**Use this for**: Tracking progress & execution

---

## 🎯 PHASE 1 OBJECTIVES

### Core Features
✅ Session management (create, track, complete)  
✅ Item counting dengan real-time variance calculation  
✅ 2-level approval workflow  
✅ Variance reporting & analysis  
✅ Automatic accounting journal creation  

### Rating Target: 6/10
- Functionality: 100% (core features)
- User Experience: 70% (basic UI)
- Integration: 60% (accounting only)
- Analytics: 40% (basic reports)
- Security: 80% (permission guards)

---

## 📊 IMPLEMENTATION ROADMAP

### Week 1: Backend (28 hours)
```
Task 1.1: Database Schema (4h)
  ↓
Task 1.2: Repository Layer (6h)
  ↓
Task 1.3: Service Layer (8h)
  ↓
Task 1.4: Controller & Routes (6h)
  ↓
Task 1.5: Testing & Docs (4h)
```

### Week 2: Frontend (44 hours)
```
Task 2.1: Page Structure (8h)
  ↓
Task 2.2: Form Component (10h)
  ↓
Task 2.3: Approval Workflow (6h)
  ↓
Task 2.4: Variance Report (8h)
  ↓
Task 2.5: Integration & Testing (8h)
  ↓
Task 2.6: Documentation (4h)
```

### QA & Deployment (18 hours)
```
Task 3.1: E2E Testing (6h)
Task 3.2: Performance & Security (4h)
Task 4.1: Deployment Prep (4h)
Task 4.2: Documentation (4h)
```

---

## 🏗️ ARCHITECTURE HIGHLIGHTS

### Backend Stack
- **Framework**: Express.js
- **Database**: Supabase (PostgreSQL)
- **Validation**: Zod
- **Pattern**: Repository → Service → Controller

### Frontend Stack
- **Framework**: React
- **Data Fetching**: React Query
- **Styling**: Tailwind CSS
- **Tables**: React Table (virtual scrolling)
- **Export**: jsPDF, xlsx

### Database
- 3 main tables: opname_sessions, opname_items, opname_approvals
- Proper indexing untuk performance
- Audit trail untuk compliance

---

## 🔄 KEY WORKFLOWS

### Workflow 1: Complete Opname
```
1. User starts opname session
   ↓
2. System fetches all active items with current stock
   ↓
3. User inputs physical count per item
   ↓
4. System calculates variance in real-time
   ↓
5. User completes opname
   ↓
6. Approver reviews & approves
   ↓
7. System creates adjustment journals
   ↓
8. Inventory stock updated
```

### Workflow 2: Reject & Restart
```
1. Approver rejects opname with reason
   ↓
2. Preparer notified
   ↓
3. Preparer can restart (clear counts, keep session)
   ↓
4. Repeat counting process
```

---

## 📱 UI COMPONENTS

### Main Page: StokOpnamePage
```
┌─────────────────────────────────────────┐
│  STOK OPNAME                            │
│  [Start] [Export] [Settings]            │
├─────────────────────────────────────────┤
│ [Active] [History] [Reports]            │
├─────────────────────────────────────────┤
│                                         │
│  TAB 1: ACTIVE OPNAME                   │
│  ┌─────────────────────────────────┐   │
│  │ Session: OPNAME-OUT1-20240529-01│   │
│  │ Progress: 450/1000 (45%)        │   │
│  │ [Search] [Filter]               │   │
│  ├─────────────────────────────────┤   │
│  │ Bahan | Stok Sistem | Stok Fisik│   │
│  │ ─────────────────────────────────│   │
│  │ Kopi  | 100        | [___]      │   │
│  │ Gula  | 50         | [___]      │   │
│  │ ...                             │   │
│  ├─────────────────────────────────┤   │
│  │ [Save] [Complete] [Cancel]      │   │
│  └─────────────────────────────────┘   │
│                                         │
└─────────────────────────────────────────┘
```

---

## 🔐 PERMISSION MODEL

| Role | Start | Record | Complete | Approve | View |
|------|-------|--------|----------|---------|------|
| Inventory Manager | ✓ | ✓ | ✓ | ✗ | ✓ |
| Accounting Manager | ✗ | ✗ | ✗ | ✓ | ✓ |
| Admin | ✓ | ✓ | ✓ | ✓ | ✓ |

---

## 📊 SUCCESS METRICS (Phase 1)

### Functionality
- ✅ All core features implemented
- ✅ All workflows working
- ✅ All edge cases handled
- ✅ All tests passing

### User Experience
- ✅ Intuitive interface
- ✅ Clear workflow
- ✅ Fast performance (< 2s load)
- ✅ Mobile-friendly (Phase 2)

### Integration
- ✅ Accounting sync working
- ✅ Inventory updated correctly
- ✅ Journals created automatically
- ✅ Audit trail complete

### Quality
- ✅ 80%+ test coverage
- ✅ No critical bugs
- ✅ Performance acceptable
- ✅ Security verified

---

## 🚀 FUTURE PHASES

### Phase 2: Advanced Features (Week 3-4)
- Barcode scanning integration
- Mobile optimization
- Scheduled opname
- Advanced variance categorization
- Multi-outlet coordination

### Phase 3: Intelligence Layer (Week 5-6)
- AI anomaly detection
- Predictive analytics
- Root cause analysis
- Advanced reporting dashboard
- Performance optimization

### Phase 4: Enterprise Features (Week 7-8)
- Enterprise security
- Compliance features
- Advanced integrations
- Scalability improvements
- Production readiness

---

## 📝 GETTING STARTED

### For Backend Developer
1. Read `requirements.md` - Understand what to build
2. Read `design.md` - Understand the architecture
3. Start with Task 1.1 - Database Schema
4. Follow task sequence in `tasks.md`

### For Frontend Developer
1. Read `requirements.md` - Understand requirements
2. Read `design.md` - Understand component structure
3. Wait for backend API ready
4. Start with Task 2.1 - Page Structure

### For QA Engineer
1. Read `requirements.md` - Understand acceptance criteria
2. Read `design.md` - Understand workflows
3. Create test cases from `tasks.md`
4. Execute tests after each task

---

## 🔗 RELATED DOCUMENTS

- **Roadmap**: `STOK_OPNAME_ROADMAP.md` (high-level overview)
- **Database**: See `design.md` for schema details
- **API**: See `design.md` for endpoint specifications
- **Components**: See `design.md` for component hierarchy

---

## ✅ CHECKLIST

### Pre-Implementation
- [ ] All stakeholders reviewed spec
- [ ] Database schema approved
- [ ] API design approved
- [ ] UI mockups approved
- [ ] Team assigned to tasks

### During Implementation
- [ ] Follow task sequence
- [ ] Update task status regularly
- [ ] Document blockers
- [ ] Maintain code quality
- [ ] Write tests as you go

### Post-Implementation
- [ ] All tests passing
- [ ] Code reviewed
- [ ] Documentation complete
- [ ] Performance verified
- [ ] Security verified
- [ ] Ready for Phase 2

---

## 📞 SUPPORT

For questions or clarifications:
1. Check the relevant spec file
2. Review design patterns in `design.md`
3. Check task details in `tasks.md`
4. Consult with team lead

---

**Status**: ✅ Specification Complete - Ready for Implementation

**Next Step**: Start Task 1.1 - Database Schema & Migrations
