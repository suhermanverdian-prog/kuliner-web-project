# STOK OPNAME SYSTEM - PHASE 3 DESIGN
## Intelligence Layer Architecture

---

## 🏗️ ARCHITECTURE OVERVIEW

```
┌─────────────────────────────────────────────────────────┐
│                  FRONTEND (React)                        │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Analytics Dashboard                             │   │
│  │  ├── KPI Cards                                   │   │
│  │  ├── Trend Charts                                │   │
│  │  ├── Variance Heatmap                            │   │
│  │  ├── Risk Matrix                                 │   │
│  │  ├── Anomaly Alerts                              │   │
│  │  ├── Predictions View                            │   │
│  │  └── Custom Report Builder                       │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                          ↓ API Calls
┌─────────────────────────────────────────────────────────┐
│                 BACKEND (Express + Python)              │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Analytics Controller                            │   │
│  │  ├── GET /api/analytics/dashboard                │   │
│  │  ├── GET /api/analytics/trends                   │   │
│  │  ├── GET /api/analytics/anomalies                │   │
│  │  └── GET /api/analytics/reports                  │   │
│  └──────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Prediction Controller                           │   │
│  │  ├── GET /api/predictions/variance               │   │
│  │  ├── GET /api/predictions/anomaly                │   │
│  │  └── POST /api/predictions/retrain               │   │
│  └──────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Analytics Service                               │   │
│  │  ├── aggregateMetrics()                          │   │
│  │  ├── calculateTrends()                           │   │
│  │  ├── rankRisks()                                 │   │
│  │  └── generateRecommendations()                   │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                          ↓ gRPC/HTTP
┌─────────────────────────────────────────────────────────┐
│              ML SERVICE (Python FastAPI)                │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Model Server                                    │   │
│  │  ├── /predict/variance                           │   │
│  │  ├── /predict/anomaly                            │   │
│  │  ├── /train                                      │   │
│  │  └── /model/status                               │   │
│  └──────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────┐   │
│  │  ML Pipeline                                     │   │
│  │  ├── Feature Engineering                         │   │
│  │  ├── Model Training (ARIMA, Isolation Forest)    │   │
│  │  ├── Anomaly Detection                           │   │
│  │  ├── Risk Scoring                                │   │
│  │  └── Prediction Generation                       │   │
│  └──────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Data Processing                                 │   │
│  │  ├── Historical Data Loading                     │   │
│  │  ├── Feature Aggregation                         │   │
│  │  ├── Data Validation                             │   │
│  │  └── Result Formatting                           │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                          ↓ SQL
┌─────────────────────────────────────────────────────────┐
│              CACHE (Redis)                              │
│  - Metrics cache (5 min TTL)                            │
│  - Predictions cache (24 hour TTL)                      │
│  - Model metadata                                       │
└─────────────────────────────────────────────────────────┘
                          ↓ SQL
┌─────────────────────────────────────────────────────────┐
│              DATABASE (Supabase)                         │
│  ├── opname_sessions                                    │
│  ├── opname_items                                       │
│  ├── analytics_metrics (cached)                         │
│  ├── ml_predictions                                     │
│  ├── anomaly_alerts                                     │
│  └── recommendation_logs                                │
└─────────────────────────────────────────────────────────┘
```

---

## 📊 DATABASE SCHEMA DESIGN

### Table: analytics_metrics
**Purpose**: Pre-aggregated metrics untuk fast dashboard loading

```sql
CREATE TABLE analytics_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    outlet_id UUID REFERENCES outlets(id),
    metric_date DATE NOT NULL,
    metric_type VARCHAR(50),  -- 'daily', 'weekly', 'monthly'
    
    -- Variance Metrics
    total_items INT,
    items_with_variance INT,
    total_variance_rp NUMERIC(19,4),
    avg_variance_pct NUMERIC(5,2),
    max_variance_pct NUMERIC(5,2),
    min_variance_pct NUMERIC(5,2),
    
    -- Category Distribution
    variance_by_category JSONB,  -- { normal: 10, damage: 2, theft: 1, ... }
    
    -- Status Summary
    approved_count INT,
    rejected_count INT,
    pending_count INT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_analytics_metrics_tenant ON analytics_metrics(tenant_id, metric_date DESC);
CREATE INDEX idx_analytics_metrics_outlet ON analytics_metrics(outlet_id, metric_date DESC);
```

