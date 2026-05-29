-- 1. Add status column to journals if not exists
ALTER TABLE journals ADD COLUMN IF NOT EXISTS status text DEFAULT 'APPROVED';

-- 2. Create RPC function for Atomic Journal Entry with pre-flight check
CREATE OR REPLACE FUNCTION create_journal_transaction(
  header_payload jsonb,
  lines_payload jsonb[]
) RETURNS jsonb AS $$
DECLARE
  v_journal_id uuid;
  v_tenant_id uuid;
  v_debit_total numeric := 0;
  v_credit_total numeric := 0;
  v_lines_inserted jsonb[];
  v_line_item jsonb;
  v_acc_id uuid;
  v_acc_name text;
  v_inserted_line_id uuid;
  v_ret jsonb;
BEGIN
  -- Resolve Tenant
  v_tenant_id := (header_payload->>'tenant_id')::uuid;

  -- 1. Pre-flight check: Calculate debit and credit totals
  FOREACH v_line_item IN ARRAY lines_payload LOOP
    v_debit_total := v_debit_total + COALESCE((v_line_item->>'debit')::numeric, 0);
    v_credit_total := v_credit_total + COALESCE((v_line_item->>'credit')::numeric, 0);
  END LOOP;

  -- Enforce double-entry accounting balance
  IF ABS(v_debit_total - v_credit_total) > 0.01 THEN
    RAISE EXCEPTION 'Journal entry is not balanced: Total Debit (%) must equal Total Credit (%)', v_debit_total, v_credit_total;
  END IF;

  -- 2. Insert Header
  INSERT INTO journals (
    tenant_id, date, reference, notes, status, created_at
  ) VALUES (
    v_tenant_id,
    COALESCE((header_payload->>'date')::timestamp with time zone, now()),
    header_payload->>'reference',
    header_payload->>'notes',
    COALESCE(header_payload->>'status', 'APPROVED'),
    now()
  ) RETURNING id INTO v_journal_id;

  -- 3. Insert Lines with dynamic account resolution
  FOREACH v_line_item IN ARRAY lines_payload LOOP
    -- Resolve account dynamically from accounts table to ensure database integrity
    SELECT id, name INTO v_acc_id, v_acc_name
    FROM accounts
    WHERE tenant_id = v_tenant_id AND code = v_line_item->>'account_code'
    LIMIT 1;

    -- Fallback if no account found (can auto-create later, but let's assert/resolve here)
    IF v_acc_id IS NULL THEN
      -- Optional Auto-create account safely if template code matches standard patterns
      IF (v_line_item->>'account_code') ~ '^[1-5]\d{3}$' THEN
        INSERT INTO accounts (tenant_id, code, name, category, normal_balance, is_active, created_at)
        VALUES (
          v_tenant_id,
          v_line_item->>'account_code',
          COALESCE(v_line_item->>'account_name', 'Account ' || (v_line_item->>'account_code')),
          CASE 
            WHEN (v_line_item->>'account_code') LIKE '1%' THEN 'Asset'
            WHEN (v_line_item->>'account_code') LIKE '2%' THEN 'Liability'
            WHEN (v_line_item->>'account_code') LIKE '3%' THEN 'Equity'
            WHEN (v_line_item->>'account_code') LIKE '4%' THEN 'Revenue'
            ELSE 'Expense'
          END,
          CASE 
            WHEN (v_line_item->>'account_code') LIKE '1%' OR (v_line_item->>'account_code') LIKE '5%' THEN 'Debit'
            ELSE 'Credit'
          END,
          true,
          now()
        ) RETURNING id, name INTO v_acc_id, v_acc_name;
      ELSE
        RAISE EXCEPTION 'Invalid Account Code: % does not match required Chart of Accounts (COA) templates.', v_line_item->>'account_code';
      END IF;
    END IF;

    -- Insert Journal Line
    INSERT INTO journal_lines (
      tenant_id, journal_id, account_code, account_id, account_name, debit, credit, created_at
    ) VALUES (
      v_tenant_id,
      v_journal_id,
      v_line_item->>'account_code',
      v_acc_id,
      v_acc_name,
      ROUND(COALESCE((v_line_item->>'debit')::numeric, 0), 2),
      ROUND(COALESCE((v_line_item->>'credit')::numeric, 0), 2),
      now()
    );
  END LOOP;

  -- 4. Return the created journal object along with its ID
  SELECT json_build_object('id', v_journal_id, 'status', COALESCE(header_payload->>'status', 'APPROVED')) INTO v_ret;
  RETURN v_ret;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
