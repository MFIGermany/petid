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
 * Mantiene una única chapita pendiente durante la sesión para evitar
 * crear una fila nueva cada vez que el usuario refresca la página.
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
      title: 'Activar chapita',
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
        title: 'Activar chapita',
        selectedPetId: '',
        pets,
        newTag,
        error: 'Selecciona la mascota a la que deseas vincular la chapita.'
      });
    }

    if (!tagId) {
      throw new Error('La reserva de la nueva chapita expiró. Recarga la página para generar otra.');
    }

    const result = await Tag.activateReserved({
      tagId,
      petId,
      userId: req.session.user.id
    });

    // La reserva ya fue consumida. La próxima visita generará una nueva.
    delete req.session.pendingTagId;

    req.session.flash = {
      type: 'success',
      message: result.replaced
        ? 'Chapita reemplazada correctamente. La identificación anterior fue deshabilitada.'
        : 'Chapita activada correctamente.'
    };

    res.redirect(`/p/${result.tag.public_code}`);
  } catch (err) {
    try {
      // Si la reserva dejó de ser válida, se elimina para que GET genere otra.
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
        title: 'Activar chapita',
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

// Útil durante desarrollo/fabricación. En producción debe manejarse desde
// un panel administrativo o proceso de inventario, no desde el cliente.
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
