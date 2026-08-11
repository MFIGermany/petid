const bcrypt = require('bcryptjs');
const User = require('../models/User');

exports.loginForm = (req, res) => {
  res.render('auth/login', { title: 'Entrar', error: null });
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findByEmail(email || '');

    if (!user || !(await bcrypt.compare(password || '', user.password_hash))) {
      return res.status(422).render('auth/login', {
        title: 'Entrar',
        error: 'E-mail ou senha incorretos.'
      });
    }

    req.session.user = { id: user.id, name: user.name, email: user.email };
    const redirectTo = req.session.returnTo || '/dashboard';
    delete req.session.returnTo;
    res.redirect(redirectTo);
  } catch (err) {
    next(err);
  }
};

exports.registerForm = (req, res) => {
  res.render('auth/register', { title: 'Criar conta', error: null });
};

exports.register = async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body;
    if (!name || !email || !password || password.length < 6) {
      return res.status(422).render('auth/register', {
        title: 'Criar conta',
        error: 'Preencha nome, e-mail e uma senha com pelo menos 6 caracteres.'
      });
    }

    if (await User.findByEmail(email)) {
      return res.status(422).render('auth/register', {
        title: 'Criar conta',
        error: 'Já existe uma conta com esse e-mail.'
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email, passwordHash, phone });

    req.session.user = { id: user.id, name: user.name, email: user.email };
    res.redirect('/dashboard');
  } catch (err) {
    next(err);
  }
};

exports.logout = (req, res, next) => {
  req.session.destroy((err) => {
    if (err) return next(err);
    res.clearCookie(process.env.SESSION_COOKIE_NAME || 'petid.sid');
    res.redirect('/');
  });
};
