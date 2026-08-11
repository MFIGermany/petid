const router = require('express').Router();
const controller = require('../controllers/homeController');
router.get('/', controller.index);
module.exports = router;
