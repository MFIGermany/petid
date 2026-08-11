const router = require('express').Router();
const controller = require('../controllers/publicController');

router.get('/p/:code', controller.petProfile);

module.exports = router;
