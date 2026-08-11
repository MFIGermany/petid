const router = require('express').Router();
const controller = require('../controllers/tagController');
const { requireAuth } = require('../middlewares/auth');

router.get('/activate', requireAuth, controller.activateForm);
router.post('/activate', requireAuth, controller.activate);
router.post('/dev/create-blank', requireAuth, controller.devCreateBlank);

module.exports = router;
