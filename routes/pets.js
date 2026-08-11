const router = require('express').Router();
const controller = require('../controllers/petController');
const { requireAuth } = require('../middlewares/auth');
const { uploadPetPhoto } = require('../middlewares/uploadPetPhoto');

router.get('/new', requireAuth, controller.newForm);
router.post('/', requireAuth, uploadPetPhoto.single('photo'), controller.create);
router.get('/:id/edit', requireAuth, controller.editForm);
router.post('/:id', requireAuth, uploadPetPhoto.single('photo'), controller.update);
router.post('/:id/toggle-lost', requireAuth, controller.toggleLost);
router.post('/:id/delete', requireAuth, controller.remove);

module.exports = router;
