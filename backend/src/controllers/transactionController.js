const { supabase } = require('../config/supabase');
const { getPagination } = require('../utils/helpers');

const list = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, account_id, type, start_date, end_date } = req.query;
    const { from, to } = getPagination(parseInt(page), parseInt(limit));

    let query = supabase
      .from('transactions')
      .select('*, accounts(name, type)', { count: 'exact' })
      .eq('user_id', req.userId)
      .order('date', { ascending: false })
      .range(from, to);

    if (account_id) query = query.eq('account_id', account_id);
    if (type) query = query.eq('type', type);
    if (start_date) query = query.gte('date', start_date);
    if (end_date) query = query.lte('date', end_date);

    const { data, error, count } = await query;
    if (error) return res.status(400).json({ error: error.message });
    res.json({ data, total: count, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const { account_id, date, amount, type, description, reference } = req.body;
    if (!amount || !type) return res.status(400).json({ error: 'Amount and type are required' });
    const { data, error } = await supabase
      .from('transactions')
      .insert({ user_id: req.userId, account_id, date, amount: parseInt(amount), type, description, reference })
      .select().single();
    if (error) return res.status(400).json({ error: error.message });
    res.status(201).json(data);
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    const { error } = await supabase
      .from('transactions').delete()
      .eq('id', req.params.id).eq('user_id', req.userId);
    if (error) return res.status(400).json({ error: error.message });
    res.json({ message: 'Transaction deleted' });
  } catch (err) { next(err); }
};

module.exports = { list, create, remove };
