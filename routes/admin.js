const router = require('express').Router();
const controller = require('../controllers/adminController');
const { requireAdmin, requireAdminGuest } = require('../middlewares/adminAuth');

router.get('/login', requireAdminGuest, controller.loginForm);
router.post('/login', requireAdminGuest, controller.login);
router.post('/logout', requireAdmin, controller.logout);

router.get('/', requireAdmin, controller.dashboard);
router.get('/clients', requireAdmin, controller.clients);
router.get('/clients/:id', requireAdmin, controller.clientDetail);
router.post('/clients/:id', requireAdmin, controller.updateClient);
router.post('/clients/:id/delete', requireAdmin, controller.deleteClient);
router.post('/pets/:id/toggle-lost', requireAdmin, controller.togglePetLost);
router.post('/tags/:id/toggle-status', requireAdmin, controller.toggleTagStatus);

module.exports = router;
