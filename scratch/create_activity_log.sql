CREATE TABLE IF NOT EXISTS activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  role TEXT NOT NULL,
  method TEXT NOT NULL,
  resource TEXT NOT NULL,
  resource_id UUID,
  before_json JSONB,
  after_json JSONB,
  duration_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Indexes for fast filtering
CREATE INDEX IF NOT EXISTS idx_activity_log_user ON activity_log (user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_tenant ON activity_log (tenant_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_resource ON activity_log (resource);
