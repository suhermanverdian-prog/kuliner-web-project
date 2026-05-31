# STOK OPNAME SYSTEM - PHASE 3 TASKS
## Intelligence Layer Implementation

**Phase**: 3 - Intelligence Layer  
**Duration**: 2 weeks (50 hours)  
**Target Rating**: 7.5/10  

---

## WEEK 1: ANALYTICS & DATA FOUNDATION

### Task 3.1: Database Schema & Aggregation Layer
**Status**: `todo`  
**Effort**: 6 hours  
**Owner**: Backend Developer  

**Description**:
Create database tables untuk analytics, predictions, anomalies, dan recommendations. Implement data aggregation layer untuk fast metric calculations.

**Sub-tasks**:
- [ ] Create `analytics_metrics` table dengan pre-aggregated data
- [ ] Create `ml_predictions` table untuk model predictions
- [ ] Create `anomaly_alerts` table untuk tracking detected anomalies
- [ ] Create `recommendation_logs` table untuk recommendation tracking
- [ ] Create `model_metrics` table untuk ML model performance
- [ ] Create migration script dengan proper indexes
- [ ] Implement scheduled aggregation job (daily)
- [ ] Setup data retention policy (keep 24 months historical)

**Acceptance Criteria**:
- [ ] All 5 tables created dengan constraints
- [ ] Indexes created untuk performance
- [ ] Migration script tested (up/down)
- [ ] Aggregation job running daily
- [ ] Historical data migrated (if available)
- [ ] Query performance tested (< 100ms)
- [ ] Schema documented

**Dependencies**: Phase 1 backend complete

**Notes**:
- Use UUID untuk primary keys
- Add tenant_id untuk multi-tenancy
- Create backups sebelum aggregation
- Monitor storage usage

---

### Task 3.2: Analytics Service Layer
**Status**: `todo`  
**Effort**: 8 hours  
**Owner**: Backend Developer  

**Description**:
Implement analytics service untuk calculate variance metrics, trends, risk scores, dan provide data untuk dashboard.

**Methods to Implement**:
```javascript
// Metrics Aggregation
calculateDashboardMetrics(tenantId, outletId, dateRange)
getTrendData(outletId, metric, window: '7d'|'30d'|'90d')
getVarianceDistribution(outletId, dateRange)
getRiskMatrix(outletId)
getCategoryBreakdown(outletId, dateRange)

// Advanced Analytics
correlateVarianceWithTransactions(sessionId)
detectOutlierItems(outletId, threshold)
compareOutletPerformance(tenantId, dateRange)
forecastNextOpname(outletId)

// Caching & Performance
invalidateMetricsCache(outlet_id)
preWarmCache(tenant_id)
```

**Acceptance Criteria**:
- [ ] File created: `backend/src/services/analyticsService.js`
- [ ] All methods implemented
- [ ] Proper error handling
- [ ] Caching layer integrated (Redis)
- [ ] Performance targets met (< 200ms)
- [ ] Logging added
- [ ] Unit tests written (80%+ coverage)

**Dependencies**: Task 3.1

**Notes**:
- Follow existing service patterns
- Use Redis untuk caching
- Implement TTL strategies (5min untuk metrics, 1hr untuk trends)
- Add cache invalidation triggers

---

### Task 3.3: Analytics Controller & Routes
**Status**: `todo`  
**Effort**: 6 hours  
**Owner**: Backend Developer  

**Description**:
Implement controller layer dan API routes untuk analytics endpoints.

**API Endpoints**:
```
GET    /api/analytics/dashboard         - Main dashboard metrics
GET    /api/analytics/trends            - Variance trends (7d/30d/90d)
GET    /api/analytics/variance-dist     - Variance distribution
GET    /api/analytics/risk-matrix       - Risk assessment
GET    /api/analytics/category-breakdown - Category analysis
GET    /api/analytics/outlet-comparison  - Multi-outlet comparison
POST   /api/analytics/export            - Export report
```

**Acceptance Criteria**:
- [ ] File created: `backend/src/controllers/analyticsController.js`
- [ ] Routes file created/updated: `backend/src/routes/analyticsRoutes.js`
- [ ] All endpoints implemented
- [ ] Zod validation schemas added
- [ ] Permission guards added
- [ ] Error handling comprehensive
- [ ] Request/response logging added

