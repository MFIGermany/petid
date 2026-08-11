const router = require('express').Router();
const controller = require('../controllers/dashboardController');
const { requireAuth } = require('../middlewares/auth');

router.get('/', requireAuth, controller.index);

module.exports = router;
