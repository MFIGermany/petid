const Tag = require('../models/Tag');
const Scan = require('../models/Scan');

exports.petProfile = async (req, res, next) => {
  try {
    const profile = await Tag.findPublic(req.params.code);
    if (!profile) {
      return res.status(404).render('common/error', {
        title: 'Identificación no encontrada',
        message: 'Esta chapita no está activa o el código no existe.'
      });
    }

    const source = req.query.src === 'qr' ? 'qr' : (req.query.src === 'nfc' ? 'nfc' : 'unknown');
    Scan.log({
      tagId: profile.tag_id,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      source
    });

    res.render('public/pet', {
      title: `${profile.name} - PetID`,
      pet: profile
    });
  } catch (err) {
    next(err);
  }
};