**Dependencies**: Task 3.2

**Notes**:
- Add to server.js routes
- Use requireFeature guard
- Implement proper error responses
- Add rate limiting untuk heavy queries

---

### Task 3.4: Analytics Dashboard UI (Frontend)
**Status**: `todo`  
**Effort**: 10 hours  
**Owner**: Frontend Developer  

**Description**:
Create analytics dashboard dengan KPI cards, trend charts, risk matrix, dan anomaly alerts.

**Components to Create**:
```
AnalyticsDashboard
├── Header (Date range, Filters, Export)
├── KPI Cards Section
│   ├── Card: Total Items
│   ├── Card: Avg Variance %
│   ├── Card: Items with Variance
│   ├── Card: Anomalies Detected
│   ├── Card: Approval Rate
│   └── Card: Risk Score
├── Trends Section
│   ├── Line Chart: Variance Trend
│   ├── Line Chart: Volume Trend
│   └── Pie Chart: Category Distribution
├── Predictions Section
│   ├── Expected Variance
│   ├── Confidence Score
│   └── Risk Level Gauge
├── Risk Matrix Section
│   ├── Scatter Plot: Outlet Risk Distribution
│   ├── Table: High-Risk Items
│   └── Filter/Drill-down
├── Anomalies Section
│   ├── Alert Cards
│   ├── Status Badges
│   └── Recommended Actions
└── Bottom Section
    ├── Recent Investigations
    └── Historical Comparison
```

**Acceptance Criteria**:
- [ ] Main dashboard created
- [ ] All KPI cards displaying correctly
- [ ] Charts rendering properly
- [ ] Real-time data updates (on interval)
- [ ] Filter functionality working
- [ ] Export button working
- [ ] Responsive design
- [ ] Performance < 3s load time

**Dependencies**: Task 3.3

**Notes**:
- Use Recharts atau Chart.js
- Implement data refresh interval (30s)
- Add loading states
- Mobile-responsive layout

---

## WEEK 2: ML INTELLIGENCE & PREDICTIONS

### Task 3.5: ML Model Development & Training
**Status**: `todo`  
**Effort**: 10 hours  
**Owner**: Data Scientist  

**Description**:
Develop ML models untuk variance prediction, anomaly detection, dan risk scoring. Train models dengan historical opname data.

**Models to Develop**:

**Model 1: Variance Prediction (ARIMA)**
- Input: Historical variance data (12 months)
- Output: Predicted variance untuk next opname
- Features: Time-based (day, month, season), outlet, category
- Accuracy target: >= 85%
- Training data: 80% of historical data
- Evaluation: MAPE, MAE metrics

**Model 2: Anomaly Detection (Isolation Forest)**
- Input: Variance + context features
- Output: Anomaly score + binary classification
- Features: Variance %, recency, frequency, category
- Precision target: >= 90%
- False positive rate: < 10%
- Evaluation: ROC-AUC, Precision-Recall

**Model 3: Risk Scoring (Random Forest)**
- Input: Multiple risk indicators
- Output: Risk score (0-100) + category
- Features: Variance amount, frequency, trend, category, outlet
- Accuracy target: >= 85%
- Evaluation: F1-score, Feature importance

**Acceptance Criteria**:
- [ ] Data exploration & analysis completed
- [ ] Feature engineering pipeline created
- [ ] 3 models trained & evaluated
- [ ] Model accuracy >= 85%
- [ ] Cross-validation tested
- [ ] Backtesting against historical data
- [ ] Model versioning implemented
- [ ] Model documentation created

**Dependencies**: Task 3.1, historical data

**Notes**:
- Use scikit-learn, pandas, numpy
- Implement proper train-test split
- Handle class imbalance dalam anomaly model
- Create feature scaling pipeline
- Document all assumptions

---

### Task 3.6: ML Service (Python FastAPI) & Integration
**Status**: `todo`  
**Effort**: 8 hours  
**Owner**: Backend Developer + Data Scientist  

**Description**:
Create Python FastAPI service untuk model serving, predictions, retraining. Setup communication dengan Express backend.

**Service Components**:

**Endpoints to Implement**:
```
POST   /predict/variance        - Predict variance for next opname
POST   /predict/anomaly         - Detect anomalies in opname data
POST   /predict/risk            - Score risk for items/outlets
GET    /model/status            - Check model versions & metrics
POST   /train                   - Trigger model retraining
GET    /train/:jobId            - Get training job status
```