### Table: ml_predictions
**Purpose**: Store model predictions untuk variance & anomalies

```sql
CREATE TABLE ml_predictions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    outlet_id UUID REFERENCES outlets(id),
    bahan_id UUID REFERENCES bahan(id),
    
    prediction_type VARCHAR(20),  -- 'variance', 'anomaly', 'risk'
    predicted_value NUMERIC(10,4),
    confidence_score NUMERIC(3,2),  -- 0.0 to 1.0
    
    prediction_date DATE,
    prediction_window VARCHAR(20),  -- 'next_opname', '7_days', '30_days'
    
    -- Actual result (after opname)
    actual_value NUMERIC(10,4),
    is_accurate BOOLEAN,
    
    model_version VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_ml_predictions_outlet ON ml_predictions(outlet_id, prediction_date DESC);
CREATE INDEX idx_ml_predictions_bahan ON ml_predictions(bahan_id);
CREATE INDEX idx_ml_predictions_accuracy ON ml_predictions(is_accurate);
```

### Table: anomaly_alerts
**Purpose**: Track detected anomalies & investigation status

```sql
CREATE TABLE anomaly_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    opname_session_id UUID REFERENCES opname_sessions(id),
    
    anomaly_type VARCHAR(50),  -- 'outlier', 'trend_break', 'multivariate', 'fraud'
    severity VARCHAR(20),  -- 'low', 'medium', 'high', 'critical'
    
    -- Anomaly Details
    affected_items JSONB,  -- [{ bahan_id, variance, reason }]
    anomaly_score NUMERIC(3,2),
    explanation TEXT,
    
    -- Investigation
    investigation_status VARCHAR(20),  -- 'open', 'investigating', 'resolved'
    recommended_actions JSONB,  -- [{ action, priority, rationale }]
    
    investigated_by UUID REFERENCES users(id),
    investigation_notes TEXT,
    resolved_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_anomaly_alerts_outlet ON anomaly_alerts(tenant_id);
CREATE INDEX idx_anomaly_alerts_severity ON anomaly_alerts(severity);
CREATE INDEX idx_anomaly_alerts_status ON anomaly_alerts(investigation_status);
```

### Table: recommendation_logs
**Purpose**: Track recommendations & their outcomes

```sql
CREATE TABLE recommendation_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    anomaly_alert_id UUID REFERENCES anomaly_alerts(id),
    
    recommendation_type VARCHAR(50),  -- 'recount', 'supplier_review', 'process_change', 'inventory_adjust'
    priority VARCHAR(20),  -- 'high', 'medium', 'low'
    
    description TEXT,
    reasoning TEXT,
    
    -- Action tracking
    action_taken BOOLEAN DEFAULT FALSE,
    action_description TEXT,
    action_completed_by UUID REFERENCES users(id),
    action_completed_at TIMESTAMP WITH TIME ZONE,
    
    outcome TEXT,  -- 'positive', 'negative', 'neutral', 'pending'
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_recommendations_alert ON recommendation_logs(anomaly_alert_id);
CREATE INDEX idx_recommendations_priority ON recommendation_logs(priority);
```

### Table: model_metrics
**Purpose**: Track ML model performance

```sql
CREATE TABLE model_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    
    model_name VARCHAR(100),
    model_version VARCHAR(50),
    
    accuracy NUMERIC(5,2),
    precision NUMERIC(5,2),
    recall NUMERIC(5,2),
    f1_score NUMERIC(5,2),
    
    training_samples INT,
    evaluation_samples INT,
    
    last_trained TIMESTAMP WITH TIME ZONE,
    last_evaluated TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_model_metrics_name ON model_metrics(model_name, model_version);
```

---

## 🎨 FRONTEND COMPONENT DESIGN

### Page: Analytics Dashboard
```
StokOpnameAnalyticsDashboard
├── Header
│   ├── Title
│   ├── Date Range Picker
│   └── Export Button
│
├── KPI Cards Section
│   ├── Card: Total Items Counted
│   ├── Card: Average Variance %
│   ├── Card: Items with Variance
│   ├── Card: Anomalies Detected
│   ├── Card: Approval Rate
│   └── Card: Risk Score
│
├── Trends Section
│   ├── Variance Trend Chart (7-day, 30-day, 90-day)
│   ├── Volume Trend Chart
│   └── Category Distribution Pie
│
├── Predictions Section
│   ├── Expected Variance Next Opname
│   ├── Confidence Score
│   ├── Anomaly Probability
│   └── Risk Level Gauge
│
├── Risk Matrix Section
│   ├── Outlet Risk Distribution
│   ├── Category Risk Breakdown
│   ├── High-Risk Items List
│   └── Filter/Drill-down
│
├── Anomalies Section
│   ├── Active Anomalies List
│   ├── Severity Indicators
│   ├── Investigation Status
│   ├── Recommended Actions
│   └── Alert Details Modal
│
└── Bottom Section
    ├── Recent Investigations
    ├── Successful Recommendations
    └── Historical Comparison
```

