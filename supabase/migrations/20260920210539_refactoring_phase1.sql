-- Phase 1: Security and Integrity Migration

-- 1. Soft Deletes
ALTER TABLE public.profile_ledger ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.payables ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.transaction_records ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- 2. Payment Validation
ALTER TABLE public.transaction_records ADD CONSTRAINT check_payment_amount_positive CHECK (amount > 0);

CREATE OR REPLACE FUNCTION public.check_payment_overpay()
RETURNS TRIGGER AS $$
DECLARE
    v_payable_amount NUMERIC(10,2);
    v_total_paid NUMERIC(10,2);
BEGIN
    SELECT amount INTO v_payable_amount FROM public.payables WHERE id = NEW.payable_id;
    
    SELECT COALESCE(SUM(amount), 0) INTO v_total_paid 
    FROM public.transaction_records 
    WHERE payable_id = NEW.payable_id 
      AND deleted = false 
      AND deleted_at IS NULL
      AND id != NEW.id;

    IF v_total_paid + NEW.amount > v_payable_amount THEN
        RAISE EXCEPTION 'Payment exceeds remaining payable balance.';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_payment_overpay ON public.transaction_records;
CREATE TRIGGER trg_check_payment_overpay
BEFORE INSERT OR UPDATE ON public.transaction_records
FOR EACH ROW EXECUTE FUNCTION public.check_payment_overpay();

-- 3. Audit Logs via Triggers
CREATE OR REPLACE FUNCTION public.log_audit_event()
RETURNS TRIGGER AS $$
DECLARE
    v_user TEXT;
    v_role TEXT;
    v_action TEXT;
    v_details TEXT;
BEGIN
    v_user := COALESCE(current_setting('request.jwt.claims', true)::json->>'email', 'System');
    v_role := COALESCE(current_setting('request.jwt.claims', true)::json->'user_metadata'->>'role', 'system');
    
    IF TG_OP = 'INSERT' THEN
        v_action := 'Created ' || TG_TABLE_NAME;
        v_details := 'Added record with ID ' || NEW.id;
        INSERT INTO public.audit_logs ("user", role, action, details) VALUES (v_user, v_role, v_action, v_details);
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        IF NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
            v_action := 'Deleted ' || TG_TABLE_NAME;
            v_details := 'Soft deleted record with ID ' || NEW.id;
        ELSE
            v_action := 'Updated ' || TG_TABLE_NAME;
            v_details := 'Modified record with ID ' || NEW.id;
        END IF;
        INSERT INTO public.audit_logs ("user", role, action, details) VALUES (v_user, v_role, v_action, v_details);
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        v_action := 'Hard Deleted ' || TG_TABLE_NAME;
        v_details := 'Hard deleted record with ID ' || OLD.id;
        INSERT INTO public.audit_logs ("user", role, action, details) VALUES (v_user, v_role, v_action, v_details);
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_audit_profile_ledger ON public.profile_ledger;
CREATE TRIGGER trg_audit_profile_ledger AFTER INSERT OR UPDATE OR DELETE ON public.profile_ledger FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

DROP TRIGGER IF EXISTS trg_audit_payables ON public.payables;
CREATE TRIGGER trg_audit_payables AFTER INSERT OR UPDATE OR DELETE ON public.payables FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

DROP TRIGGER IF EXISTS trg_audit_transactions ON public.transaction_records;
CREATE TRIGGER trg_audit_transactions AFTER INSERT OR UPDATE OR DELETE ON public.transaction_records FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

-- Default recorded_by
ALTER TABLE public.transaction_records ALTER COLUMN recorded_by SET DEFAULT COALESCE(current_setting('request.jwt.claims', true)::json->>'email', 'System');

-- 4. RLS Policies
DROP POLICY IF EXISTS "Allow authenticated full access to profile_ledger" ON public.profile_ledger;
DROP POLICY IF EXISTS "Allow authenticated full access to payables" ON public.payables;
DROP POLICY IF EXISTS "Allow authenticated full access to transaction_records" ON public.transaction_records;
DROP POLICY IF EXISTS "Allow authenticated full access to edit_requests" ON public.edit_requests;
DROP POLICY IF EXISTS "Allow authenticated full access to audit_logs" ON public.audit_logs;

