const { supabase } = require('../config/supabase');

const getProfile = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', req.userId)
      .single();

    if (error) return res.status(404).json({ error: 'Profile not found' });
    res.json(data);
  } catch (err) {
    next(err);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const allowedFields = [
      'business_name', 'address', 'currency', 'tax_number',
      'invoice_prefix', 'invoice_notes', 'payment_terms', 'primary_color',
    ];
    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    }

    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', req.userId)
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  } catch (err) {
    next(err);
  }
};

const uploadLogo = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const ext = req.file.mimetype.split('/')[1];
    const path = `logos/${req.userId}/logo.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('klivora-assets')
      .upload(path, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: true,
      });

    if (uploadError) return res.status(400).json({ error: uploadError.message });

    const { data: { publicUrl } } = supabase.storage
      .from('klivora-assets')
      .getPublicUrl(path);

    await supabase
      .from('users')
      .update({ logo_url: publicUrl })
      .eq('id', req.userId);

    res.json({ logo_url: publicUrl });
  } catch (err) {
    next(err);
  }
};

const completeOnboarding = async (req, res, next) => {
  try {
    // Seed default chart of accounts for new user
    const defaultAccounts = [
      { name: 'Checking Account', type: 'asset', code: '1010', is_system: true },
      { name: 'Accounts Receivable', type: 'asset', code: '1200', is_system: true },
      { name: 'Accounts Payable', type: 'liability', code: '2000', is_system: true },
      { name: 'Owner Equity', type: 'equity', code: '3000', is_system: true },
      { name: 'Sales Revenue', type: 'income', code: '4000', is_system: true },
      { name: 'General Expenses', type: 'expense', code: '5000', is_system: true },
      { name: 'Rent', type: 'expense', code: '5100', is_system: true },
      { name: 'Utilities', type: 'expense', code: '5200', is_system: true },
      { name: 'Travel', type: 'expense', code: '5300', is_system: true },
      { name: 'Office Supplies', type: 'expense', code: '5400', is_system: true },
    ];

    await supabase.from('accounts').insert(
      defaultAccounts.map((a) => ({ ...a, user_id: req.userId }))
    );

    const { data, error } = await supabase
      .from('users')
      .update({ onboarding_complete: true, ...req.body })
      .eq('id', req.userId)
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  } catch (err) {
    next(err);
  }
};

const deleteAccount = async (req, res, next) => {
  try {
    const { error } = await supabase.auth.admin.deleteUser(req.userId);
    if (error) return res.status(400).json({ error: error.message });
    res.json({ message: 'Account deleted successfully' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getProfile, updateProfile, uploadLogo, completeOnboarding, deleteAccount };