**Integration Points**:
- Load models dari disk/registry
- Cache predictions (24 hours)
- Handle prediction errors gracefully
- Return confidence scores
- Format results untuk frontend

**Acceptance Criteria**:
- [ ] FastAPI service created
- [ ] All endpoints implemented
- [ ] Model loading working
- [ ] Prediction latency < 500ms
- [ ] Error handling robust
- [ ] Docker containerized
- [ ] Integration tested with Express backend
- [ ] Async job queue for retraining

**Dependencies**: Task 3.5

**Notes**:
- Use separate Python environment
- Implement model registry
- Add monitoring/logging
- Setup health check endpoint
- Create requirements.txt

---

### Task 3.7: Predictions & Anomaly Detection API
**Status**: `todo`  
**Effort**: 6 hours  
**Owner**: Backend Developer  

**Description**:
Implement Express API layer untuk predictions dan anomalies, integrate dengan Python ML service.

**Methods to Implement**:
```javascript
// Prediction Service
getVariancePrediction(outletId, bahanId)
getAnomalyPrediction(outletId)
getRiskScore(outletId, items)

// Anomaly Detection & Alerting
detectAnomalies(sessionId)
generateAnomalyAlerts(sessionId)
getAnomalyAlerts(tenantId, filters)
investigateAnomaly(alertId, notes)
resolveAnomaly(alertId, resolution)

// Recommendations
generateRecommendations(alertId)
getRecommendations(alertId)
trackRecommendationAction(recommendationId, action)
```

**API Endpoints**:
```
GET    /api/predictions/variance
GET    /api/predictions/anomalies
GET    /api/predictions/risk
POST   /api/predictions/train
GET    /api/predictions/:jobId/status

GET    /api/anomalies/alerts
PUT    /api/anomalies/:alertId/investigate
PUT    /api/anomalies/:alertId/resolve

GET    /api/recommendations
PUT    /api/recommendations/:id/action
```

**Acceptance Criteria**:
- [ ] All methods implemented
- [ ] API endpoints working
- [ ] Integration dengan ML service verified
- [ ] Caching configured (24h for predictions)
- [ ] Error handling complete
- [ ] Rate limiting added
- [ ] Integration tests passing
- [ ] Performance targets met

**Dependencies**: Task 3.6

---

### Task 3.8: Predictions & Anomalies UI (Frontend)
**Status**: `todo`  
**Effort**: 8 hours  
**Owner**: Frontend Developer  

**Description**:
Create frontend components untuk prediction insights, anomaly viewing, recommendations.

**Components to Create**:
```
PredictionInsights
├── Predicted Variance (next opname)
├── Confidence Score
├── Risk Level
├── Comparison to history
└── Recommendations

AnomalyAlertCard
├── Severity badge
├── Type label
├── Main metric
├── Explanation
├── Recommended actions
└── Action buttons

RecommendationPanel
├── Recommendation list
├── Priority indicators
├── Action tracking
└── Outcome logging

AnomalyInvestigationModal
├── Anomaly details
├── Investigation form
├── Comments
└── Resolution tracking
```

**Acceptance Criteria**:
- [ ] Components created
- [ ] Data loading correctly
- [ ] Real-time updates working
- [ ] User actions tracked
- [ ] Responsive design
- [ ] Accessibility compliant
- [ ] Performance optimized

**Dependencies**: Task 3.7

---

### Task 3.9: Advanced Reporting & Custom Reports
**Status**: `todo`  
**Effort**: 6 hours  
**Owner**: Backend + Frontend Developer  

**Description**:
Implement custom report builder, scheduled reports, export functionality (PDF/Excel/CSV).

**Backend Components**:
```javascript
// Report Generation
generateReport(reportConfig)
scheduleReport(reportConfig, cronSchedule)
exportReport(reportId, format: 'pdf'|'excel'|'csv')

// Report Templates
getReportTemplates()
createReportTemplate(config)
getTemplatePreview(templateId)

// Report History
getReportHistory(tenantId)
getReportArchive(reportId)
deleteReport(reportId)
```

