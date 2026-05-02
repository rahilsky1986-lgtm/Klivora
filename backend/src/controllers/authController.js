const { supabase } = require('../config/supabase');

const register = async (req, res, next) => {
  try {
    const { email, password, business_name } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { business_name: business_name || '' },
      },
    });

    if (error) return res.status(400).json({ error: error.message });

    // Update user profile with business name
    if (data.user && business_name) {
      await supabase
        .from('users')
        .update({ business_name })
        .eq('id', data.user.id);
    }

    res.status(201).json({
      message: 'Account created successfully. Please check your email to verify.',
      user: { id: data.user?.id, email: data.user?.email },
      session: data.session,
    });
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return res.status(401).json({ error: error.message });

    // Fetch user profile
    const { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single();

    res.json({
      user: { ...data.user, profile },
      session: data.session,
    });
  } catch (err) {
    next(err);
  }
};

const logout = async (req, res, next) => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) return res.status(400).json({ error: error.message });
    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.FRONTEND_URL}/reset-password`,
    });

    if (error) return res.status(400).json({ error: error.message });
    res.json({ message: 'Password reset email sent. Please check your inbox.' });
  } catch (err) {
    next(err);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { password } = req.body;
    if (!password) return res.status(400).json({ error: 'New password is required' });

    const { error } = await supabase.auth.updateUser({ password });
    if (error) return res.status(400).json({ error: error.message });
    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    next(err);
  }
};

const refreshToken = async (req, res, next) => {
  try {
    const { refresh_token } = req.body;
    if (!refresh_token) return res.status(400).json({ error: 'Refresh token required' });

    const { data, error } = await supabase.auth.refreshSession({ refresh_token });
    if (error) return res.status(401).json({ error: error.message });

    res.json({ session: data.session });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, logout, forgotPassword, resetPassword, refreshToken };
