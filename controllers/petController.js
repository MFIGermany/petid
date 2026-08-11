const Pet = require('../models/Pet');
const Contact = require('../models/Contact');
const Tag = require('../models/Tag');
const {
  uploadPetPhoto,
  removeObject,
  removeByPublicUrl
} = require('../services/supabaseStorage');

function formUserName(req) {
  return req.session?.user?.name || '';
}

exports.newForm = (req, res) => {
  res.render('pets/form', {
    title: 'Nueva mascota',
    pet: null,
    contact: null,
    tags: [],
    error: null,
    formUserName: formUserName(req)
  });
};

exports.create = async (req, res, next) => {
  let uploadedPhoto = null;

  try {
    if (!req.body.name || !req.body.species) {
      return res.status(422).render('pets/form', {
        title: 'Nueva mascota',
        pet: req.body,
        contact: {
          name: req.body.contact_name,
          phone: req.body.phone,
          whatsapp: req.body.whatsapp
        },
        tags: [],
        error: 'El nombre y la especie son obligatorios.',
        formUserName: formUserName(req)
      });
    }

    if (req.file) {
      uploadedPhoto = await uploadPetPhoto(req.file, req.session.user.id);
    }

    const petData = {
      ...req.body,
      photo_url: uploadedPhoto?.publicUrl || null
    };

    const pet = await Pet.create(req.session.user.id, petData);
    await Contact.upsertPrimary(pet.id, req.body);

    req.session.flash = {
      type: 'success',
      message: 'Mascota creada correctamente.'
    };

    res.redirect(`/pets/${pet.id}/edit`);
  } catch (err) {
    if (uploadedPhoto?.objectPath) {
      await removeObject(uploadedPhoto.objectPath).catch(() => {});
    }
    next(err);
  }
};

exports.editForm = async (req, res, next) => {
  try {
    const pet = await Pet.findOwned(req.params.id, req.session.user.id);

    if (!pet) {
      return res.status(404).render('common/error', {
        title: 'Mascota no encontrada',
        message: 'No tienes acceso a esta mascota.'
      });
    }

    const [contact, tags] = await Promise.all([
      Contact.primaryForPet(pet.id),
      Tag.listByPet(pet.id)
    ]);

    res.render('pets/form', {
      title: `Editar ${pet.name}`,
      pet,
      contact,
      tags,
      error: null,
      formUserName: formUserName(req)
    });
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  let uploadedPhoto = null;

  try {
    const currentPet = await Pet.findOwned(req.params.id, req.session.user.id);
    if (!currentPet) return res.status(404).send('Mascota no encontrada');

    if (!req.body.name || !req.body.species) {
      const [contact, tags] = await Promise.all([
        Contact.primaryForPet(currentPet.id),
        Tag.listByPet(currentPet.id)
      ]);

      return res.status(422).render('pets/form', {
        title: `Editar ${currentPet.name}`,
        pet: { ...currentPet, ...req.body },
        contact,
        tags,
        error: 'El nombre y la especie son obligatorios.',
        formUserName: formUserName(req)
      });
    }

    if (req.file) {
      uploadedPhoto = await uploadPetPhoto(req.file, req.session.user.id);
    }

    const petData = {
      ...req.body,
      photo_url: uploadedPhoto?.publicUrl || currentPet.photo_url || null
    };

    const pet = await Pet.update(
      req.params.id,
      req.session.user.id,
      petData
    );

    if (!pet) {
      if (uploadedPhoto?.objectPath) {
        await removeObject(uploadedPhoto.objectPath).catch(() => {});
      }
      return res.status(404).send('Mascota no encontrada');
    }

    await Contact.upsertPrimary(pet.id, req.body);

    // La BD ya apunta a la nueva foto: ahora sí podemos borrar la anterior.
    if (uploadedPhoto && currentPet.photo_url && currentPet.photo_url !== uploadedPhoto.publicUrl) {
      await removeByPublicUrl(currentPet.photo_url).catch((storageError) => {
        console.warn('No se pudo borrar la foto anterior de Storage:', storageError.message);
      });
    }

    req.session.flash = {
      type: 'success',
      message: 'Cambios guardados.'
    };

    res.redirect(`/pets/${pet.id}/edit`);
  } catch (err) {
    // Si falló antes de persistir la nueva URL, evita dejar un archivo huérfano.
    if (uploadedPhoto?.objectPath) {
      await removeObject(uploadedPhoto.objectPath).catch(() => {});
    }
    next(err);
  }
};

exports.toggleLost = async (req, res, next) => {
  try {
    const pet = await Pet.toggleLost(req.params.id, req.session.user.id);
    if (!pet) return res.status(404).send('Mascota no encontrada');

    req.session.flash = {
      type: pet.is_lost ? 'warning' : 'success',
      message: pet.is_lost
        ? `${pet.name} fue marcado como perdido.`
        : `${pet.name} fue marcado como encontrado.`
    };

    res.redirect('/dashboard');
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const pet = await Pet.findOwned(req.params.id, req.session.user.id);
    if (!pet) return res.status(404).send('Mascota no encontrada');

    const removed = await Pet.remove(req.params.id, req.session.user.id);
    if (!removed) return res.status(404).send('Mascota no encontrada');

    if (pet.photo_url) {
      await removeByPublicUrl(pet.photo_url).catch((storageError) => {
        console.warn('No se pudo borrar la foto de Storage:', storageError.message);
      });
    }

    req.session.flash = {
      type: 'success',
      message: 'Mascota eliminada.'
    };

    res.redirect('/dashboard');
  } catch (err) {
    next(err);
  }
};
