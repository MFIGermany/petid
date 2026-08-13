const Admin = require('../models/Admin');
const adminAuth = require('../services/adminAuth');
const { removeByPublicUrl } = require('../services/supabaseStorage');

function flash(req, type, message) {
  req.session.flash = { type, message };
}

function clientPath(userId) {
  return `/admin/clients/${encodeURIComponent(userId)}`;
}

function validEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());
}

function pageItems(page, totalPages) {
  const items = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, page + 2);
  for (let current = start; current <= end; current += 1) items.push(current);
  return items;
}

exports.loginForm = (req, res) => {
  res.render('admin/login', {
    title: 'Administração',
    error: null,
    configured: adminAuth.isConfigured()
  });
};

exports.login = async (req, res, next) => {
  try {
    if (!adminAuth.isConfigured()) {
      return res.status(503).render('admin/login', {
        title: 'Administração',
        error: 'O acesso administrativo ainda não foi configurado no ambiente.',
        configured: false
      });
    }

    const blockedUntil = Number(req.session.adminLoginBlockedUntil || 0);
    if (blockedUntil > Date.now()) {
      return res.status(429).render('admin/login', {
        title: 'Administração',
        error: 'Muitas tentativas de acesso. Tente novamente em alguns minutos.',
        configured: true
      });
    }

    const admin = await adminAuth.verify(req.body.email, req.body.password);

    if (!admin) {
      const attempts = Number(req.session.adminLoginAttempts || 0) + 1;
      req.session.adminLoginAttempts = attempts;

      if (attempts >= 5) {
        req.session.adminLoginBlockedUntil = Date.now() + (15 * 60 * 1000);
        req.session.adminLoginAttempts = 0;
      }

      return res.status(422).render('admin/login', {
        title: 'Administração',
        error: 'E-mail ou senha incorretos.',
        configured: true
      });
    }

    const redirectTo = String(req.session.adminReturnTo || '/admin');
    const currentUser = req.session.user || null;

    // Regenera o identificador da sessão depois da autenticação administrativa
    // para reduzir risco de session fixation. Mantém apenas a sessão normal do
    // tutor, caso exista no mesmo navegador.
    req.session.regenerate((regenerateError) => {
      if (regenerateError) return next(regenerateError);

      if (currentUser) req.session.user = currentUser;
      req.session.admin = {
        email: admin.email,
        name: admin.name,
        authenticatedAt: new Date().toISOString()
      };

      req.session.save((saveError) => {
        if (saveError) return next(saveError);
        res.redirect(redirectTo.startsWith('/admin') ? redirectTo : '/admin');
      });
    });
  } catch (err) {
    next(err);
  }
};

exports.logout = (req, res, next) => {
  if (!req.session) return res.redirect('/admin/login');
  delete req.session.admin;
  delete req.session.adminReturnTo;

  req.session.save((err) => {
    if (err) return next(err);
    res.redirect('/admin/login');
  });
};

exports.dashboard = async (req, res, next) => {
  try {
    const [stats, recentClients, lostPets] = await Promise.all([
      Admin.dashboardStats(),
      Admin.recentClients(6),
      Admin.lostPets(8)
    ]);

    res.render('admin/dashboard', {
      title: 'Painel administrativo',
      stats,
      recentClients,
      lostPets
    });
  } catch (err) {
    next(err);
  }
};

exports.clients = async (req, res, next) => {
  try {
    const result = await Admin.listClients({
      query: req.query.q || '',
      page: req.query.page || 1,
      pageSize: 15
    });

    res.render('admin/clients', {
      title: 'Clientes',
      ...result,
      pageItems: pageItems(result.page, result.totalPages)
    });
  } catch (err) {
    next(err);
  }
};

