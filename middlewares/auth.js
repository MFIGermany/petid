const User = require('../models/User');

async function requireAuth(req, res, next) {
  try {
    if (!req.session.user) {
      req.session.returnTo = req.originalUrl;
      return res.redirect('/login');
    }

    // Confirma que a conta ainda existe. Isso também encerra corretamente
    // sessões de clientes removidos pelo painel administrativo.
    const user = await User.findById(req.session.user.id);
    if (!user) {
      delete req.session.user;
      delete req.session.pendingTagId;
      req.session.returnTo = req.originalUrl;
      return req.session.save((err) => {
        if (err) return next(err);
        res.redirect('/login');
      });
    }

    req.session.user = {
      id: user.id,
      name: user.name,
      email: user.email
    };

    next();
  } catch (err) {
    next(err);
  }
}

function requireGuest(req, res, next) {
  if (req.session.user) return res.redirect('/dashboard');
  next();
}

module.exports = { requireAuth, requireGuest };
