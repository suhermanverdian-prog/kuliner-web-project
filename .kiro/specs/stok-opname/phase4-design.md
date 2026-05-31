# STOK OPNAME SYSTEM - PHASE 4 DESIGN
## Enterprise Security, Compliance & Operations Architecture

---

## 🏗️ ENTERPRISE ARCHITECTURE OVERVIEW

```
┌──────────────────────────────────────────────────────────────┐
│                    MULTI-TENANT ARCHITECTURE                 │
├──────────────────────────────────────────────────────────────┤
│
│  ┌─────────────────────────────────────────────────────┐
│  │            SECURITY LAYER (Edge)                    │
│  │  ├─ DDoS Protection (Cloudflare/AWS Shield)       │
│  │  ├─ WAF (Web Application Firewall)                │
│  │  ├─ API Gateway (Rate limiting, Auth)            │
│  │  └─ TLS 1.3 Termination                           │
│  └─────────────────────────────────────────────────────┘
│
│  ┌─────────────────────────────────────────────────────┐
│  │         APPLICATION LAYER (K8s)                     │
│  │  ┌──────────────┐  ┌──────────────┐              │
│  │  │ Express API  │  │ ML Service   │              │
│  │  │ (Multi-zone) │  │ (Separate)   │              │
│  │  └──────────────┘  └──────────────┘              │
│  │  ├─ Load Balancer                                │
│  │  ├─ Horizontal scaling                           │
│  │  ├─ Health checks                                │
│  │  └─ Circuit breakers                             │
│  └─────────────────────────────────────────────────────┘
│
│  ┌─────────────────────────────────────────────────────┐
│  │         DATA LAYER (Encrypted)                      │
│  │  ┌──────────────┐  ┌──────────────┐              │
│  │  │ PostgreSQL   │  │  Redis       │              │
│  │  │ (Primary)    │  │  (Cache)     │              │
│  │  └──────────────┘  └──────────────┘              │
│  │  ├─ Encryption at rest (AES-256)                 │
│  │  ├─ Replication (HA)                             │
│  │  ├─ Backups (geo-redundant)                      │
│  │  └─ Audit logs (immutable)                       │
│  └─────────────────────────────────────────────────────┘
│
│  ┌─────────────────────────────────────────────────────┐
│  │         OBSERVABILITY LAYER                         │
│  │  ├─ Prometheus (Metrics)                          │
│  │  ├─ ELK Stack (Logs)                              │
│  │  ├─ Jaeger (Tracing)                              │
│  │  ├─ Grafana (Dashboards)                          │
│  │  └─ AlertManager (Alerts)                         │
│  └─────────────────────────────────────────────────────┘
│
└──────────────────────────────────────────────────────────────┘

Per-Tenant Isolation:
├─ Network: VPC per region, subnet per tenant (optional)
├─ Database: Schema isolation + row-level security
├─ Compute: Pod affinity rules
├─ Storage: Encrypted buckets per tenant
└─ Audit: Separate audit log per tenant
```

---

## 🔐 SECURITY ARCHITECTURE

### Layered Security Model

```
┌─────────────────────────────────────────────────────┐
│ Layer 1: Edge Security (Cloudflare/AWS WAF)         │
│ ├─ DDoS protection                                  │
│ ├─ Bot detection                                    │
│ ├─ Rate limiting                                    │
│ └─ Geographic filtering                             │
└─────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────┐
│ Layer 2: API Gateway & TLS                          │
│ ├─ Client certificate validation                    │
│ ├─ TLS 1.3 enforcement                              │
│ ├─ Certificate pinning                              │
│ └─ Request signing                                  │
└─────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────┐
│ Layer 3: Authentication & Authorization             │
│ ├─ OAuth2 / OpenID Connect                          │
│ ├─ Multi-Factor Authentication (2FA/TOTP)          │
│ ├─ RBAC (Role-Based Access Control)                │
│ ├─ ABAC (Attribute-Based Access Control)           │
│ └─ Token management & refresh                       │
└─────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────┐
│ Layer 4: Application Security                       │
│ ├─ Input validation & sanitization                  │
│ ├─ SQL injection prevention                         │
│ ├─ XSS prevention                                   │
│ ├─ CSRF protection                                  │
│ ├─ Rate limiting per user                           │
│ └─ Audit logging                                    │
└─────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────┐
│ Layer 5: Data Security                              │
│ ├─ Encryption at rest (AES-256)                     │
│ ├─ Field-level encryption (sensitive data)          │
│ ├─ Tokenization (PII)                               │
│ ├─ Key rotation (quarterly)                         │
│ ├─ Secure key storage (KMS)                         │
│ └─ Immutable audit logs                             │
└─────────────────────────────────────────────────────┘
```

