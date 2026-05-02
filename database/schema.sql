-- ============================================================
-- Klivora Database Schema
-- Run this in your Supabase SQL editor
-- All money values in cents (integers)
-- All timestamps in UTC
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- USERS (extends Supabase auth.users)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  business_name TEXT,
  logo_url TEXT,
  address JSONB DEFAULT '{}',
  currency TEXT DEFAULT 'USD',
  tax_number TEXT,
  invoice_prefix TEXT DEFAULT 'INV',
  next_invoice_number INTEGER DEFAULT 1,
  invoice_notes TEXT,
  payment_terms TEXT DEFAULT 'Due within 30 days',
  primary_color TEXT DEFAULT '#2D6BE4',
  onboarding_complete BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- CUSTOMERS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address JSONB DEFAULT '{}',
  currency TEXT DEFAULT 'USD',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customers_user_id ON public.customers(user_id);

-- ============================================================
-- INVOICES
-- ============================================================
CREATE TYPE invoice_status AS ENUM ('draft', 'sent', 'viewed', 'paid', 'overdue', 'cancelled');

CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  invoice_number TEXT NOT NULL,
  status invoice_status DEFAULT 'draft',
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  subtotal INTEGER DEFAULT 0, -- in cents
  tax_amount INTEGER DEFAULT 0, -- in cents
  discount_amount INTEGER DEFAULT 0, -- in cents
  total INTEGER DEFAULT 0, -- in cents
  currency TEXT DEFAULT 'USD',
  notes TEXT,
  payment_terms TEXT,
  stripe_payment_url TEXT,
  stripe_payment_intent_id TEXT,
  sent_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  viewed_at TIMESTAMPTZ,
  recurring BOOLEAN DEFAULT FALSE,
  recurring_interval TEXT, -- 'weekly', 'monthly', 'yearly'
  recurring_next_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, invoice_number)
);

CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON public.invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_customer_id ON public.invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status);

-- ============================================================
-- INVOICE ITEMS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.invoice_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity DECIMAL(10,2) DEFAULT 1,
  unit_price INTEGER DEFAULT 0, -- in cents
  tax_rate DECIMAL(5,2) DEFAULT 0,
  amount INTEGER DEFAULT 0, -- in cents (quantity * unit_price)
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON public.invoice_items(invoice_id);

-- ============================================================
-- EXPENSES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  amount INTEGER NOT NULL, -- in cents
  category TEXT NOT NULL,
  description TEXT,
  vendor TEXT,
  receipt_url TEXT,
  billable BOOLEAN DEFAULT FALSE,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  billed_on_invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON public.expenses(user_id);

-- ============================================================
-- ACCOUNTS (Chart of Accounts)
-- ============================================================
CREATE TYPE account_type AS ENUM ('asset', 'liability', 'equity', 'income', 'expense');

CREATE TABLE IF NOT EXISTS public.accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type account_type NOT NULL,
  code TEXT,
  description TEXT,
  is_system BOOLEAN DEFAULT FALSE, -- system/default accounts
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON public.accounts(user_id);

-- ============================================================
-- TRANSACTIONS
-- ============================================================
CREATE TYPE transaction_type AS ENUM ('debit', 'credit');

CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  amount INTEGER NOT NULL, -- in cents
  type transaction_type NOT NULL,
  description TEXT,
  reference TEXT,
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
  expense_id UUID REFERENCES public.expenses(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON public.transactions(date);

-- ============================================================
-- EMPLOYEES
-- ============================================================
CREATE TYPE pay_frequency AS ENUM ('weekly', 'biweekly', 'monthly', 'annually');

CREATE TABLE IF NOT EXISTS public.employees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  salary INTEGER NOT NULL, -- in cents (annual or per-period depending on frequency)
  frequency pay_frequency DEFAULT 'monthly',
  tax_info JSONB DEFAULT '{}',
  start_date DATE,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_employees_user_id ON public.employees(user_id);

-- ============================================================
-- PAYROLL RUNS
-- ============================================================
CREATE TYPE payroll_status AS ENUM ('draft', 'approved', 'paid');

CREATE TABLE IF NOT EXISTS public.payroll_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  gross INTEGER NOT NULL, -- in cents
  deductions INTEGER DEFAULT 0, -- in cents
  net INTEGER NOT NULL, -- in cents
  status payroll_status DEFAULT 'draft',
  notes TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payroll_runs_user_id ON public.payroll_runs(user_id);
CREATE INDEX IF NOT EXISTS idx_payroll_runs_employee_id ON public.payroll_runs(employee_id);

-- ============================================================
-- PAYMENTS (Stripe)
-- ============================================================
CREATE TYPE payment_status AS ENUM ('pending', 'succeeded', 'failed', 'refunded');

CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL, -- in cents
  currency TEXT DEFAULT 'USD',
  stripe_payment_intent_id TEXT,
  stripe_charge_id TEXT,
  status payment_status DEFAULT 'pending',
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON public.payments(invoice_id);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE TYPE notification_type AS ENUM (
  'invoice_viewed', 'payment_received', 'invoice_overdue',
  'payroll_due', 'expense_added', 'general'
);

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  action_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users: only own profile
CREATE POLICY "users_own" ON public.users FOR ALL USING (auth.uid() = id);

-- Customers: only own records
CREATE POLICY "customers_own" ON public.customers FOR ALL USING (auth.uid() = user_id);

-- Invoices: only own records
CREATE POLICY "invoices_own" ON public.invoices FOR ALL USING (auth.uid() = user_id);

-- Invoice items: through invoice ownership
CREATE POLICY "invoice_items_own" ON public.invoice_items FOR ALL
  USING (invoice_id IN (SELECT id FROM public.invoices WHERE user_id = auth.uid()));

-- Expenses: only own records
CREATE POLICY "expenses_own" ON public.expenses FOR ALL USING (auth.uid() = user_id);

-- Accounts: only own records
CREATE POLICY "accounts_own" ON public.accounts FOR ALL USING (auth.uid() = user_id);

-- Transactions: only own records
CREATE POLICY "transactions_own" ON public.transactions FOR ALL USING (auth.uid() = user_id);

-- Employees: only own records
CREATE POLICY "employees_own" ON public.employees FOR ALL USING (auth.uid() = user_id);

-- Payroll runs: only own records
CREATE POLICY "payroll_runs_own" ON public.payroll_runs FOR ALL USING (auth.uid() = user_id);

-- Payments: through invoice ownership
CREATE POLICY "payments_own" ON public.payments FOR ALL
  USING (invoice_id IN (SELECT id FROM public.invoices WHERE user_id = auth.uid()));

-- Notifications: only own records
CREATE POLICY "notifications_own" ON public.notifications FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER customers_updated_at
  BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER invoices_updated_at
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER expenses_updated_at
  BEFORE UPDATE ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER employees_updated_at
  BEFORE UPDATE ON public.employees
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER payroll_runs_updated_at
  BEFORE UPDATE ON public.payroll_runs
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Auto-create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
