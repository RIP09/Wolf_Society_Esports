const router = require('express').Router();
const { validatePlayer } = require('../utils/validation');
const playerController = require('../controllers/playerController');
const auth = require('../middleware/auth');

router.get('/', playerController.getPlayers);
router.get('/:id', playerController.getPlayer);
router.post('/', auth, validatePlayer, playerController.createPlayer);
router.put('/:id', auth, playerController.updatePlayer);
router.delete('/:id', auth, playerController.deletePlayer);

module.exports = router;
