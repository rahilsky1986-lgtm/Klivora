const { supabase } = require('../config/supabase');

const list = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', req.userId)
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  } catch (err) { next(err); }
};

const markRead = async (req, res, next) => {
  try {
    const { error } = await supabase
      .from('notifications').update({ read: true })
      .eq('id', req.params.id).eq('user_id', req.userId);
    if (error) return res.status(400).json({ error: error.message });
    res.json({ success: true });
  } catch (err) { next(err); }
};

const markAllRead = async (req, res, next) => {
  try {
    const { error } = await supabase
      .from('notifications').update({ read: true })
      .eq('user_id', req.userId).eq('read', false);
    if (error) return res.status(400).json({ error: error.message });
    res.json({ success: true });
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    const { error } = await supabase
      .from('notifications').delete()
      .eq('id', req.params.id).eq('user_id', req.userId);
    if (error) return res.status(400).json({ error: error.message });
    res.json({ message: 'Notification deleted' });
  } catch (err) { next(err); }
};

module.exports = { list, markRead, markAllRead, remove };
