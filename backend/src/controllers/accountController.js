const { supabase } = require('../config/supabase');

const list = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('accounts').select('*').eq('user_id', req.userId).order('code');
    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const { name, type, code, description } = req.body;
    if (!name || !type) return res.status(400).json({ error: 'Name and type are required' });
    const { data, error } = await supabase
      .from('accounts').insert({ user_id: req.userId, name, type, code, description })
      .select().single();
    if (error) return res.status(400).json({ error: error.message });
    res.status(201).json(data);
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const { name, type, code, description } = req.body;
    const { data, error } = await supabase
      .from('accounts').update({ name, type, code, description })
      .eq('id', req.params.id).eq('user_id', req.userId).select().single();
    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    const { error } = await supabase
      .from('accounts').delete().eq('id', req.params.id).eq('user_id', req.userId);
    if (error) return res.status(400).json({ error: error.message });
    res.json({ message: 'Account deleted' });
  } catch (err) { next(err); }
};

module.exports = { list, create, update, remove };