### Authentication & Authorization Model

```
User Login
    ↓
┌─ OAuth2 / SAML / OpenID Connect ─┐
│                                    │
├─ Validate Credentials             │
├─ Generate Tokens (JWT)            │
│  ├─ Access Token (15 min)         │
│  ├─ Refresh Token (7 days)        │
│  └─ Signed with RS256             │
│                                    │
├─ 2FA/TOTP Challenge (if enabled)  │
│                                    │
└─ Load User Permissions            │
    ├─ Tenant ID
    ├─ Roles
    ├─ Features access
    └─ Resource limits

Each Request:
├─ Validate JWT signature
├─ Check token expiration
├─ Verify tenant isolation
├─ Check permission for resource
└─ Log access attempt
```

---

## 💾 DATA ARCHITECTURE

### Multi-Tenant Database Design

```
Database: stok_opname_prod

Schema Per Tenant (Optional):
├─ public_*               (shared references)
├─ tenant_{id}_opname     (opname data)
├─ tenant_{id}_analytics  (analytics data)
├─ tenant_{id}_audit      (audit logs)
└─ tenant_{id}_ml         (ML models & predictions)

Row-Level Security (RLS):
├─ Enable RLS on all tables
├─ Filter by tenant_id in WHERE clause
├─ Policies prevent cross-tenant access
└─ Audit RLS violations

Encryption Strategy:
├─ Column-level encryption for sensitive fields
│  ├─ Variance details (encrypted)
│  ├─ Predictions (encrypted)
│  └─ Audit logs (encrypted but queryable)
├─ Database encryption (TDE/EDB)
├─ Backup encryption
└─ Key management via AWS KMS / Vault
```

### Audit Log Architecture

```
Immutable Audit Log Design:
├─ Separate table: audit_logs
├─ Append-only (no updates/deletes)
├─ Indexed by: timestamp, user_id, resource_id
├─ Encrypted: sensitive fields
├─ Fields:
│  ├─ timestamp (UTC)
│  ├─ user_id
│  ├─ action (CREATE, UPDATE, DELETE, APPROVE, etc.)
│  ├─ resource_type (opname_session, variance, approval, etc.)
│  ├─ resource_id
│  ├─ old_value (JSON)
│  ├─ new_value (JSON)
│  ├─ ip_address
│  ├─ user_agent
│  ├─ tenant_id
│  └─ hash (SHA-256 of record for tamper detection)
└─ Retention: Configurable (default: 7 years)

Compliance Reporting:
├─ Export by date range
├─ Filter by action/user/resource
├─ Include computed hash for verification
└─ Generate compliance reports
```

---

## 🔄 DEPLOYMENT ARCHITECTURE

### High Availability Setup

```
┌─────────────────────────────────────────────────────┐
│           MULTI-REGION DEPLOYMENT                   │
├─────────────────────────────────────────────────────┤
│
│  ┌──────────────────┐         ┌──────────────────┐
│  │   Region A       │         │   Region B       │
│  │  (Active)        │         │  (Standby)       │
│  │                  │         │                  │
│  │ ┌──────────────┐ │         │ ┌──────────────┐ │
│  │ │ K8s Cluster  │ │         │ │ K8s Cluster  │ │
│  │ │ (3 zones)    │ │         │ │ (3 zones)    │ │
│  │ └──────────────┘ │         │ └──────────────┘ │
│  │                  │         │                  │
│  │ ┌──────────────┐ │         │ ┌──────────────┐ │
│  │ │ PostgreSQL   │◄├─────────┤►│ PostgreSQL   │ │
│  │ │ (Primary)    │ │ Sync    │ │ (Replica)    │ │
│  │ └──────────────┘ │ Repl    │ └──────────────┘ │
│  │                  │         │                  │
│  └──────────────────┘         └──────────────────┘
│         ↑                             ↑
│         └─────────────────────────────┘
│         Active-Active Load Balancer
│         (Route 53 / Global Load Balancer)
│
│  Backup:
│  ├─ Daily backups to S3 (geo-redundant)
│  ├─ Point-in-time recovery (PITR) - 35 days
│  ├─ Backup encryption (KMS)
│  └─ Backup verification (weekly restore test)
│
└─────────────────────────────────────────────────────┘

Failover Process:
├─ Health check every 10 seconds
├─ If Region A down → Route 53 switches to Region B
├─ Database failover: Automated (< 1 min)
├─ Data sync delay: < 15 seconds (async replication)
└─ RTO: < 5 min, RPO: < 15 min
```