exports.clientDetail = async (req, res, next) => {
  try {
    const details = await Admin.getClientDetails(req.params.id);

    if (!details) {
      return res.status(404).render('common/error', {
        title: 'Cliente não encontrado',
        message: 'Este cliente não existe ou já foi excluído.'
      });
    }

    const contactsByPet = {};
    details.contacts.forEach((contact) => {
      const key = String(contact.pet_id);
      if (!contactsByPet[key]) contactsByPet[key] = [];
      contactsByPet[key].push(contact);
    });

    const tagsByPet = {};
    details.tags.forEach((tag) => {
      const key = String(tag.pet_id);
      if (!tagsByPet[key]) tagsByPet[key] = [];
      tagsByPet[key].push(tag);
    });

    res.render('admin/client-detail', {
      title: details.client.name,
      ...details,
      contactsByPet,
      tagsByPet,
      error: null
    });
  } catch (err) {
    next(err);
  }
};

exports.updateClient = async (req, res, next) => {
  try {
    const name = String(req.body.name || '').trim().slice(0, 160);
    const email = String(req.body.email || '').trim().toLowerCase().slice(0, 254);
    const phone = String(req.body.phone || '').trim().slice(0, 60);

    if (!name || !validEmail(email)) {
      flash(req, 'error', 'Informe um nome e um e-mail válido.');
      return res.redirect(clientPath(req.params.id));
    }

    const updated = await Admin.updateClient(req.params.id, { name, email, phone });
    if (!updated) {
      flash(req, 'error', 'Cliente não encontrado.');
      return res.redirect('/admin/clients');
    }

    flash(req, 'success', 'Dados do cliente atualizados.');
    res.redirect(clientPath(req.params.id));
  } catch (err) {
    if (err.code === '23505') {
      flash(req, 'error', 'Já existe outro cliente com esse e-mail.');
      return res.redirect(clientPath(req.params.id));
    }
    next(err);
  }
};

exports.togglePetLost = async (req, res, next) => {
  try {
    const pet = await Admin.togglePetLost(req.params.id);
    if (!pet) {
      flash(req, 'error', 'Pet não encontrado.');
      return res.redirect('/admin/clients');
    }

    flash(
      req,
      pet.is_lost ? 'warning' : 'success',
      pet.is_lost
        ? `${pet.name} foi marcado como perdido pelo administrador.`
        : `${pet.name} foi marcado como encontrado pelo administrador.`
    );

    res.redirect(clientPath(pet.user_id));
  } catch (err) {
    next(err);
  }
};

exports.toggleTagStatus = async (req, res, next) => {
  try {
    const tag = await Admin.toggleTagStatus(req.params.id);

    flash(
      req,
      tag.status === 'active' ? 'success' : 'warning',
      tag.status === 'active'
        ? `Plaquinha ${tag.public_code} reativada para ${tag.pet_name}.`
        : `Plaquinha ${tag.public_code} desativada.`
    );

    res.redirect(clientPath(tag.user_id));
  } catch (err) {
    flash(req, 'error', err.message || 'Não foi possível alterar a plaquinha.');
    const fallback = req.body.user_id ? clientPath(req.body.user_id) : '/admin/clients';
    res.redirect(fallback);
  }
};

exports.deleteClient = async (req, res, next) => {
  try {
    const result = await Admin.deleteClient(req.params.id);

    if (!result) {
      flash(req, 'error', 'Cliente não encontrado.');
      return res.redirect('/admin/clients');
    }

    // A exclusão do banco não depende do Storage. Se uma imagem falhar aqui,
    // o cliente continua removido e apenas registramos o arquivo órfão.
    for (const photoUrl of result.photoUrls) {
      await removeByPublicUrl(photoUrl).catch((storageError) => {
        console.warn('Não foi possível excluir foto após remover cliente:', storageError.message);
      });
    }

    flash(req, 'success', `Cliente ${result.user.name} excluído. As plaquinhas foram preservadas e desativadas.`);
    res.redirect('/admin/clients');
  } catch (err) {
    next(err);
  }
};
