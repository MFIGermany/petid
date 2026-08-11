const Pet = require('../models/Pet');
const Tag = require('../models/Tag');

async function getPetsWithTags(userId) {
  const [pets, activeTags] = await Promise.all([
    Pet.allByUser(userId),
    Tag.activeByUser(userId)
  ]);

  const activeByPet = new Map(
    activeTags.map(tag => [String(tag.pet_id), tag])
  );

  return pets.map(pet => ({
    ...pet,
    activeTag: activeByPet.get(String(pet.id)) || null
  }));
}

/**
 * Mantém uma única plaquinha pendente durante a sessão para evitar
 * criar uma nova linha sempre que o usuário atualizar a página.
 */
async function getOrCreatePendingTag(req) {
  if (req.session.pendingTagId) {
    const existing = await Tag.findById(req.session.pendingTagId);

    if (existing && existing.status === 'inactive' && !existing.pet_id) {
      return existing;
    }

    delete req.session.pendingTagId;
  }

  const tag = await Tag.createBlank();
  req.session.pendingTagId = tag.id;
  return tag;
}

exports.activateForm = async (req, res, next) => {
  try {
    const [pets, newTag] = await Promise.all([
      getPetsWithTags(req.session.user.id),
      getOrCreatePendingTag(req)
    ]);

    res.render('tags/activate', {
      title: 'Ativar plaquinha',
      selectedPetId: req.query.pet_id || '',
      pets,
      newTag,
      error: null
    });
  } catch (err) {
    next(err);
  }
};

exports.activate = async (req, res, next) => {
  try {
    const petId = req.body.pet_id;
    const tagId = req.session.pendingTagId;

    if (!petId) {
      const [pets, newTag] = await Promise.all([
        getPetsWithTags(req.session.user.id),
        getOrCreatePendingTag(req)
      ]);

      return res.status(422).render('tags/activate', {
        title: 'Ativar plaquinha',
        selectedPetId: '',
        pets,
        newTag,
        error: 'Selecione o pet ao qual deseja vincular a plaquinha.'
      });
    }

    if (!tagId) {
      throw new Error('A reserva da nova plaquinha expirou. Recarregue a página para gerar outra.');
    }

    const result = await Tag.activateReserved({
      tagId,
      petId,
      userId: req.session.user.id
    });

    // A reserva já foi utilizada. A próxima visita gerará uma nova.
    delete req.session.pendingTagId;

    req.session.flash = {
      type: 'success',
      message: result.replaced
        ? 'Plaquinha substituída com sucesso. A identificação anterior foi desativada.'
        : 'Plaquinha ativada com sucesso.'
    };

    res.redirect(`/p/${result.tag.public_code}`);
  } catch (err) {
    try {
      // Se a reserva deixou de ser válida, ela é removida para que o GET gere outra.
      const pending = req.session.pendingTagId
        ? await Tag.findById(req.session.pendingTagId)
        : null;

      if (!pending || pending.status !== 'inactive' || pending.pet_id) {
        delete req.session.pendingTagId;
      }

      const [pets, newTag] = await Promise.all([
        getPetsWithTags(req.session.user.id),
        getOrCreatePendingTag(req)
      ]);

      return res.status(422).render('tags/activate', {
        title: 'Ativar plaquinha',
        selectedPetId: req.body.pet_id || '',
        pets,
        newTag,
        error: err.message
      });
    } catch (renderErr) {
      next(renderErr);
    }
  }
};

// Útil durante desenvolvimento/fabricação. Em produção, deve ser gerenciado por
// um painel administrativo ou processo de estoque, e não pelo cliente.
exports.devCreateBlank = async (req, res, next) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(404).send('Not found');
    }

    const tag = await Tag.createBlank();
    res.json(tag);
  } catch (err) {
    next(err);
  }
};
