-- ============================================================
-- Klivora pg_cron Jobs
-- Run these in your Supabase SQL Editor to set up automated tasks
-- Requires pg_cron extension (enabled by default in Supabase)
-- ============================================================

-- Enable pg_cron if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ============================================================
-- 1. Process Recurring Invoices (Daily at 00:00 UTC)
-- ============================================================
-- Note: This requires a separate worker/service since it needs
-- application logic. The cron job below calls a Supabase Edge Function
-- or you can run the Node.js script via external cron (GitHub Actions, etc.)
--
-- Alternative: Use Supabase Edge Functions for serverless execution
-- See: https://supabase.com/docs/guides/functions

-- ============================================================
-- 2. Check Overdue Invoices (Daily at 09:00 UTC)
-- ============================================================
-- This can be done directly in SQL since it's a simple update

-- Create function to update overdue invoices
CREATE OR REPLACE FUNCTION public.check_overdue_invoices()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  inv RECORD;
BEGIN
  FOR inv IN
    SELECT id, invoice_number, user_id, customers.name as customer_name
    FROM public.invoices i
    LEFT JOIN public.customers c ON i.customer_id = c.id
    WHERE i.status IN ('sent', 'viewed')
    AND i.due_date < CURRENT_DATE
  LOOP
    -- Update invoice status
    UPDATE public.invoices
    SET status = 'overdue'
    WHERE id = inv.id;

    -- Create notification
    INSERT INTO public.notifications (user_id, type, title, message, action_url)
    VALUES (
      inv.user_id,
      'invoice_overdue',
      'Invoice Overdue',
      'Invoice ' || inv.invoice_number || ' for ' || COALESCE(inv.customer_name, 'customer') || ' is now overdue',
      '/invoices/' || inv.id
    );
  END LOOP;
END;
$$;

-- Schedule the overdue check daily at 9 AM UTC
SELECT cron.schedule(
  'check-overdue-invoices',
  '0 9 * * *',
  $$SELECT public.check_overdue_invoices();$$
);

-- ============================================================
-- 3. Clean up old notifications (Weekly on Sunday at 03:00 UTC)
-- ============================================================

CREATE OR REPLACE FUNCTION public.cleanup_old_notifications()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.notifications
  WHERE read = true
  AND created_at < NOW() - INTERVAL '90 days';
END;
$$;

SELECT cron.schedule(
  'cleanup-old-notifications',
  '0 3 * * 0',
  $$SELECT public.cleanup_old_notifications();$$
);

-- ============================================================
-- 4. Generate monthly recurring invoices (1st of month at 00:00 UTC)
-- ============================================================
-- This requires the Node.js script since it involves complex logic
-- You can run it via:
-- - GitHub Actions scheduled workflow
-- - Supabase Edge Function + pg_cron HTTP call
-- - External cron service (cron-job.org, etc.)

-- Example: Call an Edge Function via HTTP (if you create one)
-- SELECT cron.schedule(
--   'process-recurring-invoices',
--   '0 0 * * *',
--   $$SELECT net.http_post(
--     'https://your-project.supabase.co/functions/v1/process-recurring',
--     '{}',
--     '{"Authorization": "Bearer ' || current_setting('app.settings.service_role_key') || '"}'::jsonb
--   );$$
-- );

-- ============================================================
-- View scheduled jobs
-- ============================================================
-- SELECT * FROM cron.job;

-- ============================================================
-- Remove a job
-- ============================================================
-- SELECT cron.unschedule('check-overdue-invoices');
-- SELECT cron.unschedule('cleanup-old-notifications');