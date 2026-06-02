-- Migration: Create Customisations Table
-- This script creates the customisations table for POS settings
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS customisations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    outlet_id UUID,
    key TEXT NOT NULL,
    value JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, outlet_id, key)
);

-- Disable RLS for development
ALTER TABLE customisations DISABLE ROW LEVEL SECURITY;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_customisations_tenant ON customisations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_customisations_outlet ON customisations(outlet_id);
CREATE INDEX IF NOT EXISTS idx_customisations_key ON customisations(key);
