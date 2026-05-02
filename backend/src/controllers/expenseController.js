const { supabase } = require('../config/supabase');
const { getPagination } = require('../utils/helpers');

const EXPENSE_CATEGORIES = [
  'Advertising', 'Bank Fees', 'Equipment', 'Insurance', 'Legal & Professional',
  'Meals & Entertainment', 'Office Supplies', 'Rent', 'Software & Subscriptions',
  'Travel', 'Utilities', 'Wages & Salaries', 'Other',
];

const list = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, category, start_date, end_date } = req.query;
    const { from, to } = getPagination(parseInt(page), parseInt(limit));

    let query = supabase
      .from('expenses')
      .select('*, customers(name)', { count: 'exact' })
      .eq('user_id', req.userId)
      .order('date', { ascending: false })
      .range(from, to);

    if (category) query = query.eq('category', category);
    if (start_date) query = query.gte('date', start_date);
    if (end_date) query = query.lte('date', end_date);

    const { data, error, count } = await query;
    if (error) return res.status(400).json({ error: error.message });

    res.json({ data, total: count, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const { date, amount, category, description, vendor, billable, customer_id } = req.body;
    if (!amount || !category) {
      return res.status(400).json({ error: 'Amount and category are required' });
    }

    const { data, error } = await supabase
      .from('expenses')
      .insert({
        user_id: req.userId,
        date: date || new Date().toISOString().split('T')[0],
        amount: parseInt(amount),
        category,
        description,
        vendor,
        billable: !!billable,
        customer_id: billable ? customer_id : null,
      })
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
      .from('expenses')
      .select('*, customers(name)')
      .eq('id', req.params.id)
      .eq('user_id', req.userId)
      .single();

    if (error || !data) return res.status(404).json({ error: 'Expense not found' });
    res.json(data);
  } catch (err) {
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const { date, amount, category, description, vendor, billable, customer_id } = req.body;
    const { data, error } = await supabase
      .from('expenses')
      .update({
        date, amount: parseInt(amount), category, description, vendor,
        billable: !!billable, customer_id: billable ? customer_id : null,
      })
      .eq('id', req.params.id)
      .eq('user_id', req.userId)
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  } catch (err) {
    next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.userId);

    if (error) return res.status(400).json({ error: error.message });
    res.json({ message: 'Expense deleted' });
  } catch (err) {
    next(err);
  }
};

const uploadReceipt = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const ext = req.file.mimetype.split('/')[1];
    const path = `receipts/${req.userId}/${req.params.id}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('klivora-assets')
      .upload(path, req.file.buffer, { contentType: req.file.mimetype, upsert: true });

    if (uploadError) return res.status(400).json({ error: uploadError.message });

    const { data: { publicUrl } } = supabase.storage.from('klivora-assets').getPublicUrl(path);

    const { data, error } = await supabase
      .from('expenses')
      .update({ receipt_url: publicUrl })
      .eq('id', req.params.id)
      .eq('user_id', req.userId)
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    res.json({ receipt_url: publicUrl, expense: data });
  } catch (err) {
    next(err);
  }
};

module.exports = { list, create, getOne, update, remove, uploadReceipt, EXPENSE_CATEGORIES };
