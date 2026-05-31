# PHASE 3: INTELLIGENCE LAYER - IMPLEMENTATION GUIDE

**Status**: Specification Complete - Ready for Implementation  
**Duration**: 2 weeks (82 hours total)  
**Target Rating**: 7.5/10  

---

## 📋 WHAT IS PHASE 3?

Phase 3 adalah layer intelligence untuk Stok Opname System yang menambahkan:

1. **Analytics Dashboard** - Real-time metrics, trends, risk assessment
2. **ML Models** - Variance prediction, anomaly detection, risk scoring
3. **Intelligent Recommendations** - Automated action suggestions
4. **Advanced Reporting** - Custom reports, scheduled delivery, exports
5. **Model Monitoring** - Performance tracking, automated retraining

---

## 🎯 KEY FEATURES

### 1. Analytics Dashboard
- **KPI Cards**: Total items, avg variance %, anomalies detected, approval rate, risk score
- **Trend Charts**: 7-day, 30-day, 90-day variance trends
- **Risk Matrix**: Outlet risk distribution, high-risk items
- **Category Breakdown**: Variance distribution by item category
- **Predictions**: Expected variance next opname, confidence score

### 2. ML Models
- **Variance Prediction** (ARIMA): Predict expected variance using time-series
- **Anomaly Detection** (Isolation Forest): Identify unusual variance patterns
- **Risk Scoring** (Random Forest): Score risk level for items/outlets
- **Confidence Scores**: Include model confidence in predictions

### 3. Intelligent Recommendations
- **Recount Recommendations**: Flag items for recounting
- **Process Recommendations**: Suggest improvements
- **Investigation Alerts**: Recommend investigation focus areas
- **Action Tracking**: Monitor recommendation outcomes

### 4. Advanced Reporting
- **Custom Report Builder**: Drag-drop report configuration
- **Report Templates**: Pre-built variance, trend, risk reports
- **Scheduled Reports**: Auto-generate and email reports
- **Export Formats**: PDF, Excel, CSV downloads

### 5. Model Monitoring
- **Performance Dashboard**: Model accuracy, precision, recall
- **Automatic Retraining**: Weekly model updates
- **Model Drift Detection**: Alert when model performance degrades
- **Version Control**: Model versioning & rollback

---

## 📦 DELIVERABLES

### Backend
```
backend/src/
├── services/
│   ├── analyticsService.js          (82 methods)
│   ├── predictionService.js         (41 methods)
│   ├── anomalyService.js            (35 methods)
│   └── recommendationService.js     (28 methods)
├── controllers/
│   ├── analyticsController.js
│   ├── predictionController.js
│   ├── anomalyController.js
│   └── reportingController.js
├── routes/
│   ├── analyticsRoutes.js
│   ├── predictionRoutes.js
│   └── reportingRoutes.js
└── jobs/
    ├── analyticsAggregation.js
    └── mlRetraining.js
```

### Frontend
```
frontend/src/
├── pages/
│   └── AnalyticsDashboard.jsx
├── components/
│   ├── KPICard.jsx
│   ├── TrendChart.jsx
│   ├── RiskMatrix.jsx
│   ├── AnomalyAlert.jsx
│   ├── PredictionCard.jsx
│   ├── RecommendationPanel.jsx
│   └── ReportBuilder.jsx
└── hooks/
    └── useAnalytics.js
```

### ML Service (Python)
```
ml-service/
├── models/
│   ├── variance_predictor.py       (ARIMA)
│   ├── anomaly_detector.py         (Isolation Forest)
│   └── risk_scorer.py              (Random Forest)
├── pipelines/
│   ├── feature_engineering.py
│   ├── data_preparation.py
│   └── model_training.py
├── api/
│   └── app.py                      (FastAPI)
├── requirements.txt
└── Dockerfile
```

### Database
```
4 New Tables:
- analytics_metrics           (pre-aggregated metrics)
- ml_predictions              (model predictions)
- anomaly_alerts              (detected anomalies)
- recommendation_logs         (recommendation tracking)
- model_metrics               (ML model performance)

Indexed columns for performance
```

---

## 🗂️ FILE STRUCTURE

