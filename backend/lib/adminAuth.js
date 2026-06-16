/** Require X-Admin-Key header when ADMIN_API_KEY is set. */

function requireAdmin(req, res, next) {
  const key = process.env.ADMIN_API_KEY;
  if (!key) {
    return next();
  }
  if (req.headers['x-admin-key'] === key) {
    return next();
  }
  return res.status(401).json({ success: false, error: 'Admin API key required' });
}

module.exports = { requireAdmin };