### Container Orchestration (Kubernetes)

```
Cluster Setup:
├─ Control plane (3 masters): HA setup
├─ Worker nodes: Auto-scaling (5-50 nodes)
├─ Node types:
│  ├─ Compute nodes (API, ML)
│  ├─ Memory nodes (Cache, Analytics)
│  └─ Storage nodes (Databases)
│
├─ Namespaces:
│  ├─ production (main workloads)
│  ├─ monitoring (observability)
│  ├─ logging (ELK stack)
│  └─ ci-cd (build/deploy)
│
├─ Network Policies:
│  ├─ Ingress rules: API gateway only
│  ├─ Egress rules: KMS, S3, external APIs
│  └─ No pod-to-pod cross-namespace
│
└─ Resource Management:
   ├─ CPU limits: API 1, ML 4 CPUs
   ├─ Memory limits: API 2GB, ML 16GB
   ├─ PVC storage: Persistent volumes for data
   └─ Requests: Reserved capacity
```

---

## 📊 COMPLIANCE ARCHITECTURE

### GDPR Compliance

```
Data Processing Agreement (DPA):
├─ Data classification
├─ Processing locations
├─ Sub-processor management
├─ Data subject rights handling
│  ├─ Right to access
│  ├─ Right to erasure (right to be forgotten)
│  ├─ Right to data portability
│  └─ Right to restrict processing
└─ Breach notification procedures

Technical Implementation:
├─ Data anonymization (pseudonymization)
├─ Differential privacy for analytics
├─ Consent management system
├─ Cookie consent banner
├─ Data export API (JSON/CSV)
├─ Data deletion confirmation
└─ Privacy impact assessment (DPIA)
```

### SOC2 Type II Compliance

```
SOC2 Control Areas:
├─ CC (Common Criteria)
│  ├─ CC1: Organization & Governance
│  ├─ CC2: Communication & Responsibilities
│  ├─ CC3: Policies & Procedures
│  ├─ CC4: Change Management
│  ├─ CC5: Access Controls
│  ├─ CC6: Logical & Physical Controls
│  ├─ CC7: Deficiency Management
│  └─ CC8: Shared Services & Segregation
│
├─ Security Criteria
│  ├─ Encryption at rest & in transit
│  ├─ Access controls (MFA, RBAC)
│  ├─ Audit logging
│  ├─ Incident response
│  └─ Penetration testing (annual)
│
├─ Availability Criteria
│  ├─ 99.95% uptime
│  ├─ Disaster recovery
│  ├─ Backup & restore
│  └─ Health monitoring
│
└─ Confidentiality & Privacy
    ├─ Data classification
    ├─ Access restrictions
    ├─ Encryption
    └─ Retention policies

Audit Schedule:
├─ Internal audit (quarterly)
├─ External audit (annual) - 6 months duration
└─ Remediation of findings
```

---

## 🔍 OBSERVABILITY ARCHITECTURE

### Monitoring Stack

```
┌─────────────────────────────────────────────────┐
│        OBSERVABILITY (Logs, Metrics, Traces)    │
├─────────────────────────────────────────────────┤
│
│  METRICS (Prometheus)
│  ├─ System: CPU, Memory, Disk, Network
│  ├─ Application: Request rate, latency, errors
│  ├─ Database: Query time, connections, locks
│  ├─ ML: Model accuracy, prediction latency
│  └─ Business: Opname count, approval rate
│
│  LOGS (ELK Stack)
│  ├─ Filebeat: Collect logs from containers
│  ├─ Logstash: Parse & enrich logs
│  ├─ Elasticsearch: Store (7-day retention)
│  ├─ Kibana: Visualize
│  └─ Audit logs: Separate, immutable storage
│
│  TRACES (Jaeger)
│  ├─ Distributed tracing
│  ├─ Request flow visualization
│  ├─ Latency analysis
│  ├─ Dependency mapping
│  └─ Sampling: 10% of requests
│
│  DASHBOARDS (Grafana)
│  ├─ System Health
│  ├─ Application Performance
│  ├─ User Analytics
│  ├─ Security Events
│  └─ Business Metrics
│
│  ALERTING (AlertManager)
│  ├─ High latency (p95 > 500ms)
│  ├─ High error rate (> 1%)
│  ├─ Pod crashes
│  ├─ Database alerts
│  ├─ Security alerts
│  └─ Capacity warnings
│
└─────────────────────────────────────────────────┘
```

---

## 🚀 INFRASTRUCTURE AS CODE

### Terraform Modules