### Specification Files
```
.kiro/specs/stok-opname/
├── phase3-requirements.md    ← Business requirements
├── phase3-design.md          ← Technical architecture
├── phase3-tasks.md           ← Task breakdown
└── phase3-README.md          ← This file
```

---

## 📊 METRICS & KPIs

### Dashboard Metrics
```
Summary Level:
- Total Items Counted (outlet/company)
- Average Variance % (with trend)
- Items with Variance (count & %)
- Anomalies Detected (current period)
- Approval Rate (% sessions approved)
- Risk Score (0-100 scale)

Detailed Level:
- Variance by Category (pie chart)
- Variance by Outlet (bar chart)
- Trend over time (line chart)
- Risk distribution (scatter plot)
- Top 10 high-variance items
- Recent anomalies (table)
```

### ML Model Metrics
```
Variance Prediction:
- MAPE (Mean Absolute Percentage Error): Target < 15%
- MAE (Mean Absolute Error): Target < 10% variance
- Accuracy @ 80% CI: Target >= 85%

Anomaly Detection:
- Precision: Target >= 90%
- Recall: Target >= 80%
- F1-Score: Target >= 85%
- False Positive Rate: < 10%

Risk Scoring:
- Accuracy: Target >= 85%
- AUC-ROC: Target >= 0.90
- Feature Importance Interpretability: Documented

Overall:
- Model Retraining: Weekly
- Drift Detection: Automatic
- Performance Monitoring: Real-time
```

---

## 🔄 DATA FLOW

### Analytics Pipeline
```
Opname Session Completed
    ↓
Calculate Variance Metrics
    ↓
Store in analytics_metrics table
    ↓
Cache to Redis (5 min TTL)
    ↓
Dashboard reads from cache
    ↓
Trigger anomaly detection
    ↓
Generate predictions
    ↓
Create alerts if needed
```

### ML Pipeline
```
Daily Cron Trigger
    ↓
Load historical data (12 months)
    ↓
Feature engineering
    ↓
Train/retrain models
    ↓
Evaluate models
    ↓
Deploy new models (if improved)
    ↓
Generate predictions
    ↓
Cache predictions (24h TTL)
```

---

## 🚀 IMPLEMENTATION ORDER

### Phase 1: Foundation (Days 1-3)
1. **Task 3.1**: Database schema & aggregation
   - Create 5 new tables
   - Setup aggregation job
   - Validate schema

2. **Task 3.2**: Analytics service
   - Implement metrics calculation
   - Add caching logic
   - Test performance

3. **Task 3.3**: Analytics API
   - Create routes
   - Add validation
   - Test endpoints

### Phase 2: Intelligence (Days 4-7)
4. **Task 3.5**: ML model development
   - Data exploration
   - Feature engineering
   - Model training & evaluation
   - Backtesting

5. **Task 3.6**: ML service
   - Setup Python service
   - Implement prediction endpoints
   - Integration testing

6. **Task 3.7**: Predictions API
   - Create Express integration
   - Add caching
   - Error handling

### Phase 3: UI & Finalization (Days 8-10)
7. **Task 3.4**: Analytics dashboard UI
   - KPI cards
   - Charts
   - Filters & interactivity

8. **Task 3.8**: Prediction UI
   - Insights components
   - Anomaly cards
   - Recommendations

9. **Task 3.9**: Reporting
   - Report builder
   - Scheduling
   - Exports

### Phase 4: Testing & Deployment (Days 11-14)
10. **Task 3.10**: Monitoring & retraining
11. **Task 3.11**: Integration testing
12. **Task 3.12**: Documentation & deployment

---

## 🛠️ TECHNOLOGY STACK

### Backend
- **Node.js + Express**: API server
- **Redis**: Caching layer
- **PostgreSQL (Supabase)**: Data storage
- **Bull**: Job queue for async tasks

### ML Service
- **Python 3.9+**: ML development
- **FastAPI**: ML API server
- **scikit-learn**: ML models
- **pandas/numpy**: Data processing
- **Prophet/statsmodels**: Time-series forecasting
- **Docker**: Containerization

### Frontend
- **React 18**: UI framework
- **Recharts/Chart.js**: Data visualization
- **React Query**: Data fetching
- **Tailwind CSS**: Styling

