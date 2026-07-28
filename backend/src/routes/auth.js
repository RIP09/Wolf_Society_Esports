const router = require('express').Router();
const { validateRegister, validateLogin } = require('../utils/validation');
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');

router.post('/register', validateRegister, authController.register);
router.post('/login', validateLogin, authController.login);
router.get('/me', auth, authController.getMe);

module.exports = router;
