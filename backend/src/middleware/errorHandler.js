const errorHandler = (err, req, res, next) => {
  console.error(`[Error] ${err.message}`, {
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method,
  });

  // Validation errors
  if (err.type === 'validation') {
    return res.status(400).json({
      error: 'Validation failed',
      details: err.details,
    });
  }

  // Supabase errors
  if (err.code && err.message) {
    const status = err.status || 400;
    return res.status(status).json({ error: err.message });
  }

  // Default 500
  const status = err.status || err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production'
    ? 'An unexpected error occurred'
    : err.message || 'Internal server error';

  res.status(status).json({ error: message });
};

module.exports = errorHandler;