---

## 📈 PERFORMANCE TARGETS

| Metric | Target | Priority |
|--------|--------|----------|
| Dashboard load time | < 3 seconds | Critical |
| API response time | < 200ms | Critical |
| Prediction latency | < 500ms | High |
| Model training | < 5 minutes | Medium |
| Query performance | < 100ms | High |
| Cache hit ratio | > 80% | Medium |

---

## 🧪 TESTING STRATEGY

### Unit Tests
- Individual service methods
- Model prediction accuracy
- Analytics calculations
- 80%+ code coverage target

### Integration Tests
- API endpoint workflows
- ML service integration
- Database operations
- Cache consistency

### E2E Tests
- Complete analytics workflow
- Prediction generation & display
- Anomaly detection & alerts
- Report generation & export

### Performance Tests
- Dashboard load testing
- Concurrent API calls
- Large dataset handling (100k+ records)
- Cache efficiency

---

## 🔒 SECURITY & COMPLIANCE

### Data Security
- Encrypt sensitive predictions
- Audit trail for all anomalies
- Secure ML model storage
- RBAC for analytics access

### Model Security
- Model versioning & registry
- Prediction verification
- Drift detection alerts
- Explainability documentation

### Privacy
- Tenant data isolation
- No cross-tenant leakage
- Compliance with data retention

---

## 📚 DOCUMENTATION

After implementation, create:
- **API Documentation**: Swagger/OpenAPI
- **ML Model Documentation**: Model cards, assumptions
- **User Guide**: Dashboard usage, interpreting metrics
- **Admin Guide**: Model management, retraining
- **Developer Guide**: Extending models, adding features
- **Troubleshooting Guide**: Common issues & solutions

---

## 🎯 SUCCESS CRITERIA

✅ Phase 3 is successful when:

1. **Analytics Dashboard**
   - All KPIs displaying accurately
   - Charts rendering correctly
   - Filters working as expected
   - Load time < 3 seconds

2. **ML Models**
   - Variance prediction accuracy >= 85%
   - Anomaly detection precision >= 90%
   - Risk scores correlating with actual issues
   - Models retraining automatically weekly

3. **Predictions & Alerts**
   - Predictions generating for all opnames
   - Alerts firing correctly for anomalies
   - Confidence scores calibrated
   - Recommendations relevant & actionable

4. **Reporting**
   - Custom reports generating correctly
   - Scheduling working (emails sent)
   - Exports working (PDF, Excel, CSV)
   - Report templates available

5. **Integration**
   - ML service communicating with backend
   - No data silos or inconsistencies
   - Monitoring alerts working
   - Performance targets met

6. **Quality**
   - 80%+ test coverage
   - Zero critical bugs
   - Documentation complete
   - User training completed

---

## ❓ FAQ

**Q: Can I run ML service on same server as Express?**
A: Recommended to separate for scalability. Use containerization (Docker).

**Q: How often should models retrain?**
A: Weekly recommended. Can adjust based on data change rate.

**Q: What if prediction confidence is low?**
A: Show warning to user, fall back to simple threshold rules.

**Q: Can I use different ML algorithms?**
A: Yes! Architecture supports plugin model strategy. See Task 3.5.

**Q: How much historical data is needed?**
A: Minimum 3 months, optimal 12 months for good models.

**Q: What about model explainability?**
A: SHAP/LIME values documented in model cards. Required for compliance.

---

## 📞 SUPPORT

For questions about Phase 3 implementation:
1. Review design.md for technical architecture
2. Check tasks.md for specific implementation steps
3. Refer to requirements.md for business context
4. See this README for overview & success criteria

---

## ✨ NEXT STEPS

When Phase 3 is complete:

1. **Phase 4**: Enterprise Features
   - Security & encryption hardening
   - Advanced compliance features
   - Multi-tenancy optimization
   - Production readiness

2. **Continuous Improvement**
   - Collect user feedback
   - Monitor model performance
   - Optimize based on real-world usage
   - Plan Phase 4+ features

---

**Status**: ✅ Specification Complete  
**Ready for**: Implementation by development team  
**Estimated Completion**: 2 weeks from start  
**Target Rating**: 7.5/10  