### Component: Prediction Insights
```
PredictionInsights
├── Title: "Analisa Prediksi Opname Berikutnya"
├── Timeline
│   ├── Confidence Score Progress Bar
│   ├── Predicted Variance Range
│   ├── Historical Comparison
│   └── Model Confidence Level
├── Factors
│   ├── Top Contributing Factors
│   ├── Risk Indicators
│   └── Positive Factors
└── Recommendations
    ├── Focus Areas
    ├── Suggested Actions
    └── Expected Improvements
```

### Component: Anomaly Alert Card
```
AnomalyCard
├── Severity Badge
├── Type Label
├── Main Metric
├── Affected Items
├── Confidence Score
├── Explanation
├── Recommended Actions
└── Action Buttons (Investigate, Close, More Details)
```

### Component: Custom Report Builder
```
ReportBuilder
├── Step 1: Select Report Type
│   ├── Variance Summary
│   ├── Trend Analysis
│   ├── Risk Assessment
│   ├── Anomaly Report
│   └── Custom
├── Step 2: Configure Metrics
│   ├── Checkboxes for metrics
│   ├── Date range selector
│   ├── Outlet filter
│   └── Category filter
├── Step 3: Configure Layout
│   ├── Chart type selector
│   ├── Sort options
│   └── Group by options
└── Step 4: Generate & Export
    ├── Preview
    ├── Download buttons (PDF, Excel, CSV)
    └── Schedule recurring
```

---

## 📋 API ENDPOINT DESIGN

### Analytics Endpoints
```
GET /api/analytics/dashboard
├── Input: { tenant_id, outlet_id, date_range }
├── Output: { kpi_cards, charts_data, alerts_summary }
└── Cache: 5 minutes

GET /api/analytics/trends
├── Input: { outlet_id, metric, window: '7d'|'30d'|'90d' }
├── Output: { trend_data, comparison, insight }
└── Cache: 5 minutes

GET /api/analytics/variance-distribution
├── Input: { outlet_id, date_range }
├── Output: { by_category, by_outlet, top_items }
└── Cache: 5 minutes

GET /api/analytics/risk-matrix
├── Input: { outlet_id }
├── Output: { risk_scores, categories, recommendations }
└── Cache: 1 hour
```

### Prediction Endpoints
```
GET /api/predictions/variance
├── Input: { outlet_id, bahan_id (optional) }
├── Output: { predicted_variance, confidence, range }
└── Cache: 24 hours

GET /api/predictions/anomalies
├── Input: { outlet_id, sensitivity }
├── Output: { anomaly_list, scores, explanations }
└── Cache: 5 minutes

POST /api/predictions/train
├── Input: { force_retrain: boolean }
├── Output: { training_status, model_version, metrics }
└── Async: Returns job_id

GET /api/predictions/status
├── Input: { job_id }
├── Output: { status, progress, result }
```

### Anomaly Endpoints
```
GET /api/anomalies/alerts
├── Input: { severity, status, outlet_id }
├── Output: { alerts[], total_count }
└── Cache: 1 minute

PUT /api/anomalies/:alertId/investigate
├── Input: { notes, assigned_to, status }
├── Output: { alert }

PUT /api/anomalies/:alertId/resolve
├── Input: { resolution_notes, outcome }
├── Output: { alert }
```

### Report Endpoints
```
POST /api/reports/generate
├── Input: { report_type, filters, format }
├── Output: { report_id, status, download_url }
└── Async

GET /api/reports/:reportId
├── Output: File download

POST /api/reports/schedule
├── Input: { report_config, schedule_cron }
├── Output: { scheduled_report }

GET /api/reports/templates
├── Output: { templates[] }
```

---

## 🔄 ML PIPELINE DESIGN

