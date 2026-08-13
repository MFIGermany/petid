function requireAdmin(req, res, next) {
  if (!req.session?.admin) {
    req.session.adminReturnTo = req.originalUrl;
    return res.redirect('/admin/login');
  }

  next();
}

function requireAdminGuest(req, res, next) {
  if (req.session?.admin) return res.redirect('/admin');
  next();
}

module.exports = { requireAdmin, requireAdminGuest };
