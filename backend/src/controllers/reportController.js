const { supabase } = require('../config/supabase');

const dashboardSummary = async (req, res, next) => {
  try {
    const userId = req.userId;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

    // Total revenue (paid invoices all time)
    const { data: paidInvoices } = await supabase
      .from('invoices').select('total').eq('user_id', userId).eq('status', 'paid');
    const totalRevenue = paidInvoices?.reduce((s, i) => s + i.total, 0) || 0;

    // Outstanding invoices (sent + viewed)
    const { data: outstandingInvoices } = await supabase
      .from('invoices').select('total, status')
      .eq('user_id', userId).in('status', ['sent', 'viewed']);
    const outstanding = outstandingInvoices?.reduce((s, i) => s + i.total, 0) || 0;

    // Overdue invoices
    const { data: overdueInvoices } = await supabase
      .from('invoices').select('total').eq('user_id', userId).eq('status', 'overdue');
    const overdue = overdueInvoices?.reduce((s, i) => s + i.total, 0) || 0;

    // Total expenses
    const { data: allExpenses } = await supabase
      .from('expenses').select('amount').eq('user_id', userId);
    const totalExpenses = allExpenses?.reduce((s, e) => s + e.amount, 0) || 0;

    // Monthly revenue chart (last 6 months)
    const monthlyData = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const start = new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0];
      const month = d.toLocaleString('default', { month: 'short', year: '2-digit' });

      const { data: mInvoices } = await supabase
        .from('invoices').select('total')
        .eq('user_id', userId).eq('status', 'paid')
        .gte('paid_at', start).lte('paid_at', end + 'T23:59:59Z');

      const { data: mExpenses } = await supabase
        .from('expenses').select('amount')
        .eq('user_id', userId).gte('date', start).lte('date', end);

      monthlyData.push({
        month,
        revenue: mInvoices?.reduce((s, i) => s + i.total, 0) || 0,
        expenses: mExpenses?.reduce((s, e) => s + e.amount, 0) || 0,
      });
    }

    // Recent invoices
    const { data: recentInvoices } = await supabase
      .from('invoices')
      .select('id, invoice_number, status, total, currency, customers(name)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);

    // Recent expenses
    const { data: recentExpenses } = await supabase
      .from('expenses')
      .select('id, date, amount, category, vendor')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(5);

    res.json({
      total_revenue: totalRevenue,
      outstanding,
      overdue,
      total_expenses: totalExpenses,
      monthly_chart: monthlyData,
      recent_invoices: recentInvoices || [],
      recent_expenses: recentExpenses || [],
    });
  } catch (err) {
    next(err);
  }
};

const profitLoss = async (req, res, next) => {
  try {
    const { start_date, end_date } = req.query;
    const userId = req.userId;

    const { data: revenues } = await supabase
      .from('invoices').select('total, currency')
      .eq('user_id', userId).eq('status', 'paid')
      .gte('paid_at', start_date || '2000-01-01')
      .lte('paid_at', (end_date || new Date().toISOString().split('T')[0]) + 'T23:59:59Z');

    const { data: expenses } = await supabase
      .from('expenses').select('amount, category')
      .eq('user_id', userId)
      .gte('date', start_date || '2000-01-01')
      .lte('date', end_date || new Date().toISOString().split('T')[0]);

    const totalRevenue = revenues?.reduce((s, i) => s + i.total, 0) || 0;
    const totalExpenses = expenses?.reduce((s, e) => s + e.amount, 0) || 0;

    // Group expenses by category
    const expensesByCategory = {};
    expenses?.forEach((e) => {
      expensesByCategory[e.category] = (expensesByCategory[e.category] || 0) + e.amount;
    });

    res.json({
      period: { start_date, end_date },
      total_revenue: totalRevenue,
      total_expenses: totalExpenses,
      net_profit: totalRevenue - totalExpenses,
      expenses_by_category: expensesByCategory,
    });
  } catch (err) { next(err); }
};

const balanceSheet = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { data: accounts } = await supabase
      .from('accounts').select('*, transactions(amount, type)')
      .eq('user_id', userId);

    const grouped = { asset: 0, liability: 0, equity: 0, income: 0, expense: 0 };
    accounts?.forEach((acc) => {
      const balance = acc.transactions?.reduce((s, t) => {
        return t.type === 'debit' ? s + t.amount : s - t.amount;
      }, 0) || 0;
      grouped[acc.type] = (grouped[acc.type] || 0) + balance;
    });

    res.json({
      assets: grouped.asset,
      liabilities: grouped.liability,
      equity: grouped.equity,
      net_worth: grouped.asset - grouped.liability,
      accounts,
    });
  } catch (err) { next(err); }
};

const taxSummary = async (req, res, next) => {
  try {
    const { year = new Date().getFullYear() } = req.query;
    const start = `${year}-01-01`;
    const end = `${year}-12-31`;

    const { data: invoices } = await supabase
      .from('invoices').select('tax_amount, total, status')
      .eq('user_id', req.userId)
      .gte('issue_date', start).lte('issue_date', end);

    const { data: expenses } = await supabase
      .from('expenses').select('amount, category')
      .eq('user_id', req.userId)
      .gte('date', start).lte('date', end);

    const taxCollected = invoices
      ?.filter((i) => i.status === 'paid')
      .reduce((s, i) => s + (i.tax_amount || 0), 0) || 0;

    const totalRevenue = invoices
      ?.filter((i) => i.status === 'paid')
      .reduce((s, i) => s + i.total, 0) || 0;

    const totalExpenses = expenses?.reduce((s, e) => s + e.amount, 0) || 0;

    res.json({
      year,
      total_revenue: totalRevenue,
      total_expenses: totalExpenses,
      net_profit: totalRevenue - totalExpenses,
      tax_collected: taxCollected,
      estimated_tax: Math.round((totalRevenue - totalExpenses) * 0.25), // rough 25% estimate
    });
  } catch (err) { next(err); }
};

module.exports = { dashboardSummary, profitLoss, balanceSheet, taxSummary };
