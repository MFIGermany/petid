const router = require('express').Router();
const controller = require('../controllers/authController');
const { requireGuest } = require('../middlewares/auth');

router.get('/login', requireGuest, controller.loginForm);
router.post('/login', requireGuest, controller.login);
router.get('/register', requireGuest, controller.registerForm);
router.post('/register', requireGuest, controller.register);
router.post('/logout', controller.logout);

module.exports = router;
