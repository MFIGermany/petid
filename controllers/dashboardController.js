const Pet = require('../models/Pet');

exports.index = async (req, res, next) => {
  try {
    const pets = await Pet.allByUser(req.session.user.id);
    const stats = pets.reduce((acc, pet) => {
      acc.pets += 1;
      acc.activeTags += Number(pet.active_tags || 0);
      acc.scans += Number(pet.scans_this_month || 0);
      return acc;
    }, { pets: 0, activeTags: 0, scans: 0 });

    res.render('dashboard/index', {
      title: 'Mis mascotas',
      pets,
      stats
    });
  } catch (err) {
    next(err);
  }
};