CREATE OR REPLACE FUNCTION public.user_role() RETURNS text AS $$
  SELECT COALESCE(current_setting('request.jwt.claims', true)::json->'user_metadata'->>'role', 'viewer')::text;
$$ LANGUAGE SQL STABLE;

-- Read for all authenticated
CREATE POLICY "Enable read access for all authenticated users" ON public.profile_ledger FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable read access for all authenticated users" ON public.payables FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable read access for all authenticated users" ON public.transaction_records FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable read access for all authenticated users" ON public.audit_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable read access for all authenticated users" ON public.edit_requests FOR SELECT TO authenticated USING (true);

-- Insert/Update for admins and treasurers
CREATE POLICY "Enable insert for admins and treasurers" ON public.profile_ledger FOR INSERT TO authenticated WITH CHECK (public.user_role() IN ('admin', 'treasurer'));
CREATE POLICY "Enable update for admins and treasurers" ON public.profile_ledger FOR UPDATE TO authenticated USING (public.user_role() IN ('admin', 'treasurer'));
CREATE POLICY "Enable delete for admins" ON public.profile_ledger FOR DELETE TO authenticated USING (public.user_role() = 'admin');

CREATE POLICY "Enable insert for admins and treasurers" ON public.payables FOR INSERT TO authenticated WITH CHECK (public.user_role() IN ('admin', 'treasurer'));
CREATE POLICY "Enable update for admins and treasurers" ON public.payables FOR UPDATE TO authenticated USING (public.user_role() IN ('admin', 'treasurer'));
CREATE POLICY "Enable delete for admins" ON public.payables FOR DELETE TO authenticated USING (public.user_role() = 'admin');

CREATE POLICY "Enable insert for admins and treasurers" ON public.transaction_records FOR INSERT TO authenticated WITH CHECK (public.user_role() IN ('admin', 'treasurer'));
CREATE POLICY "Enable update for admins and treasurers" ON public.transaction_records FOR UPDATE TO authenticated USING (public.user_role() IN ('admin', 'treasurer'));
CREATE POLICY "Enable delete for admins" ON public.transaction_records FOR DELETE TO authenticated USING (public.user_role() = 'admin');

CREATE POLICY "Enable insert for admins and treasurers" ON public.edit_requests FOR INSERT TO authenticated WITH CHECK (public.user_role() IN ('admin', 'treasurer'));
CREATE POLICY "Enable update for admins and treasurers" ON public.edit_requests FOR UPDATE TO authenticated USING (public.user_role() IN ('admin', 'treasurer'));
CREATE POLICY "Enable delete for admins" ON public.edit_requests FOR DELETE TO authenticated USING (public.user_role() = 'admin');

-- Prevent direct modification of audit logs
CREATE POLICY "Prevent direct inserts to audit logs" ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (false);
CREATE POLICY "Prevent updates to audit logs" ON public.audit_logs FOR UPDATE TO authenticated USING (false);
CREATE POLICY "Prevent deletes from audit logs" ON public.audit_logs FOR DELETE TO authenticated USING (false);

-- 5. SQL View for Totals
CREATE OR REPLACE VIEW public.student_ledger_totals WITH (security_invoker = on) AS
WITH paid_totals AS (
    SELECT transaction_records.profile_ledger_id,
        SUM(transaction_records.amount) AS total_paid
    FROM public.transaction_records
    WHERE transaction_records.deleted = false AND transaction_records.deleted_at IS NULL
    GROUP BY transaction_records.profile_ledger_id
),
due_totals AS (
    SELECT payables.profile_ledger_id,
        SUM(payables.amount) AS total_due
    FROM public.payables
    WHERE payables.deleted_at IS NULL
    GROUP BY payables.profile_ledger_id
)
SELECT 
    pl.id as profile_ledger_id,
    COALESCE(dt.total_due, 0::numeric) as total_due,
    COALESCE(pt.total_paid, 0::numeric) as total_paid
FROM public.profile_ledger pl
LEFT JOIN due_totals dt ON dt.profile_ledger_id = pl.id
LEFT JOIN paid_totals pt ON pt.profile_ledger_id = pl.id
WHERE pl.deleted_at IS NULL;

-- Ensure view is accessible
GRANT SELECT ON public.student_ledger_totals TO authenticated;
GRANT SELECT ON public.student_ledger_totals TO anon;