### Data Flow
```
Historical Opname Data
    ↓
Data Cleaning & Validation
    ↓
Feature Engineering
    ├── Time-based features (day, week, month, season)
    ├── Item features (category, unit, historical variance)
    ├── Outlet features (location, size, performance history)
    └── Transaction features (sales, purchases, transfers)
    ↓
Feature Aggregation
    ↓
Model Training
    ├── ARIMA (time-series forecasting)
    ├── Isolation Forest (anomaly detection)
    ├── Random Forest (risk scoring)
    └── LSTM (optional - complex patterns)
    ↓
Model Evaluation
    ├── Accuracy check
    ├── Precision/Recall calculation
    ├── Cross-validation
    └── Backtesting
    ↓
Model Deployment
    ├── Versioning
    ├── Registry
    └── Serving endpoints
```

### Feature Set
```
Temporal Features
- Day of week, Hour, Month, Season
- Days since last opname
- Historical trend (7-day, 30-day avg)

Item Features
- Category, Unit, Cost
- Historical variance (mean, std dev)
- Recency score
- Popularity score

Outlet Features
- Size category, Location region
- Average variance history
- Staff turnover rate (if available)
- Compliance score

Transaction Features
- Recent sales volume
- Purchase frequency
- Transfer activity
- Adjustment frequency
```

### Model Selection
```
Variance Prediction: ARIMA or Prophet
- Time-series specific
- Good for trend forecasting
- Fast inference
- Interpretable

Anomaly Detection: Isolation Forest
- Robust to outliers
- Handles high dimensions
- Good precision
- Fast

Risk Scoring: Random Forest
- Multi-factor decision
- Good interpretability
- Handles non-linear relationships
- Feature importance insights

Pattern Recognition (optional): LSTM
- Complex temporal patterns
- Longer dependencies
- More data required
- Slower inference
```

---

## 🧠 Intelligence Features

### Anomaly Detection Algorithm
```
1. Load historical variance data (12 months)
2. Calculate mean & std deviation
3. For new variance:
   a. Check if outside 2σ range (statistical outlier)
   b. Compare to seasonal pattern
   c. Check against recent trend
   d. Multivariate check (correlated items)
4. If anomaly detected:
   a. Calculate anomaly score
   b. Generate explanation
   c. Recommend actions
   d. Create alert
```

### Risk Scoring Formula
```
risk_score = (
    0.3 * variance_factor +
    0.2 * frequency_factor +
    0.2 * recency_factor +
    0.15 * category_factor +
    0.15 * outlet_factor
) * confidence_multiplier

Where:
- variance_factor: normalized variance amount
- frequency_factor: how often this item has variance
- recency_factor: weight recent vs old data
- category_factor: category-specific risk baseline
- outlet_factor: outlet's overall risk profile
- confidence_multiplier: model confidence in prediction
```

### Recommendation Engine Logic
```
IF variance > 15% AND is_negative THEN
  - HIGH priority: "Recount - potential shrinkage"
ELSE IF variance > 10% AND frequency > 2 THEN
  - HIGH priority: "Review supplier - recurring variance"
ELSE IF trend_is_increasing AND velocity > threshold THEN
  - MEDIUM priority: "Investigate trend - possible process issue"
ELSE IF anomaly_detected THEN
  - MEDIUM/HIGH priority: "Investigate anomaly - unusual pattern"
ELSE IF variance > 5% AND tolerance_exceeded THEN
  - LOW priority: "Monitor - within tolerance but track"
```

---

## ⚙️ IMPLEMENTATION DETAILS

### Technology Stack
**Backend**: Express.js, Node.js
**ML Service**: Python (FastAPI)
**ML Libraries**: scikit-learn, pandas, numpy, statsmodels/Prophet
**Cache**: Redis
**Database**: Supabase (PostgreSQL)
**Async Jobs**: Bull (Redis queue)
**Frontend**: React, Recharts/Chart.js

### Deployment Architecture
```
Frontend (React) → API Gateway (Express)
                ↓
            Cache (Redis)
                ↓
    ┌───────────────────┐
    ↓                   ↓
Database (Supabase)   ML Service (Python)
                      (separate container)
```

### Performance Considerations
- Dashboard queries: Use aggregated metrics table
- Predictions: Cache for 24 hours
- Anomaly detection: Real-time, but results cached
- Report generation: Async with job queue
- Model training: Scheduled off-peak (nightly)