```
terraform/
├─ aws/
│  ├─ vpc/              (Network infrastructure)
│  ├─ eks/              (Kubernetes cluster)
│  ├─ rds/              (Database)
│  ├─ elasticache/      (Redis)
│  ├─ s3/               (Storage & backups)
│  ├─ kms/              (Key management)
│  ├─ cloudfront/       (CDN)
│  ├─ cloudwatch/       (Monitoring)
│  └─ iam/              (Roles & policies)
│
├─ kubernetes/
│  ├─ namespaces/
│  ├─ deployments/
│  ├─ services/
│  ├─ configmaps/
│  ├─ secrets/
│  ├─ rbac/
│  ├─ network-policies/
│  └─ storage-classes/
│
├─ monitoring/
│  ├─ prometheus/
│  ├─ grafana/
│  ├─ elk/
│  └─ alertmanager/
│
└─ variables.tf
   outputs.tf
   main.tf
```

---

## 🔗 INTEGRATION ARCHITECTURE

### ERP Integration

```
┌──────────────────────────────────────────────────┐
│        INTEGRATION LAYER                         │
├──────────────────────────────────────────────────┤
│
│  ┌─────────────────────────────────────────┐
│  │  Stok Opname API (Webhook-based)       │
│  │  ├─ POST /webhooks/inventory-update    │
│  │  ├─ POST /webhooks/journal-created     │
│  │  ├─ GET /api/v1/opname/sessions       │
│  │  └─ GET /api/v1/analytics/reports     │
│  └─────────────────────────────────────────┘
│         ↓ (REST + JSON)
│  ┌─────────────────────────────────────────┐
│  │  ERP System (SAP, Oracle, NetSuite)    │
│  │  ├─ Inventory module                    │
│  │  ├─ General ledger module              │
│  │  ├─ Reporting module                    │
│  │  └─ Analytics module                    │
│  └─────────────────────────────────────────┘
│
│  Error Handling:
│  ├─ Retry logic (exponential backoff)
│  ├─ Dead letter queue for failed events
│  ├─ Webhook signature validation
│  ├─ Request idempotency (unique IDs)
│  └─ Detailed integration logs
│
└──────────────────────────────────────────────────┘
```

---

## 📋 TECHNOLOGY STACK

### Infrastructure
- Cloud: AWS (primary) / GCP / Azure compatible
- Kubernetes: EKS / GKE / AKS
- Database: PostgreSQL 14+ (managed RDS/Cloud SQL)
- Cache: Redis (managed ElastiCache/Memorystore)
- Storage: S3 / GCS (geo-redundant)

### Security
- TLS: Cert-Manager + Let's Encrypt (or commercial CA)
- Secrets: AWS Secrets Manager / HashiCorp Vault
- KMS: AWS KMS / GCP Cloud KMS
- IAM: Kubernetes RBAC + Cloud IAM
- WAF: AWS WAF / Cloudflare

### Observability
- Metrics: Prometheus + Grafana
- Logs: ELK Stack (Elasticsearch + Logstash + Kibana)
- Traces: Jaeger / AWS X-Ray
- APM: New Relic / Datadog (optional premium)

### CI/CD
- Version Control: Git (GitHub / GitLab)
- CI: GitHub Actions / GitLab CI / Jenkins
- CD: ArgoCD / Flux
- Registry: ECR / GCR / Docker Hub

### Compliance & Security
- SIEM: Splunk / ELK with security plugin
- Vulnerability Scanning: Trivy / Snyk
- Infrastructure Scanning: Prowler / Forseti
- Patch Management: Dependabot / Renovate

---

## 📈 SCALING STRATEGY

### Horizontal Scaling

```
Load Distribution:
├─ Frontend: CDN (CloudFront/Cloudflare)
├─ API: Load balancer + auto-scaling (3-50 pods)
├─ Database: Read replicas + caching
├─ Cache: Redis cluster (3+ nodes)
└─ ML: Batch processing + async queues

Auto-scaling Triggers:
├─ CPU > 70%: Add pod
├─ CPU < 30%: Remove pod
├─ Memory > 80%: Alert
├─ Disk > 85%: Alert & cleanup
└─ Request latency p95 > 500ms: Add pod
```

### Vertical Scaling

```
Node Capacity:
├─ Compute nodes: 4-16 CPUs, 16-64 GB RAM
├─ Memory nodes: 4 CPUs, 32-256 GB RAM
├─ Storage nodes: NVMe for performance
└─ GPU nodes: For ML model training (optional)
```

---

**Status**: Phase 4 Design Complete  
**Ready for**: Task Breakdown  