**Frontend Components**:
```
ReportBuilder
├── Step 1: Select Template
├── Step 2: Configure Filters
├── Step 3: Choose Metrics
├── Step 4: Design Layout
├── Step 5: Preview & Export

ReportScheduler
├── Report Selection
├── Schedule Frequency
├── Email Recipients
├── Format Selection

ReportGallery
├── Available Templates
├── Recent Reports
├── Scheduled Reports
└── Report History
```

**Acceptance Criteria**:
- [ ] Report builder working
- [ ] Export formats working (PDF, Excel, CSV)
- [ ] Scheduling working
- [ ] Email notifications working
- [ ] Template library created
- [ ] Report caching implemented
- [ ] Performance tested
- [ ] User-friendly interface

**Dependencies**: Tasks 3.2, 3.3

---

## INTEGRATION & QA

### Task 3.10: ML Pipeline Monitoring & Retraining
**Status**: `todo`  
**Effort**: 4 hours  
**Owner**: Data Scientist / DevOps  

**Description**:
Setup model monitoring, automated retraining triggers, model performance tracking.

**Components**:
- [ ] Model performance dashboard
- [ ] Automated retraining scheduler (weekly)
- [ ] Model drift detection
- [ ] A/B testing framework (optional)
- [ ] Model versioning & rollback capability
- [ ] Alert on performance degradation

**Acceptance Criteria**:
- [ ] Monitoring dashboard created
- [ ] Retraining job working
- [ ] Model drift detected
- [ ] Alerts configured
- [ ] Versioning implemented
- [ ] Documentation complete

**Dependencies**: Task 3.6

---

### Task 3.11: Integration Testing & Performance
**Status**: `todo`  
**Effort**: 4 hours  
**Owner**: QA Engineer  

**Description**:
End-to-end testing of analytics, predictions, anomalies, recommendations workflows.

**Test Scenarios**:
- [ ] Dashboard loads within 3s
- [ ] Predictions generated accurately
- [ ] Anomalies detected correctly
- [ ] Recommendations relevant
- [ ] Reports generated correctly
- [ ] Cache working effectively
- [ ] Error handling robust
- [ ] Multi-tenant isolation verified

**Acceptance Criteria**:
- [ ] All scenarios tested
- [ ] Performance targets met
- [ ] No data leaks between tenants
- [ ] Error handling verified
- [ ] Load testing completed
- [ ] Stress testing passed

**Dependencies**: Tasks 3.1-3.9

---

### Task 3.12: Documentation & Deployment
**Status**: `todo`  
**Effort**: 6 hours  
**Owner**: Technical Writer / DevOps  

**Description**:
Complete documentation, deployment guides, user training materials.

**Deliverables**:
- [ ] API documentation (analytics endpoints)
- [ ] ML model documentation
- [ ] Analytics feature user guide
- [ ] Admin guide untuk model management
- [ ] Developer guide untuk extending models
- [ ] Deployment guide (staging → production)
- [ ] Troubleshooting guide
- [ ] Performance tuning guide

**Acceptance Criteria**:
- [ ] All documents completed
- [ ] Code examples provided
- [ ] Deployment tested
- [ ] User training completed
- [ ] Support team trained

**Dependencies**: All Phase 3 tasks

---

## SUMMARY

| Task | Effort | Focus Area | Key Deliverable |
|------|--------|------------|-----------------|
| 3.1 | 6h | Database | Tables + Aggregation |
| 3.2 | 8h | Backend Service | Analytics calculations |
| 3.3 | 6h | API Endpoints | Analytics routes |
| 3.4 | 10h | Frontend Dashboard | Analytics UI |
| 3.5 | 10h | ML Models | Trained models |
| 3.6 | 8h | ML Service | Python API |
| 3.7 | 6h | Prediction API | Integration layer |
| 3.8 | 8h | Prediction UI | Frontend components |
| 3.9 | 6h | Reporting | Report builder |
| 3.10 | 4h | Monitoring | Model tracking |
| 3.11 | 4h | QA | Testing |
| 3.12 | 6h | Documentation | Guides |
| **Total** | **82h** | - | - |

**Target Rating**: 7.5/10  
**Success Criteria**: All 12 tasks completed dengan acceptance criteria met

---

## NEXT STEPS

1. Prioritize tasks by dependency
2. Setup development environment (Python ML stack)
3. Prepare historical data untuk model training
4. Start Task 3.1: Database schema
5. Parallelize frontend/backend work

**Ready to implement Phase 3?**

