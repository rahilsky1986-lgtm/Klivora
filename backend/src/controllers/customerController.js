const { supabase } = require('../config/supabase');
const { getPagination } = require('../utils/helpers');

const list = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const { from, to } = getPagination(parseInt(page), parseInt(limit));

    let query = supabase
      .from('customers')
      .select('*', { count: 'exact' })
      .eq('user_id', req.userId)
      .order('name', { ascending: true })
      .range(from, to);

    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    const { data, error, count } = await query;
    if (error) return res.status(400).json({ error: error.message });

    res.json({ data, total: count, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const { name, email, phone, address, currency, notes } = req.body;
    if (!name) return res.status(400).json({ error: 'Customer name is required' });

    const { data, error } = await supabase
      .from('customers')
      .insert({ user_id: req.userId, name, email, phone, address, currency, notes })
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
};

const getOne = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', req.userId)
      .single();

    if (error || !data) return res.status(404).json({ error: 'Customer not found' });
    res.json(data);
  } catch (err) {
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const { name, email, phone, address, currency, notes } = req.body;
    const { data, error } = await supabase
      .from('customers')
      .update({ name, email, phone, address, currency, notes })
      .eq('id', req.params.id)
      .eq('user_id', req.userId)
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    if (!data) return res.status(404).json({ error: 'Customer not found' });
    res.json(data);
  } catch (err) {
    next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.userId);

    if (error) return res.status(400).json({ error: error.message });
    res.json({ message: 'Customer deleted' });
  } catch (err) {
    next(err);
  }
};

const getInvoices = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('invoices')
      .select('id, invoice_number, status, issue_date, due_date, total, currency')
      .eq('customer_id', req.params.id)
      .eq('user_id', req.userId)
      .order('created_at', { ascending: false });

    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  } catch (err) {
    next(err);
  }
};

const getBalance = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('invoices')
      .select('status, total')
      .eq('customer_id', req.params.id)
      .eq('user_id', req.userId)
      .in('status', ['sent', 'viewed', 'overdue']);

    if (error) return res.status(400).json({ error: error.message });

    const outstanding = data.reduce((sum, inv) => sum + (inv.total || 0), 0);
    res.json({ outstanding_balance: outstanding });
  } catch (err) {
    next(err);
  }
};

module.exports = { list, create, getOne, update, remove, getInvoices, getBalance };
